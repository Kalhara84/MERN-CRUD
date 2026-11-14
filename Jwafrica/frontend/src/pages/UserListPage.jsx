import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import { usePageTitle } from '../components/Layout';
import ConfirmDelete from '../components/ConfirmDelete';
import { dateTime } from '../utils/format';

export default function UserListPage() {
  usePageTitle('Users');
  const { user: me } = useAuth();
  const flash = useFlash();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState(null);   // the user chosen in the delete pop-up
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.get('/users');
      setUsers(d.users);
    } catch (e) {
      flash.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // Search: show only the rows that contain the typed text
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.usdsno, u.usdusd, u.usdnam, u.usddesig, u.usdemail, u.usducdame].join(' ').toLowerCase().includes(q));
  }, [users, search]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const d = await api.delete(`/users/${toDelete.usdsno}`);
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
      <div className="jw-card">
        <div className="jw-card-head">
          <h5><i className="bi bi-people" /> User master <span className="text-muted small">({users.length})</span></h5>
          <div className="d-flex gap-2">
            <input type="search" className="form-control form-control-sm" placeholder="Search..." style={{ width: 200 }}
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <Link to="/users/add" className="btn btn-primary btn-sm"><i className="bi bi-plus-lg" /> Add User</Link>
          </div>
        </div>
        <div className="jw-card-body">
          <div className="table-responsive">
            <table className="table jw-table align-middle">
              <thead>
                <tr>
                  <th>#</th><th>User code</th><th>Name</th><th>Designation</th><th>Email</th>
                  <th>Admin</th><th>Status</th><th>Updated by</th><th>Updated on</th><th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.usdsno}>
                    <td>{u.usdsno}</td>
                    <td className="fw-semibold">{u.usdusd}</td>
                    <td>{u.usdnam || ''}</td>
                    <td>{u.usddesig}</td>
                    <td>{u.usdemail}</td>
                    <td>{u.is_admin ? <span className="badge text-bg-dark">Admin</span> : <span className="text-muted">-</span>}</td>
                    <td>{u.is_active ? <span className="badge text-bg-success">Active</span> : <span className="badge text-bg-danger">Blocked</span>}</td>
                    <td>{u.usducdame || '-'}</td>
                    <td>{dateTime(u.usdameddt, u.usdametime)}</td>
                    <td className="text-end text-nowrap">
                      <Link to={`/users/${u.usdsno}/edit`} className="btn btn-outline-gold btn-sm"><i className="bi bi-pencil" /></Link>
                      {/* A user cannot delete himself */}
                      {u.usdsno !== me.usdsno && (
                        <button type="button" className="btn btn-outline-danger btn-sm ms-1" onClick={() => setToDelete(u)}>
                          <i className="bi bi-trash" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan="10" className="text-center text-muted py-4">No users yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDelete show={Boolean(toDelete)} title="Delete user" busy={busy} onCancel={() => setToDelete(null)} onConfirm={confirmDelete}>
        Delete user <b>{toDelete && toDelete.usdusd}</b>? This cannot be undone.
      </ConfirmDelete>
    </>
  );
}
