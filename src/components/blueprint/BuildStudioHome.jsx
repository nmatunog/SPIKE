import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  deriveDay1Journey,
  derivePortfolioPages,
  deriveRecentWin,
  deriveTodayMission,
  firstNameFromUser,
} from '../../lib/buildStudioService.js';
import { isDay1MissionActive } from '../../lib/day1BuilderService.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{
 *   participantId: string,
 *   participantName?: string,
 *   state: { week: number, day: number },
 * }} props
 */
export function BuildStudioHome({ participantId, participantName = 'Builder', state }) {
  const firstName = firstNameFromUser(participantName);
  const day1Active = isDay1MissionActive(state.week, state.segment);
  const mission = deriveTodayMission(participantId, state);
  const journey = day1Active ? deriveDay1Journey(participantId) : mission.journey;
  const recentWin = deriveRecentWin(participantId);
  const portfolio = derivePortfolioPages(participantId);
  const dayLabel = `Day ${state.day}`;
  const heroLine = day1Active
    ? "Today you'll build your Venture Blueprint."
    : "Today you'll take another step toward building your venture.";

  return (
    <div className="space-y-8">
      {/* Welcome hero */}
      <section className="relative overflow-hidden rounded-3xl px-1 pt-2 sm:px-2">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-spike/10 blur-3xl"
        />
        <p className="text-sm font-medium text-slate-500">Good morning, {firstName}.</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
          {heroLine}
        </h1>
        <Link
          to={mission.href}
          className="mt-8 inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-spike px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-spike/25 transition hover:bg-spike-light hover:shadow-spike/30"
        >
          Continue {dayLabel}
          <ArrowRight size={20} />
        </Link>
      </section>

      {/* Build Studio hero card */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-spike-dark p-6 text-white shadow-2xl shadow-slate-900/20 sm:p-8 lg:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-spike/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl"
        />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spike-light/80">
            Build Studio
          </p>

          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-400">{dayLabel} · {mission.stepLabel}</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                {mission.title}
              </h2>
              {mission.coachReady ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                  <Sparkles size={16} className="text-spike-light" />
                  AI Venture Coach™ is ready — continue where you left off.
                </p>
              ) : null}
              <p className="mt-2 text-sm text-slate-400">
                Estimated · {mission.estimatedMinutes} min
              </p>
            </div>

            <Link
              to={mission.href}
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-spike-muted"
            >
              Continue
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>{dayLabel} progress</span>
              <span className="text-white">{mission.progressPercent}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10 backdrop-blur">
              <div
                className="h-full rounded-full bg-gradient-to-r from-spike-light to-spike transition-all duration-700 ease-out"
                style={{ width: `${mission.progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-400">Building Your Venture Blueprint™</p>
          </div>
        </div>
      </section>

      <div className={`grid gap-6 ${journey.length ? 'lg:grid-cols-[1fr_280px]' : ''}`}>
        {journey.length ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 backdrop-blur sm:p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Today&apos;s Journey
          </h3>
          <ol className="mt-4 space-y-3">
            {journey.map((step) => (
              <li key={step.id}>
                <Link
                  to={step.href}
                  className={`flex items-center gap-4 rounded-xl px-3 py-3 transition ${
                    step.complete
                      ? 'bg-emerald-50/80 text-slate-600'
                      : 'bg-slate-50 hover:bg-spike-muted/50'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      step.complete
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-slate-700 ring-1 ring-slate-200'
                    }`}
                  >
                    {step.complete ? '✓' : step.index}
                  </span>
                  <span className={`font-medium ${step.complete ? 'line-through opacity-70' : 'text-slate-900'}`}>
                    {step.label}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
        ) : null}

        <div className={`space-y-4 ${journey.length ? '' : 'max-w-sm'}`}>
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            <h3 className="text-sm font-semibold text-slate-900">Venture Portfolio™</h3>
            <p className="mt-1 text-xs text-slate-500">Every milestone adds a page.</p>
            <div className="mt-4 grid grid-cols-4 gap-1.5">
              {Array.from({ length: portfolio.total }, (_, i) => (
                <div
                  key={i}
                  className={`aspect-[3/4] rounded-md border transition ${
                    i < portfolio.filled
                      ? 'border-spike/30 bg-gradient-to-br from-spike-muted to-white shadow-sm'
                      : 'border-slate-100 bg-slate-50'
                  }`}
                />
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold text-spike">{portfolio.percent}% complete</p>
            <Link
              to={ROUTES.myVenturePortfolio}
              className="mt-3 inline-flex text-sm font-semibold text-spike hover:underline"
            >
              Open portfolio →
            </Link>
          </section>

          {recentWin ? (
            <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Recent win</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{recentWin.message}</p>
              <p className="mt-1 text-xs text-slate-600">{recentWin.sub}</p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
