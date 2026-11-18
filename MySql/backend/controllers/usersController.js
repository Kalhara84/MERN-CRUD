// =============================================================================
// users.js - Users page: list, add, edit, delete   (admin only, see server.js)
//
//   GET    /api/users        list of users
//   GET    /api/users/:id    one user
//   POST   /api/users        add a user
//   PUT    /api/users/:id    change a user
//   DELETE /api/users/:id    delete a user
// =============================================================================

const bcrypt = require('bcryptjs');
const model = require('../models/usersModel');
const { nowLocal } = require('../db');
const { safeUser } = require('../auth');

// The columns that come from the form, in 3 groups
const TEXT_FIELDS = ['usdusd', 'usdnam', 'usdemail', 'usddesig', 'usduno', 'usdprintername', 'usdsalstkcatsnos'];
const NUMBER_FIELDS = ['usdcomsno', 'usddepsno', 'usdlocsno', 'usdatfliamt', 'usdatfnosetday'];
// Yes/No columns: the database holds 'Y' or '', the form shows a check box
const YN_FIELDS = [
  'usdadmin', 'usdbockpodgrnyn', 'usdbrcsalyn', 'usdlacsalyn', 'usdprnsalyn', 'usdeggsalyn',
  'usdccnsalyn', 'usdpgfsalyn', 'usdcafsalyn', 'usdmaisalyn', 'usdhegsalyn', 'usdhassalyn',
  'usdrepyn', 'usdstkrolyn', 'usdatfauthyn', 'usdsohpvalyn',
];

// Maximum length of each text box
const MAX = { usdusd: 30, usdnam: 50, usdemail: 40, usddesig: 25, usduno: 4, usdprintername: 30, usdsalstkcatsnos: 100 };

// Checks the form and prepares the values for the database.
// Returns { errors, values, password }.  errors = { fieldName: 'message' }
function readForm(body, isNew) {
  const errors = {};
  const values = {};

  TEXT_FIELDS.forEach((field) => {
    const text = String(body[field] ?? '').trim();
    if (text.length > MAX[field]) errors[field] = `Must be ${MAX[field]} characters or less`;
    values[field] = text;
  });
  if (!values.usdusd) errors.usdusd = 'User code is required';

  NUMBER_FIELDS.forEach((field) => {
    const text = String(body[field] ?? '').trim();
    if (!/^-?\d+$/.test(text)) errors[field] = 'Enter a whole number';
    values[field] = parseInt(text, 10);
  });

  YN_FIELDS.forEach((field) => { values[field] = body[field] ? 'Y' : ''; });
  values.usdactflg = body.usdactflg ? 'Y' : 'N';   // ticked = active, not ticked = blocked

  // Password: needed for a new user, optional when editing
  const password = String(body.new_password ?? '');
  if (isNew && !password) errors.new_password = 'Password is required';
  if (password.length > 30) errors.new_password = 'Password must be 30 characters or less';

  return { errors, values, password };
}

// Is this user code already used in the same company? (capital / small letters ignored)
async function codeExists(code, companyNo, exceptId) {
  const [rows] = await model.codeExists([code, companyNo, exceptId]);
  return rows.length > 0;
}

// Finds one user by id. Returns undefined when there is no such user.
async function findUser(id) {
  if (!/^\d+$/.test(id)) return undefined;
  const [rows] = await model.find([id]);
  return rows[0];
}

// GET /api/users
async function list(req, res) {
  const [rows] = await model.list();
  res.json({ users: rows.map(safeUser) });
}

// GET /api/users/:id
async function find(req, res) {
  const user = await findUser(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: safeUser(user) });
}

// POST /api/users
async function create(req, res) {
  const { errors, values, password } = readForm(req.body, true);

  // Check the duplicate code only when everything else is fine
  if (Object.keys(errors).length === 0 && (await codeExists(values.usdusd, values.usdcomsno, 0))) {
    errors.usdusd = 'This User code already exists';
  }
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Please correct the errors', errors });
  }

  const { date, time } = nowLocal();
  const me = req.user.usdusd.slice(0, 30);   // who is saving (the logged-in user)

  await model.create({
    ...values,
    usdpwd: bcrypt.hashSync(password, 10),
    usdpwdddt: date,
    // created by / date / time
    usducdnew: me, usdentddt: date, usdenttime: time,
    // last updated by / date / time
    usducdame: me, usdameddt: date, usdametime: time,
  });

  res.status(201).json({ message: `User '${values.usdusd}' added.` });
}

// PUT /api/users/:id
async function update(req, res) {
  const user = await findUser(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { errors, values, password } = readForm(req.body, false);
  if (user.usdsno === req.user.usdsno && (!values.usdadmin || values.usdactflg === 'N')) {
    return res.status(400).json({ message: 'You cannot remove your own administrator access or block your account.' });
  }
  if (Object.keys(errors).length === 0 && (await codeExists(values.usdusd, values.usdcomsno, user.usdsno))) {
    errors.usdusd = 'This User code already exists';
  }
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Please correct the errors', errors });
  }

  const { date, time } = nowLocal();
  const changes = { ...values, usducdame: req.user.usdusd.slice(0, 30), usdameddt: date, usdametime: time };

  // A new password was typed -> save the hash and today's date
  if (password) {
    changes.usdpwd = bcrypt.hashSync(password, 10);
    changes.usdpwdddt = date;
  }

  await model.update(user.usdsno, changes);
  res.json({ message: `User '${values.usdusd}' updated.` });
}

// DELETE /api/users/:id
async function remove(req, res) {
  const user = await findUser(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // A user cannot delete himself
  if (user.usdsno === req.user.usdsno) {
    return res.status(400).json({ message: 'You cannot delete the user you are logged in as.' });
  }

  await model.remove([user.usdsno]);
  res.json({ message: `User '${user.usdusd}' deleted.` });
}

module.exports = { list, find, create, update, remove };
