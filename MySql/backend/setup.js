// Database setup only. Normal app startup uses server.js.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const {
  config,
  pool,
  nowLocal,
  insertRow
} = require('./db');
async function migrate() {
  const db = await mysql.createConnection({
    ...config,
    database: undefined
  });
  let locked = false;
  try {
    if (!/^[a-zA-Z0-9_]+$/.test(config.database)) {
      throw new Error('DB_NAME must contain only letters, numbers and underscores');
    }
    await db.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4`);
    await db.query(`USE \`${config.database}\``);
    const [lock] = await db.query('SELECT GET_LOCK(?, 10) acquired', [config.database + '_migrations']);
    locked = lock[0].acquired === 1;
    if (!locked) {
      throw new Error('Another migration is running');
    }
    await db.query('CREATE TABLE IF NOT EXISTS migrations (name VARCHAR(190) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    const folder = path.join(__dirname, 'migrations');
    for (const name of fs.readdirSync(folder).filter(name => {
      return name.endsWith('.sql');
    }).sort()) {
      const [existing] = await db.execute('SELECT name FROM migrations WHERE name = ?', [name]);
      if (existing.length) {
        continue;
      }
      // MySQL DDL auto-commits. Keep migrations restart-safe with IF NOT EXISTS.
      const statements = fs.readFileSync(path.join(folder, name), 'utf8').split(';').map(sql => {
        return sql.trim();
      }).filter(Boolean);
      for (const sql of statements) {
        await db.query(sql);
      }
      await db.execute('INSERT INTO migrations (name) VALUES (?)', [name]);
      console.log('Applied:', name);
    }
    console.log('Migrations up to date.');
  } finally {
    if (locked) {
      await db.query('SELECT RELEASE_LOCK(?)', [config.database + '_migrations']);
    }
    await db.end();
  }
}
async function seed() {
  for (const row of require('./seed/lookups.json')) {
    await pool.execute('INSERT INTO sysmast (syssno, sysrtp, sysrno, sysdes) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE syssno = syssno', row);
  }
  const code = process.env.ADMIN_CODE || 'ADMIN';
  const [rows] = await pool.execute('SELECT usdsno FROM usdmast WHERE usdusd = ? AND usdcomsno = 0', [code]);
  if (!rows.length) {
    const password = process.env.ADMIN_PASSWORD || '1234';
    const {
      date,
      time
    } = nowLocal();
    await insertRow('usdmast', {
      usdusd: code,
      usdnam: 'Farm administrator',
      usdpwd: await bcrypt.hash(password, 10),
      usdadmin: 'Y',
      usdactflg: 'Y',
      usdentddt: date,
      usdenttime: time,
      usducdnew: 'SETUP'
    });
    console.log('Administrator created using ADMIN_CODE / ADMIN_PASSWORD from .env.');
  }
  console.log('Seed complete. Existing users and passwords were preserved.');
}
async function importCustomers() {
  const customers = require('./seed/customers.json');
  let added = 0;
  for (const customer of customers) {
    const [rows] = await pool.execute('SELECT cussno FROM cusmast WHERE cuscus = ?', [customer.cuscus]);
    if (rows.length) {
      continue;
    }
    const values = {
      ...customer
    };
    delete values.cussno;
    values.cusactyn = values.cusactyn || 'Y';
    for (const key of Object.keys(values)) {
      if (/ddt$|date$|time$/.test(key) && !values[key]) {
        values[key] = null;
      }
    }
    await insertRow('cusmast', values);
    added++;
  }
  console.log(`Imported ${added}; skipped ${customers.length - added} existing customer codes.`);
}
async function main() {
  const command = process.argv[2] || 'setup';
  if (command === 'setup') {
    await migrate();
    await seed();
    await importCustomers();
  } else if (command === 'migrate') {
    await migrate();
  } else if (command === 'seed') {
    await seed();
  } else if (command === 'import') {
    await importCustomers();
  } else {
    throw new Error('Use: node setup.js [setup|migrate|seed|import]');
  }
}
main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => {
  return pool.end();
});
