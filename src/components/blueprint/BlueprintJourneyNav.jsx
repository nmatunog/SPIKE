import { Link } from 'react-router-dom';
import { deriveDay1Journey } from '../../lib/buildStudioService.js';
import { ROUTES, playbookHref } from '../../routes/paths.js';

/**
 * Day 1 journey sidebar — replaces LMS-style module list on Build Studio home.
 * @param {{ participantId: string, day?: number }} props
 */
export function BlueprintJourneyNav({ participantId, day = 1 }) {
  const steps = deriveDay1Journey(participantId);

  return (
    <nav aria-label="Day 1 journey" className="space-y-1">
      <p className="mb-3 px-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
        Day {day}
      </p>
      {steps.map((step) => (
        <Link
          key={step.id}
          to={step.href}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
            step.complete
              ? 'text-slate-500 hover:bg-slate-50'
              : 'font-medium text-slate-800 hover:bg-spike-muted/60'
          }`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              step.complete
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {step.complete ? '✓' : '○'}
          </span>
          <span className={step.complete ? 'line-through opacity-75' : ''}>{step.shortLabel}</span>
        </Link>
      ))}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <Link
          to={playbookHref({ week: 1, day: Math.max(2, day) })}
          className="block rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-spike"
        >
          Open Playbook →
        </Link>
      </div>
    </nav>
  );
}
