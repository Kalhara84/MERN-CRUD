import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import { usePageTitle } from '../components/Layout';
import { dateTime } from '../utils/format';

// Check box columns: column name -> label
const SWITCH_LABELS = {
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

// Normal input boxes: column name -> [label, type, max length]
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

// Groups of fields: [card title, field names, show as switches?]
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

// Empty form: texts '', numbers 0, switches off (new users are active)
const emptyForm = () => {
  const f = {};
  Object.entries(INPUTS).forEach(([k, [, type]]) => { f[k] = type === 'number' ? 0 : ''; });
  Object.keys(SWITCH_LABELS).forEach((k) => { f[k] = false; });
  f.usdactflg = true;
  return f;
};

// Saved user -> form values
const fromUser = (u) => {
  const f = emptyForm();
  Object.keys(INPUTS).forEach((k) => { if (k !== 'new_password') f[k] = u[k] ?? ''; });
  Object.keys(SWITCH_LABELS).forEach((k) => { f[k] = (u[k] || '').toUpperCase() === 'Y'; });
  f.usdactflg = u.is_active;
  return f;
};

export default function UserFormPage() {
  const { id } = useParams();            // undefined on the Add page
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const flash = useFlash();

  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(null);       // the user as saved in the database (edit page)
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);

  usePageTitle(isEdit ? `Edit user${saved ? ` · ${saved.usdusd}` : ''}` : 'Add user');

  // Edit page: load the user
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/users/${id}`)
      .then((d) => { setSaved(d.user); setForm(fromUser(d.user)); })
      .catch((e) => { flash.error(e.message); navigate('/users'); })
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const d = isEdit ? await api.put(`/users/${id}`, form) : await api.post('/users', form);
      flash.success(d.message);
      navigate('/users');
    } catch (err) {
      if (err.status === 422) setErrors(err.data.errors || {});
      else flash.error(err.message);
      setBusy(false);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  const renderInput = (name) => {
    const [label, type, max] = INPUTS[name];
    const isPwd = name === 'new_password';
    return (
      <div className="col-md-6 col-xl-4" key={name}>
        <label className="form-label fw-semibold" htmlFor={name}>{label}</label>
        <input id={name} name={name} type={type} maxLength={max} value={form[name]}
          className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
          autoComplete={isPwd ? 'new-password' : 'off'}
          onChange={(e) => set(name, e.target.value)} />
        {isPwd && isEdit && <div className="form-text">Leave empty to keep the current password.</div>}
        {errors[name] && <div className="text-danger small">{errors[name]}</div>}
      </div>
    );
  };

  const renderSwitch = (name) => (
    <div className="col-6 col-md-4 col-xl-3" key={name}>
      <div className="form-check form-switch">
        <input id={name} type="checkbox" className="form-check-input" checked={form[name]} onChange={(e) => set(name, e.target.checked)} />
        <label className="form-check-label" htmlFor={name}>{SWITCH_LABELS[name]}</label>
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate>
      {/* One card for each group of fields */}
      {SECTIONS.map(([title, names, isSwitch]) => (
        <div className="jw-card mb-3" key={title}>
          <div className="jw-card-head"><h5>{title}</h5></div>
          <div className="jw-card-body">
            <div className="row g-3">{names.map(isSwitch ? renderSwitch : renderInput)}</div>
          </div>
        </div>
      ))}

      {/* Edit page: who updated this user last and when */}
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
