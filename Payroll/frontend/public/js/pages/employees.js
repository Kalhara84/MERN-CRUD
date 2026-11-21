import { api } from '../api.js';
import { esc, money, CATEGORY, emptyState, confirmModal } from '../ui.js';

export async function render(el, ctx) {
  let search = '', page = 1, result = null, timer;

  el.innerHTML = `
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
      <div><h4 class="page-title">Employees</h4><div class="page-sub" id="count">&nbsp;</div></div>
      <a href="/employees/new" data-link class="btn btn-primary"><i class="bi bi-plus-lg me-1"></i> Add Employee</a>
    </div>
    <div id="err"></div>
    <div class="card-soft fade-in">
      <div style="border-bottom:1px solid var(--line);padding:16px 22px">
        <div class="input-group" style="max-width:420px">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input id="search" class="form-control" placeholder="Search by name, employee no, NIC, designation" />
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-clean">
          <thead><tr>
            <th>Emp No</th><th>Name</th><th>Category</th><th>Department</th><th>Designation</th>
            <th class="text-end">Basic Salary</th><th>Status</th><th class="text-end">Actions</th>
          </tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
      <div id="pager"></div>
    </div>`;

  const $ = (s) => el.querySelector(s);

  async function load() {
    $('#rows').innerHTML = '<tr><td colspan="8" class="text-center text-muted py-5">Loading...</td></tr>';
    $('#err').innerHTML = '';
    try {
      const r = await api.list(search, page);
      if (!ctx.alive()) return;
      result = r;
      draw();
    } catch (e) {
      if (!ctx.alive()) return;
      $('#err').innerHTML = `<div class="alert alert-danger py-2">${esc(e.message)}</div>`;
      $('#rows').innerHTML = '';
    }
  }

  function draw() {
    $('#count').textContent = `${result.total} employees in total`;
    $('#rows').innerHTML = result.data.length
      ? result.data.map(row).join('')
      : `<tr><td colspan="8">${emptyState('No employees found', 'Try a different search term.')}</td></tr>`;

    $('#pager').innerHTML = result.totalPages > 1 ? `
      <div class="card-body-pad d-flex justify-content-between align-items-center">
        <div class="text-muted small">Page ${result.page} of ${result.totalPages}</div>
        <div class="btn-group">
          <button class="btn btn-outline-secondary btn-sm" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}><i class="bi bi-chevron-left"></i> Prev</button>
          <button class="btn btn-outline-secondary btn-sm" data-page="${page + 1}" ${page >= result.totalPages ? 'disabled' : ''}>Next <i class="bi bi-chevron-right"></i></button>
        </div>
      </div>` : '';
  }

  const row = (e) => `
    <tr>
      <td class="fw-semibold">${e.empeno}</td>
      <td><div class="d-flex align-items-center gap-2">
        <span class="avatar av${e.empsno % 5}">${esc((e.empnam || '?').charAt(0).toUpperCase())}</span>
        <div><div class="fw-semibold" style="color:var(--ink)">${esc(e.empnam)}</div>
        <div class="text-muted small">${esc(e.empidno || e.empdesig || '')}</div></div>
      </div></td>
      <td><span class="badge badge-soft-blue">${esc(CATEGORY[e.empcat] ?? e.empcat)}</span></td>
      <td><div>${esc(e.department_name ?? '-')}</div><div class="text-muted small">${esc(e.location_name ?? '')}</div></td>
      <td>${esc(e.empdesig || '-')}</td>
      <td class="text-end">${money(e.empsal, 2)}</td>
      <td><span class="badge ${e.empactflg === 'Y' ? 'badge-soft-green' : 'badge-soft-red'}"><i class="dot"></i>${e.empactflg === 'Y' ? 'Active' : 'Inactive'}</span></td>
      <td class="text-end text-nowrap">
        <a href="/employees/${e.empsno}" data-link class="btn btn-outline-secondary btn-sm icon-btn me-1" title="View"><i class="bi bi-eye"></i></a>
        <a href="/employees/${e.empsno}/edit" data-link class="btn btn-outline-primary btn-sm icon-btn me-1" title="Edit"><i class="bi bi-pencil"></i></a>
        <button class="btn btn-outline-danger btn-sm icon-btn" title="Delete" data-del="${e.empsno}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;

  // search box: wait a moment after typing stops
  $('#search').oninput = (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { search = e.target.value.trim(); page = 1; load(); }, 350);
  };

  el.addEventListener('click', async (e) => {
    const pg = e.target.closest('[data-page]');
    if (pg && !pg.disabled) { page = Number(pg.dataset.page); return load(); }

    const del = e.target.closest('[data-del]');
    if (!del) return;
    const emp = result.data.find((x) => x.empsno === Number(del.dataset.del));
    const ok = await confirmModal({ title: 'Delete employee', message: `Delete ${emp.empnam} (Emp No ${emp.empeno})? This cannot be undone.` });
    if (!ok) return;
    try {
      await api.remove(emp.empsno);
      // removed the last row of a page -> go back one page
      if (result.data.length === 1 && page > 1) page -= 1;
      await load();
    } catch (err) {
      $('#err').innerHTML = `<div class="alert alert-danger py-2">${esc(err.message)}</div>`;
    }
  });

  await load();
}
