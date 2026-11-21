const { verifyToken } = require('./lib/auth');

/** protects a route: no valid "Authorization: Bearer <token>" -> 401 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization ;
  const user = header.startsWith('Bearer ') ? verifyToken(header.slice(7)) : null;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  req.user = user;
  next();
}

/** wraps an async controller so errors go to the error handler */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function notFound(_req, res) {
  res.status(404).json({ message: 'Not found' });
}

function errorHandler(err, _req, res, _next) {
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });
  console.error(err);
  res.status(500).json({ message: 'Server error' });
}

module.exports = { requireAuth, wrap, notFound, errorHandler };
