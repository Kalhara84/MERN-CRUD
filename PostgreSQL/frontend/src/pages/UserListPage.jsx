// =============================================================================
// pages/UserListPage.jsx - Users page: w-full text-left text-sm of all users
// =============================================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { ConfirmDelete } from '../components/Modal';
import { dateTime } from '../helpers';
export default function UserListPage({
  me,
  showMessage
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState(null); // the user chosen in the delete pop-up (null = pop-up closed)
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
  useEffect(() => {
    loadUsers();
  }, []);

  // Search: keep only the rows that contain the typed text
  const text = search.trim().toLowerCase();
  const shown = users.filter(u => {
    return [u.usdsno, u.usdusd, u.usdnam, u.usddesig, u.usdemail, u.usducdame].join(' ').toLowerCase().includes(text);
  });

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
  return <>
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 p-5">
          <h5> Your farm team <span className="text-stone-500 text-sm">({users.length})</span></h5>
          <div className="flex flex-wrap gap-2">
            <input type="search" className="field " aria-label="Search records" placeholder="Search records..." style={{
            width: 200
          }} value={search} onChange={e => {
            return setSearch(e.target.value);
          }} />
            <Link to="/users/add" className="button button-primary text-xs">+ Add User</Link>
          </div>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm  ">
              <thead>
                <tr>
                  <th>#</th><th>User code</th><th>Name</th><th>Designation</th><th>Email</th>
                  <th>Admin</th><th>Status</th><th>Updated by</th><th>Updated on</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="10" className="py-8 text-center text-stone-500">Loading users…</td></tr>}
                {shown.map(u => {
                return <tr key={u.usdsno}>
                    <td>{u.usdsno}</td>
                    <td className="font-semibold">{u.usdusd}</td>
                    <td>{u.usdnam || ''}</td>
                    <td>{u.usddesig}</td>
                    <td>{u.usdemail}</td>
                    <td>{u.is_admin ? <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-stone-100 text-stone-700">Admin</span> : <span className="text-stone-500">-</span>}</td>
                    <td>{u.is_active ? <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700">Active</span> : <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700">Blocked</span>}</td>
                    <td>{u.usducdame || '-'}</td>
                    <td>{dateTime(u.usdameddt, u.usdametime)}</td>
                    <td className="text-right whitespace-nowrap">
                      <Link to={`/users/${u.usdsno}/edit`} className="button button-light text-xs">Edit</Link>
                      {/* A user cannot delete himself, so no button on his own row */}
                      {u.usdsno !== me.usdsno && <button type="button" className="button button-danger text-xs ml-1" onClick={() => {
                      return setToDelete(u);
                    }}>
                          Delete
                        </button>}
                    </td>
                  </tr>;
              })}
                {!loading && shown.length === 0 && <tr><td colSpan="10" className="text-center text-stone-500 py-4">No users yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toDelete && <ConfirmDelete title="Delete user" busy={busy} onCancel={() => {
      return setToDelete(null);
    }} onConfirm={confirmDelete}>
          Delete user <b>{toDelete.usdusd}</b>? This cannot be undone.
        </ConfirmDelete>}
    </>;
}
