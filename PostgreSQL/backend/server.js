// Start here: connect the database, register the API URLs, then listen.
const {
  pool
} = require('./db');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL
}));
app.use(express.json({
  limit: '100kb'
}));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customersRoutes'));
app.use('/api/users', require('./routes/usersRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use((req, res) => {
  return res.status(404).json({
    message: 'Not found'
  });
});
app.use((error, req, res, next) => {
  console.error(error.message);
  if (error.code === '23505') {
    return res.status(409).json({
      message: 'This code already exists. Please choose another code.'
    });
  }
  res.status(error.status || 500).json({
    message: error.status === 400 ? 'Invalid request body' : 'Unable to complete the request. Please try again.'
  });
});

// Importing this file for a check does not start a second server.
if (require.main === module) {
  const port = process.env.PORT || 5000;
  pool.execute('SELECT 1').then(() => {
    app.listen(port, () => {
      return console.log('SRTBF API on http://localhost:' + port + ' (PostgreSQL connected)');
    });
  }).catch(error => {
    console.error('Cannot connect to PostgreSQL. Check backend/.env:', error.message);
    process.exitCode = 1;
    pool.end();
  });
}
module.exports = app;
