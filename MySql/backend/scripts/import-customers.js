const customers = require('../seed/customers.json');
const { pool, insertRow } = require('../models/database');
async function run() {
  let added = 0;
  for (const customer of customers) {
    const { rows } = await pool.query('SELECT cussno FROM cusmast WHERE cuscus = ?', [customer.cuscus]);
    if (rows.length) continue;
    const values = { ...customer };
    delete values.cussno;
    values.cusactyn = values.cusactyn || 'Y';
    for (const key of Object.keys(values)) {
      if (/ddt$|date$|time$/.test(key) && !values[key]) values[key] = null;
    }
    await insertRow('cusmast', values);
    added++;
  }
  console.log(`Imported ${added}; skipped ${customers.length - added} existing customer codes.`);
}
run().catch(error => { console.error('Import failed:', error.message); process.exitCode = 1; }).finally(() => pool.end());
