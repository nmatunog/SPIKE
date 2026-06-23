import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { deriveWeek2JourneyProgress } from '../../lib/customerDiscovery/week2MissionService.js';

/**
 * 5-step Week 2 mission journey — Prepare → Validate.
 * @param {{ participantId: string, calendarDay?: number, activeDay?: number }} props
 */
export function Week2JourneyNav({ participantId, calendarDay = 5, activeDay }) {
  const phases = deriveWeek2JourneyProgress(participantId, calendarDay);
  const active = activeDay ?? phases.find((p) => p.active)?.day ?? 1;

  return (
    <nav aria-label="Week 2 mission journey" className="space-y-2">
      <p className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
        Week 2 journey
      </p>
      <ol className="space-y-1">
        {phases.map((phase, idx) => {
          const isActive = phase.day === active;
          return (
            <li key={phase.id}>
              <Link
                to={phase.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'spike-task-active'
                    : phase.complete
                      ? 'spike-task-done'
                      : 'spike-task-pending hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    phase.complete
                      ? 'bg-venture-discover text-white'
                      : isActive
                        ? 'bg-spike text-white'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {phase.complete ? <Check size={14} /> : idx + 1}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-900">{phase.label}</span>
                  <span className="block text-[10px] text-slate-500">Day {phase.programDay}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
