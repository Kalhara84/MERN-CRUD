const app = require('./app');
const { pool } = require('./models/database');
const port = process.env.PORT || 5000;
pool.query('SELECT 1').then(() => {
  app.listen(port, () => console.log('SRTBF API on http://localhost:' + port + ' (MySQL connected)'));
}).catch(error => {
  console.error('Cannot connect to MySQL. Start MySQL and check backend/.env:', error.message);
  process.exit(1);
});
