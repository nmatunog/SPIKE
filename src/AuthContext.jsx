import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiFetch } from './apiClient';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const AuthContext = createContext(null);
const STATIC_ONLY = import.meta.env.VITE_STATIC_ONLY === 'true';
const USE_SUPABASE = isSupabaseConfigured && !STATIC_ONLY;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    USE_SUPABASE ? null : localStorage.getItem('spike_token'),
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(
    USE_SUPABASE ? true : !!localStorage.getItem('spike_token'),
  );

  const fetchSupabaseUser = useCallback(async (authUser) => {
    if (!authUser || !supabase) return null;

    const [{ data: profile, error: profileError }, { data: internProgress }] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, name, role')
          .eq('id', authUser.id)
          .maybeSingle(),
        supabase
          .from('intern_progress')
          .select('segment, hours, licensed, squad, university')
          .eq('user_id', authUser.id)
          .maybeSingle(),
      ]);

    if (profileError) throw profileError;
    if (!profile) {
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email || 'User',
        role: 'INTERN',
        internProgress: internProgress || null,
      };
    }
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      internProgress: internProgress || null,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (USE_SUPABASE) {
      async function bootstrapSupabase() {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error || !data.session?.user) {
          setUser(null);
          setToken(null);
          setLoading(false);
          return;
        }
        try {
          const currentUser = await fetchSupabaseUser(data.session.user);
          if (!cancelled) {
            setToken(null);
            setUser(currentUser);
          }
        } catch {
          if (!cancelled) {
            setToken(null);
            setUser(null);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      bootstrapSupabase();
      const { data: sub } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (cancelled) return;
          if (!session?.user) {
            setToken(null);
            setUser(null);
            setLoading(false);
            return;
          }
          try {
            const currentUser = await fetchSupabaseUser(session.user);
            if (!cancelled) {
              setToken(null);
              setUser(currentUser);
              setLoading(false);
            }
          } catch {
            if (!cancelled) {
              setToken(null);
              setUser(null);
              setLoading(false);
            }
          }
        },
      );
      return () => {
        cancelled = true;
        sub.subscription.unsubscribe();
      };
    }

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
  }, [fetchSupabaseUser, token]);

  const login = useCallback(async (email, password) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const currentUser = await fetchSupabaseUser(data.user);
      setToken(null);
      setUser(currentUser);
      return currentUser;
    }

    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    localStorage.setItem('spike_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, [fetchSupabaseUser]);

  /** First deploy only: creates the single bootstrap admin when the database has no users. */
  const completeBootstrapSetup = useCallback(async (body) => {
    if (USE_SUPABASE) {
      throw new Error(
        'Supabase mode: create the first user in Supabase Auth and set role ADMIN in public.profiles.',
      );
    }
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
    if (USE_SUPABASE) {
      supabase.auth.signOut();
      setToken(null);
      setUser(null);
      return;
    }
    localStorage.removeItem('spike_token');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (USE_SUPABASE) {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        setToken(null);
        setUser(null);
        return null;
      }
      const me = await fetchSupabaseUser(data.session.user);
      setToken(null);
      setUser(me);
      return me;
    }

    const t = localStorage.getItem('spike_token');
    if (!t) return;
    const me = await apiFetch('/api/auth/me', { token: t });
    setUser(me);
    return me;
  }, [fetchSupabaseUser]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isSupabaseConfigured,
      usingSupabaseAuth: USE_SUPABASE,
      login,
      completeBootstrapSetup,
      logout,
      refreshUser,
    }),
    [
      token,
      user,
      loading,
      login,
      completeBootstrapSetup,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
