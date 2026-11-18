// Create the initial administrator and dropdown values.
const bcrypt = require('bcryptjs');
const { pool, nowLocal, insertRow } = require('../models/database');
async function seed() {
  for (const row of require('../seed/lookups.json')) {
    await pool.query('INSERT INTO sysmast (syssno, sysrtp, sysrno, sysdes) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE syssno = syssno', row);
  }
  const { rows } = await pool.query('SELECT usdsno FROM usdmast LIMIT 1');
  if (!rows.length) {
    const password = process.env.ADMIN_PASSWORD;
    if (!password || password.length < 8) throw new Error('Set ADMIN_PASSWORD (at least 8 characters) in .env to create the first administrator');
    const { date, time } = nowLocal();
    await insertRow('usdmast', { usdusd: process.env.ADMIN_CODE || 'ADMIN', usdnam: 'Farm administrator', usdpwd: await bcrypt.hash(password, 10), usdadmin: 'Y', usdactflg: 'Y', usdentddt: date, usdenttime: time, usducdnew: 'SETUP' });
    console.log('Administrator created using ADMIN_CODE / ADMIN_PASSWORD from .env.');
  }
  console.log('Seed complete. Existing users and passwords were preserved.');
}
seed().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
