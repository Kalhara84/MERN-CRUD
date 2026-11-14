// =============================================================================
// setup.js - creates the tables and adds the starting data.      npm run db:setup
// It is safe to run again: tables and rows that already exist are kept.
//
// Starting logins:   2000 / "2000 rbf"      and      ADMIN / "0777289242"
// (change these passwords after the first login)
// =============================================================================
const bcrypt = require('bcryptjs');
const { pool, nowLocal } = require('./db');

// ------------------------------------------------------------------ tables
// SERIAL = a number that goes up by itself (1, 2, 3 ...)
// NOT NULL DEFAULT '' = cannot be empty (NULL), and '' is used when nothing is given
const TABLES = `
  -- Users (login + Users page)
  CREATE TABLE IF NOT EXISTS usdmast (
    usdsno            SERIAL PRIMARY KEY,
    usdusd            VARCHAR(30)  NOT NULL,              -- user code (login name)
    usdcomsno         INTEGER      NOT NULL DEFAULT 0,
    usdnam            VARCHAR(50),
    usdpwd            VARCHAR(100),                       -- password (saved as a hash)
    usddesig          VARCHAR(25)  NOT NULL DEFAULT '',
    usddepsno         INTEGER      NOT NULL DEFAULT 0,
    usdlocsno         INTEGER      NOT NULL DEFAULT 0,
    usduno            VARCHAR(4)   NOT NULL DEFAULT '',
    usdemail          VARCHAR(40)  NOT NULL DEFAULT '',
    usdadmin          VARCHAR(1)   NOT NULL DEFAULT '',   -- Y = admin
    usdactflg         VARCHAR(1)   NOT NULL DEFAULT 'Y',  -- N = blocked
    usdbockpodgrnyn   VARCHAR(1)   NOT NULL DEFAULT '',
    usdbrcsalyn       VARCHAR(1)   NOT NULL DEFAULT '',
    usdlacsalyn       VARCHAR(1)   NOT NULL DEFAULT '',
    usdprnsalyn       VARCHAR(1)   NOT NULL DEFAULT '',
    usdeggsalyn       VARCHAR(1)   NOT NULL DEFAULT '',
    usdccnsalyn       VARCHAR(1)   NOT NULL DEFAULT '',
    usdpgfsalyn       VARCHAR(1)   NOT NULL DEFAULT '',
    usdcafsalyn       VARCHAR(1)   NOT NULL DEFAULT '',
    usdmaisalyn       VARCHAR(1)   NOT NULL DEFAULT '',
    usdhegsalyn       VARCHAR(1)   NOT NULL DEFAULT '',
    usdhassalyn       VARCHAR(1)   NOT NULL DEFAULT '',
    usdrepyn          VARCHAR(1)   NOT NULL DEFAULT '',
    usdstkrolyn       VARCHAR(1)   NOT NULL DEFAULT '',
    usdatfauthyn      VARCHAR(1)   NOT NULL DEFAULT '',
    usdsohpvalyn      VARCHAR(1)   NOT NULL DEFAULT '',
    usdsalstkcatsnos  VARCHAR(100) NOT NULL DEFAULT '',
    usdprintername    VARCHAR(30)  NOT NULL DEFAULT '',
    usdatfliamt       INTEGER      NOT NULL DEFAULT 0,
    usdatfnosetday    INTEGER      NOT NULL DEFAULT 0,
    usdpwdddt         DATE,                               -- password last changed
    usducdnew         VARCHAR(30), usdentddt DATE, usdenttime TIME,   -- created by / date / time
    usducdame         VARCHAR(30), usdameddt DATE, usdametime TIME,   -- updated by / date / time
    UNIQUE (usdusd, usdcomsno)
  );

  -- Combo box tables
  CREATE TABLE IF NOT EXISTS excmast (            -- Item Category
    excsno SERIAL PRIMARY KEY,
    excexc VARCHAR(40) NOT NULL UNIQUE,
    excnam VARCHAR(40) NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS exlocmast (          -- Location
    exlocsno SERIAL PRIMARY KEY,
    exlocloc VARCHAR(40) NOT NULL UNIQUE,
    exlocnam VARCHAR(40) NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS exsmast (            -- Service Cat
    exssno SERIAL PRIMARY KEY,
    exsexs VARCHAR(40) NOT NULL UNIQUE,
    exsnam VARCHAR(40) NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS expmast (            -- Period
    expsno SERIAL PRIMARY KEY,
    expexp VARCHAR(40) NOT NULL UNIQUE,
    expdays INTEGER
  );
  CREATE TABLE IF NOT EXISTS g_genmast (          -- Acc Code
    gensno SERIAL PRIMARY KEY,
    genctl VARCHAR(8) NOT NULL,
    gensub VARCHAR(4) NOT NULL DEFAULT '',
    gendes VARCHAR(60),
    UNIQUE (genctl, gensub)
  );

  -- Expire entry: header
  CREATE TABLE IF NOT EXISTS exhmast (
    exhsno      SERIAL PRIMARY KEY,
    exhdno      VARCHAR(30) NOT NULL UNIQUE,          -- entry code
    exhexcsno   INTEGER     NOT NULL,                 -- Item Category id
    exhexlocsno INTEGER     NOT NULL,                 -- Location id
    exhddt      DATE        NOT NULL,
    exhdes      VARCHAR(50) NOT NULL,
    exhucdnew   VARCHAR(30), exhentddt DATE, exhenttime TIME,   -- created by / date / time
    exhucdame   VARCHAR(30), exhameddt DATE, exhametime TIME    -- updated by / date / time
  );

  -- Expire entry: lines  (ON DELETE CASCADE = when the header is deleted, its lines go too)
  CREATE TABLE IF NOT EXISTS exlmast (
    exlsno       SERIAL PRIMARY KEY,
    exlexhsno    INTEGER NOT NULL REFERENCES exhmast (exhsno) ON DELETE CASCADE,
    exllno       INTEGER NOT NULL,                    -- line number 1, 2, 3 ...
    exlexssno    INTEGER NOT NULL,                    -- Service Cat id
    exlexpsno    INTEGER NOT NULL,                    -- Period id
    exlgensno    INTEGER NOT NULL,                    -- Acc Code id
    exlcomplddt  DATE,
    exlcutoffddt DATE,
    UNIQUE (exlexhsno, exllno)
  );
`;

// Runs one INSERT for every row in the list. Rows that already exist are skipped.
async function seed(sql, rows) {
  for (const row of rows) await pool.query(sql + ' ON CONFLICT DO NOTHING', row);
}

async function main() {
  await pool.query(TABLES);
  console.log('Tables ready.');

  // ---- users
  const { date, time } = nowLocal();
  await seed(
    `INSERT INTO usdmast (usdusd, usdnam, usdpwd, usdemail, usdadmin, usdactflg, usducdnew, usdentddt, usdenttime, usducdame, usdameddt, usdametime)
     VALUES ($1, $2, $3, $4, 'Y', 'Y', 'SETUP', $5, $6, 'SETUP', $5, $6)`,
    [
      ['2000', '2000', bcrypt.hashSync('2000 rbf', 10), 'rumeshdezoysa@gmail.com', date, time],
      ['ADMIN', 'ADMIN', bcrypt.hashSync('0777289242', 10), '', date, time],
    ]
  );

  // ---- sample data for the Expire Module combo boxes (replace with real data later)
  await seed('INSERT INTO excmast (excexc, excnam) VALUES ($1, $2)', [
    ['MED', 'Medicine'], ['VAC', 'Vaccines'], ['FEED', 'Feed'], ['PKG', 'Packing Material'], ['CHM', 'Chemicals'],
  ]);
  await seed('INSERT INTO exlocmast (exlocloc, exlocnam) VALUES ($1, $2)', [
    ['MAIN', 'Main Store'], ['FARM1', 'Farm 1 Store'], ['FARM2', 'Farm 2 Store'], ['HATCH', 'Hatchery'], ['COLD', 'Cold Room'],
  ]);
  await seed('INSERT INTO exsmast (exsexs, exsnam) VALUES ($1, $2)', [
    ['INSP', 'Inspection'], ['REORD', 'Re-order'], ['DISP', 'Disposal'], ['RETN', 'Return to Supplier'], ['QC', 'Quality Check'],
  ]);
  await seed('INSERT INTO expmast (expexp, expdays) VALUES ($1, $2)', [
    ['1 WEEK', 7], ['2 WEEKS', 14], ['1 MONTH', 30], ['2 MONTHS', 60], ['3 MONTHS', 90], ['6 MONTHS', 180],
  ]);
  await seed('INSERT INTO g_genmast (genctl, gensub, gendes) VALUES ($1, $2, $3)', [
    ['1100', '001', 'Medicine Stock'], ['1100', '002', 'Vaccine Stock'], ['1200', '001', 'Feed Stock'],
    ['1300', '001', 'Packing Material Stock'], ['5100', '001', 'Expired Stock Write-off'],
    ['5100', '002', 'Damaged Stock Write-off'], ['5200', '001', 'Stock Adjustment'],
  ]);

  console.log('Starting data ready.  Login: 2000 / "2000 rbf"   or   ADMIN / "0777289242"');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Setup failed:', err.message);
    process.exit(1);
  });
