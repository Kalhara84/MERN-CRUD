require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,

  db: {
    name: process.env.DB_NAME || 'django_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'mypass',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
  },

  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  tzName: process.env.TZ_NAME || 'Asia/Colombo',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  appName: process.env.APP_NAME || 'JW Africa',
};

if (env.nodeEnv === 'production' && env.jwtSecret === 'dev-only-secret-change-me') {
  throw new Error('Set JWT_SECRET in the .env file before running in production.');
}

module.exports = env;
