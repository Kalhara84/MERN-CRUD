import { createContext, useContext, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import { APP_NAME } from '../config';

const TitleContext = createContext(() => {});

// Pages call this to set the title in the top bar and the browser tab
export function usePageTitle(title) {
  const setTitle = useContext(TitleContext);
  useEffect(() => {
    setTitle(title);
    document.title = `${title} | ${APP_NAME}`;
  }, [title, setTitle]);
}

export default function Layout() {
  const { user, logout } = useAuth();
  const flash = useFlash();
  const navigate = useNavigate();
  const location = useLocation();
  const [title, setTitle] = useState('Dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  // Page background class from the theme (login page uses its own class)
  useEffect(() => {
    document.body.classList.add('jw-body');
    return () => document.body.classList.remove('jw-body');
  }, []);

  // Small screens: close the sidebar after choosing a page
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const linkClass = ({ isActive }) => `jw-link ${isActive ? 'active' : ''}`;
  const doLogout = () => { logout(); navigate('/login'); };

  return (
    <TitleContext.Provider value={setTitle}>
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

          {/* Expire Module (all logged-in users) */}
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
          <button type="button" className="btn btn-dark-gold btn-sm w-100" onClick={doLogout}>
            <i className="bi bi-box-arrow-right" /> Logout
          </button>
        </div>
      </aside>

      <div className="jw-main">
        {/* TOP BAR: menu button (small screens), page title, logged-in user name */}
        <header className="jw-topbar">
          <button className="btn btn-outline-gold btn-sm d-lg-none" type="button" onClick={() => setMenuOpen((o) => !o)}>
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

        {/* CONTENT: green/red messages, then the page */}
        <main className="jw-content">
          {flash.messages.map((m) => (
            <div key={m.id} className={`alert alert-${m.type} alert-dismissible fade show`} role="alert">
              {m.text}
              <button type="button" className="btn-close" aria-label="Close" onClick={() => flash.dismiss(m.id)} />
            </div>
          ))}
          <Outlet />
        </main>

        <footer className="jw-footer">&copy; {new Date().getFullYear()} {APP_NAME} Jewellers</footer>
      </div>
    </TitleContext.Provider>
  );
}
