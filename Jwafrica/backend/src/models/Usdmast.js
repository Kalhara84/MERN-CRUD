const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Short way to write a 1-letter Yes/No column: 'Y' or empty.
const yn = () => ({ type: DataTypes.STRING(1), allowNull: false, defaultValue: '' });

const Usdmast = sequelize.define(
  'Usdmast',
  {
    usdsno: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // User code = the name typed on the login page
    usdusd: { type: DataTypes.STRING(30), allowNull: false },
    usdcomsno: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    usdnam: { type: DataTypes.STRING(50), allowNull: true },

    // Password (stored as a hash)
    usdpwd: { type: DataTypes.STRING(128), allowNull: true },

    usddesig: { type: DataTypes.STRING(25), allowNull: false, defaultValue: '' },
    usddepsno: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    usdlocsno: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    usduno: { type: DataTypes.STRING(4), allowNull: false, defaultValue: '' },
    usdemail: { type: DataTypes.STRING(40), allowNull: false, defaultValue: '' },

    // Y = admin user (can open the Users page)
    usdadmin: yn(),
    // Y = active, N = blocked (cannot login)
    usdactflg: yn(),

    // Permission flags (Y / empty)
    usdbockpodgrnyn: yn(),
    usdbrcsalyn: yn(),
    usdlacsalyn: yn(),
    usdprnsalyn: yn(),
    usdeggsalyn: yn(),
    usdccnsalyn: yn(),
    usdpgfsalyn: yn(),
    usdcafsalyn: yn(),
    usdmaisalyn: yn(),
    usdhegsalyn: yn(),
    usdhassalyn: yn(),
    usdsalstkcatsnos: { type: DataTypes.STRING(100), allowNull: false, defaultValue: '' },
    usdrepyn: yn(),
    usdstkrolyn: yn(),

    usdprintername: { type: DataTypes.STRING(30), allowNull: false, defaultValue: '' },

    usdatfauthyn: yn(),
    usdatfliamt: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    usdatfnosetday: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // Date the password was last changed (empty = never)
    usdpwdddt: { type: DataTypes.DATEONLY, allowNull: true },

    usdsohpvalyn: yn(),

    // Created by / date / time
    usducdnew: { type: DataTypes.STRING(10), allowNull: false, defaultValue: '' },
    usdentddt: { type: DataTypes.DATEONLY, allowNull: true },
    usdenttime: { type: DataTypes.STRING(12), allowNull: false, defaultValue: '' },

    // Last updated by / date / time (shown in the Users list)
    usducdame: { type: DataTypes.STRING(30), allowNull: true },
    usdameddt: { type: DataTypes.DATEONLY, allowNull: true },
    usdametime: { type: DataTypes.TIME, allowNull: true },
  },
  {
    tableName: 'usdmast',
    // Same user code cannot be used twice in one company
    indexes: [{ unique: true, name: 'usdmast_usdusd_usdcomsno_uniq', fields: ['usdusd', 'usdcomsno'] }],
  }
);

// True when usdadmin = 'Y' (used by middleware/auth.js and the sidebar)
Usdmast.prototype.isAdmin = function () {
  return (this.usdadmin || '').toUpperCase() === 'Y';
};

// True unless usdactflg = 'N' (used by login and middleware/auth.js)
Usdmast.prototype.isActiveUser = function () {
  return (this.usdactflg || '').toUpperCase() !== 'N';
};

// What is sent to the browser. The password hash is NEVER sent.
Usdmast.prototype.toSafeJSON = function () {
  const data = this.toJSON();
  delete data.usdpwd;
  data.is_admin = this.isAdmin();
  data.is_active = this.isActiveUser();
  return data;
};

module.exports = Usdmast;
