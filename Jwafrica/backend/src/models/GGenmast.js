const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const str = (len, extra = {}) => ({ type: DataTypes.STRING(len), allowNull: false, defaultValue: '', ...extra });
const int0 = () => ({ type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });

module.exports = sequelize.define(
  'GGenmast',
  {
    gensno: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    genctl: { type: DataTypes.STRING(8), allowNull: false },
    gensub: str(4),
    genctlsub: str(8),

    gendebint: str(1),
    gencrdint: str(1),

    gendes: { type: DataTypes.STRING(60), allowNull: true },
    gendes1: str(30),
    genmapcode: { type: DataTypes.STRING(15), allowNull: true },
    gencde: { type: DataTypes.STRING(1), allowNull: true },

    gencomsno: int0(),
    genlocsno: int0(),
    gencatsno: { type: DataTypes.INTEGER, allowNull: true },
    genaansno: { type: DataTypes.INTEGER, allowNull: true },
    gencursno: int0(),
    genjobsno: int0(),
    genempsno: int0(),
    gengrpsno: int0(),
    genectsno: int0(),

    gensupyn: { type: DataTypes.STRING(1), allowNull: true },
    genjobyn: { type: DataTypes.STRING(1), allowNull: true },
    gendepyn: str(1),
    genempyn: str(1),
    gencusyn: str(1),
    genictyn: str(1),
    genadvyn: str(1),
    genappyn: str(1),
    gencamyn: str(1),
    genvehyn: str(1),
    genlocyn: str(1),

    genrate: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },

    genbnkprefix: str(5),
    genoticrdacc: str(12),

    genucdnew: { type: DataTypes.STRING(30), allowNull: true },
    genentddt: { type: DataTypes.DATEONLY, allowNull: true },
    genenttime: { type: DataTypes.TIME, allowNull: true },
    genucdame: { type: DataTypes.STRING(30), allowNull: true },
    genameddt: { type: DataTypes.DATEONLY, allowNull: true },
    genametime: { type: DataTypes.TIME, allowNull: true },

    gentemp: str(1),
  },
  { tableName: 'g_genmast', indexes: [{ unique: true, name: 'g_genmast_genctl_gensub_uniq', fields: ['genctl', 'gensub'] }] }
);
