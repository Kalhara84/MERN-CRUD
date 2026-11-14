const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { Usdmast } = require('../models');
const { HttpError, asyncHandler } = require('../utils/httpError');

// Allow the route only for logged-in users. Sets req.usd = the user row.
const loginRequired = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please login');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (e) {
    throw new HttpError(401, 'Session expired. Please login again');
  }

  // Load the user again from the database, so a deleted / blocked user is stopped at once
  const user = await Usdmast.findByPk(payload.sub);
  if (!user || !user.isActiveUser()) throw new HttpError(401, 'Please login');

  req.usd = user;
  next();
});

// Allow the route only for admin users (usdadmin = 'Y')
const adminRequired = [
  loginRequired,
  (req, res, next) => {
    if (!req.usd.isAdmin()) return next(new HttpError(403, 'Admin only'));
    next();
  },
];

const signToken = (user, remember) =>
  jwt.sign({ sub: user.usdsno }, env.jwtSecret, { expiresIn: remember ? '14d' : '12h' });

module.exports = { loginRequired, adminRequired, signToken };
