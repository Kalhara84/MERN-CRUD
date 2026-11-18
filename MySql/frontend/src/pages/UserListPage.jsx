// =============================================================================
// pages/UserListPage.jsx - Users page: table of all users
// =============================================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { ConfirmDelete } from '../components/Modal';
import { dateTime } from '../helpers';

export default function UserListPage({ me, showMessage }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState(null);   // the user chosen in the delete pop-up (null = pop-up closed)
  const [busy, setBusy] = useState(false);

  // Get all users from the backend
  async function loadUsers() {
    try {
      const data = await api.get('/users');
      setUsers(data.users);
    } catch (err) {
      showMessage('danger', err.message);
    }
    setLoading(false);
  }

  // Runs once when the page opens
  useEffect(() => { loadUsers(); }, []);

  // Search: keep only the rows that contain the typed text
  const text = search.trim().toLowerCase();
  const shown = users.filter((u) =>
    [u.usdsno, u.usdusd, u.usdnam, u.usddesig, u.usdemail, u.usducdame].join(' ').toLowerCase().includes(text)
  );

  // "Delete" button of the pop-up
  async function confirmDelete() {
    setBusy(true);
    try {
      const data = await api.delete('/users/' + toDelete.usdsno);
      showMessage('success', data.message);
      await loadUsers();
    } catch (err) {
      showMessage('danger', err.message);
    }
    setToDelete(null);
    setBusy(false);
  }

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
                {shown.map((u) => (
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
                      {/* A user cannot delete himself, so no button on his own row */}
                      {u.usdsno !== me.usdsno && (
                        <button type="button" className="btn btn-outline-danger btn-sm ms-1" onClick={() => setToDelete(u)}>
                          <i className="bi bi-trash" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && shown.length === 0 && (
                  <tr><td colSpan="10" className="text-center text-muted py-4">No users yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toDelete && (
        <ConfirmDelete title="Delete user" busy={busy} onCancel={() => setToDelete(null)} onConfirm={confirmDelete}>
          Delete user <b>{toDelete.usdusd}</b>? This cannot be undone.
        </ConfirmDelete>
      )}
    </>
  );
}
