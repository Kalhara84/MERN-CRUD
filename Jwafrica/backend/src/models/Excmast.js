const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define(
  'Excmast',
  {
    excsno: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    excexc: { type: DataTypes.STRING(40), allowNull: false, defaultValue: '' },
    excnam: { type: DataTypes.STRING(40), allowNull: false, defaultValue: '' },
    excusdsno: { type: DataTypes.INTEGER, allowNull: true },
    excucdnew: { type: DataTypes.STRING(30), allowNull: true },
    excentddt: { type: DataTypes.DATEONLY, allowNull: true },
    excenttime: { type: DataTypes.TIME, allowNull: true },
    excucdame: { type: DataTypes.STRING(30), allowNull: true },
    excameddt: { type: DataTypes.DATEONLY, allowNull: true },
    excametime: { type: DataTypes.TIME, allowNull: true },
  },
  { tableName: 'excmast', indexes: [{ unique: true, name: 'excmast_excexc_uniq', fields: ['excexc'] }] }
);
