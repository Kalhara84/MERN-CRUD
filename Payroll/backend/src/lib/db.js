const { Pool, types } = require('pg');

// return DATE columns as plain 'YYYY-MM-DD' text (no timezone shifting)
types.setTypeParser(1082, (v) => v);

const pool = new Pool({
  host: process.env.DB_HOST ,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = { pool };
