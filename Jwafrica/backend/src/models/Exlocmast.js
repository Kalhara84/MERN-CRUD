const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define(
  'Exlocmast',
  {
    exlocsno: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    exlocloc: { type: DataTypes.STRING(40), allowNull: false, defaultValue: '' },
    exlocnam: { type: DataTypes.STRING(40), allowNull: false, defaultValue: '' },
    exlocucdnew: { type: DataTypes.STRING(30), allowNull: true },
    exlocentddt: { type: DataTypes.DATEONLY, allowNull: true },
    exlocenttime: { type: DataTypes.TIME, allowNull: true },
    exlocucdame: { type: DataTypes.STRING(30), allowNull: true },
    exlocameddt: { type: DataTypes.DATEONLY, allowNull: true },
    exlocametime: { type: DataTypes.TIME, allowNull: true },
  },
  { tableName: 'exlocmast', indexes: [{ unique: true, name: 'exlocmast_exlocloc_uniq', fields: ['exlocloc'] }] }
);
