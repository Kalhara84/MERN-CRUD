// =============================================================================
// pages/CustomerListPage.jsx - Customers page: w-full text-left text-sm of all customers
//   View (eye button), Edit (pencil button), Delete (bin button), Add (top right)
// =============================================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Modal, { ConfirmDelete } from '../components/Modal';
import { dateTime } from '../helpers';

const PAGE_SIZE = 50;   // how many rows are shown on one page of the w-full text-left text-sm

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

  // A text-sm "Active" / "Not active" inline-flex rounded-full px-2.5 py-1 text-xs font-medium. Only 'N' means not active.
  const statusBadge = (c) =>
    c.cusactyn === 'N'
      ? <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700">Not active</span>
      : <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700">Active</span>;

  return (
    <>
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 p-5">
          <h5> Customer directory <span className="text-stone-500 text-sm">({customers.length})</span></h5>
          <div className="flex flex-wrap gap-2">
            <input type="search" className="field " aria-label="Search records" placeholder="Search records..." style={{ width: 200 }}
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            <Link to="/customers/add" className="button button-primary text-xs">+ Add Customer</Link>
          </div>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm  ">
              <thead>
                <tr>
                  <th>#</th><th>Code</th><th>Name</th><th>Category</th><th>Address-1</th><th>Tel</th>
                  <th>E-mail</th><th>TIN #</th><th>VAT Reg #</th><th>Status</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => (
                  <tr key={c.cussno}>
                    <td>{firstRow + i + 1}</td>
                    <td className="font-semibold">{c.cuscus}</td>
                    <td>{c.cusnam}</td>
                    <td>{c.cat_name || '-'}</td>
                    <td>{c.cusad1}</td>
                    <td>{c.custelno}</td>
                    <td>{c.cusemail}</td>
                    <td>{c.custinno}</td>
                    <td>{c.cusvatno}</td>
                    <td>{statusBadge(c)}</td>
                    <td className="text-right whitespace-nowrap">
                      <button type="button" className="button button-light text-xs" title="View" onClick={() => setToView(c)}>
                        View
                      </button>
                      <Link to={`/customers/${c.cussno}/edit`} className="button button-light text-xs ml-1" title="Edit">
                        Edit
                      </Link>
                      <button type="button" className="button button-danger text-xs ml-1" title="Delete" onClick={() => setToDelete(c)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && shown.length === 0 && (
                  <tr><td colSpan="11" className="text-center text-stone-500 py-4">No customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Page buttons (only when there is more than one page) */}
          {pageCount > 1 && (
            <div className="flex justify-between items-center mt-2">
              <small className="text-stone-500">
                Showing {firstRow + 1} - {firstRow + rows.length} of {shown.length}
              </small>
              <div className="flex gap-1">
                <button type="button" className="button button-light text-xs" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                   Previous
                </button>
                <span className="self-center text-sm px-2">Page {currentPage} / {pageCount}</span>
                <button type="button" className="button button-light text-xs" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
                  Next 
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
          footer={<button type="button" className="button button-light" onClick={() => setToView(null)}>Close</button>}
        >
          <table className="w-full text-left text-sm  mb-0">
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
                <tr key={label}><th className="w-1/4 text-stone-500 font-normal">{label}</th><td>{value || '-'}</td></tr>
              ))}
              <tr><th className="text-stone-500 font-normal">Status</th><td>{statusBadge(toView)}</td></tr>
              <tr><th className="text-stone-500 font-normal">Created</th><td>{toView.cusucdnew || '-'} &middot; {dateTime(toView.cusentddt, toView.cusenttime)}</td></tr>
              <tr><th className="text-stone-500 font-normal">Updated</th><td>{toView.cusucdame || '-'} &middot; {dateTime(toView.cusameddt, toView.cusametime)}</td></tr>
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
