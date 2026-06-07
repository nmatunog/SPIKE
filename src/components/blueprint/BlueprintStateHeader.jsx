import { MetricCard } from '../dashboard/MetricCard.jsx';
import { BlueprintTimelineFeed } from './BlueprintTimelineFeed.jsx';
import {
  formatCareerTrackLabel,
  formatVentureBoardStatus,
} from '../../lib/participantState.js';

/**
 * @param {{
 *   state: ReturnType<import('../../lib/participantState.js').buildParticipantState>,
 *   participantId?: string,
 *   variant?: 'full' | 'compact',
 * }} props
 */
export function BlueprintStateHeader({ state, participantId, variant = 'full' }) {
  const progressPct = Math.min(100, Math.max(0, state.blueprint_completion));

  if (variant === 'compact') {
    return (
      <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="spike-label">Week {state.week} · Day {state.day}</p>
            <p className="mt-0.5 truncate text-sm font-medium text-slate-800">
              {formatCareerTrackLabel(state)}
            </p>
            <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-spike transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-2xs text-slate-500">{progressPct}% blueprint complete</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-xl bg-spike-muted px-3 py-2 text-center">
              <p className="spike-label">Readiness</p>
              <p className="text-lg font-semibold text-spike">{state.spike_readiness_score}</p>
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-spike-muted/40 p-4 shadow-card sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="spike-label text-spike">Venture Blueprint</p>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Your progress
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Segment {state.segment} · Week {state.week} · Day {state.day} ·{' '}
            {formatCareerTrackLabel(state)}
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 sm:max-w-xs">
          <div
            className="h-full rounded-full bg-spike transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          compact
          label="Blueprint"
          value={`${state.blueprint_completion}%`}
          sub="overall completion"
          accent="red"
        />
        <MetricCard
          compact
          label="Traction"
          value={`${state.hours}h`}
          sub="of 600 program hours"
          accent="amber"
        />
        <MetricCard
          compact
          label="Readiness"
          value={String(state.spike_readiness_score)}
          sub="SPIKE score"
          accent="blue"
        />
        <MetricCard
          compact
          label="Venture board"
          value={formatVentureBoardStatus(state.venture_board_status)}
          sub="Milestone gate"
          accent="green"
        />
      </div>

      {participantId ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 spike-label">Recent activity</p>
          <BlueprintTimelineFeed participantId={participantId} limit={3} compact />
        </div>
      ) : null}
    </section>
  );
}
