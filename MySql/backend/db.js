// MySQL connection and the three small helpers shared by the API files.
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env')
});
const config = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  dateStrings: true,
  decimalNumbers: true
};
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  ...config,
  connectionLimit: 10
});
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
