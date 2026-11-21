import { api, getLookups } from '../api.js';
import { esc, loading, alertBox } from '../ui.js';

const YN = [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }];
const SEX = [{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }];
const CAT = [{ value: 'W', label: 'Wages' }, { value: 'E', label: 'Executive' }, { value: 'S', label: 'Staff' }];

/**
 * The whole form is described here once: [key, label, type, options]
 *  type: int | float | date | text | select | radio
 *  select options come from the lookups (see LOOKUP below)
 */
const SECTIONS = [
  { icon: 'bi-person', title: 'Personal', fields: [
    ['empeno', 'Employee No *', 'int'],
    ['empinital', 'Initial', 'text', { max: 20 }],
    ['empnam', 'Employee Name *', 'text', { max: 80 }],
    ['empmof', 'Sex', 'radio', { options: SEX }],
    ['empmrdtst', 'Married', 'radio', { options: YN }],
    ['empidno', 'National ID', 'text', { max: 20 }],
    ['emppasportno', 'Passport No', 'text', { max: 15 }],
    ['empdob', 'Date of Birth', 'date'],
  ] },
  { icon: 'bi-briefcase', title: 'Job', fields: [
    ['empcat', 'Category', 'radio', { options: CAT }],
    ['empdesig', 'Designation', 'text', { max: 60 }],
    ['emplocsno', 'Location', 'select', { lookup: 'locations', value: 'locsno', text: (x) => x.locnam ?? x.locloc }],
    ['empdepsno', 'Department', 'select', { lookup: 'departments', value: 'depsno', text: (x) => x.depdes ?? x.depdep }],
    ['empsecsno', 'Section', 'select', { lookup: 'sections', value: 'syssno', text: (x) => x.sysdes }],
    ['emparesno', 'Area', 'select', { lookup: 'areas', value: 'syssno', text: (x) => x.sysdes }],
    ['empcossno', 'Cost Center', 'select', { lookup: 'costCenters', value: 'syssno', text: (x) => x.sysrno }],
    ['empbasisno', 'Basis', 'select', { lookup: 'basis', value: 'syssno', text: (x) => x.sysdes }],
    ['empjoin', 'Date Joined', 'date'],
    ['empleft', 'Date Left', 'date'],
    ['empmapcode', 'Map Code', 'int'],
    ['empsts', 'Status', 'text', { max: 1, upper: true }],
    ['empactflg', 'Active', 'radio', { options: YN }],
  ] },
  { icon: 'bi-cash-stack', title: 'Salary & Statutory', fields: [
    ['empsal', 'Basic Salary', 'float'],
    ['empscgpcn', 'Service Charge %', 'float'],
    ['empepfyn', 'E.P.F', 'radio', { options: YN }],
    ['empepfno', 'E.P.F #', 'int'],
    ['emppayeyn', 'PAYE', 'radio', { options: YN }],
    ['emptno', 'Tax Table No', 'int'],
    ['empprl', 'PAYE Relief', 'float'],
    ['empgin', 'Up To Date Gross Earnings', 'float'],
    ['emptax', 'Up To Date Tax', 'float'],
    ['emptin', 'TIN No', 'text', { max: 18 }],
    ['empcob', 'Coin Op Bal', 'float'],
  ] },
  { icon: 'bi-bank', title: 'Bank', fields: [
    ['empbnkacno', 'Bank A/C #', 'text', { max: 30 }],
    ['empbnkcode', 'Bank Code', 'text', { max: 20 }],
    ['empbnkbranch', 'Bank Branch', 'text', { max: 20 }],
    ['empbnkid', 'Bank Id', 'text', { max: 20 }],
  ] },
  { icon: 'bi-telephone', title: 'Contact', fields: [
    ['empad1', 'Address Line 1', 'text', { max: 40 }],
    ['empad2', 'Address Line 2', 'text', { max: 40 }],
    ['empad3', 'Address Line 3', 'text', { max: 40 }],
    ['empad4', 'Address Line 4', 'text', { max: 40 }],
    ['empemail', 'Email', 'text', { max: 40, inputType: 'email' }],
    ['emptel', 'Telephone', 'text', { max: 25 }],
  ] },
  { icon: 'bi-calendar-check', title: 'Leave & Flags', fields: [
    ['empanual', 'Annual', 'text', { max: 4, size: 'col-6 col-lg-2' }],
    ['empcasal', 'Casual', 'text', { max: 4, size: 'col-6 col-lg-2' }],
    ['empleuleu', 'L/L', 'text', { max: 4, size: 'col-6 col-lg-2' }],
    ['_break'],
    ['empotflg', 'OT', 'radio', { options: YN, size: 'col-6 col-lg-2' }],
    ['empnopflg', 'No Pay', 'radio', { options: YN, size: 'col-6 col-lg-2' }],
    ['empattincflg', 'Attendance Incentive', 'radio', { options: YN, size: 'col-6 col-lg-3' }],
    ['emplateflg', 'Late', 'radio', { options: YN, size: 'col-6 col-lg-2' }],
    ['empnsatlflg', 'Sat Leave', 'radio', { options: YN, size: 'col-6 col-lg-2' }],
  ] },
];

const FIELDS = SECTIONS.flatMap((s) => s.fields).filter((f) => f[0] !== '_break');

const DEFAULTS = {
  empcat: 'W', empmof: 'M', empmrdtst: 'N',
  empactflg: 'Y', empepfyn: 'Y', emppayeyn: 'N',
  empotflg: 'N', empnopflg: 'N', empattincflg: 'N', emplateflg: 'N', empnsatlflg: 'N',
  empsal: '0', empscgpcn: '0', empprl: '0', emptax: '0', empgin: '0', empcob: '0', emptno: '0', empepfno: '0',
};

function fieldHtml([key, label, type, opt = {}], values, lookups) {
  const size = opt.size || 'col-md-6 col-lg-4';
  const v = values[key] ?? '';
  let input = '';

  if (type === 'radio') {
    input = `<div class="d-flex gap-3 pt-1">${opt.options.map((o) => `
      <div class="form-check">
        <input class="form-check-input" type="radio" name="${key}" id="${key}-${o.value}" value="${o.value}" ${v === o.value ? 'checked' : ''}>
        <label class="form-check-label" for="${key}-${o.value}">${esc(o.label)}</label>
      </div>`).join('')}</div>`;
  } else if (type === 'select') {
    const list = lookups?.[opt.lookup] ?? [];
    input = `<select class="form-select" name="${key}"><option value="">-- Select --</option>${list.map((x) =>
      `<option value="${x[opt.value]}" ${String(x[opt.value]) === String(v) ? 'selected' : ''}>${esc(opt.text(x))}</option>`).join('')}</select>`;
  } else {
    const t = type === 'date' ? 'date' : type === 'int' || type === 'float' ? 'number' : opt.inputType || 'text';
    const step = type === 'float' ? ' step="0.01"' : type === 'int' ? ' step="1"' : '';
    const max = opt.max ? ` maxlength="${opt.max}"` : '';
    const style = opt.upper ? ' style="text-transform:uppercase"' : '';
    input = `<input class="form-control" type="${t}" name="${key}" value="${esc(v)}"${step}${max}${style}>`;
  }
  return `<div class="${size}"><label class="form-label">${esc(label)}</label>${input}</div>`;
}

/** form values -> JSON body for the API */
function toPayload(form) {
  const body = {};
  for (const [key, , type] of FIELDS) {
    let v;
    if (type === 'radio') v = (form.querySelector(`[name="${key}"]:checked`) || {}).value ?? '';
    else v = form.elements[key].value;

    if (type === 'int' || type === 'select') body[key] = v === '' ? null : parseInt(v, 10);
    else if (type === 'float') body[key] = v === '' ? 0 : parseFloat(v);
    else if (type === 'date') body[key] = v === '' ? null : v;
    else body[key] = String(v).trim();
  }
  return body;
}

export async function render(el, ctx) {
  const id = ctx.params[0] ? Number(ctx.params[0]) : null;
  const isEdit = id !== null;
  el.innerHTML = loading();

  let values = { ...DEFAULTS }, lookups = null;
  try {
    const [lk, emp] = await Promise.all([getLookups().catch(() => null), isEdit ? api.get(id) : null]);
    lookups = lk;
    if (emp) values = Object.fromEntries(FIELDS.map(([k]) => [k, emp[k] === null || emp[k] === undefined ? '' : String(emp[k]).trim()]));
  } catch (e) {
    if (ctx.alive()) el.innerHTML = alertBox(e.message);
    return;
  }
  if (!ctx.alive()) return;

  const saveLabel = isEdit ? 'Update' : 'Save';
  el.innerHTML = `
  <form id="emp-form" novalidate>
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
      <div><h4 class="page-title">${isEdit ? 'Edit Employee' : 'Add Employee'}</h4><div class="page-sub">Fields marked * are required</div></div>
      <div class="d-flex gap-2">
        <a href="/employees" data-link class="btn btn-light">Cancel</a>
        <button class="btn btn-primary" data-save><i class="bi bi-check-lg me-1"></i>${saveLabel}</button>
      </div>
    </div>
    <div id="form-error"></div>

    ${SECTIONS.map((s) => `
      <div class="card-soft mb-3 fade-in">
        <div class="card-head"><i class="bi ${s.icon}"></i> ${esc(s.title)}</div>
        <div class="card-body-pad"><div class="row g-3">
          ${s.fields.map((f) => (f[0] === '_break' ? '<div class="w-100"></div>' : fieldHtml(f, values, lookups))).join('')}
        </div></div>
      </div>`).join('')}

    <div class="action-bar d-flex justify-content-end gap-2">
      <a href="/employees" data-link class="btn btn-light">Cancel</a>
      <button class="btn btn-primary" data-save><i class="bi bi-check-lg me-1"></i>${saveLabel}</button>
    </div>
  </form>`;

  const form = el.querySelector('#emp-form');
  const errBox = el.querySelector('#form-error');
  const buttons = form.querySelectorAll('[data-save]');

  form.onsubmit = async (e) => {
    e.preventDefault();
    errBox.innerHTML = '';
    const body = toPayload(form);
    const fail = (m) => { errBox.innerHTML = alertBox(m); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    if (body.empeno === null) return fail('Employee No is required');
    if (!body.empnam) return fail('Employee Name is required');

    buttons.forEach((b) => (b.disabled = true));
    try {
      if (isEdit) await api.update(id, body);
      else await api.create(body);
      ctx.navigate('/employees');
    } catch (err) {
      fail(err.message);
      buttons.forEach((b) => (b.disabled = false));
    }
  };
}
