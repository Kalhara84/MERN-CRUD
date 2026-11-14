const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const hashPassword = (raw) => bcrypt.hashSync(raw, 10);

const isBcrypt = (v) => /^\$2[aby]\$\d{2}\$/.test(v);
const isDjangoPbkdf2 = (v) => v.startsWith('pbkdf2_sha256$');

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// Django format:  pbkdf2_sha256$<iterations>$<salt>$<base64 hash>
function checkDjangoPbkdf2(raw, stored) {
  const [, iterations, salt, hash] = stored.split('$');
  if (!iterations || !salt || !hash) return false;
  const calc = crypto.pbkdf2Sync(raw, salt, Number(iterations), 32, 'sha256').toString('base64');
  return safeEqual(calc, hash);
}

/**
 * Compare the typed password with the stored one.
 * Returns { ok, needsUpgrade }  (needsUpgrade = save a new bcrypt hash)
 */
function verifyPassword(raw, stored) {
  stored = stored || '';
  if (!stored || !raw) return { ok: false, needsUpgrade: false };

  if (isBcrypt(stored)) return { ok: bcrypt.compareSync(raw, stored), needsUpgrade: false };

  if (isDjangoPbkdf2(stored)) {
    const ok = checkDjangoPbkdf2(raw, stored);
    return { ok, needsUpgrade: ok };
  }

  // Old plain-text password
  const ok = safeEqual(stored, raw);
  return { ok, needsUpgrade: ok };
}

module.exports = { hashPassword, verifyPassword };
