import { ArrowRight, FlaskConical, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { playbookWeek2StudioHref } from '../../../routes/paths.js';
import { WEEK2_JOURNEY_PHASES } from '../../../lib/customerDiscovery/week2JourneyConstants.js';

/**
 * Coach / mentor CTA — preview the Week 2 SPIKE Studio mission journey.
 * @param {{ facultyMode?: boolean, day?: number, mission?: string, className?: string }} props
 */
export function Week2StudioLaunchCard({
  facultyMode = false,
  day = 1,
  mission = 'mission',
  className = '',
}) {
  const href = playbookWeek2StudioHref({ day, mission });
  const phaseLabels = WEEK2_JOURNEY_PHASES.map((p) => p.label);

  return (
    <section
      className={`overflow-hidden rounded-2xl border-2 border-venture-activate/30 bg-gradient-to-br from-slate-900 via-slate-900 to-spike-dark p-5 text-white shadow-card sm:p-6 lg:p-8 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-venture-activate/90">
            <FlaskConical size={16} aria-hidden />
            Week 2 interactive module
          </p>
          <h3 className="mt-2 text-xl font-bold sm:text-2xl lg:text-3xl">SPIKE Studio — Customer Discovery</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
            {facultyMode
              ? 'Walk through the same mission journey interns use — assumptions, interviews, FEC Validation Lab, and market pitch. Sample data only; nothing affects your cohort.'
              : 'Preview the squad mission workspace before your workshop. Explore tasks, encoding flows, and deliverables with sample data.'}
          </p>
        </div>
      </div>

      <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
        {phaseLabels.map((label) => (
          <li
            key={label}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 font-medium text-slate-200"
          >
            <Sparkles size={14} className="shrink-0 text-venture-activate" aria-hidden />
            {label}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to={href}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-spike shadow-lg transition hover:bg-venture-activate/10 sm:flex-none sm:px-8 sm:text-base"
        >
          Preview SPIKE Studio
          <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
