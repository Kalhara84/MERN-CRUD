const { Pool, types } = require('pg');

// return DATE columns as plain 'YYYY-MM-DD' text (no timezone shifting)
types.setTypeParser(1082, (v) => v);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'payroll_db',
});

module.exports = { pool };
