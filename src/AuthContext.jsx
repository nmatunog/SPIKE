import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { apiFetch } from './apiClient';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const AuthContext = createContext(null);
const STATIC_ONLY = import.meta.env.VITE_STATIC_ONLY === 'true';
const USE_SUPABASE = isSupabaseConfigured && !STATIC_ONLY;
const PROFILE_FETCH_TIMEOUT_MS = 12000;
const PROFILE_RETRY_INTERVAL_MS = 2500;
const PROFILE_RETRY_MAX_ATTEMPTS = 8;

function hasCompleteProfile(appUser) {
  return Boolean(appUser?.id && appUser?.role && !appUser?.profileIncomplete);
}

/** Keep a working profile when a background refetch times out or flakes. */
function preferExistingProfile(nextUser, existingUser, authUserId) {
  if (hasCompleteProfile(existingUser) && existingUser.id === authUserId) {
    if (!nextUser || nextUser.profileIncomplete) {
      return existingUser;
    }
  }
  return nextUser;
}

/** When the DB profile cannot be read—never guess INTERN (that misroutes admins). */
function readMustChangePassword(authUser) {
  return authUser?.user_metadata?.must_change_password === true;
}

function mapProfileIncompleteUser(authUser) {
  return {
    id: authUser?.id ?? null,
    email: authUser?.email ?? '',
    name: authUser?.user_metadata?.name || authUser?.email || 'User',
    role: null,
    internProgress: null,
    profileIncomplete: true,
    mustChangePassword: readMustChangePassword(authUser),
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    USE_SUPABASE ? null : localStorage.getItem('spike_token'),
  );
  const [user, setUser] = useState(null);
  const userRef = useRef(null);
  const [loading, setLoading] = useState(
    USE_SUPABASE ? true : !!localStorage.getItem('spike_token'),
  );

  useEffect(() => {
    userRef.current = user;
  }, [user]);

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
          .select('segment, hours, licensed, squad, university, career_track, career_track_selected_at, current_week, current_day')
          .eq('user_id', authUser.id)
          .maybeSingle(),
      ]);

    if (profileError) throw profileError;
    if (!profile) {
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email || 'User',
        role: null,
        internProgress: internProgress || null,
        profileIncomplete: true,
        mustChangePassword: readMustChangePassword(authUser),
      };
    }
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      internProgress: internProgress || null,
      mustChangePassword: readMustChangePassword(authUser),
    };
  }, []);

  const fetchSupabaseUserSafe = useCallback(
    async (authUser, { existingUser = null, useTimeout = true } = {}) => {
      if (!authUser) return null;
      try {
        let result;
        if (useTimeout) {
          const profileOrTimeout = await Promise.race([
            fetchSupabaseUser(authUser),
            new Promise((resolve) => {
              setTimeout(
                () => resolve(mapProfileIncompleteUser(authUser)),
                PROFILE_FETCH_TIMEOUT_MS,
              );
            }),
          ]);
          result = profileOrTimeout || mapProfileIncompleteUser(authUser);
        } else {
          result =
            (await fetchSupabaseUser(authUser)) ||
            mapProfileIncompleteUser(authUser);
        }
        return preferExistingProfile(result, existingUser, authUser.id);
      } catch {
        return preferExistingProfile(
          mapProfileIncompleteUser(authUser),
          existingUser,
          authUser.id,
        );
      }
    },
    [fetchSupabaseUser],
  );

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
          const currentUser = await fetchSupabaseUserSafe(data.session.user);
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
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        if (!session?.user) {
          setToken(null);
          setUser(null);
          setLoading(false);
          return;
        }

        // Token refresh is frequent; do not re-query profiles when one is already loaded.
        if (
          _event === 'TOKEN_REFRESHED' &&
          hasCompleteProfile(userRef.current) &&
          userRef.current.id === session.user.id
        ) {
          return;
        }

        // Supabase recommends deferring async work out of this callback to avoid deadlocks.
        setTimeout(async () => {
          if (cancelled) return;
          try {
            const currentUser = await fetchSupabaseUserSafe(session.user, {
              existingUser: userRef.current,
            });
            if (!cancelled) {
              setToken(null);
              setUser(currentUser);
              setLoading(false);
            }
          } catch {
            if (!cancelled) {
              const kept = preferExistingProfile(
                null,
                userRef.current,
                session.user.id,
              );
              if (kept) {
                setUser(kept);
              } else {
                setToken(null);
                setUser(null);
              }
              setLoading(false);
            }
          }
        }, 0);
      });
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
  }, [fetchSupabaseUserSafe, token]);

  useEffect(() => {
    if (!USE_SUPABASE || !user?.profileIncomplete || !user?.id) return undefined;

    let cancelled = false;
    let attempts = 0;
    let retryTimer;

    const retryProfile = async () => {
      if (cancelled || attempts >= PROFILE_RETRY_MAX_ATTEMPTS) return;
      attempts += 1;

      const { data } = await supabase.auth.getSession();
      if (cancelled || !data.session?.user) return;

      try {
        const me = await fetchSupabaseUser(data.session.user);
        if (!cancelled && me && !me.profileIncomplete) {
          setUser(me);
          return;
        }
      } catch {
        /* try again */
      }

      if (!cancelled && attempts < PROFILE_RETRY_MAX_ATTEMPTS) {
        retryTimer = setTimeout(retryProfile, PROFILE_RETRY_INTERVAL_MS);
      }
    };

    retryTimer = setTimeout(retryProfile, PROFILE_RETRY_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [user?.profileIncomplete, user?.id, fetchSupabaseUser]);

  const login = useCallback(async (email, password) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const currentUser = await fetchSupabaseUserSafe(data.user);
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
  }, [fetchSupabaseUserSafe]);

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
      const me = await fetchSupabaseUserSafe(data.session.user, {
        existingUser: userRef.current,
        useTimeout: false,
      });
      setToken(null);
      setUser(me);
      return me;
    }

    const t = localStorage.getItem('spike_token');
    if (!t) return;
    const me = await apiFetch('/api/auth/me', { token: t });
    setUser(me);
    return me;
  }, [fetchSupabaseUserSafe]);

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
