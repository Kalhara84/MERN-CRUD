const sequelize = require('../config/db');

const Usdmast = require('./Usdmast');
const Excmast = require('./Excmast');
const Exlocmast = require('./Exlocmast');
const Exsmast = require('./Exsmast');
const Expmast = require('./Expmast');
const GGenmast = require('./GGenmast');
const Exhmast = require('./Exhmast');
const Exlmast = require('./Exlmast');

// Links (relations). "constraints: false" = no foreign key is created in the database,
// so the tables stay exactly the same as the old Django tables.
const link = { constraints: false };

// Header -> lines
Exhmast.hasMany(Exlmast, { foreignKey: 'exlexhsno', as: 'lines', ...link });
Exlmast.belongsTo(Exhmast, { foreignKey: 'exlexhsno', as: 'header', ...link });

// Header -> Item Category, Location
Exhmast.belongsTo(Excmast, { foreignKey: 'exhexcsno', as: 'category', ...link });
Exhmast.belongsTo(Exlocmast, { foreignKey: 'exhexlocsno', as: 'location', ...link });

module.exports = { sequelize, Usdmast, Excmast, Exlocmast, Exsmast, Expmast, GGenmast, Exhmast, Exlmast };
