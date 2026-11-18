// PostgreSQL connection and the small helpers shared by the API files.
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env')
});
const {
  Pool,
  types
} = require('pg');

// Give dates and numbers back as plain text / numbers
types.setTypeParser(1082, value => value); // DATE    -> '2026-11-18'
types.setTypeParser(1700, value => parseFloat(value)); // NUMERIC -> number
types.setTypeParser(20, value => parseInt(value, 10)); // COUNT / SUM -> number

const config = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};
const pool = new Pool({
  ...config,
  max: 10
});
pool.on('error', error => {
  return console.error('PostgreSQL error:', error.message);
});

// Write the SQL with ? marks. They are changed to $1, $2 ... for PostgreSQL.
// The answer is [rows], so  const [rows] = await pool.execute(sql, values)  works as before.
pool.execute = async (sql, values = []) => {
  let n = 0;
  const result = await pool.query(sql.replace(/\?/g, () => {
    return '$' + ++n;
  }), values);
  return [result.rows, result];
};
function nowLocal() {
  const [date, time] = new Date().toLocaleString('sv-SE', {
    timeZone: 'Asia/Colombo'
  }).split(/\s/);
  return {
    date,
    time
  };
}

// Identifiers come from our code, never from request parameters.
async function insertRow(table, values) {
  const columns = Object.keys(values);
  return pool.execute(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => {
    return '?';
  }).join(', ')})`, Object.values(values));
}
async function updateRow(table, key, id, values) {
  const columns = Object.keys(values);
  return pool.execute(`UPDATE ${table} SET ${columns.map(name => {
    return `${name} = ?`;
  }).join(', ')} WHERE ${key} = ?`, [...Object.values(values), id]);
}
module.exports = {
  config,
  pool,
  nowLocal,
  insertRow,
  updateRow
};
