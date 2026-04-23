import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiFetch } from './apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('spike_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('spike_token'));

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const me = await apiFetch('/api/auth/me', { token });
        if (!cancelled) setUser(me);
      } catch {
        localStorage.removeItem('spike_token');
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    localStorage.setItem('spike_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  /** First deploy only: creates the single bootstrap admin when the database has no users. */
  const completeBootstrapSetup = useCallback(async (body) => {
    const data = await apiFetch('/api/auth/setup', {
      method: 'POST',
      body,
    });
    localStorage.setItem('spike_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('spike_token');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem('spike_token');
    if (!t) return;
    const me = await apiFetch('/api/auth/me', { token: t });
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      completeBootstrapSetup,
      logout,
      refreshUser,
    }),
    [token, user, loading, login, completeBootstrapSetup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
