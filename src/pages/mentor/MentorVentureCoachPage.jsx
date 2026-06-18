import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import {
  MentorCoachingHistory,
  MentorCoachingSessionForm,
} from '../../components/mentor/MentorCoachingSessionForm.jsx';
import { MentorParticipantOutputs } from '../../components/mentor/MentorParticipantOutputs.jsx';
import { MentorParticipantEncodingPanel } from '../../components/mentor/MentorQuickCapture.jsx';
import { MentorWeek1SummaryPanel } from '../../components/mentor/MentorWeek1SummaryPanel.jsx';
import { MentorWeeklyAssessmentPanel } from '../../components/mentor/MentorWeeklyAssessmentPanel.jsx';
import { StaffParticipantDreamBoardSection } from '../../components/portfolio/StaffParticipantDreamBoardSection.jsx';
import { StaffParticipantTabNav } from '../../components/staff/StaffParticipantTabNav.jsx';
import { normalizeStaffParticipantTab } from '../../lib/staffParticipantTabs.js';
import { StaffFecReadOnlyPanel } from '../../components/staff/StaffFecReadOnlyPanel.jsx';
import {
  StaffPortfolioPreviewPanel,
  StaffVentureBoardPanel,
} from '../../components/staff/StaffVentureBoardPanel.jsx';
import { hydrateCoachingFromSupabase, listCoachingNotesForParticipant } from '../../lib/coachingService.js';
import { hydrateWeeklyAssessmentFromSupabase } from '../../lib/weeklyAssessmentService.js';
import { getCoachSummaryForMentor } from '../../lib/ventureCoachService.js';
import { useParticipantHydration } from '../../hooks/useParticipantHydration.js';
import { fetchRemoteParticipantSummary } from '../../lib/participantRemoteData.js';
import { COACH_VALUE_CARDS, VENTURE_DIRECTION_CARDS } from '../../lib/ventureCoachConstants.js';
import { labelFor } from '../../lib/ventureCoachEngine.js';
import { ROUTES, parseMentorParticipantPath } from '../../routes/paths.js';
import { listParticipantClosingReflections } from '../../lib/dayClosingReflection.js';

/**
 * Participant Coaching Card — 360° profile for mentors.
 * @param {{
 *   interns?: Array<{ id: string, name: string, squad?: string }>,
 *   mentorId?: string,
 *   readOnly?: boolean,
 *   showToast?: (message: string, type?: string) => void,
 * }} props
 */
export function MentorVentureCoachPage({
  interns = [],
  mentorId = '',
  readOnly = false,
  showToast,
}) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const activeTab = normalizeStaffParticipantTab(searchParams.get('tab') ?? 'overview');
  const participantId = parseMentorParticipantPath(pathname);
  const intern = interns.find((i) => i.id === participantId);
  const { ready: dataReady, version: dataVersion, error: hydrationError } = useParticipantHydration(participantId);
  const localSummary = participantId ? getCoachSummaryForMentor(participantId) : null;
  const [remoteSummary, setRemoteSummary] = useState(null);
  const [historyKey, setHistoryKey] = useState(0);
  const history = participantId ? listCoachingNotesForParticipant(participantId) : [];
  void dataVersion;

  useEffect(() => {
    if (!participantId || !dataReady) return;
    let cancelled = false;
    (async () => {
      const remote = await fetchRemoteParticipantSummary(participantId);
      if (!cancelled) setRemoteSummary(remote);
    })();
    return () => {
      cancelled = true;
    };
  }, [participantId, dataReady, dataVersion]);

  const summary = {
    ...(localSummary ?? {}),
    ambition: remoteSummary?.ambition || localSummary?.ambition || '',
    impact: remoteSummary?.impact || localSummary?.impact || localSummary?.purpose || '',
    purpose: remoteSummary?.impact || localSummary?.impact || localSummary?.purpose || '',
    tagline: remoteSummary?.tagline || localSummary?.tagline || '',
    futureSelf: remoteSummary?.futureSelf || localSummary?.futureSelf || '',
    futureSelfSummary: remoteSummary?.futureSelfSummary || localSummary?.futureSelfSummary || '',
    topThreeValues: remoteSummary?.topThreeValues?.length
      ? remoteSummary.topThreeValues
      : localSummary?.topThreeValues ?? [],
    ventureDirection: remoteSummary?.ventureDirection || localSummary?.ventureDirection || '',
    progress: localSummary?.progress,
  };

  useEffect(() => {
    if (!participantId) return;
    let cancelled = false;
    (async () => {
      await Promise.all([
        hydrateCoachingFromSupabase(participantId),
        hydrateWeeklyAssessmentFromSupabase(participantId, 1),
      ]);
      if (!cancelled) setHistoryKey((k) => k + 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [participantId]);

  if (!participantId) {
    return (
      <PageContainer>
        <p className="text-sm text-slate-600">Select a participant to open their coaching card.</p>
      </PageContainer>
    );
  }

  if (!dataReady) {
    return (
      <PageContainer>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="animate-spin text-spike" size={18} />
          Loading participant work…
        </div>
      </PageContainer>
    );
  }

  const trackLabel =
    VENTURE_DIRECTION_CARDS.find((c) => c.id === summary?.ventureDirection)?.label ??
    summary?.ventureDirection ??
    'Exploring';

  const topThreeLabels = (summary?.topThreeValues ?? []).map((id) => labelFor(id, COACH_VALUE_CARDS));
  const closingReflections = listParticipantClosingReflections(participantId);

  function refreshHistory() {
    setHistoryKey((k) => k + 1);
  }

  return (
    <PageContainer>
      {hydrationError ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Could not load all participant data from the cloud. Showing whatever is available on this device.
        </div>
      ) : null}
      <Link
        to={ROUTES.mentorVentureCoach}
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-spike"
      >
        <ArrowLeft size={16} /> All participants
      </Link>

      <header className="mb-4">
        <p className="spike-label text-spike">Participant</p>
        <h1 className="text-2xl font-bold text-slate-900">{intern?.name ?? 'Participant'}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {intern?.squad ? `${intern.squad} · ` : ''}
          {remoteSummary?.progressPercent ?? summary?.progress?.percent ?? 0}% · {trackLabel}
        </p>
      </header>

      <StaffParticipantTabNav participantId={participantId} activeTab={activeTab} />

      {remoteSummary && !remoteSummary.hasRemoteData ? (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This participant&apos;s Day 1 work is not in the cloud yet. Ask them to{' '}
          <strong>sign in once</strong> on the device where they completed Day 1 — work uploads automatically.
        </div>
      ) : null}

      {activeTab === 'venture' ? (
        <StaffVentureBoardPanel
          participantId={participantId}
          participantName={intern?.name ?? 'Participant'}
        />
      ) : null}

      {activeTab === 'fec' ? (
        <StaffFecReadOnlyPanel
          participantId={participantId}
          participantName={intern?.name ?? 'Participant'}
        />
      ) : null}

      {activeTab === 'portfolio' ? (
        <StaffPortfolioPreviewPanel
          participantId={participantId}
          participantName={intern?.name ?? 'Participant'}
        />
      ) : null}

      {activeTab === 'feedback' && !readOnly && mentorId ? (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Quick check-in</h2>
            <p className="mb-4 text-sm text-slate-600">
              Tap a rating and add a short note — saves automatically for this intern.
            </p>
            <MentorParticipantEncodingPanel
              mentorId={mentorId}
              participantId={participantId}
              participantName={intern?.name}
              showToast={showToast}
              onSaved={refreshHistory}
            />
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Coaching session</h2>
            <MentorCoachingSessionForm
              mentorId={mentorId}
              participantId={participantId}
              showToast={showToast}
              onSaved={refreshHistory}
            />
            <div className="spike-card">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Session history</h3>
              <MentorCoachingHistory
                key={historyKey}
                history={history}
                participantId={participantId}
                onUpdated={refreshHistory}
              />
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">End-of-week ratings</h2>
            <MentorWeeklyAssessmentPanel
              mentorId={mentorId}
              participantId={participantId}
              showToast={showToast}
              onSaved={refreshHistory}
            />
          </section>
        </div>
      ) : null}

      {activeTab === 'feedback' && (readOnly || !mentorId) ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Sign in with a staff account to leave ratings and coaching notes.
        </p>
      ) : null}

      {activeTab === 'overview' ? (
        <>
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Venture identity</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <SummaryCard title="Ambition" text={summary?.ambition} />
          <SummaryCard title="Impact" text={summary?.impact ?? summary?.purpose} />
          <SummaryCard title="Values" text={topThreeLabels.length ? topThreeLabels.join(' · ') : undefined} />
          <SummaryCard title="Tagline" text={summary?.tagline} highlight />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Venture direction</h2>
        <SummaryCard title="Career track" text={trackLabel} />
      </section>

      <StaffParticipantDreamBoardSection
        participantId={participantId}
        participantName={intern?.name ?? 'Participant'}
        className="mb-6"
      />

      {closingReflections.length > 0 ? (
        <section className="mb-6 spike-card space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Playbook closing reflections</h2>
          {closingReflections.map((reflection) => (
            <article key={reflection.id} className="rounded-xl border border-amber-200/80 bg-amber-50/40 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{reflection.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {reflection.summary || 'Submitted'}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Current outputs</h2>
        <MentorParticipantOutputs participantId={participantId} participantName={intern?.name} />
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <SummaryCard title="Future Self summary" text={summary?.futureSelfSummary} />
        <SummaryCard title="Future Self narrative" text={summary?.futureSelf} collapsible defaultCollapsed />
      </section>

      {!readOnly && mentorId ? (
        <section className="mb-6">
          <Link
            to={`${ROUTES.mentorVentureCoach}/${participantId}?tab=feedback`}
            className="inline-flex rounded-xl bg-spike px-4 py-2.5 text-sm font-semibold text-white hover:bg-spike-light"
          >
            Rate &amp; comment →
          </Link>
        </section>
      ) : null}

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Week 1 summary</h2>
        <MentorWeek1SummaryPanel
          participantId={participantId}
          participantName={intern?.name ?? 'Participant'}
          squad={intern?.squad}
        />
      </section>
        </>
      ) : null}
    </PageContainer>
  );
}

/**
 * @param {{
 *   title: string,
 *   text?: string,
 *   className?: string,
 *   highlight?: boolean,
 *   collapsible?: boolean,
 *   defaultCollapsed?: boolean,
 * }} props
 */
function SummaryCard({
  title,
  text,
  className = '',
  highlight = false,
  collapsible = false,
  defaultCollapsed = false,
}) {
  const [open, setOpen] = useState(!defaultCollapsed);
  const hasText = Boolean(text?.trim());

  return (
    <div className={`spike-card ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="spike-label">{title}</p>
        {collapsible && hasText ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-semibold text-spike"
          >
            {open ? 'Collapse' : 'Expand'}
          </button>
        ) : null}
      </div>
      {hasText && (!collapsible || open) ? (
        <p
          className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${
            highlight ? 'text-lg font-semibold text-spike' : 'text-slate-700'
          }`}
        >
          {text}
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Not completed yet.</p>
      )}
    </div>
  );
}
