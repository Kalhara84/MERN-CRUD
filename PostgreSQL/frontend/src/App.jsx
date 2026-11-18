// =============================================================================
// App.jsx - keeps "who is logged in" and the green/red message, and
// decides which page is shown for each address (URL).
// =============================================================================
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api, clearToken, getToken } from './api';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserListPage from './pages/UserListPage';
import UserFormPage from './pages/UserFormPage';
import CustomerListPage from './pages/CustomerListPage';
import CustomerFormPage from './pages/CustomerFormPage';
export default function App() {
  const location = useLocation();
  const [user, setUser] = useState(null); // the logged-in user (null = nobody)
  const [checking, setChecking] = useState(Boolean(getToken())); // true while we check the saved token
  const [message, setMessage] = useState(null); // { type: 'success' | 'danger', text }

  // Page opened: if a token is saved, ask the server who the user is
  useEffect(() => {
    if (!getToken()) {
      return;
    }
    api.get('/auth/me').then(data => {
      return setUser(data.user);
    }).catch(() => {
      return clearToken();
    }).finally(() => {
      return setChecking(false);
    });
  }, []);

  // The message disappears after 6 seconds
  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = setTimeout(() => {
      return setMessage(null);
    }, 6000);
    return () => {
      return clearTimeout(timer);
    };
  }, [message]);

  // Pages call this:  showMessage('success', 'User added.')   or   showMessage('danger', 'Failed')
  function showMessage(type, text) {
    setMessage({
      type,
      text
    });
  }
  function logout() {
    clearToken();
    setUser(null);
  }
  if (checking) {
    return <div className="flex justify-center items-center min-h-screen"><div className="spinner" /></div>;
  }

  // ---- Not logged in: only the login page can be opened
  if (!user) {
    return <Routes>
        <Route path="/login" element={<LoginPage onLogin={setUser} />} />
        <Route path="*" element={<Navigate to="/login" replace state={{
        from: location.pathname
      }} />} />
      </Routes>;
  }

  // Users pages are for admin users only
  const adminOnly = page => {
    return user.is_admin ? page : <div className="rounded-xl p-4 bg-red-50 text-red-700 m-4"><b>Admin only.</b> You do not have permission to open this page.</div>;
  };

  // ---- Logged in: every page is shown inside the Layout (sidebar + top bar)
  return <Layout user={user} message={message} onCloseMessage={() => {
    return setMessage(null);
  }} onLogout={logout}>
      <Routes>
        <Route path="/" element={<DashboardPage user={user} />} />
        {/* Customers (all logged-in users) */}
        <Route path="/customers" element={<CustomerListPage showMessage={showMessage} />} />
        <Route path="/customers/add" element={<CustomerFormPage showMessage={showMessage} />} />
        <Route path="/customers/:id/edit" element={<CustomerFormPage showMessage={showMessage} />} />

        {/* Users (admin only) */}
        <Route path="/users" element={adminOnly(<UserListPage me={user} showMessage={showMessage} />)} />
        <Route path="/users/add" element={adminOnly(<UserFormPage showMessage={showMessage} />)} />
        <Route path="/users/:id/edit" element={adminOnly(<UserFormPage showMessage={showMessage} />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>;
}
