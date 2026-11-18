// Run with npm run db:migrate to create or update the MySQL tables.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config/database');
async function migrate() {
  const db = await mysql.createConnection({ ...config, database: undefined });
  let locked = false;
  try {
    if (!/^[a-zA-Z0-9_]+$/.test(config.database)) throw new Error('DB_NAME must contain only letters, numbers and underscores');
    await db.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4`);
    await db.query(`USE \`${config.database}\``);
    const [lock] = await db.query('SELECT GET_LOCK(?, 10) acquired', [config.database + '_migrations']);
    locked = lock[0].acquired === 1;
    if (!locked) throw new Error('Another migration is running');
    await db.query('CREATE TABLE IF NOT EXISTS migrations (name VARCHAR(190) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    const folder = path.join(__dirname, '../migrations');
    for (const name of fs.readdirSync(folder).filter(name => name.endsWith('.sql')).sort()) {
      const [existing] = await db.execute('SELECT name FROM migrations WHERE name = ?', [name]);
      if (existing.length) continue;
      // MySQL DDL auto-commits. Keep migrations restart-safe with IF NOT EXISTS.
      const statements = fs.readFileSync(path.join(folder, name), 'utf8').split(';').map(sql => sql.trim()).filter(Boolean);
      for (const sql of statements) await db.query(sql);
      await db.execute('INSERT INTO migrations (name) VALUES (?)', [name]);
      console.log('Applied:', name);
    }
    console.log('Migrations up to date.');
  } finally {
    if (locked) await db.query('SELECT RELEASE_LOCK(?)', [config.database + '_migrations']);
    await db.end();
  }
}
migrate().catch(error => { console.error('Migration failed:', error.message); process.exitCode = 1; });
