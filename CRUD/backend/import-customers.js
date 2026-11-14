// =============================================================================
// import-customers.js - loads the old customers into the cusmast table.
//                                                   npm run db:import-customers
//
// Run  npm run db:setup  first (it creates the tables).
// The customers are read from  seed/customers.json  (taken from the old database).
// It is safe to run again: a customer code that already exists is skipped.
// =============================================================================
const customers = require('./seed/customers.json');
const { pool } = require('./db');

async function main() {
  let added = 0;

  for (const c of customers) {
    const result = await pool.query(
      `INSERT INTO cusmast
         (cussno, cuscus, cusnam, cuscatsno, cuscredittmssno, cuscreditlimit, cusrepsno,
          cusadd, cusad1, cusad2, cusad3, cusad4, cusad5, custelno, cusfaxno, cusemail,
          custinno, cusvatno, cussvatno, cusactyn,
          cusucdnew, cusentddt, cusenttime, cusucdame, cusameddt, cusametime)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
       ON CONFLICT DO NOTHING`,
      [
        c.cussno, c.cuscus, c.cusnam, c.cuscatsno, c.cuscredittmssno, c.cuscreditlimit, c.cusrepsno,
        c.cusadd, c.cusad1, c.cusad2, c.cusad3, c.cusad4, c.cusad5, c.custelno, c.cusfaxno, c.cusemail,
        c.custinno, c.cusvatno, c.cussvatno,
        c.cusactyn || 'Y',                    // an empty flag in the old data means "active"
        c.cusucdnew || null, c.cusentddt, c.cusenttime,
        c.cusucdame || null, c.cusameddt, c.cusametime,
      ]
    );
    added += result.rowCount;
  }

  // The ids above were typed by us, so move the SERIAL counter forward.
  // Without this, the next new customer would get an id that is already used.
  await pool.query("SELECT setval(pg_get_serial_sequence('cusmast', 'cussno'), (SELECT COALESCE(MAX(cussno), 1) FROM cusmast))");

  console.log(`Customers: ${added} added, ${customers.length - added} skipped (already there).`);
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Import failed:', err.message);
    process.exit(1);
  });
