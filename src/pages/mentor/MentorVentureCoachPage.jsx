import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import {
  MentorCoachingHistory,
  MentorCoachingSessionForm,
} from '../../components/mentor/MentorCoachingSessionForm.jsx';
import { MentorParticipantOutputs } from '../../components/mentor/MentorParticipantOutputs.jsx';
import { MentorParticipantEncodingPanel } from '../../components/mentor/MentorQuickCapture.jsx';
import { MentorWeek1SummaryPanel } from '../../components/mentor/MentorWeek1SummaryPanel.jsx';
import { MentorWeeklyAssessmentPanel } from '../../components/mentor/MentorWeeklyAssessmentPanel.jsx';
import { hydrateCoachingFromSupabase, listCoachingNotesForParticipant } from '../../lib/coachingService.js';
import { hydrateWeeklyAssessmentFromSupabase } from '../../lib/weeklyAssessmentService.js';
import { getCoachSummaryForMentor } from '../../lib/ventureCoachService.js';
import { COACH_VALUE_CARDS, VENTURE_DIRECTION_CARDS } from '../../lib/ventureCoachConstants.js';
import { labelFor } from '../../lib/ventureCoachEngine.js';
import { ROUTES } from '../../routes/paths.js';

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
  const { participantId } = useParams();
  const intern = interns.find((i) => i.id === participantId);
  const summary = participantId ? getCoachSummaryForMentor(participantId) : null;
  const [historyKey, setHistoryKey] = useState(0);
  const history = participantId ? listCoachingNotesForParticipant(participantId) : [];

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

  const trackLabel =
    VENTURE_DIRECTION_CARDS.find((c) => c.id === summary?.ventureDirection)?.label ??
    summary?.ventureDirection ??
    'Exploring';

  const topThreeLabels = (summary?.topThreeValues ?? []).map((id) => labelFor(id, COACH_VALUE_CARDS));

  function refreshHistory() {
    setHistoryKey((k) => k + 1);
  }

  return (
    <PageContainer>
      <Link
        to={ROUTES.mentorVentureCoach}
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-spike"
      >
        <ArrowLeft size={16} /> All participants
      </Link>

      <header className="mb-6">
        <p className="spike-label text-spike">Participant Coaching Card</p>
        <h1 className="text-2xl font-bold text-slate-900">{intern?.name ?? 'Participant'}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {intern?.squad ? `${intern.squad} · ` : ''}
          Venture Coach {summary?.progress?.percent ?? 0}% · {trackLabel}
        </p>
      </header>

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

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Current outputs</h2>
        <MentorParticipantOutputs participantId={participantId} participantName={intern?.name} />
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <SummaryCard title="Future Self summary" text={summary?.futureSelfSummary} />
        <SummaryCard title="Future Self narrative" text={summary?.futureSelf} collapsible defaultCollapsed />
      </section>

      {!readOnly && mentorId ? (
        <>
          <section className="mb-6">
            <MentorParticipantEncodingPanel
              mentorId={mentorId}
              participantId={participantId}
              participantName={intern?.name}
              showToast={showToast}
              onSaved={refreshHistory}
            />
          </section>

          <section className="mb-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Coaching notes</h2>
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

          <section className="mb-6">
            <details className="spike-card group">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 marker:content-none">
                <span className="inline-flex items-center gap-2">
                  End-of-week ratings
                  <span className="text-xs font-normal text-slate-500">(optional — use after Day 5)</span>
                </span>
              </summary>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <MentorWeeklyAssessmentPanel
                  mentorId={mentorId}
                  participantId={participantId}
                  showToast={showToast}
                  onSaved={refreshHistory}
                />
              </div>
            </details>
          </section>
        </>
      ) : null}

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Week 1 summary</h2>
        <MentorWeek1SummaryPanel
          participantId={participantId}
          participantName={intern?.name ?? 'Participant'}
          squad={intern?.squad}
        />
      </section>
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
