const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define(
  'Exsmast',
  {
    exssno: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    exsexs: { type: DataTypes.STRING(40), allowNull: false, defaultValue: '' },
    exsnam: { type: DataTypes.STRING(40), allowNull: false, defaultValue: '' },
    exsucdnew: { type: DataTypes.STRING(30), allowNull: true },
    exsentddt: { type: DataTypes.DATEONLY, allowNull: true },
    exsenttime: { type: DataTypes.TIME, allowNull: true },
    exsucdame: { type: DataTypes.STRING(30), allowNull: true },
    exsameddt: { type: DataTypes.DATEONLY, allowNull: true },
    exsametime: { type: DataTypes.TIME, allowNull: true },
  },
  { tableName: 'exsmast', indexes: [{ unique: true, name: 'exsmast_exsexs_uniq', fields: ['exsexs'] }] }
);
