import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'deal-engine-token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authRequired, setAuthRequired] = useState(false);
  const [userMode, setUserMode] = useState(false);
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUserState] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/status`)
      .then((r) => r.json())
      .then((d) => {
        setAuthRequired(d.authRequired);
        setUserMode(!!d.userMode);
      })
      .catch(() => setAuthRequired(false));
  }, []);

  const setToken = useCallback((t, u = null) => {
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      setUserState(u || null);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setUserState(null);
    }
    setTokenState(t);
  }, []);

  const login = useCallback(async (emailOrPassword, password) => {
    const body = userMode
      ? { email: emailOrPassword, password }
      : { password: emailOrPassword };
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setToken(data.token, data.user || null);
    setShowLogin(false);
  }, [setToken, userMode]);

  const register = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setToken(data.token, data.user || null);
    setShowLogin(false);
  }, [setToken]);

  const logout = useCallback(() => setToken(null), [setToken]);

  const apiFetch = useCallback(
    async (url, opts = {}) => {
      const headers = { ...opts.headers };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { ...opts, headers });
      if (res.status === 401 && authRequired) setShowLogin(true);
      return res;
    },
    [token, authRequired]
  );

  const value = {
    authRequired,
    userMode,
    token,
    user,
    isAuthenticated: !authRequired || !!token,
    showLogin,
    setShowLogin,
    login,
    register,
    logout,
    setToken,
    apiFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
