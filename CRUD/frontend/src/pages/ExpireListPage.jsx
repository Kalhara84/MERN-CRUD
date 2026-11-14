// =============================================================================
// pages/ExpireListPage.jsx - Expire Module: table of all entries
// =============================================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { ConfirmDelete } from '../components/Modal';
import { dateTime } from '../helpers';

export default function ExpireListPage({ showMessage }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState(null);   // the entry chosen in the delete pop-up
  const [busy, setBusy] = useState(false);

  // Get all entries from the backend
  async function loadRows() {
    try {
      const data = await api.get('/expire');
      setRows(data.rows);
    } catch (err) {
      showMessage('danger', err.message);
    }
    setLoading(false);
  }

  useEffect(() => { loadRows(); }, []);

  // Search: keep only the rows that contain the typed text
  const text = search.trim().toLowerCase();
  const shown = rows.filter((h) =>
    [h.exhsno, h.exhdno, h.exhddt, h.exhdes, h.cat_name, h.loc_name, h.exhucdame, h.exhucdnew].join(' ').toLowerCase().includes(text)
  );

  // "Delete" button of the pop-up
  async function confirmDelete() {
    setBusy(true);
    try {
      const data = await api.delete('/expire/' + toDelete.exhsno);
      showMessage('success', data.message);
      await loadRows();
    } catch (err) {
      showMessage('danger', err.message);
    }
    setToDelete(null);
    setBusy(false);
  }

  return (
    <>
      <div className="jw-card exp-list">
        <div className="jw-card-head">
          <h5><i className="bi bi-hourglass-split" /> Expire entries <span className="text-muted small">({rows.length})</span></h5>
          <div className="d-flex gap-2">
            <input type="search" className="form-control form-control-sm" placeholder="Search..." style={{ width: 200 }}
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <Link to="/expire/add" className="btn btn-primary btn-sm"><i className="bi bi-plus-lg" /> Add Entry</Link>
          </div>
        </div>
        <div className="jw-card-body">
          <div className="table-responsive">
            <table className="table jw-table align-middle">
              <thead>
                <tr>
                  <th>#</th><th>Code</th><th>Date</th><th>Description</th><th>Item Category</th><th>Location</th>
                  <th className="text-center">Lines</th><th>Updated by</th><th>Updated on</th><th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((h) => (
                  <tr key={h.exhsno}>
                    <td>{h.exhsno}</td>
                    <td className="fw-semibold">{h.exhdno}</td>
                    <td>{h.exhddt}</td>
                    <td>{h.exhdes}</td>
                    <td>{h.cat_name}</td>
                    <td>{h.loc_name}</td>
                    <td className="text-center"><span className="badge text-bg-secondary">{h.line_count}</span></td>
                    <td>{h.exhucdame || h.exhucdnew || '-'}</td>
                    {/* The last update, or the created date when it was never updated */}
                    <td>{h.exhameddt ? dateTime(h.exhameddt, h.exhametime) : dateTime(h.exhentddt, h.exhenttime)}</td>
                    <td className="text-end text-nowrap">
                      <Link to={`/expire/${h.exhsno}/edit`} className="btn btn-outline-gold btn-sm"><i className="bi bi-pencil" /></Link>
                      <button type="button" className="btn btn-outline-danger btn-sm ms-1" onClick={() => setToDelete(h)}>
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && shown.length === 0 && (
                  <tr><td colSpan="10" className="text-center text-muted py-4">No expire entries yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toDelete && (
        <ConfirmDelete title="Delete entry" busy={busy} onCancel={() => setToDelete(null)} onConfirm={confirmDelete}>
          Delete expire entry <b>{toDelete.exhdno}</b> and all its lines? This cannot be undone.
        </ConfirmDelete>
      )}
    </>
  );
}
