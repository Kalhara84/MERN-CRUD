require('./config/database');
const express = require('express');
const cors = require('cors');
const { loginRequired, adminOnly } = require('./middleware/auth');
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5174' }));
app.use(express.json({ limit: '100kb' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', loginRequired, require('./routes/customersRoutes'));
app.use('/api/users', loginRequired, adminOnly, require('./routes/usersRoutes'));
app.get('/api/dashboard', loginRequired, require('./controllers/dashboardController').summary);
app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use((error, req, res, next) => {
  console.error(error.message);
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'This code already exists. Please choose another code.' });
  res.status(error.status || 500).json({ message: error.status === 400 ? 'Invalid request body' : 'Unable to complete the request. Please try again.' });
});
module.exports = app;
