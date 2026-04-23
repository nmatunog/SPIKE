import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Users,
  Settings,
  BarChart,
  Edit3,
  MonitorPlay,
  CheckCircle,
  Clock,
  Shield,
  Briefcase,
  PlusCircle,
  LogOut,
  Download,
  Search,
  AlertCircle,
  LayoutDashboard,
  X,
  Info,
  Rocket,
  Presentation,
  ArrowRight,
  ArrowLeft,
  PlayCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from './AuthContext.jsx';
import { apiFetch } from './apiClient.js';
import { fullSyllabusData } from './fullSyllabusData.js';
import { orientationSlides } from './orientationSlideContents.jsx';

function mapApiRoleToUi(role) {
  switch (role) {
    case 'ADMIN':
      return 'admin';
    case 'INTERN':
      return 'intern';
    case 'FACULTY':
      return 'faculty';
    case 'MENTOR':
      return 'mentor';
    default:
      return 'guest';
  }
}

const SpikeMasterPortal = ({ navigate } = {}) => {
  const {
    token,
    user,
    loading: authLoading,
    login,
    logout,
    refreshUser,
    completeBootstrapSetup,
  } = useAuth();
  const userRole = user ? mapApiRoleToUi(user.role) : 'guest';
  const STATIC_ONLY = import.meta.env.VITE_STATIC_ONLY === 'true';
  const [publicTab, setPublicTab] = useState('orientation');

  const [activeTab, setActiveTab] = useState('dashboard');
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
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('INTERN');
  const [regUniversity, setRegUniversity] = useState('');
  const [regSquad, setRegSquad] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);

  const [setupLoadState, setSetupLoadState] = useState('loading');
  const [setupLoadError, setSetupLoadError] = useState('');
  const [setupMeta, setSetupMeta] = useState(null);

  const [bootName, setBootName] = useState('');
  const [bootEmail, setBootEmail] = useState('');
  const [bootPassword, setBootPassword] = useState('');
  const [bootPassword2, setBootPassword2] = useState('');
  const [bootSecret, setBootSecret] = useState('');
  const [bootSubmitting, setBootSubmitting] = useState(false);
  const [bootError, setBootError] = useState('');

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: '', type: 'success' }),
      3000,
    );
  }, []);

  const loadInterns = useCallback(async () => {
    if (!token || !['FACULTY', 'MENTOR', 'ADMIN'].includes(user?.role)) return;
    setInternsLoading(true);
    try {
      const rows = await apiFetch('/api/interns', { token });
      setInterns(rows);
    } catch (e) {
      showToast(e.message || 'Failed to load interns', 'info');
    } finally {
      setInternsLoading(false);
    }
  }, [token, user?.role, showToast]);

  const loadPendingLogs = useCallback(async () => {
    if (!token || !['FACULTY', 'MENTOR', 'ADMIN'].includes(user?.role)) return;
    try {
      const rows = await apiFetch('/api/traction-logs/pending', { token });
      setPendingLogs(rows);
    } catch (e) {
      showToast(e.message || 'Failed to load pending logs', 'info');
    }
  }, [token, user?.role, showToast]);

  const loadMyLogs = useCallback(async () => {
    if (!token || user?.role !== 'INTERN') return;
    try {
      const rows = await apiFetch('/api/traction-logs/my', { token });
      setMyLogs(rows);
    } catch {
      setMyLogs([]);
    }
  }, [token, user?.role]);

  const loadSetupInfo = useCallback(async () => {
    if (STATIC_ONLY) {
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
  }, [STATIC_ONLY]);

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
  }, [user, loadMyLogs]);

  useEffect(() => {
    if (user && ['FACULTY', 'MENTOR', 'ADMIN'].includes(user.role)) {
      loadPendingLogs();
    } else {
      setPendingLogs([]);
    }
  }, [user, loadPendingLogs]);

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
      <div className="container mx-auto flex flex-col items-center px-6 py-8">
        <div className="flex min-h-[600px] max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
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
            className="animate-in zoom-in-95 fade-in flex-grow overflow-y-auto p-6 duration-300 md:p-10"
            key={currentSlide}
          >
            <div className="mx-auto my-auto w-full max-w-3xl">
              <div className="mb-8 text-center">
                <div className="flex justify-center">
                  {orientationSlides[currentSlide].icon}
                </div>
                <h2 className="mb-3 text-3xl font-black text-gray-900 md:text-4xl">
                  {orientationSlides[currentSlide].title}
                </h2>
                <p className="text-lg italic text-gray-500">
                  {orientationSlides[currentSlide].subtitle}
                </p>
              </div>
              {orientationSlides[currentSlide].content}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-gray-200 bg-gray-50 p-4 md:p-6">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 font-bold transition-all ${
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
                className="flex items-center gap-2 rounded-lg bg-[#8B0000] px-6 py-3 font-bold text-white shadow-md transition-all hover:bg-red-900 hover:pr-4"
              >
                Next <ArrowRight size={18} className="ml-1" />
              </button>
            ) : (
              <button
                onClick={() => {
                  showToast('Orientation Completed!', 'success');
                  setActiveTab('dashboard');
                  if (typeof navigate === 'function') navigate();
                }}
                className="flex items-center gap-2 rounded-lg bg-green-700 px-6 py-3 font-bold text-white shadow-md transition-all hover:bg-green-800"
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
    if (!token || !editData) return;
    try {
      await apiFetch(`/api/interns/${editData.id}/progress`, {
        token,
        method: 'PATCH',
        body: {
          segment: editData.segment,
          hours: editData.hours,
          licensed: editData.licensed,
        },
      });
      await loadInterns();
      handleCloseModal();
      showToast('Intern details updated successfully!');
    } catch (e) {
      showToast(e.message || 'Update failed', 'info');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      setLoginPassword('');
      setActiveTab('dashboard');
      showToast('Signed in successfully.');
    } catch (err) {
      setLoginError(err.message || 'Sign in failed.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleBootstrapSubmit = async (e) => {
    e.preventDefault();
    setBootError('');
    if (bootPassword !== bootPassword2) {
      setBootError('Passwords do not match.');
      return;
    }
    setBootSubmitting(true);
    try {
      await completeBootstrapSetup({
        name: bootName.trim(),
        email: bootEmail.trim(),
        password: bootPassword,
        ...(setupMeta?.secretRequired ? { setupSecret: bootSecret } : {}),
      });
      setBootPassword('');
      setBootPassword2('');
      setBootSecret('');
      setActiveTab('dashboard');
      showToast('Administrator account created. You are signed in.');
      await loadSetupInfo();
    } catch (err) {
      setBootError(err.message || 'Setup failed.');
    } finally {
      setBootSubmitting(false);
    }
  };

  const submitAdminRegister = async (e) => {
    e.preventDefault();
    if (!token) return;
    setRegSubmitting(true);
    try {
      await apiFetch('/api/auth/register', {
        token,
        method: 'POST',
        body: {
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          role: regRole,
          university: regRole === 'INTERN' ? regUniversity.trim() || undefined : undefined,
          squad: regRole === 'INTERN' ? regSquad.trim() || undefined : undefined,
        },
      });
      setRegPassword('');
      showToast('User created.');
      await loadInterns();
    } catch (err) {
      showToast(err.message || 'Registration failed', 'info');
    } finally {
      setRegSubmitting(false);
    }
  };

  const Navigation = () => (
    <nav className="relative z-50 bg-[#8B0000] text-white shadow-md">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-4 md:flex-row">
        <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-start">
          <div className="flex items-center gap-3">
            <div className="rounded bg-white p-1.5 text-xl font-bold leading-none text-[#8B0000]">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-wide">
                S.P.I.K.E. PORTAL
              </h1>
              <p className="text-xs text-red-200">AIAPH 1Matunog District</p>
            </div>
          </div>
        </div>

        {userRole === 'guest' ? (
          <p className="text-center text-sm text-red-100 md:text-right">
            {setupMeta?.needsBootstrap
              ? 'Create the first administrator account, or sign in if the database is already set up.'
              : 'Sign in with an account your administrator created.'}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-3 md:flex-row md:gap-6">
            <span className="hidden text-sm text-red-100 md:inline">
              {user?.name}
            </span>
            <span className="rounded-full bg-red-900 px-3 py-1 text-sm font-bold uppercase tracking-wider shadow-inner">
              Role:{' '}
              {userRole === 'intern'
                ? 'Intern'
                : userRole === 'mentor'
                  ? 'Advisor'
                  : userRole === 'admin'
                    ? 'Admin'
                    : 'Faculty'}
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                setActiveTab('dashboard');
                showToast('Signed out.');
              }}
              className="flex items-center gap-1 font-medium text-red-200 transition hover:text-white"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );

  const MasterSyllabusView = () => (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 flex items-end justify-between border-b pb-4">
        <div>
          <h2 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <Rocket className="text-[#8B0000]" size={32} />
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

  const ProgressReportsView = () => (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Intern Progress Reports
          </h2>
          <p className="mt-1 text-gray-600">
            Track intern hours, 600-hour segment completion, and licensing
            status.
          </p>
        </div>
        <div className="flex w-full items-center rounded-lg border border-gray-300 bg-white px-3 py-2 md:w-64">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search interns..."
            className="ml-2 w-full text-sm outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {internsLoading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-gray-600">
            <Loader2 className="animate-spin" size={22} />
            Loading interns…
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-100 text-sm uppercase tracking-wide text-gray-700">
                <th className="border-b p-4">Intern Name</th>
                <th className="border-b p-4">Recruitment Source</th>
                <th className="border-b p-4">Incubator Stage</th>
                <th className="w-1/4 border-b p-4">Traction Hours Logged</th>
                <th className="border-b p-4 text-center">Compliance</th>
                <th className="border-b p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {interns
                .filter((intern) => {
                  const q = searchQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    intern.name.toLowerCase().includes(q) ||
                    (intern.email || '').toLowerCase().includes(q) ||
                    (intern.university || '').toLowerCase().includes(q) ||
                    (intern.squad || '').toLowerCase().includes(q)
                  );
                })
                .map((intern) => (
                <tr
                  key={intern.id}
                  className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50"
                >
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{intern.name}</div>
                    <div className="text-xs text-gray-500">
                      {intern.email}
                      {intern.squad ? ` · ${intern.squad}` : ''}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {intern.university}
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-800">
                    <span
                      className={`rounded px-2 py-1 text-xs font-bold ${
                        intern.segment === 1
                          ? 'bg-blue-100 text-blue-800'
                          : intern.segment === 2
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      Segment {intern.segment}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-[#8B0000]"
                          style={{
                            width: `${Math.min((intern.hours / 600) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs font-bold text-gray-700">
                        {intern.hours}/600
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {intern.licensed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
                        <CheckCircle size={12} /> Licensed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-800">
                        <Clock size={12} /> Target: Hr 110
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleOpenModal(intern)}
                      className="rounded px-3 py-1 text-sm font-bold text-[#8B0000] underline transition hover:bg-red-50 hover:text-red-900"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );

  const InternDashboard = () => {
    const p = user?.internProgress;
    const hours = p?.hours ?? 0;
    const segment = p?.segment ?? 1;
    const licensed = p?.licensed ?? false;

    return (
    <div className="container mx-auto flex flex-col gap-8 px-6 py-8 lg:flex-row">
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
                await apiFetch('/api/traction-logs', {
                  token,
                  method: 'POST',
                  body: { task, hours: hoursVal },
                });
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
          <div className="mb-4 flex items-center justify-between border-b pb-4">
            <h3 className="text-lg font-bold">Current module focus</h3>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-[#8B0000]">
              In progress
            </span>
          </div>
          {segment === 1 ? (
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-center justify-between rounded border bg-gray-50 p-3">
                <span>Module 4: Regulatory Compliance</span>
                <span className="font-bold text-green-600">Done</span>
              </li>
              <li className="flex items-center justify-between rounded border border-[#8B0000] bg-white p-3">
                <span className="font-bold text-[#8B0000]">
                  Module 5: AIA Product Solutions & Sales
                </span>
                <span className="text-gray-500">Ongoing</span>
              </li>
              <li className="flex items-center justify-between rounded border p-3 text-gray-400">
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
    );
  };

  const FacultyDashboard = () => (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 flex flex-col items-end justify-between md:flex-row">
        <div>
          <h2 className="mb-2 text-3xl font-bold text-gray-900">S.P.I.K.E. Dev Studio</h2>
          <p className="text-gray-600">Dynamic curriculum editor for the full 600-hour master plan.</p>
        </div>
        <button
          type="button"
          onClick={() => showToast('Opening New Module Builder...', 'info')}
          className="mt-4 flex items-center gap-2 rounded-lg bg-[#8B0000] px-4 py-2 text-white transition hover:bg-red-900 md:mt-0"
        >
          <PlusCircle size={18} /> New Module Element
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Edit3 className="text-[#8B0000]" /> Live Syllabus Editor
          </h3>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-xs text-gray-500">
              Select a module from any of the 3 segments to edit tasks.
            </p>
            <select className="mb-4 w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]">
              <optgroup label="Segment 1">
                <option>Module 1: Industry Immersion</option>
                <option>Module 6: Insurance Entrepreneurship</option>
              </optgroup>
              <optgroup label="Segment 2">
                <option>Module 8: Prospecting & Approaching</option>
                <option>Module 11: Objections, Closing & Validation</option>
              </optgroup>
              <optgroup label="Segment 3">
                <option>Module 13: Agency Scaling & Graduation</option>
              </optgroup>
            </select>
            <button
              type="button"
              onClick={() => showToast('Live editor loaded for selected module.', 'info')}
              className="w-full rounded-lg bg-gray-200 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-300"
            >
              Open Editor
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <MonitorPlay className="text-[#8B0000]" /> Presentation Assets
          </h3>
          <ul className="space-y-3">
            <li
              role="presentation"
              onClick={() => showToast('Opening presentation...', 'info')}
              className="flex cursor-pointer items-center gap-3 rounded border border-gray-100 p-2 text-sm hover:bg-gray-50"
            >
              <MonitorPlay size={16} className="text-blue-600" />
              <span>AIA LMS Module 1-4 Overview.pptx</span>
            </li>
            <li
              role="presentation"
              onClick={() => showToast('Opening presentation...', 'info')}
              className="flex cursor-pointer items-center gap-3 rounded border border-gray-100 p-2 text-sm hover:bg-gray-50"
            >
              <MonitorPlay size={16} className="text-blue-600" />
              <span>Partnership Board Pitch Template.pptx</span>
            </li>
          </ul>
          <button
            type="button"
            onClick={() => showToast('File upload dialog opened.', 'info')}
            className="mt-4 w-full rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm font-medium text-gray-500 transition hover:border-[#8B0000] hover:text-[#8B0000]"
          >
            + Upload Presentation
          </button>
        </div>
      </div>
    </div>
  );

  const MentorDashboard = () => (
    <div className="container mx-auto px-6 py-8">
      <h2 className="mb-6 text-3xl font-bold text-gray-900">Advisory Board Control Center</h2>
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Users className="text-[#8B0000]" /> Active interns overview
          </h3>
          <div className="overflow-hidden rounded-lg border">
            <div className="border-b bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
              Incubator stages (live)
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-[#8B0000]">Segment 1 (Proof of Concept)</span>
                <span className="text-xs text-gray-500">{internSummary.s1} interns</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2 text-sm">
                <span className="font-bold text-blue-700">Segment 2 (Market Validation)</span>
                <span className="text-xs text-gray-500">{internSummary.s2} interns</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2 text-sm">
                <span className="font-bold text-green-700">Segment 3 (Partnership Track)</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{internSummary.s3} interns</span>
                  <button
                    type="button"
                    onClick={() => showToast('Final Board Pitch scheduled!', 'success')}
                    className="rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-800 transition hover:bg-green-200"
                  >
                    Schedule Board Pitch
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Briefcase className="text-[#8B0000]" /> Field work debriefing (auto-log)
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Submit verified field hours; totals sync to the intern record in the database.
          </p>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const internId = Number.parseInt(e.target.internId.value, 10);
              const hoursToAdd = Number.parseInt(e.target.hoursCompleted.value, 10);
              if (!internId || !hoursToAdd || !token) return;
              try {
                await apiFetch(`/api/interns/${internId}/progress`, {
                  token,
                  method: 'PATCH',
                  body: { hoursAdd: hoursToAdd },
                });
                await loadInterns();
                showToast(`Logged ${hoursToAdd} traction hours.`);
                e.target.reset();
              } catch (err) {
                showToast(err.message || 'Failed to log hours', 'info');
              }
            }}
          >
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">Select intern</label>
              <select
                name="internId"
                required
                className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
              >
                <option value="">-- Choose intern --</option>
                {interns.map((intern) => (
                  <option key={intern.id} value={intern.id}>
                    {intern.name} (Seg {intern.segment}) - {intern.hours}hrs
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">Execution duration</label>
              <select
                name="hoursCompleted"
                required
                className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
              >
                <option value="">-- Select hours --</option>
                <option value="4">Half-day session (4 hrs)</option>
                <option value="8">Full day session (8 hrs)</option>
                <option value="16">Multi-day field execution (16 hrs)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">Board feedback notes</label>
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
                placeholder="Optional notes for the intern file"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#8B0000] py-2 text-sm font-bold text-white transition hover:bg-red-900"
            >
              Submit evaluation & log hours
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <CheckCircle className="text-[#8B0000]" /> Pending traction approvals
          </h3>
          {pendingLogs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
              No pending traction logs.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                    <th className="p-3">Date</th>
                    <th className="p-3">Intern</th>
                    <th className="p-3">Task</th>
                    <th className="p-3 text-center">Hours</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="p-3 text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm font-bold text-gray-900">
                        {log.user?.name}
                      </td>
                      <td className="p-3 text-sm text-gray-700">{log.task}</td>
                      <td className="p-3 text-center text-sm font-bold text-[#8B0000]">
                        {log.hours}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await apiFetch(`/api/traction-logs/${log.id}`, {
                                  token,
                                  method: 'PATCH',
                                  body: { action: 'approve' },
                                });
                                await loadInterns();
                                await loadPendingLogs();
                                showToast(`Approved ${log.hours} hrs for ${log.user?.name}`);
                              } catch (err) {
                                showToast(err.message || 'Approve failed', 'info');
                              }
                            }}
                            className="rounded bg-green-100 px-3 py-1 text-xs font-bold text-green-700 transition hover:bg-green-200"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await apiFetch(`/api/traction-logs/${log.id}`, {
                                  token,
                                  method: 'PATCH',
                                  body: { action: 'reject' },
                                });
                                await loadPendingLogs();
                                showToast(`Rejected log for ${log.user?.name}`, 'info');
                              } catch (err) {
                                showToast(err.message || 'Reject failed', 'info');
                              }
                            }}
                            className="rounded bg-red-50 px-3 py-1 text-xs font-bold text-red-700 transition hover:bg-red-100"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const AdminDashboard = () => (
    <div className="container mx-auto px-6 py-8">
      <h2 className="mb-6 text-3xl font-bold text-gray-900">Admin overview</h2>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 border-l-4 border-l-[#8B0000] bg-white p-6 shadow-sm">
          <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-500">
            Active interns
          </p>
          <p className="text-3xl font-black text-gray-900">{internSummary.n}</p>
        </div>
        <div className="rounded-xl border border-gray-200 border-l-4 border-l-green-600 bg-white p-6 shadow-sm">
          <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-500">
            Partnership track (Seg 3)
          </p>
          <p className="text-3xl font-black text-gray-900">{internSummary.s3}</p>
        </div>
        <div className="rounded-xl border border-gray-200 border-l-4 border-l-blue-600 bg-white p-6 shadow-sm">
          <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-500">
            Avg completion
          </p>
          <p className="text-3xl font-black text-gray-900">
            {internSummary.n ? internSummary.avgHours : 0}
            <span className="text-lg text-gray-500">/600 hrs</span>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="text-[#8B0000]" size={22} />
            <h3 className="text-lg font-bold text-gray-900">Create user account</h3>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Team members cannot sign up on their own. Admins create interns, faculty,
            mentors, or other admins here. Interns receive a progress record automatically.
          </p>
          <form className="space-y-3" onSubmit={submitAdminRegister}>
            <input
              required
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
            />
            <input
              required
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
            />
            <input
              required
              type="password"
              minLength={8}
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
            />
            <select
              value={regRole}
              onChange={(e) => setRegRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
            >
              <option value="INTERN">Intern</option>
              <option value="FACULTY">Faculty</option>
              <option value="MENTOR">Mentor (Advisory Board)</option>
              <option value="ADMIN">Admin</option>
            </select>
            {regRole === 'INTERN' && (
              <>
                <input
                  value={regUniversity}
                  onChange={(e) => setRegUniversity(e.target.value)}
                  placeholder="University / recruitment source"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
                />
                <input
                  value={regSquad}
                  onChange={(e) => setRegSquad(e.target.value)}
                  placeholder="Squad (optional)"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
                />
              </>
            )}
            <button
              type="submit"
              disabled={regSubmitting}
              className="w-full rounded-lg bg-[#8B0000] py-2 text-sm font-bold text-white transition hover:bg-red-900 disabled:opacity-60"
            >
              {regSubmitting ? 'Creating…' : 'Create account'}
            </button>
          </form>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-sm">
          <Settings size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-bold text-gray-700">System configuration</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Manage user accounts, traction exports, and agency alignment settings. Deploy the API
            separately and set{' '}
            <code className="rounded bg-gray-100 px-1">VITE_API_URL</code> on Netlify for production
            builds.
          </p>
          <button
            type="button"
            onClick={() => showToast('Loading system configuration settings...', 'info')}
            className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
          >
            Open settings
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-gray-50 pb-12 font-sans selection:bg-red-900 selection:text-white">
      <Navigation />

      {['faculty', 'mentor', 'admin'].includes(userRole) && (
        <div className="sticky top-0 z-40 border-b border-gray-200 bg-white px-6 py-1 shadow-sm">
          <div className="container mx-auto flex gap-2 overflow-x-auto whitespace-nowrap text-sm font-bold text-gray-600 md:gap-6">
            <button
              className={`border-b-[3px] px-2 py-3 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-[#8B0000] text-[#8B0000]'
                  : 'border-transparent hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="flex items-center gap-2">
                <LayoutDashboard size={16} /> Role Dashboard
              </span>
            </button>
            <button
              className={`border-b-[3px] px-2 py-3 transition-colors ${
                activeTab === 'orientation'
                  ? 'border-[#8B0000] text-[#8B0000]'
                  : 'border-transparent hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('orientation')}
            >
              <span className="flex items-center gap-2">
                <PlayCircle size={16} /> Orientation Deck
              </span>
            </button>
            <button
              className={`border-b-[3px] px-2 py-3 transition-colors ${
                activeTab === 'syllabus'
                  ? 'border-[#8B0000] text-[#8B0000]'
                  : 'border-transparent hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('syllabus')}
            >
              <span className="flex items-center gap-2">
                <BookOpen size={16} /> Master Blueprint
              </span>
            </button>
            <button
              className={`border-b-[3px] px-2 py-3 transition-colors ${
                activeTab === 'reports'
                  ? 'border-[#8B0000] text-[#8B0000]'
                  : 'border-transparent hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('reports')}
            >
              <span className="flex items-center gap-2">
                <BarChart size={16} /> Progress Reports
              </span>
            </button>
          </div>
        </div>
      )}

      <main>
        {userRole === 'guest' && (
          STATIC_ONLY ? (
            <div className="container mx-auto px-6 py-8">
              <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-2 text-2xl font-extrabold text-gray-900">Static preview mode</h2>
                <p className="text-sm text-gray-600">Running without an API. Orientation and master blueprint are available.</p>
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
            <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-16">
              <Shield size={56} className="mb-4 text-[#8B0000]" />
              <h2 className="mb-2 text-center text-3xl font-extrabold text-gray-900">
                Welcome to S.P.I.K.E.
              </h2>
              <p className="mb-6 text-center text-sm text-gray-600">
                There is no public self-registration. The first person to access an empty database
                creates the administrator account once. Everyone else must be created by an admin
                after that.
              </p>

              {setupLoadState === 'loading' && (
                <div className="flex flex-col items-center gap-3 py-8 text-gray-600">
                  <Loader2 className="animate-spin text-[#8B0000]" size={32} />
                  <p className="text-sm font-medium">Checking setup…</p>
                </div>
              )}

              {setupLoadState === 'error' && (
                <div className="mb-6 w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="mb-3 font-medium">{setupLoadError}</p>
                  <button
                    type="button"
                    onClick={() => loadSetupInfo()}
                    className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-950"
                  >
                    Retry
                  </button>
                </div>
              )}

              {setupLoadState === 'ok' && setupMeta?.needsBootstrap && (
                <form
                  className="mb-10 w-full space-y-4 rounded-2xl border-2 border-[#8B0000]/30 bg-red-50/50 p-6 shadow-sm"
                  onSubmit={handleBootstrapSubmit}
                >
                  <h3 className="text-center text-lg font-bold text-gray-900">
                    First-time setup: create administrator
                  </h3>
                  <p className="text-center text-xs text-gray-600">
                    This form appears only when the database has no users. You will be signed in as
                    an admin. No one else can use this shortcut after the first account exists.
                  </p>
                  {bootError && (
                    <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-700">
                      {bootError}
                    </p>
                  )}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">
                      Full name
                    </label>
                    <input
                      required
                      value={bootName}
                      onChange={(e) => setBootName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-[#8B0000]"
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">Email</label>
                    <input
                      type="email"
                      required
                      value={bootEmail}
                      onChange={(e) => setBootEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-[#8B0000]"
                      placeholder="you@agency.com"
                      autoComplete="username"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={bootPassword}
                      onChange={(e) => setBootPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-[#8B0000]"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={bootPassword2}
                      onChange={(e) => setBootPassword2(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-[#8B0000]"
                      placeholder="Repeat password"
                      autoComplete="new-password"
                    />
                  </div>
                  {setupMeta.secretRequired && (
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-700">
                        Setup secret
                      </label>
                      <input
                        type="password"
                        required
                        value={bootSecret}
                        onChange={(e) => setBootSecret(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-[#8B0000]"
                        placeholder="Value from API SETUP_SECRET"
                        autoComplete="off"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Your API host must define <code className="rounded bg-gray-100 px-1">SETUP_SECRET</code>{' '}
                        for this field to appear.
                      </p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={bootSubmitting}
                    className="w-full rounded-lg bg-[#8B0000] py-2.5 text-sm font-bold text-white transition hover:bg-red-900 disabled:opacity-60"
                  >
                    {bootSubmitting ? 'Creating account…' : 'Create administrator & sign in'}
                  </button>
                </form>
              )}

              {setupLoadState === 'ok' && (
                <>
                  {setupMeta?.needsBootstrap && (
                    <p className="mb-4 w-full text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                      Already set up this server?
                    </p>
                  )}
                  <form
                    className="w-full space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                    onSubmit={handleLoginSubmit}
                  >
                    <h3 className="text-center text-sm font-bold text-gray-800">
                      {setupMeta?.needsBootstrap ? 'Sign in instead' : 'Sign in'}
                    </h3>
                    {loginError && (
                      <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-700">
                        {loginError}
                      </p>
                    )}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-700">Email</label>
                      <input
                        type="email"
                        required
                        autoComplete="username"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#8B0000]"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-700">Password</label>
                      <input
                        type="password"
                        required
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#8B0000]"
                        placeholder="••••••••"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loginSubmitting}
                      className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-60"
                    >
                      {loginSubmitting ? 'Signing in…' : 'Sign in'}
                    </button>
                  </form>
                </>
              )}
            </div>
          )
        )}

        {userRole === 'intern' && user?.internProgress && <InternDashboard />}
        {userRole === 'intern' && user && !user.internProgress && (
          <div className="container mx-auto px-6 py-12 text-center text-gray-700">
            <p className="font-medium">
              Your account has no intern progress record. Contact an administrator.
            </p>
          </div>
        )}

        {['faculty', 'mentor', 'admin'].includes(userRole) && (
          <>
            {activeTab === 'dashboard' && userRole === 'faculty' && (
              <>
                <FacultyDashboard />
                <MentorDashboard />
              </>
            )}
            {activeTab === 'dashboard' && userRole === 'mentor' && (
              <MentorDashboard />
            )}
            {activeTab === 'dashboard' && userRole === 'admin' && (
              <AdminDashboard />
            )}
            {activeTab === 'orientation' && <OrientationModule />}
            {activeTab === 'syllabus' && <MasterSyllabusView />}
            {activeTab === 'reports' && <ProgressReportsView />}
          </>
        )}
      </main>

      {toast.show && (
        <div className="animate-in slide-in-from-bottom-5 fade-in fixed bottom-6 right-6 z-50 duration-300">
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
                onClick={handleCloseModal}
                className="text-red-200 transition hover:text-white"
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
