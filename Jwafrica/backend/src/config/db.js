const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'postgres',
  logging: false,
  define: {
    // Tables already have their own column names, so no createdAt / updatedAt
    timestamps: false,
    freezeTableName: true,
  },
});

module.exports = sequelize;
