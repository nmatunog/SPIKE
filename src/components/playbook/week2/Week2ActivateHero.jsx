import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BLUEPRINT_LINKS, playbookHref } from '../../../routes/paths.js';

/**
 * Week 2 Activate hero — mission-first banner (Playbook + welcome flow).
 * @param {{
 *   variant?: 'intern' | 'mentor' | 'faculty',
 *   showActions?: boolean,
 *   className?: string,
 * }} props
 */
export function Week2ActivateHero({ variant = 'intern', showActions = true, className = '' }) {
  const isStaff = variant === 'mentor' || variant === 'faculty';

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card ${className}`}
    >
      <div className="grid lg:grid-cols-[minmax(0,42%)_1fr]">
        <div className="relative min-h-[200px] lg:min-h-[320px]">
          <img
            src="/images/week-2-activate-hero.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-left"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-white lg:via-white/80"
            aria-hidden
          />
        </div>

        <div className="relative flex flex-col justify-between px-6 py-8 sm:px-10 sm:py-10">
          <div>
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              <span className="text-venture-activate">Week 2</span>
              <span className="h-px w-8 bg-venture-activate/60" aria-hidden />
              <span>Activate</span>
            </p>
            <h2 className="mt-4 text-4xl font-black leading-none tracking-tight text-slate-900 sm:text-5xl">
              WEEK 2
              <br />
              <span className="text-venture-activate">ACTIVATE</span>
            </h2>
            <div className="mt-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-slate-200" aria-hidden />
              <p className="text-sm font-semibold text-slate-700 sm:text-base">From Ideas to Evidence</p>
              <span className="h-px flex-1 bg-slate-200" aria-hidden />
            </div>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {isStaff
                ? 'Week 2 is live — squads move from discovery into customer validation. Open Customer Discovery in Venture Blueprint or deliver Day 1 from this Playbook view.'
                : 'You completed Discover. Now your squad turns assumptions into evidence — interviews, market intelligence, and portfolio proof.'}
            </p>
            <blockquote className="mt-6 border-l-4 border-venture-activate pl-4 text-sm text-slate-700 sm:text-base">
              Great ventures are not built on assumptions. They are built on{' '}
              <span className="font-bold text-venture-activate">evidence</span>.
            </blockquote>
          </div>

          {showActions ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={BLUEPRINT_LINKS.customerDiscovery}
                className="spike-btn-primary inline-flex items-center gap-2"
              >
                Open Customer Discovery
                <ArrowRight size={16} />
              </Link>
              <Link to={playbookHref({ segment: 1, week: 2, day: 1 })} className="spike-btn-secondary">
                Playbook Week 2
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
