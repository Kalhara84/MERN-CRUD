
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('./db');
const router = require('express').Router();

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
  const [rows] = await pool.execute("SELECT * FROM usdmast WHERE usdusd = ? AND usdactflg <> 'N' ORDER BY usdcomsno LIMIT 1", [code]);
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

function safeUser(row) {
  const user = { ...row };
  delete user.usdpwd;
  user.is_admin = (row.usdadmin || '').toUpperCase() === 'Y';
  user.is_active = (row.usdactflg || '').toUpperCase() !== 'N';
  return user;
}

// Middleware: lets the request pass only when the user is logged in.
// After this runs, req.user = the logged-in user.
async function loginRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please login' });

  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Session expired. Please login again' });
  }

  // Read the user from the database again, so a deleted / blocked user is stopped at once
  const [rows] = await pool.execute('SELECT * FROM usdmast WHERE usdsno = ?', [payload.id]);
  const user = rows[0] ? safeUser(rows[0]) : null;
  if (!user || !user.is_active) return res.status(401).json({ message: 'Please login' });

  req.user = user;
  next();
}

// Middleware: use it AFTER loginRequired. Only admin users can pass.
function adminOnly(req, res, next) {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Admin only' });
  next();
}

router.post('/login', login);
router.get('/me', loginRequired, (req, res) => res.json({ user: req.user }));
module.exports = { router, loginRequired, adminOnly, safeUser };
