// =============================================================================
// pages/LoginPage.jsx - the login page
// =============================================================================
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, saveToken } from '../api';
import { APP_NAME } from '../helpers';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [usdusd, setUsdusd] = useState('');      // user code
  const [usdpwd, setUsdpwd] = useState('');      // password
  const [remember, setRemember] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // This page has its own background style (jw-login)
  useEffect(() => {
    document.title = `Login | ${APP_NAME}`;
    document.body.classList.add('jw-login');
    return () => document.body.classList.remove('jw-login');
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (!usdusd.trim() || !usdpwd) {
      setError('Please enter User Code and Password');
      return;
    }

    setBusy(true);
    try {
      const data = await api.post('/auth/login', { usdusd: usdusd.trim(), usdpwd, remember });
      saveToken(data.token, remember);
      onLogin(data.user);
      // Go to the page the user wanted before login, or to the dashboard
      navigate((location.state && location.state.from) || '/', { replace: true });
    } catch (err) {
      setError(err.message);   // Invalid User Code / Invalid Password
      setUsdpwd('');
      setBusy(false);
    }
  }

  return (
    <div className="jw-login-wrap">
      {/* LEFT SIDE: brand name and pictures */}
      <section className="jw-login-hero">
        <div className="brand"><img src="/assets/img/jw-logo.svg" alt={APP_NAME} /><span>{APP_NAME}</span></div>
        <div>
          <h1>Crafting trust,<br /><em>one gem at a time.</em></h1>
          <p>Stock, customers, suppliers and pricing for your jewellery business &mdash; all in one elegant place.</p>
          <div className="gems">
            <img src="/assets/img/diamond.svg" alt="diamond" />
            <img src="/assets/img/ring.svg" alt="ring" />
            <img src="/assets/img/necklace.svg" alt="necklace" />
            <img src="/assets/img/earring.svg" alt="earrings" />
            <img src="/assets/img/bangle.svg" alt="bangle" />
          </div>
        </div>
        <small>&copy; {new Date().getFullYear()} {APP_NAME} Jewellers</small>
      </section>

      {/* RIGHT SIDE: the login form */}
      <section className="jw-login-panel">
        <div className="jw-login-card">
          <img className="logo-m" src="/assets/img/jw-logo.svg" alt={APP_NAME} />
          <h2>Welcome back</h2>
          <p className="sub">Sign in to continue to your dashboard.</p>

          <form id="login" onSubmit={submit} autoComplete="off" noValidate>
            {error && (
              <div className="alert alert-danger py-2 mb-3"><i className="bi bi-x-circle" /> <b>{error}</b></div>
            )}

            <div className="jw-input">
              <i className="bi bi-person lead-ico" />
              <input type="text" value={usdusd} onChange={(e) => setUsdusd(e.target.value)}
                className="form-control" placeholder="User Name" autoComplete="off" autoFocus />
            </div>
            <div className="jw-input">
              <i className="bi bi-lock lead-ico" />
              <input type={showPwd ? 'text' : 'password'} value={usdpwd} onChange={(e) => setUsdpwd(e.target.value)}
                className="form-control" placeholder="Password" autoComplete="off" />
              <button type="button" className="toggle-pwd" tabIndex={-1} aria-label="Show password" onClick={() => setShowPwd(!showPwd)}>
                <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>

            {/* Remember me: ticked = stay logged in for 14 days */}
            <div className="links">
              <div className="form-check m-0">
                <input className="form-check-input" type="checkbox" id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <label className="form-check-label" htmlFor="remember">Remember me</label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-signin w-100" disabled={busy}>
              {busy ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="jw-login-foot"><i className="bi bi-shield-check" /> Secure staff access only</div>
        </div>
      </section>
    </div>
  );
}
