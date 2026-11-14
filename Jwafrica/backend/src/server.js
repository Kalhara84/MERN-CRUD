const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log(`PostgreSQL connected (${env.db.name})`);
  } catch (err) {
    console.error('Cannot connect to PostgreSQL. Check the values in the .env file.\n', err.message);
    process.exit(1);
  }

  app.listen(env.port, () => console.log(`API running on http://localhost:${env.port}`));
})();
