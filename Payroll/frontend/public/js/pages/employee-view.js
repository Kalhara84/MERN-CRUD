import { api, getLookups } from '../api.js';
import { esc, CATEGORY, yn, loading, alertBox, confirmModal } from '../ui.js';

const item = (label, value) => `
  <div class="col-6 col-md-4 col-lg-3 detail-item">
    <div class="k">${esc(label)}</div>
    <div class="v">${value === null || value === undefined || value === '' ? '-' : esc(value)}</div>
  </div>`;

const section = (icon, title, items) => `
  <div class="card-soft mb-3 fade-in">
    <div class="card-head"><i class="bi ${icon}"></i> ${esc(title)}</div>
    <div class="card-body-pad"><div class="row g-3">${items.join('')}</div></div>
  </div>`;

export async function render(el, ctx) {
  const id = Number(ctx.params[0]);
  el.innerHTML = loading();

  let emp, lookups;
  try {
    [emp, lookups] = await Promise.all([api.get(id), getLookups().catch(() => null)]);
  } catch (e) {
    if (ctx.alive()) el.innerHTML = alertBox(e.message);
    return;
  }
  if (!ctx.alive()) return;

  const name = (list, key, field = 'sysdes') => list?.find((x) => x.syssno === key)?.[field];

  el.innerHTML = `
    <div class="profile-hero d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 fade-in">
      <div class="d-flex align-items-center gap-3">
        <span class="avatar">${esc(emp.empnam.charAt(0).toUpperCase())}</span>
        <div>
          <h4>${esc(emp.empnam)}</h4>
          <div class="sub">Emp No ${emp.empeno} &middot; ${esc(emp.empdesig || 'No designation')}</div>
          <div class="mt-2 d-flex gap-2 flex-wrap">
            <span class="badge">${esc(CATEGORY[emp.empcat] ?? emp.empcat)}</span>
            <span class="badge">${emp.empactflg === 'Y' ? 'Active' : 'Inactive'}</span>
            ${emp.department_name ? `<span class="badge">${esc(emp.department_name)}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <a href="/employees" data-link class="btn btn-ghost"><i class="bi bi-arrow-left me-1"></i>Back</a>
        <a href="/employees/${emp.empsno}/edit" data-link class="btn btn-light"><i class="bi bi-pencil me-1"></i>Edit</a>
        <button class="btn btn-ghost" id="del"><i class="bi bi-trash me-1"></i>Delete</button>
      </div>
    </div>
    <div id="msg"></div>

    ${section('bi-person', 'Personal', [
      item('Initial', emp.empinital), item('Employee Name', emp.empnam),
      item('Sex', emp.empmof === 'M' ? 'Male' : emp.empmof === 'F' ? 'Female' : emp.empmof),
      item('Married', yn(emp.empmrdtst)), item('National ID', emp.empidno), item('Passport No', emp.emppasportno),
      item('Date of Birth', emp.empdob), item('Status', emp.empsts),
    ])}
    ${section('bi-briefcase', 'Job', [
      item('Category', CATEGORY[emp.empcat] ?? emp.empcat), item('Designation', emp.empdesig),
      item('Department', emp.department_name), item('Location', emp.location_name),
      item('Section', name(lookups?.sections, emp.empsecsno)), item('Area', name(lookups?.areas, emp.emparesno)),
      item('Cost Center', name(lookups?.costCenters, emp.empcossno, 'sysrno')), item('Basis', name(lookups?.basis, emp.empbasisno)),
      item('Date Joined', emp.empjoin), item('Date Left', emp.empleft),
      item('Map Code', emp.empmapcode), item('Active', yn(emp.empactflg)),
    ])}
    ${section('bi-cash-stack', 'Salary & Statutory', [
      item('Basic Salary', emp.empsal), item('E.P.F', yn(emp.empepfyn)), item('E.P.F #', emp.empepfno), item('PAYE', yn(emp.emppayeyn)),
      item('Tax Table No', emp.emptno), item('PAYE Relief', emp.empprl), item('Up To Date Gross Earnings', emp.empgin),
      item('Up To Date Tax', emp.emptax), item('TIN No', emp.emptin), item('Coin Op Bal', emp.empcob), item('Service Charge %', emp.empscgpcn),
    ])}
    ${section('bi-bank', 'Bank', [
      item('Bank A/C #', emp.empbnkacno), item('Bank Code', emp.empbnkcode), item('Bank Branch', emp.empbnkbranch), item('Bank Id', emp.empbnkid),
    ])}
    ${section('bi-telephone', 'Contact', [
      item('Address', [emp.empad1, emp.empad2, emp.empad3, emp.empad4].filter(Boolean).join(', ')),
      item('Email', emp.empemail), item('Telephone', emp.emptel),
    ])}
    ${section('bi-calendar-check', 'Leave & Flags', [
      item('Annual', emp.empanual), item('Casual', emp.empcasal), item('L/L', emp.empleuleu), item('OT', yn(emp.empotflg)),
      item('No Pay', yn(emp.empnopflg)), item('Attendance Incentive', yn(emp.empattincflg)), item('Late', yn(emp.emplateflg)), item('Sat Leave', yn(emp.empnsatlflg)),
    ])}`;

  el.querySelector('#del').onclick = async () => {
    const ok = await confirmModal({ title: 'Delete employee', message: `Delete ${emp.empnam} (Emp No ${emp.empeno})? This cannot be undone.` });
    if (!ok) return;
    try {
      await api.remove(emp.empsno);
      ctx.navigate('/employees');
    } catch (e) {
      el.querySelector('#msg').innerHTML = alertBox(e.message);
    }
  };
}
