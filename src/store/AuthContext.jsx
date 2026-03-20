import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'dsa_token';
const USER_KEY  = 'dsa_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [authUser, setAuthUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; } catch { return null; }
  });

  // ── Sign up ───────────────────────────────────────────────────────────────
  const signup = useCallback(async (name, email, password) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || 'Signup failed' };

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setAuthUser(data.user);
    return { user: data.user };
  }, []);

  // ── Log in ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || 'Login failed' };

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setAuthUser(data.user);
    return { user: data.user };
  }, []);

  // ── Log out ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setAuthUser(null);
  }, []);

  // ── Update Auth User ───────────────────────────────────────────────────────
  const updateAuthUser = useCallback((newUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setAuthUser(newUser);
  }, []);

  // ── Refresh User from Backend ──────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        updateAuthUser(user);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  }, [token, updateAuthUser]);

  return (
    <AuthContext.Provider value={{ authUser, token, login, signup, logout, updateAuthUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
