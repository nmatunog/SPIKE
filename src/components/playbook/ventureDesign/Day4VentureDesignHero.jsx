import { ArrowRight, Layout, Monitor, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BLUEPRINT_LINKS, ROUTES } from '../../../routes/paths.js';

const WORKSHOP_STEPS = [
  'Target Insight',
  'Before & After',
  'Venture Proposition',
  'Brand Identity',
  'FEC Preview',
];

const WORKSHOP_HREF = `${BLUEPRINT_LINKS.businessPlan}?start=1`;
const PROJECTION_HREF = ROUTES.playbookFecProjection;
const COACH_WORKSHOP_HREF = `${BLUEPRINT_LINKS.businessPlan}?coach=1&start=1`;

/**
 * Day 4 main hero — primary material for interns, mentors, and Program Coach.
 * @param {{
 *   variant: 'intern' | 'mentor' | 'faculty',
 *   progressPercent?: number,
 * }} props
 */
export function Day4VentureDesignHero({ variant, progressPercent = 0 }) {
  const isFaculty = variant === 'faculty';
  const isMentor = variant === 'mentor';

  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-spike/30 bg-gradient-to-br from-slate-950 via-spike-dark to-slate-900 p-6 text-white shadow-card sm:p-8 lg:p-10">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-spike/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
          <Layout size={16} aria-hidden />
          Day 4 — main hero material
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-red-100">
            Replaces Deck 02
          </span>
        </p>
        <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
          Venture Design Studio
        </h2>
        <p className="mt-1 text-lg font-semibold text-red-100/90 sm:text-xl">
          Financial Entrepreneurship Canvas Workshop
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
          {isFaculty
            ? 'Today’s delivery centers on this interactive module — not slides. Project the full FEC for your overview, then send squads into the five-step workshop.'
            : isMentor
              ? 'This is what your interns work through today: individual inputs, squad consolidation, coach feedback, and portfolio sync. Preview the workshop or the full canvas structure.'
              : 'Your squad’s main work today: five guided steps that turn market research into brand identity and your Financial Entrepreneurship Canvas draft.'}
        </p>

        {!isFaculty ? (
          <p className="mt-4 max-w-3xl rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-100">
            {isMentor ? (
              <>
                <strong className="text-amber-200">Wrap-up cue:</strong> Ask each squad to finish all five
                steps, open <strong>Generate Portfolio View</strong>, then tap{' '}
                <strong>Save to Portfolio</strong> — UVP, venture name, and FEC snapshot. No presentations yet.
              </>
            ) : (
              <>
                <strong className="text-amber-200">Wrap-up (15 min):</strong> Finish all five steps →{' '}
                <strong>Generate Portfolio View</strong> → <strong>Save to Portfolio</strong>. That stores your
                Unique Venture Proposition, venture name, and FEC snapshot. No squad presentation yet.
              </>
            )}
          </p>
        ) : null}

        <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {WORKSHOP_STEPS.map((label) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-200"
            >
              <Sparkles size={14} className="shrink-0 text-amber-300" aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {!isFaculty && progressPercent > 0 ? (
            <div className="rounded-2xl bg-white/10 px-5 py-3 text-center backdrop-blur-sm">
              <p className="text-3xl font-black">{progressPercent}%</p>
              <p className="text-2xs font-semibold uppercase tracking-wide text-slate-400">
                Design progress
              </p>
            </div>
          ) : null}

          <div className="flex flex-1 flex-wrap gap-3">
            {isFaculty ? (
              <>
                <Link
                  to={PROJECTION_HREF}
                  className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-stone-900 shadow-lg transition hover:bg-amber-300 sm:flex-none sm:px-8 sm:text-base"
                >
                  <Monitor size={18} aria-hidden />
                  FEC Canvas projection
                  <ArrowRight size={18} aria-hidden />
                </Link>
                <Link
                  to={COACH_WORKSHOP_HREF}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-spike shadow-lg hover:bg-red-50 sm:px-8"
                >
                  Squad workshop view
                </Link>
              </>
            ) : isMentor ? (
              <>
                <Link
                  to={WORKSHOP_HREF}
                  className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-spike shadow-lg hover:bg-red-50 sm:flex-none sm:px-8"
                >
                  Preview workshop
                  <ArrowRight size={18} aria-hidden />
                </Link>
                <Link
                  to={PROJECTION_HREF}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <Monitor size={18} aria-hidden />
                  FEC overview
                </Link>
              </>
            ) : (
              <Link
                to={WORKSHOP_HREF}
                className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-spike shadow-lg transition hover:bg-red-50 sm:flex-none sm:px-10 sm:text-base"
              >
                Enter Venture Design Studio
                <ArrowRight size={18} aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export { WORKSHOP_HREF, PROJECTION_HREF, COACH_WORKSHOP_HREF };
