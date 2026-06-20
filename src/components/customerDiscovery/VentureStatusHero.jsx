import { getVentureStatus, getMisBreakdown } from '../../lib/customerDiscovery/week2MisService.js';

/**
 * Venture Status hero — human narrative + secondary MIS.
 * @param {{ participantId: string }} props
 */
export function VentureStatusHero({ participantId }) {
  const status = getVentureStatus(participantId);
  const mis = getMisBreakdown(participantId);

  const phaseDot =
    status.phaseColor === 'discover'
      ? 'bg-venture-discover'
      : status.phaseColor === 'validate'
        ? 'bg-venture-validate'
        : 'bg-spike';

  return (
    <section className="spike-venture-status mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="spike-label">Venture status</p>
          <p className="flex items-center gap-2 text-lg font-bold text-slate-900 sm:text-xl">
            <span className={`h-2.5 w-2.5 rounded-full ${phaseDot}`} aria-hidden />
            {status.phase}
          </p>
          <p className="text-sm text-slate-600">
            Next: <span className="font-semibold text-slate-800">{status.nextMilestone}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="spike-score-pill">Research depth · {mis.score} MIS</span>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-venture-discover to-spike transition-all duration-500"
          style={{ width: `${status.progress}%` }}
          role="progressbar"
          aria-valuenow={status.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500 tabular-nums">{status.progress}% venture progress</p>
    </section>
  );
}
