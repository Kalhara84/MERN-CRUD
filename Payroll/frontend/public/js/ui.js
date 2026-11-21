/** small helpers shared by all pages */
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const money = (n, d = 0) =>
  Number(n ?? 0).toLocaleString('en-LK', { minimumFractionDigits: d, maximumFractionDigits: d });

export const CATEGORY = { W: 'Wages', E: 'Executive', S: 'Staff' };
export const GENDER = { M: 'Male', F: 'Female' };
export const yn = (v) => (v === 'Y' ? 'Yes' : v === 'N' ? 'No' : v || '-');

export const loading = (text = 'Loading...') =>
  `<div class="text-center text-muted py-5"><div class="spinner-border text-primary mb-2"></div><div>${esc(text)}</div></div>`;

export const alertBox = (msg) => `<div class="alert alert-danger py-2">${esc(msg)}</div>`;

export const emptyState = (title, sub = '') =>
  `<div class="empty-state"><img src="/assets/empty.svg" alt="" /><div class="t">${esc(title)}</div>${sub ? `<div class="small">${esc(sub)}</div>` : ''}</div>`;

/** delete / confirm dialog -> resolves true (confirmed) or false (cancelled) */
export function confirmModal({ title, message, confirmText = 'Delete' }) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'modal-backdrop-lite';
    el.innerHTML = `
      <div class="modal-box">
        <div class="modal-icon"><i class="bi bi-trash3-fill"></i></div>
        <h5 class="mb-2">${esc(title)}</h5>
        <p class="text-muted mb-4">${esc(message)}</p>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-light" data-no>Cancel</button>
          <button class="btn btn-danger" data-yes>${esc(confirmText)}</button>
        </div>
      </div>`;
    const done = (v) => { el.remove(); resolve(v); };
    el.addEventListener('click', (e) => {
      if (e.target === el || e.target.closest('[data-no]')) done(false);
      else if (e.target.closest('[data-yes]')) done(true);
    });
    document.body.appendChild(el);
  });
}
