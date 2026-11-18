
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const model = require('../models/authModel');
const { safeUser } = require('../utils/user');

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('Set JWT_SECRET in backend/.env');



// POST /api/auth/login   body: { usdusd, usdpwd, remember }
async function login(req, res) {
  const code = String(req.body.usdusd || '').trim();
  const password = String(req.body.usdpwd || '');
  const remember = Boolean(req.body.remember);

  if (!code || !password) {
    return res.status(400).json({ message: 'Please enter User Code and Password' });
  }

  // Find the user (capital / small letters do not matter). Blocked users (usdactflg = 'N') are skipped.
  const { rows } = await model.findByCode(code);
  const user = rows[0];
  if (!user) return res.status(401).json({ message: 'Invalid user code or password' });

  // The password is saved as a hash, so we compare with bcrypt
  if (!user.usdpwd || !bcrypt.compareSync(password, user.usdpwd)) {
    return res.status(401).json({ message: 'Invalid user code or password' });
  }

  // "Remember me" = the token works for 14 days, otherwise 12 hours
  const token = jwt.sign({ id: user.usdsno }, SECRET, { expiresIn: remember ? '14d' : '12h' });
  res.json({ token, user: safeUser(user) });
}


module.exports = { login };
