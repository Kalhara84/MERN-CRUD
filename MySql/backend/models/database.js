const mysql = require('mysql2/promise');
const connection = mysql.createPool({ ...require('../config/database'), connectionLimit: 10 });
// All models receive the same readable { rows } result.
const pool = {
  async query(sql, values = []) {
    const [rows] = await connection.execute(sql, values);
    return { rows, rowCount: rows.affectedRows || 0 };
  },
  end: () => connection.end(),
};
function nowLocal() {
  const [date, time] = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Colombo' }).split(/\s/);
  return { date, time };
}
// Identifiers come from our code, never from request parameters.
async function insertRow(table, values) {
  const columns = Object.keys(values);
  return pool.query(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`, Object.values(values));
}
async function updateRow(table, key, id, values) {
  const columns = Object.keys(values);
  return pool.query(`UPDATE ${table} SET ${columns.map(name => `${name} = ?`).join(', ')} WHERE ${key} = ?`, [...Object.values(values), id]);
}
module.exports = { pool, nowLocal, insertRow, updateRow };
