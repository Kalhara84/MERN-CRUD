// =============================================================================
// pages/CustomerListPage.jsx - Customers page: table of all customers
//   View (eye button), Edit (pencil button), Delete (bin button), Add (top right)
// =============================================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Modal, { ConfirmDelete } from '../components/Modal';
import { dateTime } from '../helpers';

const PAGE_SIZE = 50;   // how many rows are shown on one page of the table

export default function CustomerListPage({ showMessage }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [toView, setToView] = useState(null);       // the customer shown in the details pop-up (null = closed)
  const [toDelete, setToDelete] = useState(null);   // the customer chosen in the delete pop-up (null = closed)
  const [busy, setBusy] = useState(false);

  // Get all customers from the backend
  async function loadCustomers() {
    try {
      const data = await api.get('/customers');
      setCustomers(data.customers);
    } catch (err) {
      showMessage('danger', err.message);
    }
    setLoading(false);
  }

  // Runs once when the page opens
  useEffect(() => { loadCustomers(); }, []);

  // Search: keep only the rows that contain the typed text
  const text = search.trim().toLowerCase();
  const shown = customers.filter((c) =>
    [c.cuscus, c.cusnam, c.cat_name, c.rep_name, c.cusad1, c.cusad2, c.custelno, c.cusemail, c.custinno, c.cusvatno]
      .join(' ').toLowerCase().includes(text)
  );

  // Cut the result into pages, and keep the page number inside the real range
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const firstRow = (currentPage - 1) * PAGE_SIZE;
  const rows = shown.slice(firstRow, firstRow + PAGE_SIZE);

  // "Delete" button of the pop-up
  async function confirmDelete() {
    setBusy(true);
    try {
      const data = await api.delete('/customers/' + toDelete.cussno);
      showMessage('success', data.message);
      await loadCustomers();
    } catch (err) {
      showMessage('danger', err.message);
    }
    setToDelete(null);
    setBusy(false);
  }

  // A small "Active" / "Not active" badge. Only 'N' means not active.
  const statusBadge = (c) =>
    c.cusactyn === 'N'
      ? <span className="badge text-bg-danger">Not active</span>
      : <span className="badge text-bg-success">Active</span>;

  return (
    <>
      <div className="jw-card">
        <div className="jw-card-head">
          <h5><i className="bi bi-person-lines-fill" /> Customer master <span className="text-muted small">({customers.length})</span></h5>
          <div className="d-flex gap-2">
            <input type="search" className="form-control form-control-sm" placeholder="Search..." style={{ width: 200 }}
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            <Link to="/customers/add" className="btn btn-primary btn-sm"><i className="bi bi-plus-lg" /> Add Customer</Link>
          </div>
        </div>
        <div className="jw-card-body">
          <div className="table-responsive">
            <table className="table jw-table align-middle">
              <thead>
                <tr>
                  <th>#</th><th>Code</th><th>Name</th><th>Category</th><th>Address-1</th><th>Tel</th>
                  <th>E-mail</th><th>TIN #</th><th>VAT Reg #</th><th>Status</th><th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => (
                  <tr key={c.cussno}>
                    <td>{firstRow + i + 1}</td>
                    <td className="fw-semibold">{c.cuscus}</td>
                    <td>{c.cusnam}</td>
                    <td>{c.cat_name || '-'}</td>
                    <td>{c.cusad1}</td>
                    <td>{c.custelno}</td>
                    <td>{c.cusemail}</td>
                    <td>{c.custinno}</td>
                    <td>{c.cusvatno}</td>
                    <td>{statusBadge(c)}</td>
                    <td className="text-end text-nowrap">
                      <button type="button" className="btn btn-outline-secondary btn-sm" title="View" onClick={() => setToView(c)}>
                        <i className="bi bi-eye" />
                      </button>
                      <Link to={`/customers/${c.cussno}/edit`} className="btn btn-outline-gold btn-sm ms-1" title="Edit">
                        <i className="bi bi-pencil" />
                      </Link>
                      <button type="button" className="btn btn-outline-danger btn-sm ms-1" title="Delete" onClick={() => setToDelete(c)}>
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && shown.length === 0 && (
                  <tr><td colSpan="11" className="text-center text-muted py-4">No customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Page buttons (only when there is more than one page) */}
          {pageCount > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-2">
              <small className="text-muted">
                Showing {firstRow + 1} - {firstRow + rows.length} of {shown.length}
              </small>
              <div className="d-flex gap-1">
                <button type="button" className="btn btn-light btn-sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                  <i className="bi bi-chevron-left" /> Previous
                </button>
                <span className="align-self-center small px-2">Page {currentPage} / {pageCount}</span>
                <button type="button" className="btn btn-light btn-sm" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
                  Next <i className="bi bi-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View pop-up: every detail of one customer (nothing can be changed here) */}
      {toView && (
        <Modal
          title={`Customer ${toView.cuscus}`}
          onClose={() => setToView(null)}
          onSubmit={(e) => { e.preventDefault(); setToView(null); }}
          footer={<button type="button" className="btn btn-light" onClick={() => setToView(null)}>Close</button>}
        >
          <table className="table table-sm mb-0">
            <tbody>
              {[
                ['Name', toView.cusnam],
                ['Category', toView.cat_name],
                ['Rep', toView.rep_name],
                ['Credit Terms', toView.credit_name],
                ['Credit Limit', toView.cuscreditlimit],
                ['Full Address', toView.cusadd],
                ['Address-1', toView.cusad1],
                ['Address-2', toView.cusad2],
                ['Address-3', toView.cusad3],
                ['Address-4', toView.cusad4],
                ['Address-5', toView.cusad5],
                ['Tel', toView.custelno],
                ['Fax', toView.cusfaxno],
                ['E-mail', toView.cusemail],
                ['TIN #', toView.custinno],
                ['VAT Reg #', toView.cusvatno],
                ['SVAT Reg #', toView.cussvatno],
              ].map(([label, value]) => (
                <tr key={label}><th className="w-25 text-muted fw-normal">{label}</th><td>{value || '-'}</td></tr>
              ))}
              <tr><th className="text-muted fw-normal">Status</th><td>{statusBadge(toView)}</td></tr>
              <tr><th className="text-muted fw-normal">Created</th><td>{toView.cusucdnew || '-'} &middot; {dateTime(toView.cusentddt, toView.cusenttime)}</td></tr>
              <tr><th className="text-muted fw-normal">Updated</th><td>{toView.cusucdame || '-'} &middot; {dateTime(toView.cusameddt, toView.cusametime)}</td></tr>
            </tbody>
          </table>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDelete title="Delete customer" busy={busy} onCancel={() => setToDelete(null)} onConfirm={confirmDelete}>
          Delete customer <b>{toDelete.cuscus}</b> - {toDelete.cusnam}? This cannot be undone.
        </ConfirmDelete>
      )}
    </>
  );
}
