// =============================================================================
//
//   GET    /api/expire             list of entries
//   GET    /api/expire/lookups     data of all the combo boxes
//   POST   /api/expire/locations   save a new location (the "Add Location" pop-up)
//   GET    /api/expire/:id         one entry with its lines
//   POST   /api/expire             new entry
//   PUT    /api/expire/:id         change an entry
//   DELETE /api/expire/:id         delete an entry (its lines are deleted automatically)
//
// =============================================================================
const express = require('express');
const { pool, nowLocal } = require('./db');

const router = express.Router();

// ------------------------------------------------------------ combo box data
// Every item is { id, label }
async function getLookups() {
  const [cat, loc, svc, per, acc] = await Promise.all([
    pool.query('SELECT * FROM excmast ORDER BY excexc'),
    pool.query('SELECT * FROM exlocmast ORDER BY exlocloc'),
    pool.query('SELECT * FROM exsmast ORDER BY exsexs'),
    pool.query('SELECT * FROM expmast ORDER BY expdays, expexp'),
    pool.query('SELECT * FROM g_genmast ORDER BY genctl, gensub'),
  ]);

  return {
    cat: cat.rows.map((r) => ({ id: r.excsno, label: `${r.excexc} - ${r.excnam}` })),          // Item Category
    loc: loc.rows.map((r) => ({ id: r.exlocsno, label: `${r.exlocloc} - ${r.exlocnam}` })),    // Location
    svc: svc.rows.map((r) => ({ id: r.exssno, label: `${r.exsexs} - ${r.exsnam}` })),          // Service Cat
    per: per.rows.map((r) => ({                                                               // Period
      id: r.expsno,
      label: r.expdays !== null ? `${r.expexp} (${r.expdays} days)` : r.expexp,
    })),
    acc: acc.rows.map((r) => ({                                                               // Acc Code
      id: r.gensno,
      label: `${r.genctl}${r.gensub ? '-' + r.gensub : ''}  ${r.gendes || ''}`.trim(),
    })),
  };
}

// GET /api/expire/lookups
router.get('/lookups', async (req, res) => {
  res.json(await getLookups());
});

// POST /api/expire/locations   body: { exlocloc, exlocnam }
router.post('/locations', async (req, res) => {
  const code = String(req.body.exlocloc || '').trim();
  const name = String(req.body.exlocnam || '').trim();
  const errors = {};

  if (!code) errors.exlocloc = 'Location Code is required';
  else if (code.length > 40) errors.exlocloc = 'Location Code must be 40 characters or less';
  if (!name) errors.exlocnam = 'Location Name is required';
  else if (name.length > 40) errors.exlocnam = 'Location Name must be 40 characters or less';

  // The code must be new (capital / small letters are the same)
  if (!errors.exlocloc) {
    const dup = await pool.query('SELECT 1 FROM exlocmast WHERE lower(exlocloc) = lower($1)', [code]);
    if (dup.rows.length > 0) errors.exlocloc = 'This Location Code already exists';
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Please correct the errors', errors });
  }

  const { rows } = await pool.query(
    'INSERT INTO exlocmast (exlocloc, exlocnam) VALUES ($1, $2) RETURNING exlocsno',
    [code, name]
  );
  // id + text for the new option of the Location combo box
  res.status(201).json({ id: rows[0].exlocsno, label: `${code} - ${name}` });
});

// --------------------------------------------------------------------- list
// GET /api/expire
router.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT h.*,
           c.excnam   AS cat_name,
           l.exlocnam AS loc_name,
           (SELECT COUNT(*)::int FROM exlmast WHERE exlexhsno = h.exhsno) AS line_count
    FROM exhmast h
    LEFT JOIN excmast   c ON c.excsno   = h.exhexcsno
    LEFT JOIN exlocmast l ON l.exlocsno = h.exhexlocsno
    ORDER BY h.exhsno DESC`);
  res.json({ rows });
});

// ---------------------------------------------------------------- one entry
// Finds the header row by id. Returns undefined when there is no such entry.
async function findEntry(id) {
  if (!/^\d+$/.test(id)) return undefined;
  const { rows } = await pool.query('SELECT * FROM exhmast WHERE exhsno = $1', [id]);
  return rows[0];
}

// GET /api/expire/:id
router.get('/:id', async (req, res) => {
  const header = await findEntry(req.params.id);
  if (!header) return res.status(404).json({ message: 'Entry not found' });

  const { rows: lines } = await pool.query('SELECT * FROM exlmast WHERE exlexhsno = $1 ORDER BY exllno', [header.exhsno]);
  res.json({ entry: { ...header, lines } });
});

// ---------------------------------------------------------------- checking
// A real calendar date written as YYYY-MM-DD ?
function isDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(text))) return false;
  const d = new Date(text + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === text;
}

// Checks the header and every line.
// Returns { errors, lineErrors }   errors = { field: message }   lineErrors = { rowNumber: { field: message } }
async function checkEntry(body, lines, currentId) {
  const lookups = await getLookups();
  const errors = {};
  const lineErrors = {};

  // Is the chosen id one of the ids in the combo box?
  const inList = (value, items) => items.some((item) => String(item.id) === String(value));

  // ---- header
  const code = String(body.exhdno || '').trim();
  const description = String(body.exhdes || '').trim();

  if (!code) errors.exhdno = 'Code is required';
  else if (code.length > 30) errors.exhdno = 'Code must be 30 characters or less';

  if (!isDate(body.exhddt)) errors.exhddt = 'Enter a valid Date';

  if (!description) errors.exhdes = 'Description is required';
  else if (description.length > 50) errors.exhdes = 'Description must be 50 characters or less';

  if (!inList(body.exhexcsno, lookups.cat)) errors.exhexcsno = 'Select a valid Item Category';
  if (!inList(body.exhexlocsno, lookups.loc)) errors.exhexlocsno = 'Select a valid Location';

  // The code must be unique (the entry we are editing is ignored)
  if (!errors.exhdno) {
    const dup = await pool.query('SELECT 1 FROM exhmast WHERE exhdno = $1 AND exhsno <> $2', [code, currentId || 0]);
    if (dup.rows.length > 0) errors.exhdno = 'This Code already exists';
  }

  // ---- lines
  lines.forEach((line, i) => {
    const e = {};
    if (!inList(line.exlexssno, lookups.svc)) e.exlexssno = 'Select a valid Service Cat';
    if (!inList(line.exlexpsno, lookups.per)) e.exlexpsno = 'Select a valid Period';
    if (!inList(line.exlgensno, lookups.acc)) e.exlgensno = 'Select a valid Acc Code';
    if (!isDate(line.exlcomplddt)) e.exlcomplddt = 'Enter a valid Complete Date';
    if (!isDate(line.exlcutoffddt)) e.exlcutoffddt = 'Enter a valid Cutoff Date';
    if (Object.keys(e).length > 0) lineErrors[i] = e;
  });

  return { errors, lineErrors };
}

// ------------------------------------------------------------------- saving
// Used by both "new" (id = null) and "change" (id = the entry id).
// The header and ALL lines are saved together: if something fails, nothing is saved (transaction).
async function saveEntry(req, res, id) {
  const lines = Array.isArray(req.body.lines) ? req.body.lines : [];
  if (lines.length === 0) {
    return res.status(400).json({ message: 'Add at least one detail line' });
  }

  const { errors, lineErrors } = await checkEntry(req.body, lines, id);
  if (Object.keys(errors).length > 0 || Object.keys(lineErrors).length > 0) {
    return res.status(422).json({ message: 'Please correct the errors', errors, lineErrors });
  }

  const b = req.body;
  const code = String(b.exhdno).trim();
  const description = String(b.exhdes).trim();
  const { date, time } = nowLocal();
  const me = req.user.usdusd.slice(0, 30);

  const client = await pool.connect();   // one connection for the whole transaction
  try {
    await client.query('BEGIN');

    let headerId = id;
    if (!id) {
      // New entry -> "created" columns
      const r = await client.query(
        `INSERT INTO exhmast (exhdno, exhddt, exhdes, exhexcsno, exhexlocsno, exhucdnew, exhentddt, exhenttime)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING exhsno`,
        [code, b.exhddt, description, b.exhexcsno, b.exhexlocsno, me, date, time]
      );
      headerId = r.rows[0].exhsno;
    } else {
      // Existing entry -> "updated" columns, and the old lines are removed
      // (the lines on the screen are saved again below)
      await client.query(
        `UPDATE exhmast SET exhdno = $1, exhddt = $2, exhdes = $3, exhexcsno = $4, exhexlocsno = $5,
                exhucdame = $6, exhameddt = $7, exhametime = $8
         WHERE exhsno = $9`,
        [code, b.exhddt, description, b.exhexcsno, b.exhexlocsno, me, date, time, id]
      );
      await client.query('DELETE FROM exlmast WHERE exlexhsno = $1', [id]);
    }

    // Lines: the first row on the screen is line 1, then 2, 3 ...
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      await client.query(
        `INSERT INTO exlmast (exlexhsno, exllno, exlexssno, exlexpsno, exlgensno, exlcomplddt, exlcutoffddt)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [headerId, i + 1, l.exlexssno, l.exlexpsno, l.exlgensno, l.exlcomplddt, l.exlcutoffddt]
      );
    }

    await client.query('COMMIT');
    res.status(id ? 200 : 201).json({ message: `Expire entry '${code}' ${id ? 'updated' : 'added'}.` });
  } catch (err) {
    await client.query('ROLLBACK');   // something failed -> undo everything
    throw err;
  } finally {
    client.release();
  }
}

// POST /api/expire
router.post('/', (req, res) => saveEntry(req, res, null));

// PUT /api/expire/:id
router.put('/:id', async (req, res) => {
  const header = await findEntry(req.params.id);
  if (!header) return res.status(404).json({ message: 'Entry not found' });
  await saveEntry(req, res, header.exhsno);
});

// DELETE /api/expire/:id
router.delete('/:id', async (req, res) => {
  const header = await findEntry(req.params.id);
  if (!header) return res.status(404).json({ message: 'Entry not found' });

  // The lines are deleted automatically (ON DELETE CASCADE, see setup.js)
  await pool.query('DELETE FROM exhmast WHERE exhsno = $1', [header.exhsno]);
  res.json({ message: `Expire entry '${header.exhdno}' deleted.` });
});

module.exports = router;
