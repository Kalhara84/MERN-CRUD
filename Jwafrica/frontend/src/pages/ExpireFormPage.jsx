import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import { usePageTitle } from '../components/Layout';
import AddLocationModal from '../components/AddLocationModal';
import { dateTime, todayLocal } from '../utils/format';

let keySeed = 1;
// A blank table row. "key" is only for React (it is not sent to the server).
const newLine = () => ({ key: keySeed++, exlexssno: '', exlexpsno: '', exlgensno: '', exlcomplddt: '', exlcutoffddt: '' });

const LINE_LABELS = {
  exlexssno: 'Service Cat', exlexpsno: 'Period', exlgensno: 'Acc Code',
  exlcomplddt: 'Complete Date', exlcutoffddt: 'Cutoff Date',
};
const HEADER_LABELS = {
  exhdno: 'Code', exhddt: 'Date', exhdes: 'Description', exhexcsno: 'Item Category', exhexlocsno: 'Location',
};

// One header field: label (+ red *), the input, and the error text.
// (Defined outside the page component on purpose, so the input keeps the cursor while typing.)
function HeaderField({ name, error, children }) {
  return (
    <>
      <label className="form-label" htmlFor={name}>{HEADER_LABELS[name]} <span className="text-danger">*</span></label>
      {children}
      <div className="invalid-feedback">{error || `${HEADER_LABELS[name]} is required`}</div>
    </>
  );
}

// Browser check before sending (the server checks again)
function validate(header, lines) {
  const errors = {};
  Object.entries(HEADER_LABELS).forEach(([f, label]) => {
    if (!String(header[f]).trim()) errors[f] = `${label} is required`;
  });
  const lineErrors = {};
  lines.forEach((l, i) => {
    Object.entries(LINE_LABELS).forEach(([f, label]) => {
      if (!String(l[f]).trim()) lineErrors[i] = { ...lineErrors[i], [f]: `${label} is required` };
    });
  });
  return { errors, lineErrors };
}

export default function ExpireFormPage() {
  const { id } = useParams();            // undefined on the Add page
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const flash = useFlash();
  usePageTitle('Expire Module');

  const [lookups, setLookups] = useState(null);   // data of all combo boxes
  const [header, setHeader] = useState({ exhdno: '', exhddt: todayLocal(), exhdes: '', exhexcsno: '', exhexlocsno: '' });
  const [lines, setLines] = useState([newLine()]);
  const [saved, setSaved] = useState(null);       // the entry as saved in the database (edit page)
  const [errors, setErrors] = useState({});       // header errors  { field: message }
  const [lineErrors, setLineErrors] = useState({}); // line errors   { rowIndex: { field: message } }
  const [linesError, setLinesError] = useState(null);
  const [showLoc, setShowLoc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const focusKey = useRef(null);                  // row that should get the cursor after "+"

  // Page opened: load combo box data (+ the entry on the edit page)
  useEffect(() => {
    const jobs = [api.get('/expire/lookups')];
    if (isEdit) jobs.push(api.get(`/expire/${id}`));

    Promise.all(jobs)
      .then(([lk, entry]) => {
        setLookups(lk);
        if (entry) {
          const e = entry.entry;
          setSaved(e);
          setHeader({
            exhdno: e.exhdno, exhddt: e.exhddt, exhdes: e.exhdes,
            exhexcsno: String(e.exhexcsno), exhexlocsno: String(e.exhexlocsno),
          });
          setLines(e.lines.length ? e.lines.map((l) => ({
            key: keySeed++,
            exlexssno: String(l.exlexssno), exlexpsno: String(l.exlexpsno), exlgensno: String(l.exlgensno),
            exlcomplddt: l.exlcomplddt || '', exlcutoffddt: l.exlcutoffddt || '',
          })) : [newLine()]);
        }
      })
      .catch((e) => { flash.error(e.message); navigate('/expire'); })
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // After "+": put the cursor in the first box of the new row
  useEffect(() => {
    if (focusKey.current === null) return;
    const el = document.querySelector(`tr[data-key="${focusKey.current}"] select`);
    if (el) el.focus();
    focusKey.current = null;
  }, [lines]);

  // ---------- header ----------
  const setH = (name, value) => {
    setHeader((h) => ({ ...h, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  // ---------- lines ----------
  const setL = (index, name, value) => {
    setLines((ls) => ls.map((l, i) => (i === index ? { ...l, [name]: value } : l)));
    setLineErrors((le) => {
      if (!le[index]) return le;
      return { ...le, [index]: { ...le[index], [name]: undefined } };
    });
    setLinesError(null);
  };

  // + button: add a blank row under the clicked row
  const addLineAfter = (index) => {
    const line = newLine();
    focusKey.current = line.key;
    setLines((ls) => [...ls.slice(0, index + 1), line, ...ls.slice(index + 1)]);
    setLineErrors({});
  };

  // - button: remove the row. The last row cannot be removed, so it is just cleared.
  const removeLine = (index) => {
    setLineErrors({});
    setLines((ls) => (ls.length > 1 ? ls.filter((_, i) => i !== index) : [newLine()]));
  };

  // ---------- "Add Location" pop-up ----------
  const onLocationAdded = ({ id: locId, label }) => {
    setLookups((lk) => ({
      ...lk,
      // keep the list in alphabetical order (like the database list)
      loc: [...lk.loc, { id: locId, label }].sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase())),
    }));
    setH('exhexlocsno', String(locId));   // select the new location
  };

  // ---------- save ----------
  const scrollToFirstError = () => setTimeout(() => {
    const el = document.querySelector('.exp-page .is-invalid');
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
  }, 0);

  const submit = async (e) => {
    e.preventDefault();

    const v = validate(header, lines);
    if (Object.keys(v.errors).length || Object.keys(v.lineErrors).length) {
      setErrors(v.errors); setLineErrors(v.lineErrors); setLinesError(null);
      scrollToFirstError();
      return;
    }

    setBusy(true);
    const body = { ...header, lines: lines.map(({ key, ...rest }) => rest) };
    try {
      const d = isEdit ? await api.put(`/expire/${id}`, body) : await api.post('/expire', body);
      flash.success(d.message);
      navigate('/expire');
    } catch (err) {
      if (err.status === 422) {
        setErrors(err.data.errors || {});
        setLineErrors(err.data.lineErrors || {});
        setLinesError(err.data.linesError || null);
        if (err.data.errors && err.data.errors.__all__) flash.error(err.data.errors.__all__);
        scrollToFirstError();
      } else {
        flash.error(err.message);
      }
      setBusy(false);
    }
  };

  if (loading || !lookups) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  // ---------- small pieces ----------
  const options = (items) => items.map((o) => <option key={o.id} value={o.id}>{o.label}</option>);
  const cls = (base, bad) => `${base} ${bad ? 'is-invalid' : ''}`;

  // "Line 1: Service Cat is required, ..." under the table
  const lineErrorTexts = Object.entries(lineErrors)
    .map(([i, errs]) => [Number(i), Object.values(errs).filter(Boolean)])
    .filter(([, list]) => list.length);

  return (
    <div className="exp-page">
      <h3 className="exp-title">{isEdit ? 'Edit Expire Entry' : 'Add Expire Entry'}</h3>
      <hr />

      <form id="expForm" onSubmit={submit} noValidate>
        {/* HEADER, row 1: Code, Date, Description */}
        <div className="row g-4 mb-3">
          <div className="col-md-4">
            <HeaderField name="exhdno" error={errors.exhdno}>
              <input id="exhdno" type="text" maxLength={30} autoComplete="off" value={header.exhdno} title={errors.exhdno || ''}
                className={cls('form-control', errors.exhdno)} onChange={(e) => setH('exhdno', e.target.value)} />
            </HeaderField>
          </div>
          <div className="col-md-4">
            <HeaderField name="exhddt" error={errors.exhddt}>
              <input id="exhddt" type="date" value={header.exhddt} title={errors.exhddt || ''}
                className={cls('form-control', errors.exhddt)} onChange={(e) => setH('exhddt', e.target.value)} />
            </HeaderField>
          </div>
          <div className="col-md-4">
            <HeaderField name="exhdes" error={errors.exhdes}>
              <input id="exhdes" type="text" maxLength={50} autoComplete="off" value={header.exhdes} title={errors.exhdes || ''}
                className={cls('form-control', errors.exhdes)} onChange={(e) => setH('exhdes', e.target.value)} />
            </HeaderField>
          </div>
        </div>

        {/* HEADER, row 2: Item Category and Location combo boxes */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <HeaderField name="exhexcsno" error={errors.exhexcsno}>
              <select id="exhexcsno" value={header.exhexcsno} title={errors.exhexcsno || ''}
                className={cls('form-select', errors.exhexcsno)} onChange={(e) => setH('exhexcsno', e.target.value)}>
                <option value="">-- Select --</option>
                {options(lookups.cat)}
              </select>
            </HeaderField>
          </div>
          <div className="col-md-4">
            <HeaderField name="exhexlocsno" error={errors.exhexlocsno}>
              <select id="exhexlocsno" value={header.exhexlocsno} title={errors.exhexlocsno || ''}
                className={cls('form-select', errors.exhexlocsno)} onChange={(e) => setH('exhexlocsno', e.target.value)}>
                <option value="">-- Select --</option>
                {options(lookups.loc)}
              </select>
            </HeaderField>
          </div>
          <div className="col-md-4 exp-addloc">
            <button type="button" className="btn btn-secondary" onClick={() => setShowLoc(true)}>Add Location</button>
          </div>
        </div>

        {/* LINES table: one row = one exlmast record */}
        <div className="table-responsive">
          <table className="table exp-table align-middle">
            <thead>
              <tr>
                <th>#</th><th>Service Cat</th><th>Period</th><th>Acc Code</th>
                <th>Complete Date</th><th>Cutoff Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => {
                const le = lineErrors[i] || {};
                return (
                  <tr className="line-row" key={line.key} data-key={line.key}>
                    <td className="line-no">{i + 1}</td>
                    <td>
                      <select value={line.exlexssno} title={le.exlexssno || ''} className={cls('form-select form-select-sm', le.exlexssno)}
                        onChange={(e) => setL(i, 'exlexssno', e.target.value)}>
                        <option value="">-- Select --</option>{options(lookups.svc)}
                      </select>
                    </td>
                    <td>
                      <select value={line.exlexpsno} title={le.exlexpsno || ''} className={cls('form-select form-select-sm', le.exlexpsno)}
                        onChange={(e) => setL(i, 'exlexpsno', e.target.value)}>
                        <option value="">-- Select --</option>{options(lookups.per)}
                      </select>
                    </td>
                    <td>
                      <select value={line.exlgensno} title={le.exlgensno || ''} className={cls('form-select form-select-sm', le.exlgensno)}
                        onChange={(e) => setL(i, 'exlgensno', e.target.value)}>
                        <option value="">-- Select --</option>{options(lookups.acc)}
                      </select>
                    </td>
                    <td>
                      <input type="date" value={line.exlcomplddt} title={le.exlcomplddt || ''} className={cls('form-control form-control-sm', le.exlcomplddt)}
                        onChange={(e) => setL(i, 'exlcomplddt', e.target.value)} />
                    </td>
                    <td>
                      <input type="date" value={line.exlcutoffddt} title={le.exlcutoffddt || ''} className={cls('form-control form-control-sm', le.exlcutoffddt)}
                        onChange={(e) => setL(i, 'exlcutoffddt', e.target.value)} />
                    </td>
                    {/* + adds a row below this one, - removes this row */}
                    <td className="text-center text-nowrap">
                      <button type="button" className="btn btn-outline-primary" title="Add row" onClick={() => addLineAfter(i)}>+</button>{' '}
                      <button type="button" className="btn btn-outline-danger" title="Remove row" onClick={() => removeLine(i)}>-</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Errors of the lines: no rows, or what is wrong in each row */}
        {linesError && <div className="text-danger exp-lines-error mt-2">{linesError}</div>}
        {lineErrorTexts.map(([i, list]) => (
          <div key={i} className="text-danger exp-lines-error">Line {i + 1}: {list.join(', ')}</div>
        ))}

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

        {/* Edit page: who updated this entry last and when */}
        {isEdit && saved && saved.exhucdame && (
          <p className="text-muted small mt-3 mb-0">Last updated by <b>{saved.exhucdame}</b> on {dateTime(saved.exhameddt, saved.exhametime)}</p>
        )}
      </form>

      <AddLocationModal show={showLoc} onClose={() => setShowLoc(false)} onAdded={onLocationAdded} />
    </div>
  );
}
