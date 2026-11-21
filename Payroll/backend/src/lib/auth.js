const crypto = require('crypto');

/** Token + password helpers using only Node's built-in crypto. */
const TOKEN_HOURS = 8;
const secret = () => process.env.AUTH_SECRET || 'change-this-secret';
const b64 = (v) => Buffer.from(v).toString('base64url');

function signToken(user) {
  const payload = { ...user, exp: Math.floor(Date.now() / 1000) + TOKEN_HOURS * 3600 };
  const body = b64(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return null;

  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}

/** stored format:  scrypt$<salt>$<hash> */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const real = Buffer.from(hash, 'hex');
  return test.length === real.length && crypto.timingSafeEqual(test, real);
}

module.exports = { signToken, verifyToken, hashPassword, verifyPassword };
