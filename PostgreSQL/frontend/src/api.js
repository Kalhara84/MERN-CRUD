const API_URL = import.meta.env.VITE_API_URL;
export function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}
export function saveToken(token, remember) {
  clearToken();
  (remember ? localStorage : sessionStorage).setItem('token', token);
}
export function clearToken() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
}

// ---- send one request
async function request(method, path, body) {
  const headers = {
    'Content-Type': 'application/json'
  };
  const token = getToken();
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }
  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (err) {
    throw new Error('Cannot reach the server. Please try again.');
  }
  let data = {};
  try {
    data = await res.json();
  } catch (err) {/* empty answer */}
  if (!res.ok) {
    // Login ended (token expired, user deleted or blocked) -> go to the login page
    if (res.status === 401 && path !== '/auth/login') {
      clearToken();
      window.location.href = '/login';
    }
    // Throw an error that also carries the status and the data sent by the server
    const error = new Error(data.message || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}
export const api = {
  get: path => {
    return request('GET', path);
  },
  post: (path, body) => {
    return request('POST', path, body || {});
  },
  put: (path, body) => {
    return request('PUT', path, body || {});
  },
  delete: path => {
    return request('DELETE', path);
  }
};
