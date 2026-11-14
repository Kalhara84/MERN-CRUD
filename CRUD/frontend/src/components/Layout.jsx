import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../helpers';

// The title shown in the top bar, chosen from the address
function getTitle(path) {
  if (path === '/users') return 'Users';
  if (path === '/users/add') return 'Add user';
  if (path.startsWith('/users/')) return 'Edit user';
  if (path.startsWith('/expire')) return 'Expire Module';
  return 'Dashboard';
}

export default function Layout({ user, message, onCloseMessage, onLogout, children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);   // the menu on small screens

  const title = getTitle(pathname);

  // Browser tab title
  useEffect(() => {
    document.title = `${title} | ${APP_NAME}`;
  }, [title]);

  // Page background style of the theme
  useEffect(() => {
    document.body.classList.add('jw-body');
    return () => document.body.classList.remove('jw-body');
  }, []);

  // Small screens: close the menu after choosing a page
  useEffect(() => setMenuOpen(false), [pathname]);

  const linkClass = ({ isActive }) => `jw-link ${isActive ? 'active' : ''}`;

  function logout() {
    onLogout();
    navigate('/login');
  }

  return (
    <>
      <div className={`jw-backdrop ${menuOpen ? 'show' : ''}`} onClick={() => setMenuOpen(false)} />

      {/* SIDEBAR (left menu) */}
      <aside className={`jw-sidebar ${menuOpen ? 'open' : ''}`}>
        <NavLink className="jw-brand" to="/">
          <img src="/assets/img/jw-logo.svg" alt="" />
          <div><div className="t1">{APP_NAME}</div><div className="t2">Jewellers</div></div>
        </NavLink>
        <nav>
          <div className="jw-nav-title">Main</div>
          <NavLink className={linkClass} to="/" end><i className="bi bi-speedometer2" /> Dashboard</NavLink>
          <NavLink className={linkClass} to="/expire"><i className="bi bi-hourglass-split" /> Expire Module</NavLink>

          {/* Users: only admin users see it */}
          {user.is_admin && (
            <>
              <div className="jw-nav-title">Administration</div>
              <NavLink className={linkClass} to="/users"><i className="bi bi-people" /> Users</NavLink>
            </>
          )}
        </nav>
        <div className="jw-side-foot">
          <button type="button" className="btn btn-dark-gold btn-sm w-100" onClick={logout}>
            <i className="bi bi-box-arrow-right" /> Logout
          </button>
        </div>
      </aside>

      <div className="jw-main">
        {/* TOP BAR: menu button (small screens), page title, user name */}
        <header className="jw-topbar">
          <button className="btn btn-outline-gold btn-sm d-lg-none" type="button" onClick={() => setMenuOpen(!menuOpen)}>
            <i className="bi bi-list" />
          </button>
          <h1 className="jw-page-title">{title}</h1>
          <div className="jw-user ms-auto">
            <div className="text-end d-none d-sm-block lh-sm">
              <div className="fw-semibold">{user.usdnam || user.usdusd}</div>
              <small className="text-muted">{user.usdusd}{user.is_admin ? ' · Admin' : ''}</small>
            </div>
            <div className="jw-avatar">{user.usdusd.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>

        {/* CONTENT: green/red message, then the page */}
        <main className="jw-content">
          {message && (
            <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
              {message.text}
              <button type="button" className="btn-close" aria-label="Close" onClick={onCloseMessage} />
            </div>
          )}
          {children}
        </main>

        <footer className="jw-footer">&copy; {new Date().getFullYear()} {APP_NAME} Jewellers</footer>
      </div>
    </>
  );
}
