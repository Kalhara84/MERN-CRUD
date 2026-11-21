const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => res.send('Payroll API is running'));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
