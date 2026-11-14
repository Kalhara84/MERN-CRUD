// =============================================================================
// server.js - starts the API.      npm run dev
// This file only connects the other files together:
//   auth.js    -> /api/auth/...     (login)
//   users.js   -> /api/users/...    (admin only)
//   expire.js  -> /api/expire/...   (all logged-in users)
//   customers.js -> /api/customers/... (all logged-in users)
// =============================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');
const { router: authRouter, loginRequired, adminOnly } = require('./auth');

const app = express();

app.use(cors());          // lets the React app call this API (in production: cors({ origin: 'your site' }))
app.use(express.json());  // reads the JSON the browser sends

// ---- API addresses
app.use('/api/auth', authRouter);
app.use('/api/users', loginRequired, adminOnly, require('./users'));
app.use('/api/expire', loginRequired, require('./expire'));
app.use('/api/customers', loginRequired, require('./customers'));

// GET /api/dashboard - the 3 number cards (admin users only)
app.get('/api/dashboard', loginRequired, async (req, res) => {
  if (!req.user.is_admin) return res.json({ stats: null });

  const { rows } = await pool.query(`
    SELECT COUNT(*) AS total,
           COUNT(*) FILTER (WHERE upper(usdactflg) <> 'N') AS active,
           COUNT(*) FILTER (WHERE upper(usdadmin) = 'Y') AS admins
    FROM usdmast`);
  const s = rows[0];
  res.json({ stats: { total: Number(s.total), active: Number(s.active), admins: Number(s.admins) } });
});

// ---- address not found
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// ---- any other error (for example the database stopped) ends here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// ---- start: first check the database, then listen
const PORT = process.env.PORT || 5000;
pool.query('SELECT 1')
  .then(() => {
    console.log('PostgreSQL connected');
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Cannot connect to PostgreSQL. Check the values in the .env file.\n', err.message);
    process.exit(1);
  });
