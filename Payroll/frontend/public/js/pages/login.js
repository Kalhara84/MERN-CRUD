import { login } from '../auth.js';
import { esc } from '../ui.js';

export async function render(el, ctx) {
  el.innerHTML = `
  <div class="login-page">
    <section class="login-hero">
      <div class="hero-inner">
        <span class="hero-pill"><i class="bi bi-shield-check"></i>Secure sign in</span>
        <h1>Attendance &amp;<br /><span>Payroll System</span></h1>
        <p>Manage employees, attendance and payroll from one clean place.</p>
        <img src="/assets/login-hero.svg" alt="Payroll dashboard, payslip and attendance device" class="hero-art" />
        <div class="hero-points">
          <span><i class="bi bi-check-circle-fill"></i>Employee records</span>
          <span><i class="bi bi-check-circle-fill"></i>Live dashboard</span>
          <span><i class="bi bi-check-circle-fill"></i>Secure access</span>
        </div>
      </div>
    </section>

    <section class="login-side">
      <form class="login-card" id="login-form" novalidate>
        <img src="/assets/logo.jpg" alt="Mike Flora" class="login-logo" />
        <h2>Welcome back</h2>
        <p class="text-muted mb-4">Sign in to continue to your dashboard</p>
        <div id="login-error"></div>

        <label class="form-label" for="username">User name</label>
        <div class="input-group mb-3">
          <span class="input-group-text"><i class="bi bi-person"></i></span>
          <input id="username" class="form-control" placeholder="Enter your user name" autocomplete="username" autofocus />
        </div>

        <label class="form-label" for="password">Password</label>
        <div class="input-group mb-4">
          <span class="input-group-text"><i class="bi bi-lock"></i></span>
          <input id="password" class="form-control" type="password" placeholder="Enter your password" autocomplete="current-password" />
          <button type="button" class="btn btn-outline-secondary" id="toggle-pw" aria-label="Show password"><i class="bi bi-eye"></i></button>
        </div>

        <button class="btn btn-primary w-100 login-btn" id="login-btn">Sign in <i class="bi bi-arrow-right ms-1"></i></button>

        <div class="login-foot">
          <img src="/assets/shield.svg" alt="" width="24" height="24" />
          <span>Mike Flora LTD - Attendance &amp; Payroll System</span>
        </div>
      </form>
    </section>
  </div>`;

  const $ = (s) => el.querySelector(s);
  const errBox = $('#login-error');
  const btn = $('#login-btn');

  $('#toggle-pw').onclick = () => {
    const pw = $('#password');
    const show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    $('#toggle-pw i').className = `bi ${show ? 'bi-eye-slash' : 'bi-eye'}`;
  };

  $('#login-form').onsubmit = async (e) => {
    e.preventDefault();
    errBox.innerHTML = '';
    const username = $('#username').value.trim();
    const password = $('#password').value;
    const showError = (m) =>
      (errBox.innerHTML = `<div class="alert alert-danger py-2 d-flex align-items-center gap-2"><i class="bi bi-exclamation-circle"></i> ${esc(m)}</div>`);

    if (!username || !password) return showError('Please enter your user name and password');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';
    try {
      await login(username, password);
      ctx.navigate('/dashboard', true);
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
      btn.innerHTML = 'Sign in <i class="bi bi-arrow-right ms-1"></i>';
    }
  };
}
