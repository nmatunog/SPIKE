import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  ExternalLink,
  Loader2,
  MonitorPlay,
  Search,
  Sparkles,
  Users,
  Briefcase,
} from 'lucide-react';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';
import { TabBar } from '../components/ui/TabBar.jsx';
import { RoleDashboardCards } from '../components/dashboard/RoleDashboardCards.jsx';
import { PendingLogCard } from '../components/traction/PendingLogCard.jsx';
import { ROUTES } from '../routes/paths.js';
import { apiFetch } from '../apiClient.js';
import { reviewTractionLog, updateInternProgress } from '../lib/supabase/index.js';
import { supabase } from '../supabaseClient.js';
import { FacultyDay1Panel } from '../components/day1/FacultyDay1Panel.jsx';
import { MentorDay1Panel } from '../components/day1/MentorDay1Panel.jsx';

const FACULTY_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
  { id: 'advisory', label: 'Advisory', icon: Users },
];

const MENTOR_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'advisory', label: 'Advisory', icon: Users },
];

function SegmentSummary({ internSummary }) {
  return (
    <div className="spike-card">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Cohort by segment</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between rounded-lg bg-spike-muted/60 px-3 py-2">
          <span className="font-medium text-spike">Segment 1</span>
          <span className="text-slate-600">{internSummary.s1} interns</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-sky-50 px-3 py-2">
          <span className="font-medium text-sky-800">Segment 2</span>
          <span className="text-slate-600">{internSummary.s2} interns</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
          <span className="font-medium text-emerald-800">Segment 3</span>
          <span className="text-slate-600">{internSummary.s3} interns</span>
        </div>
      </div>
      <Link to={ROUTES.reports} className="mt-4 inline-flex text-sm font-semibold text-spike hover:underline">
        Open progress reports →
      </Link>
    </div>
  );
}

function CurriculumPanel() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="spike-card">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Edit3 size={18} className="text-spike" /> Content Studio™
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          Edit curriculum blocks, day sequences, and playbook content in the CMS.
        </p>
        <Link to={ROUTES.adminContentStudio} className="spike-btn-primary inline-flex w-full justify-center">
          Open Content Studio
        </Link>
        <Link
          to={`${ROUTES.adminContentStudio}/day-builder`}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-spike hover:underline"
        >
          Day builder <ExternalLink size={14} />
        </Link>
      </div>

      <div className="spike-card">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MonitorPlay size={18} className="text-spike" /> Playbook delivery
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          Run facilitator mode with speaker notes, session guides, and cohort Day 1 oversight.
        </p>
        <Link to={ROUTES.playbook} className="spike-btn-secondary inline-flex w-full justify-center">
          Open Playbook
        </Link>
        <Link
          to={ROUTES.adminSquads}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-spike hover:underline"
        >
          Squad assignments <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}

function StaffQuickLinks({ userRole }) {
  return (
    <div className="spike-card">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Quick links</h3>
      <div className="flex flex-wrap gap-2">
        <Link to={ROUTES.mentorVentureCoach} className="spike-btn-secondary text-sm">
          <Sparkles size={16} /> Venture Coach reviews
        </Link>
        <Link to={ROUTES.reports} className="spike-btn-secondary text-sm">
          <Users size={16} /> Progress reports
        </Link>
        <Link to={ROUTES.analyticsCohortIdentity} className="spike-btn-secondary text-sm">
          <BarChart3 size={16} /> Cohort analytics
        </Link>
        {userRole === 'faculty' ? (
          <Link to={ROUTES.adminSquads} className="spike-btn-secondary text-sm">
            Squad formation
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   userRole: 'faculty' | 'mentor',
 *   user: object,
 *   interns: Array<object>,
 *   internSummary: object,
 *   pendingLogs: Array<object>,
 *   token: string | null,
 *   usingSupabaseAuth: boolean,
 *   showToast: (message: string, type?: string) => void,
 *   onLoadInterns: () => Promise<void>,
 *   onLoadPendingLogs: () => Promise<void>,
 *   initialTab?: 'overview' | 'curriculum' | 'advisory',
 * }} props
 */
export function StaffDashboardPage({
  userRole,
  user,
  interns,
  internSummary,
  pendingLogs,
  token,
  usingSupabaseAuth,
  showToast,
  onLoadInterns,
  onLoadPendingLogs,
  initialTab = 'overview',
}) {
  const tabs = userRole === 'faculty' ? FACULTY_TABS : MENTOR_TABS;
  const [tab, setTab] = useState(initialTab);

  async function approveLog(log) {
    try {
      if (usingSupabaseAuth && supabase) {
        await reviewTractionLog(log.id, 'approve');
      } else {
        if (!token) return;
        await apiFetch(`/api/traction-logs/${log.id}`, {
          token,
          method: 'PATCH',
          body: { action: 'approve' },
        });
      }
      await onLoadInterns();
      await onLoadPendingLogs();
      showToast(`Approved ${log.hours} hrs for ${log.user?.name}`);
    } catch (err) {
      showToast(err.message || 'Approve failed', 'info');
    }
  }

  async function rejectLog(log) {
    try {
      if (usingSupabaseAuth && supabase) {
        await reviewTractionLog(log.id, 'reject');
      } else {
        if (!token) return;
        await apiFetch(`/api/traction-logs/${log.id}`, {
          token,
          method: 'PATCH',
          body: { action: 'reject' },
        });
      }
      await onLoadPendingLogs();
      showToast(`Rejected log for ${log.user?.name}`, 'info');
    } catch (err) {
      showToast(err.message || 'Reject failed', 'info');
    }
  }

  const advisoryPanel = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SegmentSummary internSummary={internSummary} />

        <div className="spike-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Briefcase size={18} className="text-spike" /> Log field hours
          </h3>
          <p className="mb-4 text-sm text-slate-600">
            Submit verified field hours — totals sync to the intern record.
          </p>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const internId = e.target.internId.value;
              const hoursToAdd = Number.parseInt(e.target.hoursCompleted.value, 10);
              if (!internId || !hoursToAdd) return;
              try {
                if (usingSupabaseAuth && supabase) {
                  await updateInternProgress(internId, { hoursAdd: hoursToAdd });
                } else {
                  if (!token) return;
                  const legacyId = Number.parseInt(internId, 10);
                  await apiFetch(`/api/interns/${legacyId}/progress`, {
                    token,
                    method: 'PATCH',
                    body: { hoursAdd: hoursToAdd },
                  });
                }
                await onLoadInterns();
                showToast(`Logged ${hoursToAdd} traction hours.`);
                e.target.reset();
              } catch (err) {
                showToast(err.message || 'Failed to log hours', 'info');
              }
            }}
          >
            <label className="block">
              <span className="spike-label mb-1 block">Intern</span>
              <select
                name="internId"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
              >
                <option value="">Choose intern…</option>
                {interns.map((intern) => (
                  <option key={intern.id} value={intern.id}>
                    {intern.name} (Seg {intern.segment}) — {intern.hours}h
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="spike-label mb-1 block">Duration</span>
              <select
                name="hoursCompleted"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
              >
                <option value="">Select hours…</option>
                <option value="4">Half-day (4 hrs)</option>
                <option value="8">Full day (8 hrs)</option>
                <option value="16">Multi-day (16 hrs)</option>
              </select>
            </label>
            <button type="submit" className="spike-btn-primary w-full">
              Submit & log hours
            </button>
          </form>
        </div>
      </div>

      <div className="spike-card">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CheckCircle size={18} className="text-spike" /> Pending traction approvals
          {pendingLogs.length > 0 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-semibold text-amber-900">
              {pendingLogs.length}
            </span>
          ) : null}
        </h3>
        {pendingLogs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            No pending traction logs.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingLogs.map((log) => (
              <PendingLogCard
                key={log.id}
                log={log}
                onApprove={() => void approveLog(log)}
                onReject={() => void rejectLog(log)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PageContainer>
      <PageTitle
        subtitle={
          userRole === 'faculty'
            ? 'Curriculum tools and cohort oversight in one place.'
            : 'Coaching, approvals, and cohort health at a glance.'
        }
      >
        {userRole === 'faculty' ? 'Program Coach home' : 'Advisor home'}
      </PageTitle>

      <TabBar tabs={tabs} active={tab} onChange={setTab} className="mt-5" />

      {tab === 'overview' ? (
        <div className="mt-5 space-y-4">
          <RoleDashboardCards
            role={userRole}
            user={user}
            interns={interns}
            internSummary={internSummary}
            pendingLogs={pendingLogs.length}
          />
          <StaffQuickLinks userRole={userRole} />
          {userRole === 'faculty' ? (
            <FacultyDay1Panel
              interns={interns.map((i) => ({ id: i.id, name: i.name }))}
            />
          ) : (
            <MentorDay1Panel
              mentorId={user?.id}
              interns={interns.map((i) => ({ id: i.id, name: i.name }))}
              showToast={showToast}
            />
          )}
          <SegmentSummary internSummary={internSummary} />
        </div>
      ) : null}

      {tab === 'curriculum' && userRole === 'faculty' ? (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-slate-600">
            Manage curriculum in Content Studio and deliver sessions from the Playbook.
          </p>
          <CurriculumPanel />
        </div>
      ) : null}

      {tab === 'advisory' ? <div className="mt-5">{advisoryPanel}</div> : null}
    </PageContainer>
  );
}
