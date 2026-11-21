const app = require('./app');

const port = parseInt(process.env.PORT || '3001', 10);
app.listen(port, () => console.log(`Payroll API running on http://localhost:${port}`));
