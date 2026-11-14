import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get())); // true while we check the saved token

  // Page opened: if a token is saved, ask the server who the user is
  useEffect(() => {
    if (!tokenStore.get()) return;
    api.get('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // The API said 401 (login ended) -> clear the user, the router sends him to /login
  useEffect(() => {
    const onExpired = () => { tokenStore.clear(); setUser(null); };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async (usdusd, usdpwd, remember) => {
    const d = await api.post('/auth/login', { usdusd, usdpwd, remember });
    tokenStore.set(d.token, remember);
    setUser(d.user);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
