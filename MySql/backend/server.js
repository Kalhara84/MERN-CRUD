// Start here: connect the database, register the API URLs, then listen.
const { pool } = require('./db');
const express = require('express');
const cors = require('cors');
const { loginRequired, adminOnly } = require('./auth');
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5174' }));
app.use(express.json({ limit: '100kb' }));
app.use('/api/auth', require('./auth').router);
app.use('/api/customers', loginRequired, require('./customers'));
app.use('/api/users', loginRequired, adminOnly, require('./users'));
app.use('/api/dashboard', loginRequired, require('./dashboard'));
app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use((error, req, res, next) => {
  console.error(error.message);
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'This code already exists. Please choose another code.' });
  res.status(error.status || 500).json({ message: error.status === 400 ? 'Invalid request body' : 'Unable to complete the request. Please try again.' });
});
// Importing this file for a check does not start a second server.
if (require.main === module) {
  const port = process.env.PORT || 5000;
  pool.execute('SELECT 1').then(() => {
    app.listen(port, () => console.log('SRTBF API on http://localhost:' + port + ' (MySQL connected)'));
  }).catch(error => {
    console.error('Cannot connect to MySQL. Check backend/.env:', error.message);
    process.exitCode = 1;
    pool.end();
  });
}
module.exports = app;
