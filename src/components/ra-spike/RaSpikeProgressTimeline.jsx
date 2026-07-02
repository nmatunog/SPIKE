import { Lock } from 'lucide-react';

/**
 * Milestone week strip — ✓ complete · ● current · 🔒 locked
 * @param {{ currentWeek: number, totalWeeks?: number, gateWeeks?: number[] }} props
 */
export function RaSpikeProgressTimeline({ currentWeek, totalWeeks = 8, gateWeeks = [4, 8] }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2" aria-label="Program progress by week">
      {Array.from({ length: totalWeeks }, (_, i) => {
        const week = i + 1;
        const isGate = gateWeeks.includes(week);
        const isComplete = week < currentWeek;
        const isCurrent = week === currentWeek;
        const isLocked = week > currentWeek;

        let stateClass = 'border-slate-200 bg-white text-slate-400';
        let label = `Week ${week} locked`;

        if (isComplete) {
          stateClass = 'border-spike/30 bg-spike/10 text-spike';
          label = `Week ${week} complete`;
        } else if (isCurrent) {
          stateClass = 'border-spike bg-spike text-white shadow-sm';
          label = `Week ${week} current`;
        }

        return (
          <li key={week} className="flex items-center gap-1.5 sm:gap-2">
            <span
              title={label}
              aria-current={isCurrent ? 'step' : undefined}
              className={`inline-flex min-h-[2rem] min-w-[2rem] items-center justify-center rounded-full border text-xs font-bold sm:min-h-[2.25rem] sm:min-w-[2.25rem] ${stateClass} ${isGate ? 'ring-1 ring-amber-300/80' : ''}`}
            >
              {isLocked ? <Lock size={12} strokeWidth={2.5} aria-hidden /> : isComplete ? '✓' : week}
            </span>
            {week < totalWeeks ? (
              <span className="hidden h-px w-2 bg-slate-200 sm:block" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
