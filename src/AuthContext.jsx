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
import {
  authenticateMockUser,
  clearMockUser,
  getStoredMockUser,
  isMockAuthEnabled,
  persistMockUser,
} from './lib/mockAuth.js';
import { normalizeLoginIdentifier, isReadOnlyViewerProfile } from './lib/readOnlyViewer.js';
import { setOnboardingCompleteCache, isInternOnboardingSatisfied } from './lib/cohortOnboardingService.js';
import { ensureInternProgress } from './lib/supabase/cohortOnboarding.js';
import { fetchInternProgressRow } from './lib/supabase/internProgressFields.js';
import { scheduleInternDelayedUpload, clearInternDelayedUploadSchedule, runInternSignInCloudUpload } from './lib/internSessionSync.js';
import { runInternLogoutBackup } from './lib/internLogoutBackup.js';
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
  const [internCloudSyncing, setInternCloudSyncing] = useState(false);
  const [internWorkStatus, setInternWorkStatus] = useState({
    phase: 'idle',
    message: '',
    error: null,
    showBanner: false,
  });

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (user?.role === 'INTERN' && user?.id) {
      return scheduleInternDelayedUpload(user.id);
    }
    clearInternDelayedUploadSchedule();
    return undefined;
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user?.role !== 'INTERN' || !user?.id) {
      setInternCloudSyncing(false);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setInternCloudSyncing(true);
      try {
        await runInternSignInCloudUpload(user.id);
      } catch (err) {
        console.warn('[auth] intern sign-in cloud upload failed:', err instanceof Error ? err.message : err);
      } finally {
        if (!cancelled) setInternCloudSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const fetchSupabaseUser = useCallback(async (authUser) => {
    if (!authUser || !supabase) return null;

    const [{ data: profile, error: profileError }, internProgressRaw] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, name, role, read_only')
          .eq('id', authUser.id)
          .maybeSingle(),
        fetchInternProgressRow(supabase, authUser.id),
      ]);

    let internProgress = internProgressRaw;

    if (profileError) throw profileError;
    if (!profile) {
      if (internProgress?.onboarding_complete || isInternOnboardingSatisfied(internProgress)) {
        setOnboardingCompleteCache(authUser.id, true);
      }
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

    if (profile.role === 'INTERN' && !internProgress) {
      try {
        internProgress = await ensureInternProgress();
      } catch {
        /* RPC/API may be unavailable until migration 20260713 is applied */
      }
      if (!internProgress) {
        try {
          internProgress = await fetchInternProgressRow(supabase, authUser.id);
        } catch {
          /* read-only fallback failed */
        }
      }
      if (!internProgress) {
        internProgress = {
          segment: 1,
          hours: 0,
          licensed: false,
          squad: null,
          university: null,
          onboarding_complete: false,
          onboarding_welcomed_at: null,
          cohort_id: null,
          program_slug: 'spike-internship',
          ra_spike_segment: 1,
          ra_spike_current_week: 1,
        };
      }
    }

    if (internProgress?.onboarding_complete || isInternOnboardingSatisfied(internProgress)) {
      setOnboardingCompleteCache(profile.id, true);
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      internProgress: internProgress || null,
      mustChangePassword: readMustChangePassword(authUser),
      readOnlyViewer: isReadOnlyViewerProfile(profile),
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

    if (!isMockAuthEnabled()) {
      clearMockUser();
    }

    if (USE_SUPABASE) {
      async function bootstrapSupabase() {
        setLoading(true);

        const mockUser = getStoredMockUser();
        if (mockUser) {
          setToken('mock');
          setUser(mockUser);
          setLoading(false);
          return;
        }

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
          const mockUser = getStoredMockUser();
          if (mockUser) {
            setToken('mock');
            setUser(mockUser);
            setLoading(false);
            return;
          }
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
      const mockUser = getStoredMockUser();
      if (mockUser) {
        setToken('mock');
        setUser(mockUser);
        setLoading(false);
        return;
      }

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
    const loginId = normalizeLoginIdentifier(email);
    if (isMockAuthEnabled()) {
      const mockUser = authenticateMockUser(loginId, password);
      if (mockUser) {
        persistMockUser(mockUser);
        setToken('mock');
        setUser(mockUser);
        return mockUser;
      }
    }

    if (USE_SUPABASE) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginId,
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
      body: { email: loginId, password },
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
    clearInternDelayedUploadSchedule();
    clearMockUser();
    setInternWorkStatus({ phase: 'idle', message: '', error: null, showBanner: false });
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

  const logoutWithBackup = useCallback(async () => {
    const current = userRef.current;
    if (current?.role !== 'INTERN' || !current?.id) {
      logout();
      return;
    }

    const participantId = current.id;
    setInternWorkStatus({
      phase: 'cloud_sync',
      message: 'Saving playbook, portfolio, and deliverables to the cloud…',
      error: null,
      showBanner: true,
    });

    try {
      await runInternLogoutBackup(participantId, (status) => {
        setInternWorkStatus({
          phase: status.phase,
          message: status.message,
          error: status.error ?? null,
          showBanner: true,
        });
      });
      setInternWorkStatus({
        phase: 'completed',
        message: 'Cloud save and device backup complete.',
        error: null,
        showBanner: true,
      });
      await new Promise((resolve) => {
        setTimeout(resolve, 900);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setInternWorkStatus({
        phase: 'error',
        message: 'Sign-out backup had issues. Your work remains on this device.',
        error: message,
        showBanner: true,
      });
      await new Promise((resolve) => {
        setTimeout(resolve, 1200);
      });
    } finally {
      logout();
    }
  }, [logout]);

  const refreshUser = useCallback(async () => {
    const storedMock = getStoredMockUser();
    if (storedMock) {
      setToken('mock');
      setUser(storedMock);
      return storedMock;
    }

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
      internCloudSyncing,
      internWorkStatus,
      isSupabaseConfigured,
      usingSupabaseAuth: USE_SUPABASE,
      mockAuthEnabled: isMockAuthEnabled(),
      login,
      completeBootstrapSetup,
      logout,
      logoutWithBackup,
      refreshUser,
    }),
    [
      token,
      user,
      loading,
      internCloudSyncing,
      internWorkStatus,
      login,
      completeBootstrapSetup,
      logout,
      logoutWithBackup,
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
