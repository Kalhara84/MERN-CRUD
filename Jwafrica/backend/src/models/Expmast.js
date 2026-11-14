const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define(
  'Expmast',
  {
    expsno: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    expexp: { type: DataTypes.STRING(40), allowNull: false, defaultValue: '' },
    expdays: { type: DataTypes.INTEGER, allowNull: true },
    expucdnew: { type: DataTypes.STRING(30), allowNull: true },
    expentddt: { type: DataTypes.DATEONLY, allowNull: true },
    expenttime: { type: DataTypes.TIME, allowNull: true },
    expucdame: { type: DataTypes.STRING(30), allowNull: true },
    expameddt: { type: DataTypes.DATEONLY, allowNull: true },
    expametime: { type: DataTypes.TIME, allowNull: true },
  },
  { tableName: 'expmast', indexes: [{ unique: true, name: 'expmast_expexp_uniq', fields: ['expexp'] }] }
);
