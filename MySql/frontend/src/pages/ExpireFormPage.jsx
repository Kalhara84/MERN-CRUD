// =============================================================================
// pages/ExpireFormPage.jsx - Add / Edit an Expire entry
// One Save button saves the header (top part) and all the lines (table) together.
//   /expire/add  -> new entry        /expire/:id/edit  -> change an entry
// =============================================================================
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import Modal from '../components/Modal';
import { dateTime, todayLocal } from '../helpers';

// Labels of the boxes (also used for the "... is required" messages)
const HEADER_LABELS = {
  exhdno: 'Code', exhddt: 'Date', exhdes: 'Description', exhexcsno: 'Item Category', exhexlocsno: 'Location',
};
const LINE_LABELS = {
  exlexssno: 'Service Cat', exlexpsno: 'Period', exlgensno: 'Acc Code',
  exlcomplddt: 'Complete Date', exlcutoffddt: 'Cutoff Date',
};

// A blank table row. "key" is only for React, to know which row is which.
let nextKey = 1;
function newLine() {
  return { key: nextKey++, exlexssno: '', exlexpsno: '', exlgensno: '', exlcomplddt: '', exlcutoffddt: '' };
}

// Adds the red border to a box when it has an error
const cls = (base, error) => (error ? `${base} is-invalid` : base);

export default function ExpireFormPage({ showMessage }) {
  const { id } = useParams();          // empty on the Add page
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [lookups, setLookups] = useState(null);     // the data of all combo boxes
  const [header, setHeader] = useState({ exhdno: '', exhddt: todayLocal(), exhdes: '', exhexcsno: '', exhexlocsno: '' });
  const [lines, setLines] = useState([newLine()]);  // the table rows
  const [saved, setSaved] = useState(null);         // the entry as saved in the database (edit page)
  const [errors, setErrors] = useState({});         // header errors:  { field: message }
  const [lineErrors, setLineErrors] = useState({}); // line errors:    { rowNumber: { field: message } }
  const [showLoc, setShowLoc] = useState(false);    // is the "Add Location" pop-up open?
  const [busy, setBusy] = useState(false);

  // Page opened: load the combo box data (and the entry, on the edit page)
  useEffect(() => {
    async function load() {
      try {
        const lk = await api.get('/expire/lookups');

        if (isEdit) {
          const { entry } = await api.get('/expire/' + id);
          setSaved(entry);
          setHeader({
            exhdno: entry.exhdno, exhddt: entry.exhddt, exhdes: entry.exhdes,
            exhexcsno: String(entry.exhexcsno), exhexlocsno: String(entry.exhexlocsno),
          });
          setLines(entry.lines.length > 0 ? entry.lines.map((l) => ({
            key: nextKey++,
            exlexssno: String(l.exlexssno), exlexpsno: String(l.exlexpsno), exlgensno: String(l.exlgensno),
            exlcomplddt: l.exlcomplddt || '', exlcutoffddt: l.exlcutoffddt || '',
          })) : [newLine()]);
        }
        setLookups(lk);   // last, so the page is shown only when everything is ready
      } catch (err) {
        showMessage('danger', err.message);
        navigate('/expire');
      }
    }
    load();
  }, [id]);

  // ---------- header ----------
  function changeHeader(name, value) {
    setHeader({ ...header, [name]: value });
    setErrors({ ...errors, [name]: undefined });
  }

  // ---------- lines ----------
  function changeLine(index, name, value) {
    setLines(lines.map((line, i) => (i === index ? { ...line, [name]: value } : line)));
    setLineErrors({ ...lineErrors, [index]: { ...lineErrors[index], [name]: undefined } });
  }

  // "+" button: add a blank row under this row
  function addLineAfter(index) {
    const copy = [...lines];
    copy.splice(index + 1, 0, newLine());
    setLines(copy);
    setLineErrors({});
  }

  // "-" button: remove this row. The last row cannot be removed, so it is just cleared.
  function removeLine(index) {
    setLines(lines.length > 1 ? lines.filter((_, i) => i !== index) : [newLine()]);
    setLineErrors({});
  }

  // ---------- "Add Location" pop-up ----------
  // The pop-up gives us the new location { id, label }
  function onLocationAdded(location) {
    // Add it to the Location combo box (keep alphabetical order) and select it
    const list = [...lookups.loc, location].sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
    setLookups({ ...lookups, loc: list });
    changeHeader('exhexlocsno', String(location.id));
  }

  // ---------- save ----------
  // Checks the empty boxes in the browser first (the server checks again)
  function validate() {
    const newErrors = {};
    for (const name in HEADER_LABELS) {
      if (!String(header[name]).trim()) newErrors[name] = HEADER_LABELS[name] + ' is required';
    }

    const newLineErrors = {};
    lines.forEach((line, i) => {
      for (const name in LINE_LABELS) {
        if (!String(line[name]).trim()) newLineErrors[i] = { ...newLineErrors[i], [name]: LINE_LABELS[name] + ' is required' };
      }
    });

    setErrors(newErrors);
    setLineErrors(newLineErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newLineErrors).length === 0;
  }

  async function save(e) {
    e.preventDefault();
    if (!validate()) return;

    setBusy(true);
    const body = { ...header, lines };   // header boxes + the table rows
    try {
      const data = isEdit ? await api.put('/expire/' + id, body) : await api.post('/expire', body);
      showMessage('success', data.message);
      navigate('/expire');
    } catch (err) {
      if (err.status === 422) {
        // The server found wrong values (for example "This Code already exists")
        setErrors(err.data.errors || {});
        setLineErrors(err.data.lineErrors || {});
      } else {
        showMessage('danger', err.message);
      }
      setBusy(false);
    }
  }

  if (!lookups) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  // ---------- small helpers for the page ----------
  // <option> list of a combo box
  const options = (items) => items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>);

  // Label with a red *, and the red message under a header box
  const label = (name) => (
    <label className="form-label" htmlFor={name}>{HEADER_LABELS[name]} <span className="text-danger">*</span></label>
  );
  const feedback = (name) => <div className="invalid-feedback">{errors[name]}</div>;

  // One combo box cell / one date cell of a table row
  const lineSelect = (line, i, name, items) => (
    <td>
      <select value={line[name]} className={cls('form-select form-select-sm', (lineErrors[i] || {})[name])}
        onChange={(e) => changeLine(i, name, e.target.value)}>
        <option value="">-- Select --</option>
        {options(items)}
      </select>
    </td>
  );
  const lineDate = (line, i, name) => (
    <td>
      <input type="date" value={line[name]} className={cls('form-control form-control-sm', (lineErrors[i] || {})[name])}
        onChange={(e) => changeLine(i, name, e.target.value)} />
    </td>
  );

  return (
    <div className="exp-page">
      <h3 className="exp-title">{isEdit ? 'Edit Expire Entry' : 'Add Expire Entry'}</h3>
      <hr />

      <form onSubmit={save} noValidate>
        {/* HEADER, row 1: Code, Date, Description */}
        <div className="row g-4 mb-3">
          <div className="col-md-4">
            {label('exhdno')}
            <input id="exhdno" type="text" maxLength={30} autoComplete="off" value={header.exhdno}
              className={cls('form-control', errors.exhdno)} onChange={(e) => changeHeader('exhdno', e.target.value)} />
            {feedback('exhdno')}
          </div>
          <div className="col-md-4">
            {label('exhddt')}
            <input id="exhddt" type="date" value={header.exhddt}
              className={cls('form-control', errors.exhddt)} onChange={(e) => changeHeader('exhddt', e.target.value)} />
            {feedback('exhddt')}
          </div>
          <div className="col-md-4">
            {label('exhdes')}
            <input id="exhdes" type="text" maxLength={50} autoComplete="off" value={header.exhdes}
              className={cls('form-control', errors.exhdes)} onChange={(e) => changeHeader('exhdes', e.target.value)} />
            {feedback('exhdes')}
          </div>
        </div>

        {/* HEADER, row 2: Item Category and Location combo boxes + Add Location button */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            {label('exhexcsno')}
            <select id="exhexcsno" value={header.exhexcsno}
              className={cls('form-select', errors.exhexcsno)} onChange={(e) => changeHeader('exhexcsno', e.target.value)}>
              <option value="">-- Select --</option>
              {options(lookups.cat)}
            </select>
            {feedback('exhexcsno')}
          </div>
          <div className="col-md-4">
            {label('exhexlocsno')}
            <select id="exhexlocsno" value={header.exhexlocsno}
              className={cls('form-select', errors.exhexlocsno)} onChange={(e) => changeHeader('exhexlocsno', e.target.value)}>
              <option value="">-- Select --</option>
              {options(lookups.loc)}
            </select>
            {feedback('exhexlocsno')}
          </div>
          <div className="col-md-4 exp-addloc">
            <button type="button" className="btn btn-secondary" onClick={() => setShowLoc(true)}>Add Location</button>
          </div>
        </div>

        {/* LINES table: one row = one line of the entry */}
        <div className="table-responsive">
          <table className="table exp-table align-middle">
            <thead>
              <tr>
                <th>#</th><th>Service Cat</th><th>Period</th><th>Acc Code</th>
                <th>Complete Date</th><th>Cutoff Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr className="line-row" key={line.key}>
                  <td className="line-no">{i + 1}</td>
                  {lineSelect(line, i, 'exlexssno', lookups.svc)}
                  {lineSelect(line, i, 'exlexpsno', lookups.per)}
                  {lineSelect(line, i, 'exlgensno', lookups.acc)}
                  {lineDate(line, i, 'exlcomplddt')}
                  {lineDate(line, i, 'exlcutoffddt')}
                  {/* + adds a row below this one, - removes this row */}
                  <td className="text-center text-nowrap">
                    <button type="button" className="btn btn-outline-primary" title="Add row" onClick={() => addLineAfter(i)}>+</button>{' '}
                    <button type="button" className="btn btn-outline-danger" title="Remove row" onClick={() => removeLine(i)}>-</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* What is wrong in each row:  "Line 2: Period is required, ..." */}
        {Object.keys(lineErrors).map((i) => {
          const messages = Object.values(lineErrors[i]).filter(Boolean);
          return messages.length > 0 && (
            <div key={i} className="text-danger exp-lines-error">Line {Number(i) + 1}: {messages.join(', ')}</div>
          );
        })}

        {/* Total number of lines, Cancel and Save buttons */}
        <div className="row exp-totals">
          <div className="col-md-3">
            <label className="form-label" htmlFor="totalLines">Total Lines</label>
            <input type="text" id="totalLines" className="form-control" value={lines.length} readOnly />
          </div>
          <div className="col text-end align-self-end">
            <Link to="/expire" className="btn btn-secondary me-1">Cancel</Link>
            <button type="submit" className="btn btn-primary px-4" disabled={busy}>Save</button>
          </div>
        </div>

        {/* Edit page: who changed this entry last, and when */}
        {isEdit && saved && saved.exhucdame && (
          <p className="text-muted small mt-3 mb-0">Last updated by <b>{saved.exhucdame}</b> on {dateTime(saved.exhameddt, saved.exhametime)}</p>
        )}
      </form>

      {showLoc && <AddLocationModal onClose={() => setShowLoc(false)} onAdded={onLocationAdded} />}
    </div>
  );
}

// -----------------------------------------------------------------------------
// The "Add Location" pop-up. It saves the new location without leaving the page,
// then gives it to the form through onAdded({ id, label }).
// -----------------------------------------------------------------------------
function AddLocationModal({ onClose, onAdded }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});

  async function save(e) {
    e.preventDefault();

    const newErrors = {};
    if (!code.trim()) newErrors.exlocloc = 'Location Code is required';
    if (!name.trim()) newErrors.exlocnam = 'Location Name is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const location = await api.post('/expire/locations', { exlocloc: code.trim(), exlocnam: name.trim() });
      onAdded(location);
      onClose();
    } catch (err) {
      // Server messages, for example "This Location Code already exists"
      setErrors(err.data.errors || { all: err.message });
    }
  }

  return (
    <Modal
      title="Add Location"
      onClose={onClose}
      onSubmit={save}
      footer={(
        <>
          <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </>
      )}
    >
      <div className="mb-3">
        <label className="form-label" htmlFor="locCode">Location Code <span className="text-danger">*</span></label>
        <input id="locCode" type="text" maxLength={40} autoComplete="off" autoFocus value={code}
          className={cls('form-control', errors.exlocloc)} onChange={(e) => setCode(e.target.value)} />
        <div className="invalid-feedback">{errors.exlocloc}</div>
      </div>
      <div>
        <label className="form-label" htmlFor="locName">Location Name <span className="text-danger">*</span></label>
        <input id="locName" type="text" maxLength={40} autoComplete="off" value={name}
          className={cls('form-control', errors.exlocnam)} onChange={(e) => setName(e.target.value)} />
        <div className="invalid-feedback">{errors.exlocnam}</div>
      </div>
      {errors.all && <div className="text-danger small mt-2">{errors.all}</div>}
    </Modal>
  );
}
