import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import { usePageTitle } from '../components/Layout';
import ConfirmDelete from '../components/ConfirmDelete';
import { dateTime } from '../utils/format';

export default function ExpireListPage() {
  usePageTitle('Expire Module');
  const flash = useFlash();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.get('/expire');
      setRows(d.rows);
    } catch (e) {
      flash.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((h) =>
      [h.exhsno, h.exhdno, h.exhddt, h.exhdes, h.cat_name, h.loc_name, h.exhucdame, h.exhucdnew].join(' ').toLowerCase().includes(q));
  }, [rows, search]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const d = await api.delete(`/expire/${toDelete.exhsno}`);
      flash.success(d.message);
      setToDelete(null);
      await load();
    } catch (e) {
      flash.error(e.message);
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  };

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
                    {/* The last update, or the created date when never updated */}
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

      <ConfirmDelete show={Boolean(toDelete)} title="Delete entry" busy={busy} onCancel={() => setToDelete(null)} onConfirm={confirmDelete}>
        Delete expire entry <b>{toDelete && toDelete.exhdno}</b> and all its lines? This cannot be undone.
      </ConfirmDelete>
    </>
  );
}
