const jwt = require('jsonwebtoken');
const model = require('../models/authModel');
const { safeUser } = require('../utils/user');
const SECRET = process.env.JWT_SECRET;
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
  const { rows } = await model.findById(payload.id);
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



module.exports = { loginRequired, adminOnly };
