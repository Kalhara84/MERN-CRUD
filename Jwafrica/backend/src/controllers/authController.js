const { Op, fn, col, where } = require('sequelize');
const env = require('../config/env');
const { Usdmast } = require('../models');
const { signToken } = require('../middleware/auth');
const { verifyPassword, hashPassword } = require('../utils/password');
const { HttpError } = require('../utils/httpError');

// POST /api/auth/login   body: { usdusd, usdpwd, remember }
exports.login = async (req, res) => {
  const usdusd = String(req.body.usdusd || '').trim();
  const usdpwd = String(req.body.usdpwd || '');
  const remember = Boolean(req.body.remember);

  if (!usdusd || !usdpwd) throw new HttpError(400, 'Please enter User Code and Password');

  // Find the user code (any letter case) that is not blocked (usdactflg = 'N')
  const user = await Usdmast.findOne({
    where: {
      [Op.and]: [
        where(fn('lower', col('usdusd')), usdusd.toLowerCase()),
        where(fn('upper', col('usdactflg')), { [Op.ne]: 'N' }),
      ],
    },
    order: [['usdcomsno', 'ASC']],
  });
  if (!user) throw new HttpError(401, 'Invalid User Code');

  const { ok, needsUpgrade } = verifyPassword(usdpwd, user.usdpwd);
  if (!ok) throw new HttpError(401, 'Invalid Password');

  // Old password format -> save it again as a bcrypt hash
  if (needsUpgrade) await user.update({ usdpwd: hashPassword(usdpwd) });

  res.json({ token: signToken(user, remember), user: user.toSafeJSON(), appName: env.appName });
};

// GET /api/auth/me  -> the logged-in user (the browser calls this when the page is opened)
exports.me = async (req, res) => {
  res.json({ user: req.usd.toSafeJSON(), appName: env.appName });
};
