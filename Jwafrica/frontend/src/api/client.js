import { API_URL } from '../config';

const TOKEN_KEY = 'jw_token';

// "Remember me" ticked -> token kept in localStorage (stays after the browser closes)
// not ticked           -> token kept in sessionStorage (login ends when the browser closes)
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
  set(token, remember) {
    this.clear();
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

// Error thrown for every answer that is not OK. data = the JSON sent by the server.
export class ApiError extends Error {
  constructor(status, data) {
    super((data && data.message) || 'Request failed');
    this.status = status;
    this.data = data || {};
  }
}

async function request(method, path, body) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(0, { message: 'Cannot reach the server. Please try again.' });
  }

  let data = null;
  try { data = await res.json(); } catch (e) { /* empty answer */ }

  if (!res.ok) {
    // Login ended (token expired, user deleted or blocked) -> AuthContext logs out
    if (res.status === 401 && path !== '/auth/login') window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(res.status, data);
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body ?? {}),
  delete: (path) => request('DELETE', path),
};
