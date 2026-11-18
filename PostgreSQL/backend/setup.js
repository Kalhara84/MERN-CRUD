// Database setup only. Normal app startup uses server.js.
const fs = require('fs');
const path = require('path');
const {
  Client
} = require('pg');
const bcrypt = require('bcryptjs');
const {
  config,
  pool,
  nowLocal,
  insertRow
} = require('./db');
async function migrate() {
  if (!/^[a-zA-Z0-9_]+$/.test(config.database)) {
    throw new Error('DB_NAME must contain only letters, numbers and underscores');
  }

  // Create the database when it is missing (we connect to the default "postgres" database for this)
  const admin = new Client({
    ...config,
    database: 'postgres'
  });
  await admin.connect();
  try {
    const found = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [config.database]);
    if (!found.rows.length) {
      await admin.query(`CREATE DATABASE "${config.database}"`);
    }
  } finally {
    await admin.end();
  }
  const db = new Client(config);
  await db.connect();
  try {
    // Only one migration can run at a time. The lock is released when the connection closes.
    await db.query('SELECT pg_advisory_lock(hashtext($1))', [config.database + '_migrations']);
    await db.query('CREATE TABLE IF NOT EXISTS migrations (name VARCHAR(190) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    const folder = path.join(__dirname, 'migrations');
    for (const name of fs.readdirSync(folder).filter(name => {
      return name.endsWith('.sql');
    }).sort()) {
      const existing = await db.query('SELECT name FROM migrations WHERE name = $1', [name]);
      if (existing.rows.length) {
        continue;
      }

      // PostgreSQL can roll back table changes, so one file is either fully applied or not at all.
      await db.query('BEGIN');
      try {
        await db.query(fs.readFileSync(path.join(folder, name), 'utf8'));
        await db.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
        await db.query('COMMIT');
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
      console.log('Applied:', name);
    }
    console.log('Migrations up to date.');
  } finally {
    await db.end();
  }
}
async function seed() {
  for (const row of require('./seed/lookups.json')) {
    await pool.execute(
      'INSERT INTO sysmast (syssno, sysrtp, sysrno, sysdes) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING', 
      row
    );
  }
  const code = process.env.ADMIN_CODE ;
  const [rows] = await pool.execute(
    'SELECT usdsno FROM usdmast WHERE lower(usdusd) = lower(?) AND usdcomsno = 0', 
    [code]
  );

  if (!rows.length) {
    const password = process.env.ADMIN_PASSWORD;
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
    
    const [rows] = await pool.execute(
      'SELECT cussno FROM cusmast WHERE lower(cuscus) = lower(?)', 
      [customer.cuscus]
    );

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
  console.error(
    error.message
  );

  process.exitCode = 1;
  
}).finally(() => {
  return pool.end();
});
