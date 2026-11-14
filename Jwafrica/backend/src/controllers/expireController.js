// =============================================================================
// controllers/expireController.js - Expire Module (header + lines)
//
//   GET    /api/expire              list of entries
//   GET    /api/expire/lookups      data of all combo boxes
//   GET    /api/expire/:id          one entry with its lines
//   POST   /api/expire              new entry
//   PUT    /api/expire/:id          change an entry
//   DELETE /api/expire/:id          delete an entry and its lines
//   POST   /api/expire/locations    save a new location from the "Add Location" pop-up
// =============================================================================
const { fn, col, where, Op } = require('sequelize');
const { sequelize, Excmast, Exlocmast, Exsmast, Expmast, GGenmast, Exhmast, Exlmast } = require('../models');
const { nowLocal } = require('../utils/time');
const { HttpError } = require('../utils/httpError');
const v = require('../utils/validate');

// Columns of one line (exlmast) that come from the form
const LINE_FIELDS = ['exlexssno', 'exlexpsno', 'exlgensno', 'exlcomplddt', 'exlcutoffddt'];

// ------------------------------------------------------------ combo box data
// Each item is { id, label }. The text format is the same as the old Django forms.
async function lookupChoices() {
  const [cat, loc, svc, per, acc] = await Promise.all([
    Excmast.findAll({ order: [['excexc', 'ASC']] }),
    Exlocmast.findAll({ order: [['exlocloc', 'ASC']] }),
    Exsmast.findAll({ order: [['exsexs', 'ASC']] }),
    Expmast.findAll({ order: [['expdays', 'ASC'], ['expexp', 'ASC']] }),
    GGenmast.findAll({ order: [['genctl', 'ASC'], ['gensub', 'ASC']] }),
  ]);

  return {
    // Item Category <- excmast
    cat: cat.map((o) => ({ id: o.excsno, label: `${o.excexc} - ${o.excnam}` })),
    // Location <- exlocmast
    loc: loc.map((o) => ({ id: o.exlocsno, label: `${o.exlocloc} - ${o.exlocnam}` })),
    // Service Cat <- exsmast
    svc: svc.map((o) => ({ id: o.exssno, label: `${o.exsexs} - ${o.exsnam}` })),
    // Period <- expmast
    per: per.map((o) => ({ id: o.expsno, label: o.expdays !== null ? `${o.expexp} (${o.expdays} days)` : o.expexp })),
    // Acc Code <- g_genmast
    acc: acc.map((o) => ({
      id: o.gensno,
      label: `${o.genctl}${o.gensub ? `-${o.gensub}` : ''}  ${o.gendes || ''}`.trim(),
    })),
  };
}

const idSet = (items) => new Set(items.map((i) => i.id));

// GET /api/expire/lookups
exports.lookups = async (req, res) => {
  res.json(await lookupChoices());
};

// --------------------------------------------------------------------- list
// GET /api/expire
exports.list = async (req, res) => {
  const [rows, counts] = await Promise.all([
    Exhmast.findAll({
      include: [
        { model: Excmast, as: 'category', attributes: ['excnam'] },
        { model: Exlocmast, as: 'location', attributes: ['exlocnam'] },
      ],
      order: [['exhsno', 'DESC']],
    }),
    // Number of lines for each entry (one query)
    Exlmast.count({ group: ['exlexhsno'] }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.exlexhsno, Number(c.count)]));

  res.json({
    rows: rows.map((h) => ({
      ...h.toJSON(),
      category: undefined,
      location: undefined,
      cat_name: h.category ? h.category.excnam : '',
      loc_name: h.location ? h.location.exlocnam : '',
      line_count: countMap[h.exhsno] || 0,
    })),
  });
};

// ---------------------------------------------------------------- one entry
const findEntry = async (id) => {
  if (!/^\d+$/.test(String(id))) throw new HttpError(404, 'Entry not found');
  const header = await Exhmast.findByPk(id);
  if (!header) throw new HttpError(404, 'Entry not found');
  return header;
};

// GET /api/expire/:id
exports.get = async (req, res) => {
  const header = await findEntry(req.params.id);
  const lines = await Exlmast.findAll({ where: { exlexhsno: header.exhsno }, order: [['exllno', 'ASC']] });

  res.json({
    entry: {
      ...header.toJSON(),
      lines: lines.map((l) => Object.fromEntries(LINE_FIELDS.map((f) => [f, l[f]]))),
    },
  });
};

// ---------------------------------------------------------------- validation
// Checks the header and all lines. Returns { errors, lineErrors, linesError, header, lines }
async function readEntryForm(body, currentId) {
  const choices = await lookupChoices();
  const bag = v.errorBag();

  // ---- header
  bag.add('exhdno', v.requiredText(body.exhdno, 'Code', 30));
  bag.add('exhddt', v.requiredDate(body.exhddt, 'Date'));
  bag.add('exhdes', v.requiredText(body.exhdes, 'Description', 50));
  bag.add('exhexcsno', v.requiredChoice(body.exhexcsno, 'Item Category', idSet(choices.cat)));
  bag.add('exhexlocsno', v.requiredChoice(body.exhexlocsno, 'Location', idSet(choices.loc)));

  // The code must be unique
  const code = String(body.exhdno || '').trim();
  if (code && !bag.errors.exhdno) {
    const cond = { exhdno: code };
    if (currentId) cond.exhsno = { [Op.ne]: currentId };
    if (await Exhmast.findOne({ where: cond, attributes: ['exhsno'] })) bag.add('exhdno', 'This Code already exists');
  }

  // ---- lines
  const inputLines = Array.isArray(body.lines) ? body.lines : [];
  const lineErrors = {};
  let linesError = null;
  if (inputLines.length < 1) linesError = 'Add at least one detail line';

  const svc = idSet(choices.svc), per = idSet(choices.per), acc = idSet(choices.acc);
  inputLines.forEach((rawLine, i) => {
    const line = rawLine && typeof rawLine === 'object' ? rawLine : {};
    const lb = v.errorBag();
    lb.add('exlexssno', v.requiredChoice(line.exlexssno, 'Service Cat', svc));
    lb.add('exlexpsno', v.requiredChoice(line.exlexpsno, 'Period', per));
    lb.add('exlgensno', v.requiredChoice(line.exlgensno, 'Acc Code', acc));
    lb.add('exlcomplddt', v.requiredDate(line.exlcomplddt, 'Complete Date'));
    lb.add('exlcutoffddt', v.requiredDate(line.exlcutoffddt, 'Cutoff Date'));
    if (lb.hasErrors()) lineErrors[i] = lb.errors;
  });

  const failed = bag.hasErrors() || linesError || Object.keys(lineErrors).length > 0;
  if (failed) return { errors: bag.errors, lineErrors, linesError };

  return {
    errors: {},
    header: {
      exhdno: code,
      exhddt: String(body.exhddt).trim(),
      exhdes: String(body.exhdes).trim(),
      exhexcsno: Number(body.exhexcsno),
      exhexlocsno: Number(body.exhexlocsno),
    },
    lines: inputLines.map((l) => ({
      exlexssno: Number(l.exlexssno),
      exlexpsno: Number(l.exlexpsno),
      exlgensno: Number(l.exlgensno),
      exlcomplddt: String(l.exlcomplddt).trim(),
      exlcutoffddt: String(l.exlcutoffddt).trim(),
    })),
  };
}

// -------------------------------------------------------------------- save
// Saves the header (exhmast) and all lines (exlmast) together.
// If anything fails, nothing is saved (transaction).
async function saveEntry(header, lines, user, existing) {
  const { date, time } = nowLocal();
  const code = user.usdusd.slice(0, 30); // saved in the created/updated columns

  return sequelize.transaction(async (t) => {
    // --- header
    let h = existing;
    if (!h) {
      // New entry: "created" columns
      h = await Exhmast.create({ ...header, exhucdnew: code, exhentddt: date, exhenttime: time }, { transaction: t });
    } else {
      // Existing entry: "updated" columns
      await h.update({ ...header, exhucdame: code, exhameddt: date, exhametime: time }, { transaction: t });
    }

    // --- lines. Lines already in the database: { line no: line }
    const old = await Exlmast.findAll({ where: { exlexhsno: h.exhsno }, transaction: t });
    const existingLines = new Map(old.map((l) => [l.exllno, l]));

    // Rows on the screen are line 1, 2, 3 ...
    for (let i = 0; i < lines.length; i += 1) {
      const no = i + 1;
      const data = lines[i];
      const line = existingLines.get(no);
      existingLines.delete(no);

      if (!line) {
        // New row -> insert (exlexhsno links the line to the header)
        await Exlmast.create(
          { exlexhsno: h.exhsno, exllno: no, exlucdnew: code, exlentddt: date, exlenttime: time, ...data },
          { transaction: t }
        );
      } else if (LINE_FIELDS.some((k) => String(line[k]) !== String(data[k]))) {
        // Row changed -> update it and fill the "updated" columns
        await line.update({ ...data, exlucdame: code, exlameddt: date, exlametime: time }, { transaction: t });
      }
    }

    // Rows that were removed with the "-" button -> delete from the database
    for (const line of existingLines.values()) {
      await line.destroy({ transaction: t });
    }
    return h;
  });
}

const failValidation = (r) =>
  new HttpError(422, 'Please correct the errors', { errors: r.errors, lineErrors: r.lineErrors, linesError: r.linesError });

// POST /api/expire
exports.create = async (req, res) => {
  const r = await readEntryForm(req.body, null);
  if (!r.header) throw failValidation(r);

  const saved = await saveEntry(r.header, r.lines, req.usd, null);
  res.status(201).json({ message: `Expire entry '${saved.exhdno}' added.`, id: saved.exhsno });
};

// PUT /api/expire/:id
exports.update = async (req, res) => {
  const existing = await findEntry(req.params.id);
  const r = await readEntryForm(req.body, existing.exhsno);
  if (!r.header) throw failValidation(r);

  const saved = await saveEntry(r.header, r.lines, req.usd, existing);
  res.json({ message: `Expire entry '${saved.exhdno}' updated.`, id: saved.exhsno });
};

// DELETE /api/expire/:id
exports.remove = async (req, res) => {
  const header = await findEntry(req.params.id);

  await sequelize.transaction(async (t) => {
    // Lines first, then the header
    await Exlmast.destroy({ where: { exlexhsno: header.exhsno }, transaction: t });
    await header.destroy({ transaction: t });
  });

  res.json({ message: `Expire entry '${header.exhdno}' deleted.` });
};

// ----------------------------------------------------- add location pop-up
// POST /api/expire/locations   body: { exlocloc, exlocnam }
exports.addLocation = async (req, res) => {
  const bag = v.errorBag();
  bag.add('exlocloc', v.requiredText(req.body.exlocloc, 'Location Code', 40));
  bag.add('exlocnam', v.requiredText(req.body.exlocnam, 'Location Name', 40));

  const code = String(req.body.exlocloc || '').trim();
  const name = String(req.body.exlocnam || '').trim();

  // The location code must be unique (capital/small letters are treated the same)
  if (code && !bag.errors.exlocloc) {
    const dup = await Exlocmast.findOne({ where: where(fn('lower', col('exlocloc')), code.toLowerCase()) });
    if (dup) bag.add('exlocloc', 'This Location Code already exists');
  }
  if (bag.hasErrors()) throw new HttpError(400, 'Please correct the errors', { ok: false, errors: bag.errors });

  const { date, time } = nowLocal();
  const loc = await Exlocmast.create({
    exlocloc: code, exlocnam: name,
    exlocucdnew: req.usd.usdusd.slice(0, 30), exlocentddt: date, exlocenttime: time,
  });

  // id + text for the new option in the Location combo box (same text format as lookupChoices)
  res.status(201).json({ ok: true, id: loc.exlocsno, label: `${loc.exlocloc} - ${loc.exlocnam}` });
};
