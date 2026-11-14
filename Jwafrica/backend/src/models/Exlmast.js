const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define(
  'Exlmast',
  {
    exlsno: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // Link to the header (exhmast.exhsno)
    exlexhsno: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    exllno: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // ids of the Service Cat (exsmast), Period (expmast), Acc Code (g_genmast)
    exlexssno: { type: DataTypes.INTEGER, allowNull: false },
    exlexpsno: { type: DataTypes.INTEGER, allowNull: false },
    exlgensno: { type: DataTypes.INTEGER, allowNull: false },

    // Complete date and cutoff date
    exlcomplddt: { type: DataTypes.DATEONLY, allowNull: true },
    exlcutoffddt: { type: DataTypes.DATEONLY, allowNull: true },

    exlucdnew: { type: DataTypes.STRING(30), allowNull: true },
    exlentddt: { type: DataTypes.DATEONLY, allowNull: true },
    exlenttime: { type: DataTypes.TIME, allowNull: true },
    exlucdame: { type: DataTypes.STRING(30), allowNull: true },
    exlameddt: { type: DataTypes.DATEONLY, allowNull: true },
    exlametime: { type: DataTypes.TIME, allowNull: true },

    exldelflg: { type: DataTypes.STRING(1), allowNull: false, defaultValue: '' },
  },
  {
    tableName: 'exlmast',
    indexes: [{ unique: true, name: 'exlmast_exlexhsno_exllno_uniq', fields: ['exlexhsno', 'exllno'] }],
  }
);
