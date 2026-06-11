import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Settings,
  BarChart,
  CheckCircle,
  Clock,
  Briefcase,
  Download,
  AlertCircle,
  X,
  Info,
  Rocket,
  Presentation,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Bell,
} from 'lucide-react';
import { ModuleNav } from './components/nav/ModuleNav.jsx';
import { useCompactNav } from './hooks/useCompactNav.js';
import { PortalHeader } from './layouts/PortalHeader.jsx';
import { resolveUserRole } from './lib/roles.js';
import { RoleDashboardCards } from './components/dashboard/RoleDashboardCards.jsx';
import { BlueprintTimelineFeed } from './components/blueprint/BlueprintTimelineFeed.jsx';
import { PageLoader } from './components/ui/PageLoader.jsx';
import { RoleRouteGuard } from './components/routing/RoleRouteGuard.jsx';
import { ROUTES, defaultRouteForRole } from './routes/paths.js';
import {
  AdminCohortsPage,
  AdminFacultyPlaybookPage,
  AdminMentorPlaybookPage,
  AdminPage,
  AdminSquadsPage,
  AdminSquadThemesPage,
  ContentStudioPage,
  CohortIdentityAnalyticsPage,
  CohortIdentityPage,
  FacultyDayFrameworkPage,
  FacultyHomePage,
  FacultyPlaybookPage,
  MentorDayFrameworkPage,
  MentorHomePage,
  MentorParticipantsPage,
  MentorPlaybookPage,
  MentorVentureCoachPage,
  PlaybookShell,
  PortfolioPage,
  ProgressReportsPage,
  ResearchPage,
  SquadCharterPage,
  SquadDashboardPage,
  SquadPreferencesPage,
  StaffDashboardPage,
  VentureBlueprintShell,
  WelcomePage,
  MyVenturePortfolioRoute,
  PublicPortfolioPage,
  PortfolioSettingsPage,
} from './routes/lazyPages.js';
import { useAuth } from './AuthContext.jsx';
import { apiFetch } from './apiClient.js';
import {
  createTractionLog,
  fetchInterns,
  fetchMyTractionLogs,
  fetchPendingTractionLogs,
  updateInternProgress,
} from './lib/supabase/index.js';
import { supabase } from './supabaseClient.js';
import { fullSyllabusData } from './fullSyllabusData.js';
import { orientationSlides } from './orientationSlideContents.jsx';
import { AdminRegisterForm } from './components/AdminRegisterForm.jsx';
import { isMockUser, shouldUseSupabaseForUser } from './lib/mockAuth.js';
import { ForcePasswordChangeGate } from './components/ForcePasswordChangeGate.jsx';

/** @param {{ children: import('react').ReactNode, label?: string }} props */
function LazyRoute({ children, label }) {
  return <Suspense fallback={<PageLoader label={label} />}>{children}</Suspense>;
}

const SpikeMasterPortal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token,
    user,
    loading: authLoading,
    usingSupabaseAuth,
    mockAuthEnabled,
    login,
    logout,
    refreshUser,
    completeBootstrapSetup,
  } = useAuth();
  const userRole = resolveUserRole(user);
  const userIsMock = isMockUser(user);
  const compactNav = useCompactNav();
  const STATIC_ONLY = import.meta.env.VITE_STATIC_ONLY === 'true';
  const [publicTab, setPublicTab] = useState('orientation');
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success',
  });
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [editData, setEditData] = useState(null);

  const [interns, setInterns] = useState([]);
  const [internsLoading, setInternsLoading] = useState(false);
  const [pendingLogs, setPendingLogs] = useState([]);
  const [myLogs, setMyLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [setupLoadState, setSetupLoadState] = useState('loading');
  const [setupLoadError, setSetupLoadError] = useState('');
  const [setupMeta, setSetupMeta] = useState(null);
  const [activationCode, setActivationCode] = useState(null);
  const [activationCodeLoading, setActivationCodeLoading] = useState(false);
  const [activationCodeGenerating, setActivationCodeGenerating] = useState(false);
  const [passwordResetRequests, setPasswordResetRequests] = useState([]);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: '', type: 'success' }),
      3000,
    );
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (userRole === 'guest' || userRole === 'profile_error') return;
    if (location.pathname === ROUTES.home) {
      navigate(defaultRouteForRole(userRole), { replace: true });
    }
  }, [authLoading, userRole, location.pathname, navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate(ROUTES.home);
    showToast('Signed out.');
  }, [logout, navigate, showToast]);

  const getTodayKey = () => new Date().toISOString().slice(0, 10);
  const generateActivationCode = () =>
    Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

  const loadActivationCode = useCallback(async () => {
    if (!usingSupabaseAuth || user?.role !== 'ADMIN' || !supabase) return;
    setActivationCodeLoading(true);
    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .select('date_key, code, expires_at, generated_at')
        .eq('date_key', getTodayKey())
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setActivationCode(data || null);
    } catch (e) {
      showToast(e.message || 'Failed to load activation code', 'info');
    } finally {
      setActivationCodeLoading(false);
    }
  }, [showToast, usingSupabaseAuth, user?.role]);

  const loadPasswordResetRequests = useCallback(async () => {
    if (!usingSupabaseAuth || user?.role !== 'ADMIN' || !supabase) return;
    setPasswordResetLoading(true);
    try {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('id, email, note, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPasswordResetRequests(data || []);
    } catch (e) {
      showToast(e.message || 'Failed to load password help requests', 'info');
    } finally {
      setPasswordResetLoading(false);
    }
  }, [showToast, usingSupabaseAuth, user?.role]);

  const submitPasswordResetRequest = useCallback(
    async (requestEmail, note) => {
      if (!usingSupabaseAuth || !supabase) {
        throw new Error('Password help requests require Supabase.');
      }
      const { error } = await supabase.from('password_reset_requests').insert({
        email: requestEmail.trim().toLowerCase(),
        note: (note || '').trim() || null,
      });
      if (error) throw error;
    },
    [usingSupabaseAuth],
  );

  const requestPasswordHelpForGuest = useCallback(
    async (em, note) => {
      await submitPasswordResetRequest(em, note);
      showToast('Administrators will see your request on their dashboard.', 'success');
    },
    [submitPasswordResetRequest, showToast],
  );

  const resolvePasswordResetRequest = useCallback(
    async (id) => {
      if (!usingSupabaseAuth || !supabase) return;
      try {
        const { error } = await supabase
          .from('password_reset_requests')
          .update({ status: 'resolved' })
          .eq('id', id);
        if (error) throw error;
        await loadPasswordResetRequests();
        showToast('Request marked resolved.');
      } catch (e) {
        showToast(e.message || 'Could not update request', 'info');
      }
    },
    [usingSupabaseAuth, loadPasswordResetRequests, showToast],
  );

  const loadInterns = useCallback(async () => {
    if (!['FACULTY', 'MENTOR', 'ADMIN'].includes(user?.role)) return;

    if (usingSupabaseAuth && supabase) {
      setInternsLoading(true);
      try {
        setInterns(await fetchInterns());
      } catch (e) {
        showToast(e.message || 'Failed to load interns', 'info');
      } finally {
        setInternsLoading(false);
      }
      return;
    }

    if (!token) return;
    setInternsLoading(true);
    try {
      const rows = await apiFetch('/api/interns', { token });
      setInterns(rows);
    } catch (e) {
      showToast(e.message || 'Failed to load interns', 'info');
    } finally {
      setInternsLoading(false);
    }
  }, [token, user?.role, usingSupabaseAuth, showToast]);

  const loadPendingLogs = useCallback(async () => {
    if (!['FACULTY', 'MENTOR', 'ADMIN'].includes(user?.role)) return;

    if (usingSupabaseAuth && supabase) {
      try {
        setPendingLogs(await fetchPendingTractionLogs());
      } catch (e) {
        showToast(e.message || 'Failed to load pending logs', 'info');
      }
      return;
    }

    if (!token) return;
    try {
      const rows = await apiFetch('/api/traction-logs/pending', { token });
      setPendingLogs(rows);
    } catch (e) {
      showToast(e.message || 'Failed to load pending logs', 'info');
    }
  }, [token, user?.role, usingSupabaseAuth, showToast]);

  const loadMyLogs = useCallback(async () => {
    if (user?.role !== 'INTERN') return;

    if (userIsMock) {
      setMyLogs([]);
      return;
    }

    if (usingSupabaseAuth && supabase && user?.id) {
      try {
        setMyLogs(await fetchMyTractionLogs(user.id));
      } catch {
        setMyLogs([]);
      }
      return;
    }

    if (!token) return;
    try {
      const rows = await apiFetch('/api/traction-logs/my', { token });
      setMyLogs(rows);
    } catch {
      setMyLogs([]);
    }
  }, [token, user, userIsMock, usingSupabaseAuth]);

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
      const message = e.message || 'Could not reach the API.';
      setSetupLoadError(
        message === 'Bad Gateway'
          ? 'API server is not running. Start it with `cd api && npm run dev`, or add Supabase keys to `.env`, or use demo sign-in (mock auth).'
          : message,
      );
      setSetupMeta(null);
    }
  }, [STATIC_ONLY, usingSupabaseAuth, mockAuthEnabled]);

  useEffect(() => {
    if (userRole !== 'guest' || authLoading) return;
    loadSetupInfo();
  }, [userRole, authLoading, loadSetupInfo]);

  useEffect(() => {
    if (user && ['FACULTY', 'MENTOR', 'ADMIN'].includes(user.role)) {
      loadInterns();
    } else {
      setInterns([]);
    }
  }, [user, loadInterns]);

  useEffect(() => {
    if (user?.role === 'INTERN') {
      loadMyLogs();
    } else {
      setMyLogs([]);
    }
  }, [user?.role, userIsMock, loadMyLogs]);

  useEffect(() => {
    if (user && ['FACULTY', 'MENTOR', 'ADMIN'].includes(user.role)) {
      loadPendingLogs();
    } else {
      setPendingLogs([]);
    }
  }, [user, loadPendingLogs]);

  useEffect(() => {
    if (user?.role === 'ADMIN' && usingSupabaseAuth) {
      loadActivationCode();
      loadPasswordResetRequests();
    } else {
      setActivationCode(null);
      setPasswordResetRequests([]);
    }
  }, [user?.role, usingSupabaseAuth, loadActivationCode, loadPasswordResetRequests]);

  const internSummary = useMemo(() => {
    const list = interns;
    const n = list.length;
    const s1 = list.filter((i) => i.segment === 1).length;
    const s2 = list.filter((i) => i.segment === 2).length;
    const s3 = list.filter((i) => i.segment === 3).length;
    const avgHours = n
      ? Math.round(list.reduce((a, i) => a + (i.hours || 0), 0) / n)
      : 0;
    return { n, s1, s2, s3, avgHours };
  }, [interns]);

  const OrientationModule = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    return (
      <div className="mx-auto flex w-full max-w-projection flex-col items-center px-4 py-6 sm:px-6 sm:py-8 lg:py-10 2xl:py-12">
        <div className="flex min-h-[min(560px,72dvh)] max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:min-h-[600px] lg:max-w-5xl 2xl:max-w-projection 2xl:min-h-[640px] 2xl:shadow-projection">
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 lg:px-8 2xl:px-10">
            <div className="flex items-center gap-2">
              <Presentation className="text-[#8B0000]" size={20} />
              <span className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Incubator Orientation
              </span>
            </div>
            <div className="text-sm font-bold text-gray-500">
              Slide {currentSlide + 1} of {orientationSlides.length}
            </div>
          </div>

          <div className="h-1 w-full bg-gray-200">
            <div
              className="h-1 bg-[#8B0000] transition-all duration-500 ease-out"
              style={{
                width: `${((currentSlide + 1) / orientationSlides.length) * 100}%`,
              }}
            />
          </div>

          <div
            className="animate-in zoom-in-95 fade-in flex-grow overflow-y-auto p-6 duration-300 md:p-10 lg:p-12 2xl:p-16"
            key={currentSlide}
          >
            <div className="mx-auto my-auto w-full max-w-3xl lg:max-w-4xl 2xl:max-w-projection">
              <div className="mb-8 text-center lg:mb-10 2xl:mb-12">
                <div className="flex justify-center [&_svg]:h-8 [&_svg]:w-8 lg:[&_svg]:h-10 lg:[&_svg]:w-10 2xl:[&_svg]:h-12 2xl:[&_svg]:w-12">
                  {orientationSlides[currentSlide].icon}
                </div>
                <h2 className="mb-3 text-2xl font-semibold text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl 2xl:text-display-xl">
                  {orientationSlides[currentSlide].title}
                </h2>
                <p className="text-base italic text-slate-500 sm:text-lg lg:text-xl 2xl:text-2xl">
                  {orientationSlides[currentSlide].subtitle}
                </p>
              </div>
              {orientationSlides[currentSlide].content}
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-3 border-t border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between md:p-6">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-bold transition-all sm:px-6 sm:py-3 ${
                currentSlide === 0
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-100'
              }`}
            >
              <ArrowLeft size={18} /> Previous
            </button>

            {currentSlide < orientationSlides.length - 1 ? (
              <button
                onClick={() =>
                  setCurrentSlide(
                    Math.min(orientationSlides.length - 1, currentSlide + 1),
                  )
                }
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#8B0000] px-4 py-2.5 font-bold text-white shadow-md transition-all hover:bg-red-900 sm:px-6 sm:py-3 sm:hover:pr-4"
              >
                Next <ArrowRight size={18} className="ml-1" />
              </button>
            ) : (
              <button
                onClick={() => {
                  showToast('Orientation Completed!', 'success');
                  navigate(ROUTES.dashboard);
                }}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 font-bold text-white shadow-md transition-all hover:bg-green-800 sm:px-6 sm:py-3"
              >
                <CheckCircle size={18} /> Finish Orientation
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleOpenModal = (intern) => {
    setSelectedIntern(intern);
    setEditData({ ...intern });
  };

  const handleCloseModal = () => {
    setSelectedIntern(null);
    setEditData(null);
  };

  const handleSaveChanges = async () => {
    if (!editData) return;
    try {
      if (usingSupabaseAuth && supabase) {
        await updateInternProgress(editData.id, {
          segment: editData.segment,
          hours: editData.hours,
          licensed: editData.licensed,
        });
      } else {
        if (!token) return;
        await apiFetch(`/api/interns/${editData.id}/progress`, {
          token,
          method: 'PATCH',
          body: {
            segment: editData.segment,
            hours: editData.hours,
            licensed: editData.licensed,
          },
        });
      }
      await loadInterns();
      handleCloseModal();
      showToast('Intern details updated successfully!');
    } catch (e) {
      showToast(e.message || 'Update failed', 'info');
    }
  };

  const handleGuestLogin = useCallback(
    async (email, password) => {
      const signedIn = await login(email, password);
      const role = resolveUserRole(signedIn);
      navigate(
        defaultRouteForRole(
          role === 'guest' || role === 'profile_error' ? 'intern' : role,
        ),
      );
      showToast('Signed in successfully.');
    },
    [login, navigate, showToast],
  );

  const handleInternSignup = useCallback(
    async ({ name, email, password, university, squad, code }) => {
      if (!usingSupabaseAuth || !supabase) {
        throw new Error('Signup is only available in Supabase mode.');
      }
      const todayKey = getTodayKey();
      const { data: codeRow, error: codeError } = await supabase
        .from('activation_codes')
        .select('code, expires_at')
        .eq('date_key', todayKey)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (codeError) throw codeError;
      if (!codeRow) throw new Error('No activation code is available for today.');
      if (new Date(codeRow.expires_at).getTime() < Date.now()) {
        throw new Error('Activation code has expired. Ask an admin for a new code.');
      }
      if (String(codeRow.code).toUpperCase() !== code.toUpperCase()) {
        throw new Error('Invalid activation code.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, must_change_password: false } },
      });
      if (error) throw error;

      if (data.user?.id) {
        await supabase
          .from('profiles')
          .update({ name, role: 'INTERN' })
          .eq('id', data.user.id);
        await supabase.from('intern_progress').upsert(
          {
            user_id: data.user.id,
            segment: 1,
            hours: 0,
            licensed: false,
            university: university || null,
            squad: squad || null,
          },
          { onConflict: 'user_id' },
        );
      }

      showToast('Account created. You can now sign in.', 'success');
    },
    [usingSupabaseAuth, showToast],
  );

  const handleGenerateActivationCode = useCallback(async () => {
    if (!usingSupabaseAuth || user?.role !== 'ADMIN' || !supabase) return;
    setActivationCodeGenerating(true);
    try {
      const todayKey = getTodayKey();
      const nextCode = generateActivationCode();
      const expiry = new Date();
      expiry.setHours(23, 59, 59, 999);
      const payload = {
        date_key: todayKey,
        code: nextCode,
        expires_at: expiry.toISOString(),
        generated_by: user.id,
      };
      const { data, error } = await supabase
        .from('activation_codes')
        .upsert(payload, { onConflict: 'date_key' })
        .select('date_key, code, expires_at, generated_at')
        .single();
      if (error) throw error;
      setActivationCode(data || null);
      showToast(`Activation code generated: ${nextCode}`, 'success');
    } catch (err) {
      showToast(
        err.message ||
          'Failed to generate activation code. Ensure activation_codes table exists in Supabase.',
        'info',
      );
    } finally {
      setActivationCodeGenerating(false);
    }
  }, [usingSupabaseAuth, user, showToast]);

  const handleBootstrapComplete = useCallback(
    async (payload) => {
      await completeBootstrapSetup(payload);
      navigate(ROUTES.dashboard);
      showToast('Administrator account created. You are signed in.');
      await loadSetupInfo();
    },
    [completeBootstrapSetup, navigate, showToast, loadSetupInfo],
  );

  const handleAdminRegister = useCallback(
    async (body) => {
      try {
        if (usingSupabaseAuth) {
          if (!supabase) throw new Error('Supabase is not configured.');
          if (user?.role !== 'ADMIN') {
            throw new Error('Only administrators can create accounts.');
          }

          const { data: sessionData } = await supabase.auth.getSession();
          const adminSession = sessionData.session;
          if (!adminSession?.user?.id) {
            throw new Error('Your session expired. Sign in again.');
          }
          const adminId = adminSession.user.id;

          const { data: signData, error: signErr } = await supabase.auth.signUp({
            email: body.email.trim(),
            password: body.password,
            options: { data: { name: body.name.trim(), must_change_password: true } },
          });
          if (signErr) throw signErr;

          const newUser = signData.user;
          if (!newUser?.id) {
            throw new Error(
              'Could not create this user. The email may already be registered.',
            );
          }
          if (!newUser.identities?.length) {
            throw new Error(
              'This email is already registered in Supabase. Use a different address or manage the user in the Supabase Auth dashboard.',
            );
          }

          if (signData.session && signData.session.user.id !== adminId) {
            throw new Error(
              'This project auto-confirms new sign-ups, which would log you in as the new user. In Supabase: Authentication → Providers → Email → enable "Confirm email", then try again (or create users in the Supabase Auth dashboard).',
            );
          }

          const { error: profileErr } = await supabase
            .from('profiles')
            .update({
              name: body.name.trim(),
              role: body.role,
            })
            .eq('id', newUser.id);
          if (profileErr) throw profileErr;

          if (body.role === 'INTERN') {
            const { error: progErr } = await supabase.from('intern_progress').upsert(
              {
                user_id: newUser.id,
                segment: 1,
                hours: 0,
                licensed: false,
                university: body.university ?? null,
                squad: body.squad ?? null,
              },
              { onConflict: 'user_id' },
            );
            if (progErr) throw progErr;
          }

          const createdMsg =
            body.role === 'ADMIN'
              ? 'Added another administrator. They sign in with this email and the password you set (confirm email in Supabase first, if your project requires it).'
              : 'Account created. They sign in with this email and the password you set (confirm email in Supabase first, if your project requires it).';
          showToast(createdMsg);
          await loadInterns();
          try {
            await refreshUser();
          } catch {
            /* session still valid; profile can load on next navigation */
          }
          return;
        }

        if (!token) throw new Error('Not signed in');
        await apiFetch('/api/auth/register', {
          token,
          method: 'POST',
          body,
        });
        showToast(
          body.role === 'ADMIN'
            ? 'Added another administrator. They can sign in with this email and the password you set.'
            : 'User created.',
        );
        await loadInterns();
      } catch (err) {
        showToast(err.message || 'Registration failed', 'info');
        throw err;
      }
    },
    [token, usingSupabaseAuth, user, showToast, loadInterns, refreshUser],
  );

  const MasterSyllabusView = () => (
    <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 border-b pb-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl">
            <Rocket className="text-[#8B0000]" size={28} />
            S.P.I.K.E. Master Syllabus
          </h2>
          <p className="mt-1 text-gray-600">
            Official 600-Hour blueprint: From Core Internship to Next Gen
            Partner.
          </p>
        </div>
        <button
          onClick={() => showToast('Generating PDF blueprint...', 'info')}
          className="hidden items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 md:flex"
        >
          <Download size={16} /> Export Blueprint
        </button>
      </div>

      <div className="mb-8 rounded-xl border border-red-100 bg-red-50 p-6">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[#8B0000]">
          <Users size={20} /> Program group dynamics
        </h3>
        <p className="mb-2 text-sm text-gray-700">
          Interns rotate through three strategic formats:
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
          <li>
            <strong>Research Squads:</strong> Market surveys, demographic profiling, collaborative
            problem solving.
          </li>
          <li>
            <strong>Advisory Dyads:</strong> Roleplaying, mock client meetings, peer-to-peer pitch
            refinement.
          </li>
          <li>
            <strong>Agency Teams:</strong> Business planning and franchise simulation
            (Educate-Expand-Empower).
          </li>
        </ul>
      </div>

      <div className="space-y-10">
        {fullSyllabusData.map((stage, idx) => (
          <div key={idx}>
            <h3 className="rounded-t-xl border-b-4 border-[#8B0000] bg-gray-200 p-4 text-xl font-black text-gray-900 md:text-2xl">
              {stage.segment}
            </h3>
            <div className="space-y-8 rounded-b-xl border border-gray-200 bg-white p-6 shadow-sm">
              {stage.modules.map((module, mIdx) => (
                <div
                  key={mIdx}
                  className="border-b border-gray-100 pb-6 last:border-0 last:pb-0"
                >
                  <h4 className="mb-2 text-lg font-bold text-[#8B0000]">
                    {module.title}
                  </h4>
                  <p className="mb-4 border-l-4 border-red-200 py-1 pl-3 text-sm italic text-gray-600">
                    <strong>Milestone Objective:</strong> {module.objective}
                  </p>
                  <div className="space-y-3">
                    {module.tasks.map((task, tIdx) => (
                      <div
                        key={tIdx}
                        className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                      >
                        <h5 className="mb-1 text-sm font-bold text-gray-800">
                          {task.name}
                        </h5>
                        <p className="text-sm leading-relaxed text-gray-600">
                          {task.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const InternDashboard = () => {
    const p = user?.internProgress;
    const hours = p?.hours ?? 0;
    const segment = p?.segment ?? 1;
    const licensed = p?.licensed ?? false;

    return (
    <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <RoleDashboardCards role="intern" user={user} interns={interns} internSummary={internSummary} />
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-lg font-bold text-gray-900">Activity timeline</h3>
        <BlueprintTimelineFeed participantId={user?.id} limit={6} />
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
      <div className="space-y-6 lg:w-1/3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
            <BarChart size={20} className="text-[#8B0000]" /> Your 600-Hour
            Journey
          </h3>
          <div className="mb-1 text-4xl font-black text-[#8B0000]">
            {hours}{' '}
            <span className="text-lg font-medium text-gray-500">/ 600 hrs</span>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            You are currently in{' '}
            <span className="font-bold">Segment {segment}</span>.
          </p>
          <div className="h-2.5 w-full rounded-full bg-gray-200">
            <div
              className="h-2.5 rounded-full bg-[#8B0000]"
              style={{ width: `${Math.min((hours / 600) * 100, 100)}%` }}
            />
          </div>
          {!licensed && hours < 110 && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <AlertCircle size={16} className="mt-0.5 text-yellow-600" />
              <p className="text-xs font-medium text-yellow-800">
                Licensure exam target is approaching at hour 110. Ensure mock
                exams are completed.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
            <Clock size={20} className="text-[#8B0000]" /> Log traction hours
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Submit completed field or task hours for Advisory Board verification.
          </p>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const task = form.task.value;
              const hoursVal = Number.parseInt(form.hours.value, 10);
              if (!task || !hoursVal) return;
              try {
                if (usingSupabaseAuth && supabase && shouldUseSupabaseForUser(user)) {
                  await createTractionLog({
                    userId: user.id,
                    task,
                    hours: hoursVal,
                  });
                } else if (isMockUser(user)) {
                  showToast('Demo mode: traction logs are not saved to Supabase.', 'info');
                } else {
                  if (!token) return;
                  await apiFetch('/api/traction-logs', {
                    token,
                    method: 'POST',
                    body: { task, hours: hoursVal },
                  });
                }
                form.reset();
                await refreshUser();
                await loadMyLogs();
                showToast('Submitted for Board approval.');
              } catch (err) {
                showToast(err.message || 'Submit failed', 'info');
              }
            }}
          >
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                Completed milestone
              </label>
              <select
                name="task"
                required
                className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
              >
                <option value="">-- Select task --</option>
                <optgroup label="Segment 1: SPIKE Core">
                  <option value="Task 4.1: Insurance Code & Ethics">
                    Task 4.1: Insurance Code & Ethics
                  </option>
                  <option value="Task 6.4: Proof of Concept Pitch Prep">
                    Task 6.4: Proof of Concept Pitch Prep
                  </option>
                </optgroup>
                <optgroup label="Segment 2: AIA LMS">
                  <option value="LMS Module 1: Prospecting">LMS Module 1: Prospecting</option>
                  <option value="Task 11.4: Market Validation Review">
                    Task 11.4: Market Validation Review
                  </option>
                </optgroup>
                <optgroup label="Segment 3: NADS">
                  <option value="NADS: Daily Activity Tracking">NADS: Daily Activity Tracking</option>
                  <option value="Task 13.3: Partnership Board Pitch">
                    Task 13.3: Partnership Board Pitch
                  </option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                Hours (1–24)
              </label>
              <input
                name="hours"
                type="number"
                min={1}
                max={24}
                required
                className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
                placeholder="e.g. 4"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#8B0000] py-2 text-sm font-bold text-white transition hover:bg-red-900"
            >
              Submit to Board
            </button>
          </form>

          {myLogs.filter((l) => l.status === 'PENDING').length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                Pending approval
              </p>
              <ul className="space-y-2">
                {myLogs
                  .filter((l) => l.status === 'PENDING')
                  .map((log) => (
                    <li
                      key={log.id}
                      className="flex justify-between rounded border border-yellow-100 bg-yellow-50 p-2 text-sm text-gray-700"
                    >
                      <span className="truncate pr-2">{log.task}</span>
                      <span className="whitespace-nowrap font-bold text-yellow-800">
                        {log.hours} hrs
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="lg:w-2/3">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Intern Dashboard</h2>
        <p className="mb-6 text-sm text-gray-600">
          Signed in as <span className="font-semibold">{user?.email}</span>.
        </p>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-red-600">
              Target market
            </div>
            <div className="font-bold text-gray-900">Gen Z / Millennials</div>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600">
              Next milestone
            </div>
            <div className="font-bold text-gray-900">Proof of Concept Pitch</div>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-green-600">
              End goal
            </div>
            <div className="font-bold text-gray-900">Partnership Agreement</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-bold">Current module focus</h3>
            <span className="w-fit rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-[#8B0000]">
              In progress
            </span>
          </div>
          {segment === 1 ? (
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex flex-col gap-1 rounded border bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span>Module 4: Regulatory Compliance</span>
                <span className="font-bold text-green-600">Done</span>
              </li>
              <li className="flex flex-col gap-1 rounded border border-[#8B0000] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-bold text-[#8B0000]">
                  Module 5: AIA Product Solutions & Sales
                </span>
                <span className="text-gray-500">Ongoing</span>
              </li>
              <li className="flex flex-col gap-1 rounded border p-3 text-gray-400 sm:flex-row sm:items-center sm:justify-between">
                <span>Module 6: Insurance Entrepreneurship</span>
                <span>Locked</span>
              </li>
            </ul>
          ) : (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              You are in <strong>Segment {segment}</strong>. See the Master Blueprint for detailed
              module tracking.
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
    );
  };

  const adminPage = useMemo(
    () => (
      <AdminPage
        usersPanel={
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users className="text-[#8B0000]" size={22} />
              <h3 className="text-lg font-bold text-gray-900">Create user account</h3>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Add another person to the portal (intern, faculty, mentor, or administrator). Interns
              receive a progress record automatically.
              {usingSupabaseAuth && (
                <> With Supabase email confirmation enabled, they must confirm before first sign-in.</>
              )}
            </p>
            <AdminRegisterForm onRegister={handleAdminRegister} />
            {usingSupabaseAuth && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                    Intern activation code
                  </h4>
                  <button
                    type="button"
                    onClick={handleGenerateActivationCode}
                    disabled={activationCodeGenerating}
                    className="min-h-[44px] rounded-lg bg-gray-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-gray-800 disabled:opacity-60"
                  >
                    {activationCodeGenerating ? 'Generating…' : 'Generate today code'}
                  </button>
                </div>
                {activationCodeLoading ? (
                  <p className="text-sm text-gray-500">Loading activation code…</p>
                ) : activationCode ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Current code</p>
                    <p className="text-2xl font-black tracking-widest text-[#8B0000]">
                      {activationCode.code}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Expires: {new Date(activationCode.expires_at).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No code generated yet. Click “Generate today code”.
                  </p>
                )}
              </div>
            )}
          </div>
        }
        settingsPanel={
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <Settings size={40} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-700">System configuration</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Production settings live in Supabase and Cloudflare Pages environment variables.
            </p>
            <button
              type="button"
              onClick={() => showToast('Loading system configuration settings...', 'info')}
              className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              Open settings
            </button>
          </div>
        }
        passwordHelpPanel={
          usingSupabaseAuth ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Bell className="text-[#8B0000]" size={22} />
                <h3 className="text-lg font-bold text-gray-900">Password help requests</h3>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Forgot-password requests from the sign-in page. Reset in Supabase Auth, share offline,
                set <code className="rounded bg-gray-100 px-1">must_change_password</code> when needed,
                then mark resolved.
              </p>
              {passwordResetLoading ? (
                <p className="text-sm text-gray-500">Loading requests…</p>
              ) : passwordResetRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No pending requests.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                  {passwordResetRequests.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{row.email}</p>
                        {row.note ? (
                          <p className="text-sm text-gray-600">{row.note}</p>
                        ) : (
                          <p className="text-xs text-gray-400">No note</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(row.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => resolvePasswordResetRequest(row.id)}
                        className="min-h-[44px] shrink-0 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-800 transition hover:bg-gray-50"
                      >
                        Mark resolved
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => loadPasswordResetRequests()}
                className="mt-3 min-h-[44px] text-sm font-bold text-[#8B0000] underline"
              >
                Refresh list
              </button>
            </div>
          ) : null
        }
      />
    ),
    [
      handleAdminRegister,
      usingSupabaseAuth,
      activationCode,
      activationCodeLoading,
      activationCodeGenerating,
      handleGenerateActivationCode,
      showToast,
      passwordResetRequests,
      passwordResetLoading,
      loadPasswordResetRequests,
      resolvePasswordResetRequest,
    ],
  );

  const renderPlaybook = () => (
    <LazyRoute label="Loading playbook…">
      <PlaybookShell
        orientationView={<OrientationModule />}
        syllabusView={<MasterSyllabusView />}
        participantId={user?.id}
        userRole={userRole}
        interns={interns}
      />
    </LazyRoute>
  );

  const AdminDashboardHome = () => (
    <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <RoleDashboardCards role="admin" user={user} interns={interns} internSummary={internSummary} />
      <h2 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">Program overview</h2>
      <p className="mb-6 max-w-2xl text-sm text-gray-600">
        Use the Admin module for user accounts, activation codes, and password help requests.
      </p>
      <Link
        to={ROUTES.admin}
        className="inline-flex min-h-[44px] items-center rounded-lg bg-[#8B0000] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-900"
      >
        Open admin console
      </Link>
    </div>
  );

  const renderStaffDashboard = () => {
    if (userRole === 'faculty' || userRole === 'mentor') {
      return (
        <LazyRoute label="Loading dashboard…">
          <StaffDashboardPage
            userRole={userRole}
            user={user}
            interns={interns}
            internSummary={internSummary}
            pendingLogs={pendingLogs}
            token={token}
            usingSupabaseAuth={usingSupabaseAuth}
            showToast={showToast}
            onLoadInterns={loadInterns}
            onLoadPendingLogs={loadPendingLogs}
          />
        </LazyRoute>
      );
    }
    if (userRole === 'admin') return <AdminDashboardHome />;
    return null;
  };

  const renderAuthenticatedModule = () => {
    const path = location.pathname;

    if (path.startsWith(`${ROUTES.portfolio}/`) && path !== ROUTES.portfolio) {
      return (
        <LazyRoute label="Loading portfolio…">
          <PublicPortfolioPage />
        </LazyRoute>
      );
    }

    if (userRole === 'intern') {
      if (path === ROUTES.cohortIdentity) {
        return <CohortIdentityPage participantId={user.id} />;
      }
      if (path === ROUTES.squadPreferences) {
        return <SquadPreferencesPage participantId={user.id} />;
      }
      if (path === ROUTES.squad) {
        return (
          <SquadDashboardPage
            participantId={user.id}
            participantName={user.name || user.email || 'Participant'}
          />
        );
      }
      if (path === ROUTES.squadCharter) {
        return (
          <SquadCharterPage
            participantId={user.id}
            participantName={user.name || user.email || 'Participant'}
          />
        );
      }
      if (
        path === ROUTES.ventureBlueprint
        || path.startsWith(`${ROUTES.ventureBlueprint}/`)
      ) {
        if (!user?.internProgress) {
          return (
            <div className="container mx-auto px-6 py-12 text-center text-gray-700">
              <p className="font-medium">
                Your account has no intern progress record. Contact an administrator.
              </p>
            </div>
          );
        }
        return (
          <VentureBlueprintShell
            user={user}
            onLogTraction={() => navigate(ROUTES.dashboard)}
            onProgressRefresh={() => refreshUser()}
          />
        );
      }
      if (
        path === ROUTES.myVenturePortfolio
        || path.startsWith(`${ROUTES.myVenturePortfolio}/`)
      ) {
        return (
          <LazyRoute label="Loading portfolio…">
            <MyVenturePortfolioRoute user={user} />
          </LazyRoute>
        );
      }
      if (path === ROUTES.playbook) return renderPlaybook();
      if (path === ROUTES.portfolio) {
        return <Navigate to={ROUTES.myVenturePortfolio} replace />;
      }
      if (path === ROUTES.research) return <ResearchPage user={user} />;
      if (path === ROUTES.dashboard && user?.internProgress) return <InternDashboard />;
      if (user?.internProgress) {
        return <Navigate to={defaultRouteForRole('intern')} replace />;
      }
      return (
        <div className="container mx-auto px-6 py-12 text-center text-gray-700">
          <p className="font-medium">
            Your account has no intern progress record. Contact an administrator.
          </p>
        </div>
      );
    }

    if (['faculty', 'mentor', 'admin'].includes(userRole)) {
      if (path === ROUTES.playbook) return renderPlaybook();
      if (path === ROUTES.portfolio) return <PortfolioPage hours={internSummary.avgHours} />;
      if (path === ROUTES.research) return <ResearchPage user={user} />;
      if (path === ROUTES.reports) {
        return (
          <ProgressReportsPage
            interns={interns}
            internsLoading={internsLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onUpdateIntern={handleOpenModal}
          />
        );
      }
      if (path === ROUTES.analyticsCohortIdentity) {
        return <CohortIdentityAnalyticsPage />;
      }
      if (path === `${ROUTES.facultyHome}/advisory`) {
        return (
          <LazyRoute label="Loading advisory…">
            <StaffDashboardPage
              userRole="faculty"
              user={user}
              interns={interns}
              internSummary={internSummary}
              pendingLogs={pendingLogs}
              token={token}
              usingSupabaseAuth={usingSupabaseAuth}
              showToast={showToast}
              onLoadInterns={loadInterns}
              onLoadPendingLogs={loadPendingLogs}
              initialTab="advisory"
            />
          </LazyRoute>
        );
      }
      if (path === `${ROUTES.mentorHome}/advisory`) {
        return (
          <LazyRoute label="Loading advisory…">
            <StaffDashboardPage
              userRole="mentor"
              user={user}
              interns={interns}
              internSummary={internSummary}
              pendingLogs={pendingLogs}
              token={token}
              usingSupabaseAuth={usingSupabaseAuth}
              showToast={showToast}
              onLoadInterns={loadInterns}
              onLoadPendingLogs={loadPendingLogs}
              initialTab="advisory"
            />
          </LazyRoute>
        );
      }
      if (path === ROUTES.facultyHome) {
        return (
          <LazyRoute label="Loading faculty…">
            <FacultyHomePage
              interns={interns}
              internSummary={internSummary}
              pendingLogs={pendingLogs}
            />
          </LazyRoute>
        );
      }
      if (path === ROUTES.facultyPlaybook) {
        return (
          <LazyRoute label="Loading faculty playbook…">
            <FacultyPlaybookPage />
          </LazyRoute>
        );
      }
      if (path.startsWith(`${ROUTES.facultyPlaybook}/`)) {
        return (
          <LazyRoute label="Loading day framework…">
            <FacultyDayFrameworkPage />
          </LazyRoute>
        );
      }
      if (path === ROUTES.mentorHome) {
        return (
          <LazyRoute label="Loading mentor…">
            <MentorHomePage
              user={user}
              interns={interns}
              internSummary={internSummary}
              pendingLogs={pendingLogs}
              showToast={showToast}
            />
          </LazyRoute>
        );
      }
      if (path === ROUTES.mentorPlaybook) {
        return (
          <LazyRoute label="Loading mentor playbook…">
            <MentorPlaybookPage />
          </LazyRoute>
        );
      }
      if (path.startsWith(`${ROUTES.mentorPlaybook}/`)) {
        return (
          <LazyRoute label="Loading day guide…">
            <MentorDayFrameworkPage />
          </LazyRoute>
        );
      }
      if (path === ROUTES.adminFacultyPlaybook) {
        return (
          <LazyRoute label="Loading faculty admin…">
            <AdminFacultyPlaybookPage />
          </LazyRoute>
        );
      }
      if (path === ROUTES.adminMentorPlaybook) {
        return (
          <LazyRoute label="Loading mentor admin…">
            <AdminMentorPlaybookPage />
          </LazyRoute>
        );
      }
      if (path === ROUTES.mentorVentureCoach) {
        return (
          <LazyRoute label="Loading participants…">
            <MentorParticipantsPage
              interns={interns.map((i) => ({
                id: i.id,
                name: i.name,
                segment: i.segment,
                hours: i.hours,
                squad: i.squad,
              }))}
            />
          </LazyRoute>
        );
      }
      if (path.startsWith(`${ROUTES.mentorVentureCoach}/`)) {
        return (
          <LazyRoute label="Loading Venture Coach review…">
            <MentorVentureCoachPage
              interns={interns.map((i) => ({ id: i.id, name: i.name }))}
              mentorId={user?.id}
              showToast={showToast}
            />
          </LazyRoute>
        );
      }
      if (path === ROUTES.admin) {
        return <LazyRoute label="Loading admin…">{adminPage}</LazyRoute>;
      }
      if (path === ROUTES.adminCohorts) return <AdminCohortsPage />;
      if (path === ROUTES.adminSquadThemes) return <AdminSquadThemesPage />;
      if (path === ROUTES.adminSquads) {
        return (
          <AdminSquadsPage
            interns={interns.map((i) => ({ id: i.id, name: i.name }))}
          />
        );
      }
      if (path === ROUTES.adminPortfolioSettings) {
        return (
          <LazyRoute label="Loading portfolio settings…">
            <PortfolioSettingsPage />
          </LazyRoute>
        );
      }
      if (path === ROUTES.adminContentStudio || path.startsWith(`${ROUTES.adminContentStudio}/`)) {
        return (
          <LazyRoute label="Loading Content Studio…">
            <ContentStudioPage />
          </LazyRoute>
        );
      }
      if (path === ROUTES.dashboard && userRole === 'faculty') {
        return <Navigate to={ROUTES.facultyHome} replace />;
      }
      if (path === ROUTES.dashboard && userRole === 'mentor') {
        return <Navigate to={ROUTES.mentorHome} replace />;
      }
      return renderStaffDashboard();
    }

    return null;
  };

  return (
    <div
      className={`spike-app-shell ${
        compactNav ? 'spike-app-shell--compact-nav' : 'spike-app-shell--desktop-nav'
      }`}
    >
      <PortalHeader
        userRole={userRole}
        user={user}
        setupMeta={setupMeta}
        onLogout={handleLogout}
      />

      {userRole !== 'guest' && userRole !== 'profile_error' && !authLoading && (
        <ModuleNav userRole={userRole} />
      )}

      <main>
        {userRole === 'guest' && (
          STATIC_ONLY ? (
            <div className="container mx-auto px-6 py-8">
              <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-2 text-2xl font-extrabold text-gray-900">Static preview mode</h2>
                <p className="text-sm text-gray-600">
                  Preview without sign-in. Orientation and master blueprint are available.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setPublicTab('orientation')} className={`rounded-lg px-3 py-2 text-sm font-bold transition ${publicTab === 'orientation' ? 'bg-[#8B0000] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    Orientation Deck
                  </button>
                  <button type="button" onClick={() => setPublicTab('syllabus')} className={`rounded-lg px-3 py-2 text-sm font-bold transition ${publicTab === 'syllabus' ? 'bg-[#8B0000] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    Master Blueprint
                  </button>
                </div>
              </div>
              {publicTab === 'orientation' ? <OrientationModule /> : <MasterSyllabusView />}
            </div>
          ) : authLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-600">
              <Loader2 className="animate-spin text-[#8B0000]" size={40} />
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
                onRequestPasswordHelp={
                  usingSupabaseAuth ? requestPasswordHelpForGuest : undefined
                }
                onInternSignup={handleInternSignup}
              />
            </LazyRoute>
          )
        )}

        {userRole === 'profile_error' && !authLoading && (
          <div className="container mx-auto max-w-lg px-6 py-16 text-center">
            <AlertCircle className="mx-auto mb-4 text-amber-600" size={48} />
            <h2 className="mb-2 text-xl font-bold text-gray-900">Signed in, but your profile did not load</h2>
            <p className="mb-6 text-sm text-gray-600">
              Your session is valid, but the portal could not read your role from the database (for
              example a row-level security policy, a missing row in public.profiles, or a network
              error). You have not been downgraded to intern—load your profile again or sign out.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  await refreshUser();
                  showToast('Profile refresh attempted.', 'info');
                }}
                className="rounded-lg bg-[#8B0000] px-4 py-2 text-sm font-bold text-white transition hover:bg-red-900"
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

        {(userRole === 'intern' || ['faculty', 'mentor', 'admin'].includes(userRole)) &&
          !authLoading && (
            <RoleRouteGuard userRole={userRole} pathname={location.pathname}>
              <LazyRoute label="Loading module…">{renderAuthenticatedModule()}</LazyRoute>
            </RoleRouteGuard>
          )}
      </main>

      {user?.mustChangePassword &&
        !authLoading &&
        userRole !== 'guest' &&
        userRole !== 'profile_error' && (
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

      {selectedIntern && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in zoom-in w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl duration-200">
            <div className="flex items-center justify-between bg-[#8B0000] p-4 text-white">
              <h3 className="text-lg font-bold">Edit Intern Progress</h3>
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Close"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-red-200 transition hover:bg-red-900/30 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-500">
                  Intern
                </p>
                <p className="text-xl font-bold text-gray-900">{editData.name}</p>
                <p className="text-sm text-gray-600">{editData.email}</p>
                <p className="text-sm text-gray-600">
                  {[editData.university, editData.squad].filter(Boolean).join(' · ') ||
                    '—'}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  Current Segment Stage
                </label>
                <select
                  value={editData.segment}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      segment: Number.parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 p-2 outline-none transition focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                >
                  <option value={1}>Segment 1: Proof of Concept (0-200h)</option>
                  <option value={2}>
                    Segment 2: Market Validation (201-400h)
                  </option>
                  <option value={3}>
                    Segment 3: Partnership Track (401-600h)
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  Total Traction Hours (Max 600)
                </label>
                <input
                  type="number"
                  min="0"
                  max="600"
                  value={editData.hours}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      hours: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 p-2 outline-none transition focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="licensedStatus"
                  checked={editData.licensed}
                  onChange={(e) =>
                    setEditData({ ...editData, licensed: e.target.checked })
                  }
                  className="h-5 w-5 rounded text-[#8B0000] focus:ring-[#8B0000]"
                />
                <label
                  htmlFor="licensedStatus"
                  className="cursor-pointer text-sm font-bold text-gray-700"
                >
                  Officially Licensed Advisor
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 p-4">
              <button
                onClick={handleCloseModal}
                className="rounded-lg px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="rounded-lg bg-[#8B0000] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-900"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpikeMasterPortal;
