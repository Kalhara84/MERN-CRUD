// =============================================================================
// pages/UserFormPage.jsx - Add / Edit user
//   /users/add  -> new user        /users/:id/edit  -> change a user
// =============================================================================
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { dateTime } from '../helpers';

// Input boxes:  column name -> [label, type, max length]
const INPUTS = {
  usdusd: ['User code (login name)', 'text', 30],
  new_password: ['Password', 'password', 30],
  usdnam: ['Name', 'text', 50],
  usdemail: ['Email', 'text', 40],
  usddesig: ['Designation', 'text', 25],
  usdcomsno: ['Company no', 'number'],
  usddepsno: ['Department no', 'number'],
  usdlocsno: ['Location no', 'number'],
  usduno: ['Unit no', 'text', 4],
  usdprintername: ['Printer name', 'text', 30],
  usdsalstkcatsnos: ['Sales stock category nos', 'text', 100],
  usdatfliamt: ['ATF limit amount', 'number'],
  usdatfnosetday: ['ATF no. of days', 'number'],
};

// Check boxes (switches):  column name -> label
const SWITCHES = {
  usdactflg: 'Active (can login)',
  usdadmin: 'Administrator',
  usdbockpodgrnyn: 'Book PO / DGRN',
  usdbrcsalyn: 'BRC sales',
  usdlacsalyn: 'LAC sales',
  usdprnsalyn: 'PRN sales',
  usdeggsalyn: 'EGG sales',
  usdccnsalyn: 'CCN sales',
  usdpgfsalyn: 'PGF sales',
  usdcafsalyn: 'CAF sales',
  usdmaisalyn: 'MAI sales',
  usdhegsalyn: 'HEG sales',
  usdhassalyn: 'HAS sales',
  usdrepyn: 'Reports',
  usdstkrolyn: 'Stock re-order level',
  usdatfauthyn: 'ATF authorise',
  usdsohpvalyn: 'SOH price value',
};

// The page is drawn as cards:  [card title, fields in it, are they switches?]
const SECTIONS = [
  ['Login', ['usdusd', 'new_password', 'usdnam', 'usdemail'], false],
  ['Details', ['usddesig', 'usdcomsno', 'usddepsno', 'usdlocsno', 'usduno', 'usdprintername'], false],
  ['Status', ['usdactflg', 'usdadmin'], true],
  ['Permissions', [
    'usdbockpodgrnyn', 'usdbrcsalyn', 'usdlacsalyn', 'usdprnsalyn', 'usdeggsalyn', 'usdccnsalyn',
    'usdpgfsalyn', 'usdcafsalyn', 'usdmaisalyn', 'usdhegsalyn', 'usdhassalyn', 'usdrepyn',
    'usdstkrolyn', 'usdatfauthyn', 'usdsohpvalyn'], true],
  ['Other', ['usdsalstkcatsnos', 'usdatfliamt', 'usdatfnosetday'], false],
];

// An empty form: text boxes '', number boxes 0, switches off (a new user is active)
function emptyForm() {
  const form = {};
  for (const name in INPUTS) form[name] = INPUTS[name][1] === 'number' ? 0 : '';
  for (const name in SWITCHES) form[name] = false;
  form.usdactflg = true;
  return form;
}

// A user from the database -> values for the form
function formFromUser(user) {
  const form = emptyForm();
  for (const name in INPUTS) {
    if (name !== 'new_password') form[name] = user[name] ?? '';
  }
  for (const name in SWITCHES) form[name] = (user[name] || '').toUpperCase() === 'Y';
  form.usdactflg = user.is_active;
  return form;
}

export default function UserFormPage({ showMessage }) {
  const { id } = useParams();          // empty on the Add page
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm());
  const [saved, setSaved] = useState(null);       // the user as saved in the database (edit page)
  const [errors, setErrors] = useState({});       // { fieldName: 'message' }
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);

  // Edit page: load the user
  useEffect(() => {
    if (!isEdit) return;
    api.get('/users/' + id)
      .then((data) => {
        setSaved(data.user);
        setForm(formFromUser(data.user));
        setLoading(false);
      })
      .catch((err) => {
        showMessage('danger', err.message);
        navigate('/users');
      });
  }, [id]);

  // Called when a box is changed
  function change(name, value) {
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: undefined });   // remove the red message of this box
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const data = isEdit ? await api.put('/users/' + id, form) : await api.post('/users', form);
      showMessage('success', data.message);
      navigate('/users');
    } catch (err) {
      if (err.status === 422) setErrors(err.data.errors || {});   // the server found wrong values
      else showMessage('danger', err.message);
      setBusy(false);
    }
  }

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  // One input box with its label and red message
  function renderInput(name) {
    const [label, type, max] = INPUTS[name];
    const isPassword = name === 'new_password';
    return (
      <div className="col-md-6 col-xl-4" key={name}>
        <label className="form-label fw-semibold" htmlFor={name}>{label}</label>
        <input id={name} type={type} maxLength={max} value={form[name]}
          className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
          autoComplete={isPassword ? 'new-password' : 'off'}
          onChange={(e) => change(name, e.target.value)} />
        {isPassword && isEdit && <div className="form-text">Leave empty to keep the current password.</div>}
        {errors[name] && <div className="text-danger small">{errors[name]}</div>}
      </div>
    );
  }

  // One check box (switch)
  function renderSwitch(name) {
    return (
      <div className="col-6 col-md-4 col-xl-3" key={name}>
        <div className="form-check form-switch">
          <input id={name} type="checkbox" className="form-check-input" checked={form[name]}
            onChange={(e) => change(name, e.target.checked)} />
          <label className="form-check-label" htmlFor={name}>{SWITCHES[name]}</label>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={save} noValidate>
      {/* One card for each group of fields */}
      {SECTIONS.map(([title, names, isSwitch]) => (
        <div className="jw-card mb-3" key={title}>
          <div className="jw-card-head"><h5>{title}</h5></div>
          <div className="jw-card-body">
            <div className="row g-3">{names.map(isSwitch ? renderSwitch : renderInput)}</div>
          </div>
        </div>
      ))}

      {/* Edit page: who changed this user last, and when */}
      {isEdit && saved && saved.usducdame && (
        <p className="text-muted small">Last updated by <b>{saved.usducdame}</b> on {dateTime(saved.usdameddt, saved.usdametime)}</p>
      )}

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={busy}><i className="bi bi-check-lg" /> Save</button>
        <Link to="/users" className="btn btn-light">Cancel</Link>
      </div>
    </form>
  );
}
