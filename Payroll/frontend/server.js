const path = require('path');
const express = require('express');

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const apiUrl = process.env.API_URL || 'http://localhost:3001/api';

// libraries from node_modules (no CDN needed)
app.use('/vendor/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/vendor/icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font')));

// tells the browser where the backend API is
app.get('/config.js', (_req, res) => {
  res.type('js').send(`window.APP_CONFIG = ${JSON.stringify({ API_URL: apiUrl })};`);
});

app.use(express.static(path.join(__dirname, 'public')));

// any other URL -> the single page app (client side routing)
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

app.listen(port, () => console.log(`Payroll UI running on http://localhost:${port}  (API: ${apiUrl})`));
