// =============================================================================
// pages/CustomerFormPage.jsx - Add / Edit customer
//   /customers/add  -> new customer        /customers/:id/edit  -> change a customer
// =============================================================================
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { dateTime } from '../helpers';

// Text boxes:  column name -> [label, type, max length]
const INPUTS = {
  cuscus: ['Customer code', 'text', 20],
  cusnam: ['Customer name', 'text', 100],
  cuscreditlimit: ['Credit limit', 'number'],
  cusadd: ['Full address', 'text', 200],
  cusad1: ['Address-1', 'text', 40],
  cusad2: ['Address-2', 'text', 40],
  cusad3: ['Address-3', 'text', 40],
  cusad4: ['Address-4', 'text', 40],
  cusad5: ['Address-5', 'text', 40],
  custelno: ['Tel', 'text', 25],
  cusfaxno: ['Fax', 'text', 25],
  cusemail: ['E-mail', 'email', 25],
  custinno: ['TIN #', 'text', 20],
  cusvatno: ['VAT Reg #', 'text', 15],
  cussvatno: ['SVAT Reg #', 'text', 25],
};

// Drop-down boxes:  column name -> [label, name of the list that comes from the backend]
const SELECTS = {
  cuscatsno: ['Category', 'cat'],
  cuscredittmssno: ['Credit terms', 'credit'],
  cusrepsno: ['Rep', 'rep'],
};

// The page is drawn as cards:  [card title, fields in it, wide fields (they use a whole grid grid-cols-12)]
const SECTIONS = [
  ['Customer', ['cuscus', 'cusnam', 'cuscatsno', 'cusrepsno']],
  ['Credit', ['cuscredittmssno', 'cuscreditlimit']],
  ['Address', ['cusadd', 'cusad1', 'cusad2', 'cusad3', 'cusad4', 'cusad5'], ['cusadd']],
  ['Contact', ['custelno', 'cusfaxno', 'cusemail']],
  ['Tax', ['custinno', 'cusvatno', 'cussvatno']],
];

// An empty form: text boxes '', drop-downs 0 (nothing chosen), a new customer is active
function emptyForm() {
  const form = { cusactyn: true };
  for (const name in INPUTS) form[name] = '';
  for (const name in SELECTS) form[name] = 0;
  form.cuscreditlimit = 0;
  return form;
}

// A customer from the database -> values for the form
function formFromCustomer(customer) {
  const form = emptyForm();
  for (const name in INPUTS) form[name] = customer[name] ?? '';
  for (const name in SELECTS) form[name] = customer[name] ?? 0;
  form.cusactyn = customer.cusactyn !== 'N';   // only 'N' means not active
  return form;
}

export default function CustomerFormPage({ showMessage }) {
  const { id } = useParams();          // empty on the Add page
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm());
  const [saved, setSaved] = useState(null);         // the customer as saved in the database (edit page)
  const [lookups, setLookups] = useState({ cat: [], credit: [], rep: [] });   // items of the drop-downs
  const [errors, setErrors] = useState({});         // { fieldName: 'message' }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Page opened: load the drop-down items, then the customer (edit) or the next code (add)
  useEffect(() => {
    async function load() {
      try {
        setLookups(await api.get('/customers/lookups'));

        if (isEdit) {
          const data = await api.get('/customers/' + id);
          setSaved(data.customer);
          setForm(formFromCustomer(data.customer));
        } else {
          const data = await api.get('/customers/next-code');
          setForm({ ...emptyForm(), cuscus: data.code });   // the code is filled, the user can change it
        }
        setLoading(false);
      } catch (err) {
        showMessage('danger', err.message);
        navigate('/customers');
      }
    }
    load();
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

    // Quick check in the browser. The server checks everything again.
    if (!form.cuscus.trim() || !form.cusnam.trim()) {
      setErrors({
        cuscus: form.cuscus.trim() ? undefined : 'Customer code is required',
        cusnam: form.cusnam.trim() ? undefined : 'Customer name is required',
      });
      setBusy(false);
      return;
    }

    try {
      const data = isEdit ? await api.put('/customers/' + id, form) : await api.post('/customers', form);
      showMessage('success', data.message);
      navigate('/customers');
    } catch (err) {
      if (err.status === 422) setErrors(err.data.errors || {});   // the server found wrong values
      else showMessage('danger', err.message);
      setBusy(false);
    }
  }

  if (loading) return <div className="text-center py-5"><div className="spinner" /></div>;

  // One text box with its label and red message
  function renderInput(name, wide) {
    const [label, type, max] = INPUTS[name];
    const isCode = name === 'cuscus';
    return (
      <div className={wide ? 'col-span-12' : 'col-span-12 md:col-span-6 xl:col-span-4'} key={name}>
        <label className="mb-2 block text-sm font-semibold" htmlFor={name}>{label}</label>
        <input id={name} type={type} maxLength={max} min={type === 'number' ? 0 : undefined} value={form[name]}
          className={`field ${errors[name] ? 'border-red-500' : ''}`}
          autoComplete="off"
          readOnly={isCode && isEdit}   // the customer code cannot be changed after the customer is saved
          // Codes are written in capital letters
          onChange={(e) => change(name, isCode ? e.target.value.toUpperCase() : e.target.value)} />
        {isCode && isEdit && <div className="mt-1 text-xs text-stone-500">The code cannot be changed.</div>}
        {errors[name] && <div className="text-red-600 text-sm">{errors[name]}</div>}
      </div>
    );
  }

  // One drop-down box with its label and red message
  function renderSelect(name) {
    const [label, listName] = SELECTS[name];
    const items = lookups[listName];
    // An old customer can hold a value that is not in the list. Show it, so it is not lost silently.
    const unknown = form[name] && !items.some((item) => item.id === Number(form[name]));
    return (
      <div className="col-span-12 md:col-span-6 xl:col-span-4" key={name}>
        <label className="mb-2 block text-sm font-semibold" htmlFor={name}>{label}</label>
        <select id={name} value={form[name]} className={`field ${errors[name] ? 'border-red-500' : ''}`}
          onChange={(e) => change(name, Number(e.target.value))}>
          <option value={0}>-- None --</option>
          {unknown && <option value={form[name]}>Old value ({form[name]})</option>}
          {items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        {errors[name] && <div className="text-red-600 text-sm">{errors[name]}</div>}
      </div>
    );
  }

  return (
    <form onSubmit={save} noValidate>
      {/* One card for each group of fields */}
      {SECTIONS.map(([title, names, wideNames = []]) => (
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm mb-3" key={title}>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 p-5"><h5>{title}</h5></div>
          <div className="p-5">
            <div className="grid grid-cols-12 gap-5">
              {names.map((name) => (name in SELECTS ? renderSelect(name) : renderInput(name, wideNames.includes(name))))}

              {/* The Active switch sits in the first card, next to the name */}
              {title === 'Customer' && (
                <div className="col-span-12 md:col-span-6 xl:col-span-4 flex items-end">
                  <div className="flex items-center gap-2 py-2 ">
                    <input id="cusactyn" type="checkbox" className="h-4 w-4 accent-green-700" checked={form.cusactyn}
                      onChange={(e) => change('cusactyn', e.target.checked)} />
                    <label className="text-sm" htmlFor="cusactyn">Active</label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Edit page: who changed this customer last, and when */}
      {isEdit && saved && saved.cusucdame && (
        <p className="text-stone-500 text-sm">Last updated by <b>{saved.cusucdame}</b> on {dateTime(saved.cusameddt, saved.cusametime)}</p>
      )}

      <div className="flex gap-2">
        <button type="submit" className="button button-primary" disabled={busy}> Save</button>
        <Link to="/customers" className="button button-light">Cancel</Link>
      </div>
    </form>
  );
}
