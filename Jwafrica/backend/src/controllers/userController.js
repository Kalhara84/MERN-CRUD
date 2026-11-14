// =============================================================================
// controllers/userController.js - Users page (list, add, edit, delete) - admin only
// =============================================================================
const { fn, col, where, Op } = require('sequelize');
const { Usdmast } = require('../models');
const { hashPassword } = require('../utils/password');
const { nowLocal } = require('../utils/time');
const { HttpError } = require('../utils/httpError');
const v = require('../utils/validate');

// Yes/No columns. In the database they hold 'Y' or ''; on the form they are check boxes.
const YN_FIELDS = [
  'usdadmin', 'usdbockpodgrnyn', 'usdbrcsalyn', 'usdlacsalyn', 'usdprnsalyn', 'usdeggsalyn',
  'usdccnsalyn', 'usdpgfsalyn', 'usdcafsalyn', 'usdmaisalyn', 'usdhegsalyn', 'usdhassalyn',
  'usdrepyn', 'usdstkrolyn', 'usdatfauthyn', 'usdsohpvalyn',
];

const trim = (x) => (x === undefined || x === null ? '' : String(x).trim());

// Checks the typed values. Returns { errors, data } (data = values ready to save)
function readUserForm(body, { isNew }) {
  const bag = v.errorBag();

  bag.add('usdusd', v.requiredText(body.usdusd, 'User code (login name)', 30));
  bag.add('usdnam', v.optionalText(body.usdnam, 'Name', 50));
  bag.add('usdemail', v.optionalText(body.usdemail, 'Email', 40));
  bag.add('usddesig', v.optionalText(body.usddesig, 'Designation', 25));
  bag.add('usduno', v.optionalText(body.usduno, 'Unit no', 4));
  bag.add('usdprintername', v.optionalText(body.usdprintername, 'Printer name', 30));
  bag.add('usdsalstkcatsnos', v.optionalText(body.usdsalstkcatsnos, 'Sales stock category nos', 100));

  const INTS = {
    usdcomsno: 'Company no', usddepsno: 'Department no', usdlocsno: 'Location no',
    usdatfliamt: 'ATF limit amount', usdatfnosetday: 'ATF no. of days',
  };
  Object.entries(INTS).forEach(([f, label]) => bag.add(f, v.requiredInt(body[f], label)));

  // Password: required for a new user, optional when editing
  const pwd = body.new_password === undefined || body.new_password === null ? '' : String(body.new_password);
  if (isNew && !pwd) bag.add('new_password', 'Password is required');
  if (pwd.length > 30) bag.add('new_password', 'Password must be 30 characters or less');

  if (bag.hasErrors()) return { errors: bag.errors };

  const data = {
    usdusd: trim(body.usdusd),
    usdnam: trim(body.usdnam) || null,
    usdemail: trim(body.usdemail),
    usddesig: trim(body.usddesig),
    usduno: trim(body.usduno),
    usdprintername: trim(body.usdprintername),
    usdsalstkcatsnos: trim(body.usdsalstkcatsnos),
  };
  Object.keys(INTS).forEach((f) => { data[f] = parseInt(body[f], 10); });

  // Check box -> 'Y' or ''
  YN_FIELDS.forEach((f) => { data[f] = body[f] ? 'Y' : ''; });
  // Active: ticked -> 'Y', not ticked -> 'N'
  data.usdactflg = body.usdactflg ? 'Y' : 'N';

  return { errors: {}, data, password: pwd };
}

// Same user code cannot be used twice in one company (letter case ignored)
async function codeExists(usdusd, usdcomsno, exceptId) {
  const conditions = [where(fn('lower', col('usdusd')), usdusd.toLowerCase()), { usdcomsno }];
  if (exceptId) conditions.push({ usdsno: { [Op.ne]: exceptId } });
  return Boolean(await Usdmast.findOne({ where: { [Op.and]: conditions }, attributes: ['usdsno'] }));
}

const findUser = async (id) => {
  if (!/^\d+$/.test(String(id))) throw new HttpError(404, 'User not found');
  const user = await Usdmast.findByPk(id);
  if (!user) throw new HttpError(404, 'User not found');
  return user;
};

const invalid = (errors) => new HttpError(422, 'Please correct the errors', { errors });

// GET /api/users
exports.list = async (req, res) => {
  const users = await Usdmast.findAll({ order: [['usdsno', 'ASC']] });
  res.json({ users: users.map((u) => u.toSafeJSON()) });
};

// GET /api/users/:id
exports.get = async (req, res) => {
  res.json({ user: (await findUser(req.params.id)).toSafeJSON() });
};

// POST /api/users
exports.create = async (req, res) => {
  const { errors, data, password } = readUserForm(req.body, { isNew: true });
  if (data && (await codeExists(data.usdusd, data.usdcomsno))) errors.usdusd = 'This User code already exists';
  if (Object.keys(errors).length) throw invalid(errors);

  const { date, time } = nowLocal();
  const code = req.usd.usdusd.slice(0, 30);

  const user = await Usdmast.create({
    ...data,
    usdpwd: hashPassword(password),
    usdpwdddt: date,
    // "created" columns
    usducdnew: code.slice(0, 10), usdentddt: date, usdenttime: time,
    // "last updated" columns
    usducdame: code, usdameddt: date, usdametime: time,
  });

  res.status(201).json({ message: `User '${user.usdusd}' added.`, user: user.toSafeJSON() });
};

// PUT /api/users/:id
exports.update = async (req, res) => {
  const user = await findUser(req.params.id);

  const { errors, data, password } = readUserForm(req.body, { isNew: false });
  if (data && (await codeExists(data.usdusd, data.usdcomsno, user.usdsno))) errors.usdusd = 'This User code already exists';
  if (Object.keys(errors).length) throw invalid(errors);

  const { date, time } = nowLocal();
  const changes = {
    ...data,
    usducdame: req.usd.usdusd.slice(0, 30), usdameddt: date, usdametime: time,
  };
  // New password typed -> store the hash and today's date
  if (password) { changes.usdpwd = hashPassword(password); changes.usdpwdddt = date; }

  await user.update(changes);
  res.json({ message: `User '${user.usdusd}' updated.`, user: user.toSafeJSON() });
};

// DELETE /api/users/:id
exports.remove = async (req, res) => {
  const user = await findUser(req.params.id);

  // Cannot delete yourself
  if (user.usdsno === req.usd.usdsno) {
    throw new HttpError(400, 'You cannot delete the user you are logged in as.');
  }

  await user.destroy();
  res.json({ message: `User '${user.usdusd}' deleted.` });
};
