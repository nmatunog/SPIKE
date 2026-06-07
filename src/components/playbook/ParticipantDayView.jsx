import { useState } from 'react';
import { Rocket, Target, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SessionView } from './SessionView.jsx';
import { DayCompletionBar } from './DayCompletionBar.jsx';
import { DayContributionChips } from './DayContributionChips.jsx';
import { getDayCompletionSummary } from '../../lib/playbookProgress.js';
import { getDay1MissionProgress } from '../../lib/day1BuilderStorage.js';
import { BLUEPRINT_LINKS } from '../../routes/paths.js';

/**
 * @typedef {import('../../lib/contentLoader.js').DayContentBundle} DayContentBundle
 */

/**
 * @param {{
 *   bundle: DayContentBundle,
 *   participantId?: string,
 *   onProgress?: () => void,
 * }} props
 */
export function ParticipantDayView({ bundle, participantId, onProgress }) {
  const sessions = bundle.sessions?.sessions ?? [];
  const [sessionIndex, setSessionIndex] = useState(0);
  const completion = getDayCompletionSummary(participantId, bundle);
  const day1Progress = participantId ? getDay1MissionProgress(participantId) : null;
  const activeSession = sessions[sessionIndex];
  const isDay1 = bundle.day.id === 'day-segment-1-week-1-day-1';

  return (
    <div className="space-y-6">
      {isDay1 && participantId && day1Progress ? (
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
              <p className="text-xs text-slate-400">Mission progress</p>
            </div>
            <Link to={BLUEPRINT_LINKS.day1Builders} className="spike-btn-primary bg-spike hover:bg-spike-light">
              <Rocket size={16} /> Open Builders
            </Link>
          </div>
        </section>
      ) : null}

      <header className="border-b border-gray-100 pb-5">
        <div className="flex flex-wrap items-start gap-3">
          <Target className="mt-1 shrink-0 text-[#8B0000]" size={20} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8B0000]">
              Today&apos;s sessions
            </p>
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{bundle.day.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{bundle.day.theme}</p>
          </div>
        </div>
      </header>

      <DayCompletionBar
        percent={isDay1 && day1Progress ? day1Progress.percent : completion.percent}
        completedItems={isDay1 && day1Progress ? day1Progress.completed : completion.completedItems}
        totalItems={isDay1 && day1Progress ? day1Progress.total : completion.totalItems}
      />

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
          participantId={participantId}
          onProgress={onProgress}
          hideWorksheets={isDay1}
        />
      ) : (
        <p className="text-sm text-gray-500">No sessions published for this day.</p>
      )}

      <div className="rounded-xl border border-spike/15 bg-spike-muted/40 p-4">
        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-spike">
          <LayoutGrid size={14} aria-hidden />
          Where this day goes in your Blueprint
        </h4>
        <DayContributionChips contributions={bundle.contributions} />
        <div className="mt-3 flex flex-wrap gap-2">
          {isDay1 ? (
            <Link to={BLUEPRINT_LINKS.day1Builders} className="spike-btn-primary inline-flex">
              Venture Blueprint Builders™
            </Link>
          ) : null}
          <Link to={BLUEPRINT_LINKS.businessPlan} className="spike-btn-secondary inline-flex">
            Financial Canvas
          </Link>
        </div>
      </div>
    </div>
  );
}
