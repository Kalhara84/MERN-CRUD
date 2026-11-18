
require('dotenv').config();
const { Pool, types } = require('pg');

types.setTypeParser(1082, (value) => value);


const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'curd_simple',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});


function nowLocal() {
  const text = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Colombo' });
  const [date, time] = text.split(/\s/);
  return { date, time };
}


async function insertRow(table, data) {
  const columns = Object.keys(data);
  const marks = columns.map((_, i) => `$${i + 1}`);
  const { rows } = await pool.query(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${marks.join(', ')}) RETURNING *`,
    Object.values(data)
  );
  return rows[0];
}


async function updateRow(table, idColumn, id, data) {
  const columns = Object.keys(data);
  const sets = columns.map((column, i) => `${column} = $${i + 1}`);
  await pool.query(
    `UPDATE ${table} SET ${sets.join(', ')} WHERE ${idColumn} = $${columns.length + 1}`,
    [...Object.values(data), id]
  );
}

module.exports = { pool, nowLocal, insertRow, updateRow };
