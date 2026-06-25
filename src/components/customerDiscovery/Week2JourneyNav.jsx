import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import {
  deriveWeek2JourneyProgress,
  getActiveWeek2Task,
  isWeek2MissionSlugForDay,
  playbookWeek2MissionHref,
} from '../../lib/customerDiscovery/week2MissionService.js';

/**
 * 5-step Week 2 mission journey — Prepare → Validate.
 * @param {{
 *   participantId: string,
 *   calendarDay?: number,
 *   activeDay?: number,
 *   activeMissionSlug?: string,
 *   onNavigate?: (slug: string, day: number) => void,
 *   playbookMode?: boolean,
 * }} props
 */
export function Week2JourneyNav({
  participantId,
  calendarDay = 5,
  activeDay,
  activeMissionSlug = '',
  onNavigate,
  playbookMode = false,
}) {
  const phases = deriveWeek2JourneyProgress(participantId, calendarDay);
  const active = playbookMode
    ? (activeDay ?? 1)
    : (activeDay ?? phases.find((p) => p.active)?.day ?? 1);

  function missionSlugForPhase(phaseDay) {
    if (
      phaseDay === active
      && activeMissionSlug
      && isWeek2MissionSlugForDay(activeMissionSlug, phaseDay)
    ) {
      return activeMissionSlug;
    }
    return getActiveWeek2Task(participantId, phaseDay).slug;
  }

  return (
    <nav aria-label="Week 2 mission journey" className="space-y-2">
      <p className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
        Week 2 journey
      </p>
      <ol className="space-y-1">
        {phases.map((phase, idx) => {
          const isActive = phase.day === active;
          const slug = missionSlugForPhase(phase.day);
          const isCurrent = isActive && slug === activeMissionSlug;

          const className = `flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
            isActive
              ? 'spike-task-active'
              : phase.complete
                ? 'spike-task-done'
                : 'spike-task-pending hover:bg-slate-50'
          } ${isCurrent && onNavigate ? 'cursor-default' : ''}`;

          const icon = (
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
          );

          const labels = (
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900">{phase.label}</span>
              <span className="block text-[10px] text-slate-500">Day {phase.programDay}</span>
            </span>
          );

          return (
            <li key={phase.id}>
              {onNavigate ? (
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => {
                    if (!isCurrent) onNavigate(slug, phase.day);
                  }}
                  className={className}
                >
                  {icon}
                  {labels}
                </button>
              ) : (
                <Link to={playbookWeek2MissionHref(slug, { day: phase.day })} className={className}>
                  {icon}
                  {labels}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
