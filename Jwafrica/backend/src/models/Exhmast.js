const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define(
  'Exhmast',
  {
    exhsno: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // Entry code (must be unique)
    exhdno: { type: DataTypes.STRING(30), allowNull: false, unique: true },

    // id of the Item Category (excmast.excsno)
    exhexcsno: { type: DataTypes.INTEGER, allowNull: false },
    // id of the Location (exlocmast.exlocsno)
    exhexlocsno: { type: DataTypes.INTEGER, allowNull: false },

    exhddt: { type: DataTypes.DATEONLY, allowNull: false },
    exhdes: { type: DataTypes.STRING(50), allowNull: false },

    exhucdnew: { type: DataTypes.STRING(30), allowNull: true },
    exhentddt: { type: DataTypes.DATEONLY, allowNull: true },
    exhenttime: { type: DataTypes.TIME, allowNull: true },
    exhucdame: { type: DataTypes.STRING(30), allowNull: true },
    exhameddt: { type: DataTypes.DATEONLY, allowNull: true },
    exhametime: { type: DataTypes.TIME, allowNull: true },
  },
  { tableName: 'exhmast' }
);
