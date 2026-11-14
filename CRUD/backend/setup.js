// =============================================================================
// setup.js - creates the tables and adds the starting data.      npm run db:setup
// (the old customers can be loaded afterwards with:  npm run db:import-customers)
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
const TABLES = {
  usdmast: [
    "usdsno SERIAL PRIMARY KEY",
    "usdusd VARCHAR(30) NOT NULL",
    "usdcomsno INTEGER NOT NULL DEFAULT 0",
    "usdnam VARCHAR(50)",
    "usdpwd VARCHAR(100)",
    "usddesig VARCHAR(25) NOT NULL DEFAULT ''",
    "usddepsno INTEGER NOT NULL DEFAULT 0",
    "usdlocsno INTEGER NOT NULL DEFAULT 0",
    "usduno VARCHAR(4) NOT NULL DEFAULT ''",
    "usdemail VARCHAR(40) NOT NULL DEFAULT ''",
    "usdadmin VARCHAR(1) NOT NULL DEFAULT ''",
    "usdactflg VARCHAR(1) NOT NULL DEFAULT 'Y'",
    "usdbockpodgrnyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdbrcsalyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdlacsalyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdprnsalyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdeggsalyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdccnsalyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdpgfsalyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdcafsalyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdmaisalyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdhegsalyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdhassalyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdrepyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdstkrolyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdatfauthyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdsohpvalyn VARCHAR(1) NOT NULL DEFAULT ''",
    "usdsalstkcatsnos VARCHAR(100) NOT NULL DEFAULT ''",
    "usdprintername VARCHAR(30) NOT NULL DEFAULT ''",
    "usdatfliamt INTEGER NOT NULL DEFAULT 0",
    "usdatfnosetday INTEGER NOT NULL DEFAULT 0",
    "usdpwdddt DATE",
    "usducdnew VARCHAR(30)",
    "usdentddt DATE",
    "usdenttime TIME",
    "usducdame VARCHAR(30)",
    "usdameddt DATE",
    "usdametime TIME",
    "UNIQUE (usdusd, usdcomsno)",
  ],
  excmast: [
    "excsno SERIAL PRIMARY KEY",
    "excexc VARCHAR(40) NOT NULL UNIQUE",
    "excnam VARCHAR(40) NOT NULL DEFAULT ''",
  ],
  exlocmast: [
    "exlocsno SERIAL PRIMARY KEY",
    "exlocloc VARCHAR(40) NOT NULL UNIQUE",
    "exlocnam VARCHAR(40) NOT NULL DEFAULT ''",
  ],
  exsmast: [
    "exssno SERIAL PRIMARY KEY",
    "exsexs VARCHAR(40) NOT NULL UNIQUE",
    "exsnam VARCHAR(40) NOT NULL DEFAULT ''",
  ],
  expmast: [
    "expsno SERIAL PRIMARY KEY",
    "expexp VARCHAR(40) NOT NULL UNIQUE",
    "expdays INTEGER",
  ],
  g_genmast: [
    "gensno SERIAL PRIMARY KEY",
    "genctl VARCHAR(8) NOT NULL",
    "gensub VARCHAR(4) NOT NULL DEFAULT ''",
    "gendes VARCHAR(60)",
    "UNIQUE (genctl, gensub)",
  ],
  sysmast: [
    "syssno SERIAL PRIMARY KEY",
    "sysrtp INTEGER NOT NULL",
    "sysrno VARCHAR(25) NOT NULL",
    "sysdes VARCHAR(50) NOT NULL DEFAULT ''",
    "UNIQUE (sysrtp, sysrno)",
  ],
  repmast: [
    "repsno SERIAL PRIMARY KEY",
    "reprep VARCHAR(15) NOT NULL UNIQUE",
    "repnam VARCHAR(50) NOT NULL DEFAULT ''",
  ],
  cusmast: [
    "cussno SERIAL PRIMARY KEY",
    "cuscus VARCHAR(20) NOT NULL UNIQUE",
    "cusnam VARCHAR(100) NOT NULL",
    "cuscatsno INTEGER NOT NULL DEFAULT 0",
    "cuscredittmssno INTEGER NOT NULL DEFAULT 0",
    "cuscreditlimit NUMERIC(12,0) NOT NULL DEFAULT 0",
    "cusrepsno INTEGER NOT NULL DEFAULT 0",
    "cusadd VARCHAR(200) NOT NULL DEFAULT ''",
    "cusad1 VARCHAR(40) NOT NULL DEFAULT ''",
    "cusad2 VARCHAR(40) NOT NULL DEFAULT ''",
    "cusad3 VARCHAR(40) NOT NULL DEFAULT ''",
    "cusad4 VARCHAR(40) NOT NULL DEFAULT ''",
    "cusad5 VARCHAR(40) NOT NULL DEFAULT ''",
    "custelno VARCHAR(25) NOT NULL DEFAULT ''",
    "cusfaxno VARCHAR(25) NOT NULL DEFAULT ''",
    "cusemail VARCHAR(25) NOT NULL DEFAULT ''",
    "custinno VARCHAR(20) NOT NULL DEFAULT ''",
    "cusvatno VARCHAR(15) NOT NULL DEFAULT ''",
    "cussvatno VARCHAR(25) NOT NULL DEFAULT ''",
    "cusactyn VARCHAR(1) NOT NULL DEFAULT 'Y'",
    "cusdistrict VARCHAR(50) NOT NULL DEFAULT ''",
    "cuscity VARCHAR(50) NOT NULL DEFAULT ''",
    "cusjoindate DATE",
    "cusrecamt20221231 NUMERIC(12,2) NOT NULL DEFAULT 0",
    "cusbalamt20221231 NUMERIC(13,2) NOT NULL DEFAULT 0",
    "custem1 NUMERIC(14,2) NOT NULL DEFAULT 0",
    "custem2 NUMERIC(14,2) NOT NULL DEFAULT 0",
    "custem3 NUMERIC(14,2) NOT NULL DEFAULT 0",
    "cusucdnew VARCHAR(30)",
    "cusentddt DATE",
    "cusenttime TIME",
    "cusucdame VARCHAR(30)",
    "cusameddt DATE",
    "cusametime TIME",
  ],
  exhmast: [
    "exhsno SERIAL PRIMARY KEY",
    "exhdno VARCHAR(30) NOT NULL UNIQUE",
    "exhexcsno INTEGER NOT NULL",
    "exhexlocsno INTEGER NOT NULL",
    "exhddt DATE NOT NULL",
    "exhdes VARCHAR(50) NOT NULL",
    "exhucdnew VARCHAR(30)",
    "exhentddt DATE",
    "exhenttime TIME",
    "exhucdame VARCHAR(30)",
    "exhameddt DATE",
    "exhametime TIME",
  ],
  exlmast: [
    "exlsno SERIAL PRIMARY KEY",
    "exlexhsno INTEGER NOT NULL REFERENCES exhmast (exhsno) ON DELETE CASCADE",
    "exllno INTEGER NOT NULL",
    "exlexssno INTEGER NOT NULL",
    "exlexpsno INTEGER NOT NULL",
    "exlgensno INTEGER NOT NULL",
    "exlcomplddt DATE",
    "exlcutoffddt DATE",
    "UNIQUE (exlexhsno, exllno)",
  ],
};

// Table definitions in setup.js are the single source for creation and updates.
// Keep existing rows and extra legacy columns. Apply schema changes atomically.
const quote = (name) => `"${name.replace(/"/g, '""')}"`;

async function syncTables(pool, tables) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [table, definitions] of Object.entries(tables)) {
      const tableSql = quote(table);
      await client.query(`CREATE TABLE IF NOT EXISTS ${tableSql} (${definitions.join(', ')})`);
      const { rows } = await client.query(
        `SELECT attname, format_type(atttypid, atttypmod) AS type, attnotnull
         FROM pg_attribute
         WHERE attrelid = $1::regclass AND attnum > 0 AND NOT attisdropped`,
        [tableSql]
      );
      const existing = new Map(rows.map((row) => [row.attname, row]));

      for (const definition of definitions) {
        // Table-level constraints are already included when creating a table.
        if (/^(UNIQUE|PRIMARY|FOREIGN|CHECK|CONSTRAINT)\b/i.test(definition)) continue;
        const match = definition.match(/^(\w+)\s+(SERIAL|INTEGER|VARCHAR\(\d+\)|NUMERIC\(\d+,\s*\d+\)|DATE|TIME)(?=\s|$)(.*)$/i);
        if (!match) throw new Error(`Unsupported column definition: ${definition}`);
        const [, column, declaredType, options] = match;
        const columnSql = quote(column);
        if (!existing.has(column)) {
          await client.query(`ALTER TABLE ${tableSql} ADD COLUMN ${definition}`);
          continue;
        }

        // Preserve existing SERIAL sequences and IDENTITY settings.
        if (declaredType.toUpperCase() === 'SERIAL') continue;
        const current = existing.get(column);
        const notNull = /\bNOT NULL\b|\bPRIMARY KEY\b/i.test(options);
        if (current.attnotnull && !notNull) {
          await client.query(`ALTER TABLE ${tableSql} ALTER COLUMN ${columnSql} DROP NOT NULL`);
        }
        const type = declaredType.toLowerCase()
          .replace(/^varchar/, 'character varying')
          .replace(/^time$/, 'time without time zone')
          .replace(/,\s+/g, ',');
        if (current.type !== type) {
          // PostgreSQL's explicit VARCHAR cast can silently truncate strings.
          // Refuse the change if an existing value exceeds the new length.
          const length = declaredType.match(/^VARCHAR\((\d+)\)$/i);
          if (length) {
            const { rows: tooLong } = await client.query(
              `SELECT 1 FROM ${tableSql} WHERE length(${columnSql}::text) > $1 LIMIT 1`,
              [Number(length[1])]
            );
            if (tooLong.length) {
              throw new Error(`${table}.${column} contains values longer than ${length[1]} characters; increase its length in TABLES.`);
            }
          }
          // Old text time/date columns can contain empty strings for missing values.
          const fromText = /^(character varying|character|text)\b/.test(current.type);
          const value = fromText && /^(TIME|DATE)$/i.test(declaredType)
            ? `NULLIF(trim(${columnSql}::text), '')`
            : columnSql;
          await client.query(`ALTER TABLE ${tableSql} ALTER COLUMN ${columnSql} DROP DEFAULT`);
          await client.query(
            `ALTER TABLE ${tableSql} ALTER COLUMN ${columnSql} TYPE ${declaredType}
             USING ${value}::${declaredType}`
          );
        }
        const defaultValue = options.match(/\bDEFAULT\s+('(?:[^']|'')*'|[-\d.]+)/i);
        if (defaultValue) {
          await client.query(`ALTER TABLE ${tableSql} ALTER COLUMN ${columnSql} SET DEFAULT ${defaultValue[1]}`);
        }
        if (notNull && !current.attnotnull) {
          await client.query(`ALTER TABLE ${tableSql} ALTER COLUMN ${columnSql} SET NOT NULL`);
        }
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}


// Runs one INSERT for every row in the list. Rows that already exist are skipped.
async function seed(sql, rows) {
  for (const row of rows) await pool.query(sql + ' ON CONFLICT DO NOTHING', row);
}

async function main() {
  await syncTables(pool, TABLES);
  console.log('Tables created / updated.');

  // ---- users
  const { date, time } = nowLocal();
  // Use separate parameters: older databases can store entry time as VARCHAR
  // and amendment time as TIME, so PostgreSQL must infer each type separately.
  await seed(
    // Supply required values explicitly because legacy tables may have no defaults.
    `INSERT INTO usdmast (
       usdusd, usdnam, usdpwd, usdemail, usdadmin, usdactflg,
       usducdnew, usdentddt, usdenttime, usducdame, usdameddt, usdametime,
       usdcomsno, usddesig, usddepsno, usdlocsno, usduno,
       usdbockpodgrnyn, usdbrcsalyn, usdlacsalyn, usdprnsalyn, usdeggsalyn,
       usdccnsalyn, usdpgfsalyn, usdcafsalyn, usdmaisalyn, usdhegsalyn, usdhassalyn,
       usdrepyn, usdstkrolyn, usdatfauthyn, usdsohpvalyn,
       usdsalstkcatsnos, usdprintername, usdatfliamt, usdatfnosetday
     ) VALUES (
       $1, $2, $3, $4, 'Y', 'Y', 'SETUP', $5, $6, 'SETUP', $7, $8,
       0, '', 0, 0, '',
       '', '', '', '', '',
       '', '', '', '', '', '',
       '', '', '', '',
       '', '', 0, 0
     )`,
    [
      ['2000', '2000', bcrypt.hashSync('2000 rbf', 10), 'rumeshdezoysa@gmail.com', date, time, date, time],
      ['ADMIN', 'ADMIN', bcrypt.hashSync('0777289242', 10), '', date, time, date, time],
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
  // Legacy account tables have extra required columns without database defaults.
  // Include those columns only when present, keeping fresh databases compatible.
  const legacyAccountValues = {
    genctlsub: "$1::varchar || $2::varchar",
    gendebint: "''", gencrdint: "''", gendes1: "''",
    gencomsno: '0', genlocsno: '0', gencursno: '0', genjobsno: '0',
    genempsno: '0', gengrpsno: '0', genectsno: '0',
    gendepyn: "''", genempyn: "''", gencusyn: "''", genictyn: "''",
    genadvyn: "''", genappyn: "''", gencamyn: "''", genvehyn: "''",
    genlocyn: "''", genrate: '0', genbnkprefix: "''", genoticrdacc: "''", gentemp: "''",
  };
  const { rows: accountColumns } = await pool.query(
    `SELECT attname FROM pg_attribute
     WHERE attrelid = 'g_genmast'::regclass AND attnum > 0 AND NOT attisdropped`
  );
  const extraAccountColumns = Object.keys(legacyAccountValues)
    .filter((name) => accountColumns.some((column) => column.attname === name));
  const accountColumnsSql = ['genctl', 'gensub', 'gendes', ...extraAccountColumns].join(', ');
  const accountValuesSql = ['$1', '$2', '$3', ...extraAccountColumns.map((name) => legacyAccountValues[name])].join(', ');
  await seed(`INSERT INTO g_genmast (${accountColumnsSql}) VALUES (${accountValuesSql})`, [
    ['1100', '001', 'Medicine Stock'], ['1100', '002', 'Vaccine Stock'], ['1200', '001', 'Feed Stock'],
    ['1300', '001', 'Packing Material Stock'], ['5100', '001', 'Expired Stock Write-off'],
    ['5100', '002', 'Damaged Stock Write-off'], ['5200', '001', 'Stock Adjustment'],
  ]);

  // ---- Customer drop-down lists (the ids are the same as in the old database,
  //      so the old customers still point to the right Category / Credit Terms)
  const lists = [
    [374, 16, 'Direct Sales', 'Direct Sales'], [303, 16, 'OTHERS', 'OTHERS'],
    [602, 410, 'COD', 'COD'], [613, 410, 'CQ3', 'CQ3'], [614, 410, 'CSD', 'CSD'], [603, 410, 'CSH', 'CSH'],
    [604, 410, 'N1', 'N1'], [607, 410, 'N14', 'N14'], [608, 410, 'N17', 'N17'], [605, 410, 'N3', 'N3'],
    [609, 410, 'N30', 'N30'], [610, 410, 'N37', 'N37'], [612, 410, 'N40', 'N40'], [611, 410, 'N60', 'N60'],
    [606, 410, 'N7', 'N7'],
  ];
  await seed('INSERT INTO sysmast (syssno, sysrtp, sysrno, sysdes) VALUES ($1, $2, $3, $4)', lists);
  // SERIAL does not know about the ids we typed above, so move its counter forward
  await pool.query("SELECT setval(pg_get_serial_sequence('sysmast', 'syssno'), (SELECT MAX(syssno) FROM sysmast))");

  console.log('Starting data ready.  Login: 2000 / "2000 rbf"   or   ADMIN / "0777289242"');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Setup failed:', err.message);
    process.exit(1);
  });
