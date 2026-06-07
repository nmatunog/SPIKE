import { CheckCircle2, Circle, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDay1MissionProgress } from '../../lib/day1BuilderService.js';
import { hasSubmittedCohortIdentity } from '../../lib/cohortFormationService.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ participantId: string, compact?: boolean }} props
 */
export function Day1MissionControl({ participantId, compact = false }) {
  const progress = getDay1MissionProgress(participantId);

  if (compact) {
    return (
      <section className="rounded-2xl border border-spike/20 bg-gradient-to-br from-white via-spike-muted/30 to-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="spike-label text-spike">Day 1 Mission</p>
            <p className="text-sm font-semibold text-slate-900">
              {progress.percent}% — Build your Venture Blueprint™
            </p>
          </div>
          <Link to={`${ROUTES.ventureBlueprint}/day-1-builders`} className="spike-btn-primary text-sm">
            Continue
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-spike/15 bg-gradient-to-br from-slate-900 via-slate-800 to-spike-dark p-6 text-white shadow-projection sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-spike-light/90">
            Welcome to SPIKE
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Mission Control
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Today&apos;s mission: build the foundation of your Venture Blueprint™ through eight
            interactive builders — define your ambition, purpose, and values like a venture founder.
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-white/10 px-5 py-4 text-center backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-slate-300">Day 1 Progress</p>
          <p className="text-4xl font-bold text-white">{progress.percent}%</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-spike-light transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <Link
        to={ROUTES.cohortIdentity}
        className="mb-4 inline-flex spike-btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20"
      >
        {hasSubmittedCohortIdentity(participantId) ? '✓ Cohort identity' : 'Shape cohort identity'}
      </Link>

      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
        Today&apos;s Mission
      </p>
      <ul className="mb-6 grid gap-2 sm:grid-cols-2">
        {progress.builders.map((builder) => (
          <li
            key={builder.id}
            className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 backdrop-blur"
          >
            {builder.completed ? (
              <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />
            ) : (
              <Circle size={20} className="shrink-0 text-slate-500" />
            )}
            <span className={builder.completed ? 'text-slate-200 line-through' : 'text-white'}>
              {builder.missionLabel}
            </span>
          </li>
        ))}
      </ul>

      <Link
        to={`${ROUTES.ventureBlueprint}/day-1-builders`}
        className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-spike px-5 py-3 text-sm font-semibold text-white transition hover:bg-spike-light"
      >
        <Rocket size={18} />
        Open Venture Blueprint Builders™
      </Link>
    </section>
  );
}
