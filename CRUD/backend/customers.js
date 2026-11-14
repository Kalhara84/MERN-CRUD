// =============================================================================
// customers.js - Customers page: list, add, edit, delete   (all logged-in users)
//
//   GET    /api/customers            list of customers
//   GET    /api/customers/lookups    data of the drop-down lists (Category, Credit Terms, Rep)
//   GET    /api/customers/next-code  the next free customer code (shown on the Add page)
//   GET    /api/customers/:id        one customer
//   POST   /api/customers            add a customer
//   PUT    /api/customers/:id        change a customer
//   DELETE /api/customers/:id        delete a customer
// =============================================================================
const express = require('express');
const { pool, nowLocal, insertRow, updateRow } = require('./db');

const router = express.Router();

// sysmast keeps many small lists. This number tells which list we want.
const CATEGORY_TYPE = 16;
const CREDIT_TERMS_TYPE = 410;

// Text boxes that come from the form, and the longest text each one can hold
const MAX = {
  cuscus: 20, cusnam: 100, cusadd: 200,
  cusad1: 40, cusad2: 40, cusad3: 40, cusad4: 40, cusad5: 40,
  custelno: 25, cusfaxno: 25, cusemail: 50,
  custinno: 20, cusvatno: 15, cussvatno: 25,
};
const TEXT_FIELDS = Object.keys(MAX).filter((field) => field !== 'cuscus');   // the code is handled on its own

// ------------------------------------------------------------ drop-down data
// Every item is { id, label }
async function getLookups() {
  const [cat, credit, rep] = await Promise.all([
    pool.query('SELECT syssno, sysdes FROM sysmast WHERE sysrtp = $1 ORDER BY sysrno', [CATEGORY_TYPE]),
    pool.query('SELECT syssno, sysdes FROM sysmast WHERE sysrtp = $1 ORDER BY sysrno', [CREDIT_TERMS_TYPE]),
    pool.query('SELECT repsno, reprep, repnam FROM repmast ORDER BY repnam'),
  ]);

  return {
    cat: cat.rows.map((r) => ({ id: r.syssno, label: r.sysdes })),                    // Category
    credit: credit.rows.map((r) => ({ id: r.syssno, label: r.sysdes })),              // Credit Terms
    rep: rep.rows.map((r) => ({ id: r.repsno, label: r.repnam || r.reprep })),        // Rep
  };
}

// GET /api/customers/lookups
router.get('/lookups', async (req, res) => {
  res.json(await getLookups());
});

// ------------------------------------------------------------------ next code
// The biggest numeric code + 1.  Codes that are not numbers (for example "ABC") are ignored.
// GET /api/customers/next-code
router.get('/next-code', async (req, res) => {
  const { rows } = await pool.query(
    "SELECT COALESCE(MAX(cuscus::bigint), 0) + 1 AS next FROM cusmast WHERE cuscus ~ '^[0-9]{1,15}$'"
  );
  res.json({ code: String(rows[0].next) });
});

// --------------------------------------------------------------------- list
// The list also brings the Category name and the Rep name, so the table can show them.
// GET /api/customers
router.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT c.*,
           s.sysdes AS cat_name,
           t.sysdes AS credit_name,
           r.repnam AS rep_name
    FROM cusmast c
    LEFT JOIN sysmast s ON s.syssno = c.cuscatsno        AND s.sysrtp = ${CATEGORY_TYPE}
    LEFT JOIN sysmast t ON t.syssno = c.cuscredittmssno  AND t.sysrtp = ${CREDIT_TERMS_TYPE}
    LEFT JOIN repmast r ON r.repsno = c.cusrepsno
    ORDER BY c.cuscus`);
  res.json({ customers: rows });
});

// ------------------------------------------------------------- one customer
// Finds one customer by id. Returns undefined when there is no such customer.
async function findCustomer(id) {
  if (!/^\d+$/.test(id)) return undefined;
  const { rows } = await pool.query('SELECT * FROM cusmast WHERE cussno = $1', [id]);
  return rows[0];
}

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  const customer = await findCustomer(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json({ customer });
});

// ---------------------------------------------------------------- checking
// Checks the form and prepares the values for the database.
// Returns { errors, values }.   errors = { fieldName: 'message' }
// "current" is the customer that is being edited (undefined when adding a new one).
async function readForm(body, current) {
  const errors = {};
  const values = {};
  const lookups = await getLookups();

  // ---- text boxes
  TEXT_FIELDS.forEach((field) => {
    const text = String(body[field] ?? '').trim();
    if (text.length > MAX[field]) errors[field] = `Must be ${MAX[field]} characters or less`;
    values[field] = text;
  });
  if (!values.cusnam) errors.cusnam = 'Customer name is required';

  // A simple e-mail check (an empty e-mail is fine)
  if (values.cusemail && !/^\S+@\S+\.\S+$/.test(values.cusemail)) errors.cusemail = 'Enter a valid E-mail';

  // ---- customer code: typed only when adding. When editing, the old code stays.
  if (current) {
    values.cuscus = current.cuscus;
  } else {
    // Capital letters are used for codes, and the quote marks are not allowed in a code
    const code = String(body.cuscus ?? '').trim().toUpperCase().replace(/['"`]/g, '');
    if (!code) errors.cuscus = 'Customer code is required';
    else if (code.length > MAX.cuscus) errors.cuscus = `Customer code must be ${MAX.cuscus} characters or less`;
    values.cuscus = code;
  }

  // ---- drop-downs: empty (0) is allowed, otherwise the id must be in the list.
  // An old customer may hold an id that is not in the list any more. That old value is accepted
  // while it is not changed, so the customer can still be saved.
  const pick = (field, items) => {
    const text = String(body[field] ?? '').trim();
    const id = text === '' ? 0 : Number(text);
    const unchanged = current && Number(current[field]) === id;
    if (!Number.isInteger(id) || id < 0 || (id !== 0 && !unchanged && !items.some((item) => item.id === id))) {
      errors[field] = 'Select a valid value';
    }
    values[field] = id;
  };
  pick('cuscatsno', lookups.cat);
  pick('cuscredittmssno', lookups.credit);
  pick('cusrepsno', lookups.rep);

  // ---- credit limit: a whole number, 12 digits at most
  const limit = String(body.cuscreditlimit ?? '').trim();
  if (limit !== '' && !/^\d{1,12}$/.test(limit)) errors.cuscreditlimit = 'Enter a whole number (0 or more)';
  values.cuscreditlimit = limit === '' ? 0 : limit;

  // ---- Active: the switch gives true / false. Saved as 'Y' / 'N'.
  values.cusactyn = body.cusactyn ? 'Y' : 'N';

  return { errors, values };
}

// Is this customer code already used? (capital / small letters ignored)
async function codeExists(code) {
  const { rows } = await pool.query('SELECT 1 FROM cusmast WHERE lower(cuscus) = lower($1)', [code]);
  return rows.length > 0;
}

// POST /api/customers
router.post('/', async (req, res) => {
  const { errors, values } = await readForm(req.body, undefined);

  // Check the duplicate code only when everything else is fine
  if (Object.keys(errors).length === 0 && (await codeExists(values.cuscus))) {
    errors.cuscus = 'This Customer code already exists';
  }
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Please correct the errors', errors });
  }

  const { date, time } = nowLocal();
  await insertRow('cusmast', {
    ...values,
    // created by / date / time
    cusucdnew: req.user.usdusd.slice(0, 30), cusentddt: date, cusenttime: time,
  });

  res.status(201).json({ message: `Customer '${values.cuscus}' added.` });
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  const customer = await findCustomer(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  const { errors, values } = await readForm(req.body, customer);
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Please correct the errors', errors });
  }

  const { date, time } = nowLocal();
  delete values.cuscus;   // the customer code is never changed
  await updateRow('cusmast', 'cussno', customer.cussno, {
    ...values,
    // updated by / date / time
    cusucdame: req.user.usdusd.slice(0, 30), cusameddt: date, cusametime: time,
  });

  res.json({ message: `Customer '${customer.cuscus}' updated.` });
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  const customer = await findCustomer(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  await pool.query('DELETE FROM cusmast WHERE cussno = $1', [customer.cussno]);
  res.json({ message: `Customer '${customer.cuscus}' deleted.` });
});

module.exports = router;
