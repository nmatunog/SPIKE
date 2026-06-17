import { useState, useMemo } from 'react';
import { Rocket, Target, LayoutGrid, FlaskConical, Layout } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { SessionView } from './SessionView.jsx';
import { DayClosingReflectionSection } from './DayClosingReflectionSection.jsx';
import { DayCompletionBar } from './DayCompletionBar.jsx';
import { DayContributionChips } from './DayContributionChips.jsx';
import { MentorPlaybookView } from './MentorPlaybookView.jsx';
import { getDayCompletionSummary } from '../../lib/playbookProgress.js';
import { getDay1MissionProgress } from '../../lib/day1BuilderStorage.js';
import {
  loadVentureStudioState,
  ventureStudioProgressPercent,
} from '../../lib/ventureStudioStorage.js';
import {
  loadVentureDesignRecord,
  ventureDesignProgressPercent,
} from '../../lib/ventureDesignStudioService.js';
import { BLUEPRINT_LINKS, playbookHref, ROUTES } from '../../routes/paths.js';
import { UNLOCK_WEEK1_DAY2_PLUS } from '../../lib/programUnlocks.js';

/**
 * @typedef {import('../../lib/contentLoader.js').DayContentBundle} DayContentBundle
 */

/**
 * @param {{
 *   bundle: DayContentBundle,
 *   participantId?: string,
 *   onProgress?: () => void,
 *   staffPreview?: boolean,
 *   interns?: Array<{ id: string, name: string }>,
 *   mentorId?: string,
 * }} props
 */
export function ParticipantDayView({
  bundle,
  participantId,
  onProgress,
  staffPreview = false,
  interns = [],
  mentorId,
}) {
  const location = useLocation();
  const sessions = bundle.sessions?.sessions ?? [];
  const [sessionIndex, setSessionIndex] = useState(0);
  const completion = getDayCompletionSummary(participantId, bundle);
  const day1Progress = participantId ? getDay1MissionProgress(participantId) : null;
  const ventureStudioState = useMemo(
    () => (participantId ? loadVentureStudioState(participantId) : null),
    [participantId, location.pathname],
  );
  const ventureStudioPercent = ventureStudioState
    ? ventureStudioProgressPercent(ventureStudioState)
    : 0;
  const ventureDesignState = useMemo(
    () => (participantId ? loadVentureDesignRecord(participantId) : null),
    [participantId, location.pathname],
  );
  const ventureDesignPercent = ventureDesignState
    ? ventureDesignProgressPercent(ventureDesignState)
    : 0;
  const activeSession = sessions[sessionIndex];
  const isDay1 = bundle.day.id === 'day-segment-1-week-1-day-1';
  const isDay3 = bundle.day.id === 'day-segment-1-week-1-day-3';
  const isDay4 = bundle.day.id === 'day-segment-1-week-1-day-4';
  const ventureDesignHref = `${BLUEPRINT_LINKS.businessPlan}?start=1`;

  return (
    <div className="space-y-6">
      {staffPreview ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <p className="font-semibold">Participant curriculum preview</p>
          <p className="mt-1 text-sky-900">
            This is the same Playbook day interns see — slides, activities, and Venture Studio. Open{' '}
            <Link to={ROUTES.mentorVentureCoach} className="font-semibold text-spike hover:underline">
              People
            </Link>{' '}
            to review their submissions and dream boards.
          </p>
        </div>
      ) : null}

      {isDay1 && staffPreview ? (
        <section className="overflow-hidden rounded-2xl border border-spike/20 bg-gradient-to-br from-slate-900 to-spike-dark p-5 text-white shadow-card sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-spike-light/90">
            Venture Blueprint Builders™
          </p>
          <h3 className="mt-2 text-xl font-bold">Day 1 — Build your foundation</h3>
          <p className="mt-2 text-sm text-slate-300">
            Interns skip worksheets and use interactive builders on their own devices. Review their
            dream boards and vision work in People.
          </p>
        </section>
      ) : isDay1 && participantId && day1Progress ? (
        <section className="overflow-hidden rounded-2xl border border-spike/20 bg-gradient-to-br from-slate-900 to-spike-dark p-5 text-white shadow-card sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-spike-light/90">
            Venture Blueprint Builders™
          </p>
          <h3 className="mt-2 text-xl font-bold">Day 1 — Build your foundation</h3>
          <p className="mt-2 text-sm text-slate-300">
            Skip worksheets. Use interactive builders that feed your Venture Blueprint automatically.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-3xl font-bold">{day1Progress.percent}%</p>
              <p className="text-xs text-slate-400">Build progress</p>
            </div>
            <Link to={BLUEPRINT_LINKS.day1Builders} className="spike-btn-primary bg-spike hover:bg-spike-light">
              <Rocket size={16} /> Open Builders
            </Link>
          </div>
        </section>
      ) : null}

      {isDay3 ? (
        <section className="overflow-hidden rounded-2xl border border-spike/20 bg-gradient-to-br from-slate-900 to-spike-dark p-5 text-white shadow-card sm:p-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-200/90">
            <FlaskConical size={16} aria-hidden />
            Day 3 interactive module
          </p>
          <h3 className="mt-2 text-xl font-bold">Venture Studio — Market Discovery</h3>
          <p className="mt-2 text-sm text-slate-300">
            {staffPreview
              ? 'Preview the squad workspace interns use: five steps, evidence library, coach feedback, and a Day 4 canvas draft.'
              : 'Replace Deck 02 slides with a guided squad workspace: five steps, evidence library, coach feedback, and a Day 4 canvas draft.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {participantId && ventureStudioPercent > 0 ? (
              <div>
                <p className="text-3xl font-bold">{ventureStudioPercent}%</p>
                <p className="text-xs text-slate-400">Studio progress</p>
              </div>
            ) : null}
            <Link
              to={ROUTES.playbookVentureStudio}
              className="spike-btn-primary inline-flex min-h-[48px] items-center bg-white text-spike hover:bg-red-50"
            >
              <FlaskConical size={16} aria-hidden />
              {staffPreview ? 'Preview Venture Studio' : 'Enter Venture Studio'}
            </Link>
          </div>
        </section>
      ) : null}

      {isDay4 ? (
        <section className="overflow-hidden rounded-2xl border border-spike/20 bg-gradient-to-br from-slate-900 to-spike-dark p-5 text-white shadow-card sm:p-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-200/90">
            <Layout size={16} aria-hidden />
            Day 4 interactive module
          </p>
          <h3 className="mt-2 text-xl font-bold">Venture Design Studio — FEC Workshop</h3>
          <p className="mt-2 text-sm text-slate-300">
            {staffPreview
              ? 'Preview the squad workspace interns use: five steps, research hydration, coach feedback, and FEC canvas sync.'
              : 'Replace Deck 02 slides with a guided workshop: target insight, brand identity, and Financial Entrepreneurship Canvas preview.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {participantId && ventureDesignPercent > 0 ? (
              <div>
                <p className="text-3xl font-bold">{ventureDesignPercent}%</p>
                <p className="text-xs text-slate-400">Design progress</p>
              </div>
            ) : null}
            <Link
              to={ventureDesignHref}
              className="spike-btn-primary inline-flex min-h-[48px] items-center bg-white text-spike hover:bg-red-50"
            >
              <Layout size={16} aria-hidden />
              {staffPreview ? 'Preview Venture Design Studio' : 'Enter Venture Design Studio'}
            </Link>
          </div>
        </section>
      ) : null}

      <header className="border-b border-gray-100 pb-5">
        <div className="flex flex-wrap items-start gap-3">
          <Target className="mt-1 shrink-0 text-[#8B0000]" size={20} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8B0000]">
              {staffPreview ? 'Day sessions' : "Today's sessions"}
            </p>
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{bundle.day.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{bundle.day.theme}</p>
            {!staffPreview && isDay1 && UNLOCK_WEEK1_DAY2_PLUS ? (
              <Link
                to={playbookHref({ week: 1, day: 2 })}
                className="mt-3 inline-flex text-sm font-semibold text-spike hover:underline"
              >
                Continue to Day 2 Playbook →
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {!staffPreview ? (
        <DayCompletionBar
          percent={
            isDay1 && day1Progress
              ? day1Progress.percent
              : isDay3 && ventureStudioPercent > 0
                ? Math.max(completion.percent, ventureStudioPercent)
                : isDay4 && ventureDesignPercent > 0
                  ? Math.max(completion.percent, ventureDesignPercent)
                  : completion.percent
          }
          completedItems={
            isDay1 && day1Progress ? day1Progress.completed : completion.completedItems
          }
          totalItems={isDay1 && day1Progress ? day1Progress.total : completion.totalItems}
        />
      ) : null}

      {sessions.length > 1 ? (
        <div className="spike-scroll-tabs">
          {sessions.map((session, idx) => (
            <button
              key={session.id}
              type="button"
              onClick={() => setSessionIndex(idx)}
              className={`min-h-[44px] shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition lg:px-4 lg:text-base ${
                sessionIndex === idx
                  ? 'spike-nav-pill-active'
                  : 'spike-nav-pill-inactive bg-slate-100'
              }`}
            >
              S{session.sessionNumber}: {session.title}
            </button>
          ))}
        </div>
      ) : null}

      {activeSession ? (
        <SessionView
          session={activeSession}
          bundle={bundle}
          participantId={staffPreview ? undefined : participantId}
          onProgress={onProgress}
          hideWorksheets={isDay1}
          hidePersonaWorksheet={isDay3}
          staffPreview={staffPreview}
        />
      ) : (
        <p className="text-sm text-gray-500">No sessions published for this day.</p>
      )}

      {staffPreview ? (
        <section className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-4 sm:p-6">
          <MentorPlaybookView bundle={bundle} interns={interns} mentorId={mentorId} />
        </section>
      ) : null}

      {!staffPreview ? (
        <DayClosingReflectionSection
          bundle={bundle}
          participantId={participantId}
          onCompleted={onProgress}
        />
      ) : null}

      <div className="rounded-xl border border-spike/15 bg-spike-muted/40 p-4">
        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-spike">
          <LayoutGrid size={14} aria-hidden />
          Where this day goes in the Blueprint
        </h4>
        <DayContributionChips contributions={bundle.contributions} />
        {!staffPreview ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {isDay1 ? (
              <Link to={BLUEPRINT_LINKS.day1Builders} className="spike-btn-primary inline-flex">
                Venture Blueprint Builders™
              </Link>
            ) : null}
            {isDay3 ? (
              <Link to={ROUTES.playbookVentureStudio} className="spike-btn-primary inline-flex">
                Venture Studio
              </Link>
            ) : null}
            {isDay4 ? (
              <Link to={ventureDesignHref} className="spike-btn-primary inline-flex">
                Venture Design Studio
              </Link>
            ) : null}
            <Link to={BLUEPRINT_LINKS.businessPlan} className="spike-btn-secondary inline-flex">
              Financial Canvas
            </Link>
          </div>
        ) : isDay3 ? (
          <div className="mt-3">
            <Link to={ROUTES.playbookVentureStudio} className="spike-btn-primary inline-flex">
              Preview Venture Studio
            </Link>
          </div>
        ) : isDay4 ? (
          <div className="mt-3">
            <Link to={ventureDesignHref} className="spike-btn-primary inline-flex">
              Preview Venture Design Studio
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
