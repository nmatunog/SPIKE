import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { PortalHeader } from '../../layouts/PortalHeader.jsx';
import { PageLoader } from '../../components/ui/PageLoader.jsx';
import { RoleRouteGuard } from '../../components/routing/RoleRouteGuard.jsx';
import { ReadOnlyViewerBar } from '../../components/admin/ReadOnlyViewerBar.jsx';
import { SuperuserPreviewBar } from '../../components/nav/SuperuserPreviewBar.jsx';
import { RaSpikeNav } from '../../components/ra-spike/RaSpikeNav.jsx';
import { RaSpikeStaffNav } from '../../components/ra-spike/RaSpikeStaffNav.jsx';
import { ForcePasswordChangeGate } from '../../components/ForcePasswordChangeGate.jsx';
import { InternWorkStatusBanner } from '../../components/intern/InternWorkStatusBanner.jsx';
import { useCompactNav } from '../../hooks/useCompactNav.js';
import { useAuth } from '../../AuthContext.jsx';
import { apiFetch } from '../../apiClient.js';
import { fetchInterns } from '../../lib/supabase/index.js';
import { supabase } from '../../supabaseClient.js';
import { resolveUserRole, isStaffUiRole } from '../../lib/roles.js';
import { isReadOnlyViewerUser } from '../../lib/readOnlyViewer.js';
import {
  ROUTES,
  defaultRouteForRole,
  isInternshipOnlyInternPath,
  isRaSpikePlaybookPath,
  internshipEntryHref,
} from '../../routes/paths.js';
import { resolveProgramSlug, isRaSpikeProgram } from '../../lib/programs/index.js';
import { RA_SPIKE_PROGRAM } from '../../lib/programs/ra-spike.js';
import { isRaSpikeOnboardingPath, ensureRaSpikeOnboardingComplete } from '../../lib/raSpikeOnboardingService.js';
import { registerRaSpikeViaApi, isRaSpikeSignupApiUnavailable } from '../../lib/raSpikeSignupService.js';
import { buildRaSpikeCoachPreviewUser, isRaSpikeStaffPlaybookRole } from '../../lib/raSpikeCoachPreview.js';
import { buildSuperuserInternPreviewUser } from '../../lib/superuserInternPreview.js';
import {
  getEffectiveUserRole,
  getPortalAccessRole,
  isSuperuserPortalSession,
  moduleNavRoleForUser,
  readViewAsRole,
  writeViewAsRole,
} from '../../lib/superuserViewAs.js';
import { needsStaffBootstrap } from '../../lib/staffRegistrationCodeService.js';
import {
  bootstrapSuperuserAccount,
  fetchBootstrapSuperuserStatus,
} from '../../lib/bootstrapSuperuserService.js';
import { registerStaffViaApi, isStaffSignupApiUnavailable } from '../../lib/staffSignupService.js';
import { formatAuthEmailError } from '../../lib/userAdminService.js';
import { shouldUseSupabaseForUser } from '../../lib/mockAuth.js';
import { WelcomePage } from '../../pages/WelcomePage.jsx';
import { RaSpikeHomePage } from '../../pages/ra-spike/RaSpikeHomePage.jsx';
import { RaSpikePlaybookPage } from '../../pages/ra-spike/RaSpikePlaybookPage.jsx';
import { RaSpikeSquadPage } from '../../pages/ra-spike/RaSpikeSquadPage.jsx';
import { RaSpikeProfilePage } from '../../pages/ra-spike/RaSpikeProfilePage.jsx';
import { RaSpikeOnboardingPage } from '../../pages/ra-spike/RaSpikeOnboardingPage.jsx';
import { RaSpikeStageGatePrepPage } from '../../pages/ra-spike/RaSpikeStageGatePrepPage.jsx';
import { RaSpikeCoachPage } from '../../pages/staff/RaSpikeCoachPage.jsx';
import { RaSpikeAdminPage } from '../../pages/staff/RaSpikeAdminPage.jsx';
import { canonicalRaSpikePathname, isRaSpikeStandaloneEntry } from './raSpikePath.js';

/** @param {{ children: import('react').ReactNode, label?: string }} props */
function LazyRoute({ children, label }) {
  return <Suspense fallback={<PageLoader label={label} />}>{children}</Suspense>;
}

const STAFF_ROLES = ['FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'];
const RA_SPIKE_APP = { raSpikeApp: true };

/**
 * Standalone RA-SPIKE™ portal — separate entry from SPIKE Internship (SpikeMasterPortal).
 */
export function RaSpikeApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = canonicalRaSpikePathname(location.pathname);

  const {
    token,
    user,
    loading: authLoading,
    usingSupabaseAuth,
    mockAuthEnabled,
    login,
    logout,
    logoutWithBackup,
    refreshUser,
    internCloudSyncing,
    internWorkStatus,
    completeBootstrapSetup,
  } = useAuth();

  const userRole = resolveUserRole(user);
  const readOnlyViewer = isReadOnlyViewerUser(user);
  const [viewAsRole, setViewAsRole] = useState(() => readViewAsRole());
  const effectiveUserRole = useMemo(
    () => getEffectiveUserRole(userRole, viewAsRole),
    [userRole, viewAsRole],
  );
  const portalAccessRole = useMemo(() => getPortalAccessRole(userRole), [userRole]);
  const moduleNavRole = useMemo(
    () => moduleNavRoleForUser(userRole, viewAsRole),
    [userRole, viewAsRole],
  );
  const isSuperuserSession = isSuperuserPortalSession(userRole);
  const internModuleUser = useMemo(
    () => buildSuperuserInternPreviewUser(user, userRole, viewAsRole, RA_SPIKE_APP),
    [user, userRole, viewAsRole],
  );
  const compactNav = useCompactNav();
  const STATIC_ONLY = import.meta.env.VITE_STATIC_ONLY === 'true';

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [interns, setInterns] = useState([]);
  const [setupLoadState, setSetupLoadState] = useState('loading');
  const [setupLoadError, setSetupLoadError] = useState('');
  const [setupMeta, setSetupMeta] = useState(null);
  const [staffBootstrapMode, setStaffBootstrapMode] = useState(false);
  const [bootstrapSecretRequired, setBootstrapSecretRequired] = useState(false);
  const [bootstrapApiConfigured, setBootstrapApiConfigured] = useState(true);

  const internProgramSlug = useMemo(() => {
    if (portalAccessRole !== 'intern' && !(isSuperuserSession && viewAsRole === 'intern')) {
      return null;
    }
    return resolveProgramSlug((internModuleUser ?? user)?.internProgress) ?? 'ra-spike';
  }, [portalAccessRole, isSuperuserSession, viewAsRole, internModuleUser, user]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  const showRaSpikeChrome =
    (effectiveUserRole === 'intern' || (isSuperuserSession && viewAsRole === 'intern'))
    && isRaSpikeProgram(internProgramSlug)
    && !authLoading;

  const showRaSpikeStaffChrome =
    userRole !== 'guest'
    && userRole !== 'profile_error'
    && !authLoading
    && !(isSuperuserSession && viewAsRole === 'intern')
    && (isStaffUiRole(userRole) || isStaffUiRole(effectiveUserRole));

  const loadInterns = useCallback(async () => {
    if (!STAFF_ROLES.includes(user?.role)) return;
    if (usingSupabaseAuth && supabase) {
      try {
        setInterns(await fetchInterns());
      } catch (e) {
        showToast(e.message || 'Failed to load rookies', 'info');
      }
    } else if (token) {
      try {
        setInterns(await apiFetch('/api/interns', { token }));
      } catch (e) {
        showToast(e.message || 'Failed to load rookies', 'info');
      }
    }
  }, [token, user?.role, usingSupabaseAuth, showToast]);

  const loadStaffBootstrapInfo = useCallback(async () => {
    if (!usingSupabaseAuth) {
      setStaffBootstrapMode(false);
      setBootstrapSecretRequired(false);
      setBootstrapApiConfigured(true);
      return;
    }
    try {
      const [needsBootstrap, apiStatus] = await Promise.all([
        needsStaffBootstrap(),
        fetchBootstrapSuperuserStatus(),
      ]);
      setStaffBootstrapMode(needsBootstrap);
      setBootstrapSecretRequired(Boolean(apiStatus.secretRequired));
      setBootstrapApiConfigured(apiStatus.configured !== false);
    } catch {
      setStaffBootstrapMode(false);
      setBootstrapSecretRequired(false);
      setBootstrapApiConfigured(true);
    }
  }, [usingSupabaseAuth]);

  const loadSetupInfo = useCallback(async () => {
    if (STATIC_ONLY || usingSupabaseAuth || mockAuthEnabled) {
      setSetupMeta({ needsBootstrap: false, secretRequired: false });
      setSetupLoadError('');
      setSetupLoadState('ok');
      return;
    }
    setSetupLoadState('loading');
    setSetupLoadError('');
    try {
      const data = await apiFetch('/api/auth/setup');
      setSetupMeta({
        needsBootstrap: data.needsBootstrap,
        secretRequired: data.secretRequired,
      });
      setSetupLoadState('ok');
    } catch (e) {
      setSetupLoadState('error');
      setSetupLoadError(e.message || 'Could not reach the API.');
      setSetupMeta(null);
    }
  }, [STATIC_ONLY, usingSupabaseAuth, mockAuthEnabled]);

  useEffect(() => {
    if (authLoading) return;
    if (userRole === 'guest' || userRole === 'profile_error') return;
    if (isRaSpikeStandaloneEntry(location.pathname)) {
      const programSlug = effectiveUserRole === 'intern' ? internProgramSlug : null;
      navigate(defaultRouteForRole(effectiveUserRole, programSlug, RA_SPIKE_APP), { replace: true });
    }
  }, [authLoading, userRole, effectiveUserRole, internProgramSlug, location.pathname, navigate]);

  useEffect(() => {
    if (userRole !== 'superuser' && viewAsRole) {
      setViewAsRole(null);
      writeViewAsRole(null);
    }
  }, [userRole, viewAsRole]);

  useEffect(() => {
    if (authLoading || effectiveUserRole !== 'intern' || !user?.id) return;
    if (userRole === 'superuser') return;
    if (!shouldUseSupabaseForUser(user)) return;
    if (!user.internProgress?.onboarding_complete) {
      void ensureRaSpikeOnboardingComplete(user.id, user.internProgress);
    }
    if (isRaSpikeOnboardingPath(path)) {
      navigate(ROUTES.raSpikeHome, { replace: true });
    }
  }, [authLoading, effectiveUserRole, userRole, user, path, navigate]);

  useEffect(() => {
    if (userRole !== 'guest' || authLoading) return;
    loadSetupInfo();
    loadStaffBootstrapInfo();
  }, [userRole, authLoading, loadSetupInfo, loadStaffBootstrapInfo]);

  useEffect(() => {
    if (user && STAFF_ROLES.includes(user.role)) {
      loadInterns();
    } else {
      setInterns([]);
    }
  }, [user, loadInterns]);

  const handleViewAs = useCallback(
    (role) => {
      const next = role === 'superuser' ? null : role;
      setViewAsRole(next);
      writeViewAsRole(next);
      navigate(defaultRouteForRole(next ?? 'superuser', null, RA_SPIKE_APP), { replace: true });
    },
    [navigate],
  );

  const handleLogout = useCallback(async () => {
    writeViewAsRole(null);
    const isIntern = user?.role === 'INTERN' || (isSuperuserSession && viewAsRole === 'intern');
    if (isIntern && user?.id) {
      await logoutWithBackup();
    } else {
      logout();
    }
    navigate(isRaSpikeStandaloneEntry('/') ? '/' : '/ra-spike/');
    showToast('Signed out.');
  }, [logout, logoutWithBackup, navigate, showToast, user?.id, user?.role, isSuperuserSession, viewAsRole]);

  const handleGuestLogin = useCallback(
    async (email, password) => {
      const signedIn = await login(email, password);
      const role = resolveUserRole(signedIn);
      const programSlug = resolveProgramSlug(signedIn?.internProgress);
      const target = defaultRouteForRole(
        role === 'guest' || role === 'profile_error' ? 'intern' : role,
        programSlug,
        RA_SPIKE_APP,
      );
      navigate(target);
      showToast('Signed in successfully.');
    },
    [login, navigate, showToast],
  );

  const handleRaSpikeSignup = useCallback(
    async ({ name, email, password, mobile, homeAgency, homeUnit }) => {
      if (mockAuthEnabled && !usingSupabaseAuth) {
        throw new Error('RA-SPIKE signup requires Supabase mode.');
      }
      try {
        await registerRaSpikeViaApi({ name, email, password, mobile, homeAgency, homeUnit });
      } catch (apiErr) {
        if (!isRaSpikeSignupApiUnavailable(apiErr)) {
          throw new Error(formatAuthEmailError(apiErr));
        }
        if (mockAuthEnabled) {
          throw new Error('RA-SPIKE signup API unavailable. Use ra-spike@example.com for demo login.');
        }
        throw apiErr;
      }
      const signedIn = await login(email, password);
      const programSlug = resolveProgramSlug(signedIn?.internProgress);
      navigate(defaultRouteForRole('intern', programSlug, RA_SPIKE_APP), { replace: true });
      showToast('Welcome to RA-SPIKE! Start with your Dream Board or squad registration.', 'success');
    },
    [login, mockAuthEnabled, navigate, showToast, usingSupabaseAuth],
  );

  const handleSupabaseBootstrap = useCallback(
    async (payload) => {
      if (!usingSupabaseAuth) {
        throw new Error('Supabase mode is required for superuser setup.');
      }
      const result = await bootstrapSuperuserAccount(payload);
      const signedIn = await login(payload.email, payload.password);
      const nextRole = resolveUserRole(signedIn);
      setStaffBootstrapMode(false);
      await loadStaffBootstrapInfo();
      navigate(
        defaultRouteForRole(
          nextRole === 'guest' || nextRole === 'profile_error' ? 'superuser' : nextRole,
          null,
          RA_SPIKE_APP,
        ),
      );
      showToast(
        result?.mode === 'repair'
          ? 'Superuser password updated. You are signed in.'
          : 'Superuser account created. You are signed in.',
        'success',
      );
    },
    [usingSupabaseAuth, login, navigate, showToast, loadStaffBootstrapInfo],
  );

  const handleStaffSignup = useCallback(
    async ({ name, email, password, role, code }) => {
      if (!usingSupabaseAuth || !supabase) {
        throw new Error('Signup is only available in Supabase mode.');
      }
      try {
        await registerStaffViaApi({ name, email, password, role, code });
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) {
          throw new Error('Account created. Sign in with your email and password.');
        }
        showToast('Staff account created. You are signed in.', 'success');
        return;
      } catch (apiErr) {
        if (!isStaffSignupApiUnavailable(apiErr)) {
          throw new Error(formatAuthEmailError(apiErr));
        }
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, must_change_password: true } },
      });
      if (error) throw new Error(formatAuthEmailError(error));
      if (!data.user?.id) {
        throw new Error('Could not create this account. The email may already be registered.');
      }
      const { error: roleErr } = await supabase.rpc('complete_staff_signup', {
        p_role: role,
        p_name: name,
        p_code: code || null,
      });
      if (roleErr) throw roleErr;
      showToast('Staff account created. You can now sign in.', 'success');
    },
    [usingSupabaseAuth, showToast],
  );

  const handleBootstrapComplete = useCallback(
    async (payload) => {
      await completeBootstrapSetup(payload);
      navigate(defaultRouteForRole('superuser', null, RA_SPIKE_APP));
      showToast('Administrator account created. You are signed in.');
      await loadSetupInfo();
    },
    [completeBootstrapSetup, navigate, showToast, loadSetupInfo],
  );

  const renderRookieRoutes = useCallback(
    (rookie) => {
      if (isInternshipOnlyInternPath(path)) {
        return <Navigate to={ROUTES.raSpikeHome} replace />;
      }
      if (path === ROUTES.raSpikeHome) {
        return <RaSpikeHomePage user={rookie} />;
      }
      if (path === ROUTES.raSpikePlaybook || path.startsWith(`${ROUTES.raSpikePlaybook}/`)) {
        return <RaSpikePlaybookPage user={rookie} />;
      }
      if (path === ROUTES.raSpikeSquad) {
        return <RaSpikeSquadPage user={rookie} />;
      }
      if (path === ROUTES.raSpikeProfile) {
        return <RaSpikeProfilePage user={rookie} />;
      }
      if (path === ROUTES.raSpikeOnboarding) {
        return <RaSpikeOnboardingPage user={rookie} />;
      }
      if (path === ROUTES.raSpikeStageGate) {
        const search = new URLSearchParams(location.search);
        const gateParam = Number(search.get('gate'));
        const gate = gateParam === 2 ? 2 : 1;
        const weekParam = Number(search.get('week'));
        const assignmentWeek = Number.isFinite(weekParam) && weekParam >= 1 && weekParam <= 8
          ? weekParam
          : undefined;
        return (
          <RaSpikeStageGatePrepPage user={rookie} gate={gate} assignmentWeek={assignmentWeek} />
        );
      }
      return <Navigate to={ROUTES.raSpikeHome} replace />;
    },
    [path, location.search],
  );

  const renderAuthenticatedModule = () => {
    const internUser = buildSuperuserInternPreviewUser(user, userRole, viewAsRole, RA_SPIKE_APP);
    const asIntern =
      (isSuperuserSession && viewAsRole === 'intern')
      || (effectiveUserRole === 'intern' && !isSuperuserSession);

    if (asIntern) {
      const programSlug = resolveProgramSlug(
        (internUser ?? user)?.internProgress ?? { program_slug: 'ra-spike' },
      );
      if (programSlug !== 'ra-spike' && !isSuperuserSession) {
        return (
          <div className="container mx-auto px-6 py-12 text-center text-gray-700">
            <p className="font-medium">This account is not enrolled in RA-SPIKE.</p>
            <p className="mt-2 text-sm text-slate-600">
              SPIKE Internship accounts use{' '}
              <a href={internshipEntryHref('intern')} className="font-semibold text-spike hover:underline">
                portal.1cma.online
              </a>
              .
            </p>
          </div>
        );
      }
      return renderRookieRoutes(internUser ?? user);
    }

    const coachRole =
      effectiveUserRole === 'mentor' || viewAsRole === 'mentor' ? 'mentor' : 'faculty';

    if (isRaSpikePlaybookPath(path) && isRaSpikeStaffPlaybookRole(effectiveUserRole)) {
      return <RaSpikePlaybookPage user={buildRaSpikeCoachPreviewUser(user)} />;
    }

    if (path === ROUTES.raSpikeAdmin || path.startsWith(`${ROUTES.raSpikeAdmin}/`)) {
      if (!isSuperuserSession && effectiveUserRole !== 'admin') {
        return <Navigate to={ROUTES.programCoachRaSpike} replace />;
      }
      return (
        <RaSpikeAdminPage
          user={user}
          readOnlyViewer={readOnlyViewer}
          showToast={showToast}
          onChanged={loadInterns}
        />
      );
    }

    return (
      <RaSpikeCoachPage
        role={coachRole}
        canManageCoaches={isSuperuserSession}
        interns={interns}
        showToast={showToast}
        onRefresh={loadInterns}
      />
    );
  };

  return (
    <div
      className={`spike-app-shell ${
        compactNav ? 'spike-app-shell--compact-nav' : 'spike-app-shell--desktop-nav'
      }${isSuperuserSession ? ' spike-app-shell--superuser-preview' : ''}${
        internCloudSyncing || internWorkStatus?.showBanner ? ' spike-app-shell--cloud-syncing' : ''
      }`}
    >
      <InternWorkStatusBanner />
      <PortalHeader
        userRole={userRole}
        viewAsRole={viewAsRole}
        user={user}
        setupMeta={setupMeta}
        onLogout={handleLogout}
        readOnlyViewer={readOnlyViewer}
        headerSubtitle={`RA-SPIKE™ · ${RA_SPIKE_PROGRAM.theme}`}
      />

      {readOnlyViewer ? <ReadOnlyViewerBar /> : null}

      {isSuperuserSession && !authLoading ? (
        <SuperuserPreviewBar viewAsRole={viewAsRole} onViewAs={handleViewAs} compact={compactNav} />
      ) : null}

      {userRole !== 'guest' && userRole !== 'profile_error' && !authLoading && (
        showRaSpikeChrome && !isRaSpikeOnboardingPath(path) ? (
          <RaSpikeNav />
        ) : showRaSpikeStaffChrome ? (
          <RaSpikeStaffNav
            userRole={moduleNavRole}
            showAdmin={isSuperuserSession || effectiveUserRole === 'admin'}
          />
        ) : null
      )}

      <main>
        {userRole === 'guest' && (
          STATIC_ONLY ? (
            <div className="container mx-auto px-6 py-12 text-center text-slate-600">
              <p className="font-medium">RA-SPIKE static preview is not configured.</p>
            </div>
          ) : authLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-600">
              <Loader2 className="animate-spin text-spike" size={40} />
              <p className="text-sm font-medium">Loading session…</p>
            </div>
          ) : (
            <LazyRoute label="Loading…">
              <WelcomePage
                usingSupabaseAuth={usingSupabaseAuth}
                mockAuthEnabled={mockAuthEnabled}
                setupLoadState={setupLoadState}
                setupLoadError={setupLoadError}
                setupMeta={setupMeta}
                onRetrySetup={() => loadSetupInfo()}
                onBootstrap={handleBootstrapComplete}
                onLogin={handleGuestLogin}
                onInternSignup={async () => {
                  throw new Error('Internship signup is on the main SPIKE portal.');
                }}
                onRaSpikeSignup={handleRaSpikeSignup}
                onStaffSignup={handleStaffSignup}
                staffBootstrapMode={staffBootstrapMode}
                bootstrapSecretRequired={bootstrapSecretRequired}
                bootstrapApiConfigured={bootstrapApiConfigured}
                onSupabaseBootstrap={handleSupabaseBootstrap}
                raSpikeApp
              />
            </LazyRoute>
          )
        )}

        {userRole === 'profile_error' && !authLoading && (
          <div className="container mx-auto max-w-lg px-6 py-16 text-center">
            <AlertCircle className="mx-auto mb-4 text-amber-600" size={48} />
            <h2 className="mb-2 text-xl font-bold text-gray-900">Signed in, but your profile did not load</h2>
            <p className="mb-6 text-sm text-gray-600">
              Your session is valid, but the portal could not read your role from the RA-SPIKE database.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  await refreshUser();
                  showToast('Profile refresh attempted.', 'info');
                }}
                className="rounded-lg bg-spike px-4 py-2 text-sm font-bold text-white transition hover:bg-spike/90"
              >
                Load profile again
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {(portalAccessRole === 'intern'
          || isStaffUiRole(portalAccessRole)
          || isSuperuserSession)
          && !authLoading && (
            <RoleRouteGuard
              userRole={portalAccessRole}
              pathname={path}
              programSlug={portalAccessRole === 'intern' ? internProgramSlug : null}
            >
              <LazyRoute label="Loading module…">{renderAuthenticatedModule()}</LazyRoute>
            </RoleRouteGuard>
          )}
      </main>

      {user?.mustChangePassword && !authLoading && userRole !== 'guest' && userRole !== 'profile_error' && (
        <ForcePasswordChangeGate
          usingSupabaseAuth={usingSupabaseAuth}
          token={token}
          email={user.email || ''}
          onDone={refreshUser}
          showToast={showToast}
        />
      )}

      {toast.show && (
        <div
          className={`animate-in slide-in-from-bottom-5 fade-in fixed left-4 right-4 z-[60] duration-300 sm:max-w-sm ${
            compactNav
              ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]'
              : 'bottom-6 sm:left-auto sm:right-6'
          }`}
        >
          <div
            className={`flex items-center gap-3 rounded-lg border px-5 py-3 shadow-lg ${
              toast.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={20} className="text-green-600" />
            ) : (
              <Info size={20} className="text-blue-600" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
