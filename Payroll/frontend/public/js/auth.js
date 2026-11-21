import { api, TOKEN_KEY, USER_KEY } from './api.js';

export function currentUser() {
  try {
    if (!localStorage.getItem(TOKEN_KEY)) return null;
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export async function login(username, password) {
  const res = await api.login(username, password);
  localStorage.setItem(TOKEN_KEY, res.token);
  localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  return res.user;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
