const BASE = (window.APP_CONFIG && window.APP_CONFIG.API_URL)';

export const TOKEN_KEY = 'payroll_token';
export const USER_KEY = 'payroll_user';

async function request(path, init = {}, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(BASE + path, { ...init, headers, cache: 'no-store' });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  // token missing / expired -> back to the login page
  if (res.status === 401 && auth) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
    throw new Error('Session expired. Please sign in again.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const m = data && data.message;
    throw new Error(Array.isArray(m) ? m.join(', ') : m || 'Something went wrong');
  }
  return data;
}

export const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }, false),
  dashboard: () => request('/dashboard'),
  lookups: () => request('/lookups'),
  list: (search, page, limit = 10) =>
    request(`/employees?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`),
  get: (id) => request(`/employees/${id}`),
  create: (body) => request('/employees', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
};

// dropdown data is the same for every page -> load once
let lookupsPromise = null;
export const getLookups = () => (lookupsPromise ??= api.lookups().catch((e) => { lookupsPromise = null; throw e; }));
