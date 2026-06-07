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
 * }} props
 */
export function BlueprintStateHeader({ state, participantId }) {
  return (
    <section className="mb-6 rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/40 p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B0000] sm:text-xs">
            SPIKE Venture Blueprint™
          </p>
          <h2 className="text-xl font-black text-gray-900 sm:text-2xl">My Venture Blueprint™</h2>
          <p className="mt-1 text-sm text-gray-600">
            Segment {state.segment} · Week {state.week} · Day {state.day} ·{' '}
            {formatCareerTrackLabel(state)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#8B0000] px-3 py-1 text-xs font-bold text-white">
            SPIKE Readiness {state.spike_readiness_score}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Blueprint"
          value={`${state.blueprint_completion}%`}
          sub="overall completion"
          accent="red"
        />
        <MetricCard
          label="Career track"
          value={formatCareerTrackLabel(state)}
          sub={state.career_position.replace(/_/g, ' ')}
          accent="blue"
        />
        <MetricCard
          label="Traction hours"
          value={state.hours}
          sub="of 600 program"
          accent="amber"
        />
        <MetricCard
          label="Learning"
          value={`${state.spike_readiness_dimensions.learning}%`}
          sub="readiness dimension"
        />
        <MetricCard
          label="Production"
          value={`${state.spike_readiness_dimensions.production}%`}
          sub="readiness dimension"
          accent="green"
        />
        <MetricCard
          label="Venture board"
          value={formatVentureBoardStatus(state.venture_board_status)}
          sub="Hour 200 gate"
          accent="amber"
        />
      </div>

      {participantId ? (
        <div className="mt-4 border-t border-red-100 pt-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Recent activity
          </p>
          <BlueprintTimelineFeed participantId={participantId} limit={4} compact />
        </div>
      ) : null}
    </section>
  );
}
