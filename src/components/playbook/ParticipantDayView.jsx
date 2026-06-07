import { useState } from 'react';
import { Target, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SessionView } from './SessionView.jsx';
import { DayCompletionBar } from './DayCompletionBar.jsx';
import { DayContributionChips } from './DayContributionChips.jsx';
import { getDayCompletionSummary } from '../../lib/playbookProgress.js';
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
  const activeSession = sessions[sessionIndex];

  return (
    <div className="space-y-6">
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
        percent={completion.percent}
        completedItems={completion.completedItems}
        totalItems={completion.totalItems}
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
        <Link to={BLUEPRINT_LINKS.businessPlan} className="spike-btn-secondary mt-3 inline-flex">
          Open Financial Entrepreneurship Canvas
        </Link>
      </div>
    </div>
  );
}
