import { Link } from 'react-router-dom';
import { ArrowLeft, Cloud } from 'lucide-react';
import { ROUTES } from '../../routes/paths.js';
import { WEEK2_COHORT_NAME } from '../../lib/customerDiscovery/week2Constants.js';

/**
 * Customer Discovery Studio shell — minimal chrome, mission-first layout.
 * @param {{
 *   cohortName?: string,
 *   squadName?: string,
 *   children: import('react').ReactNode,
 *   sidebar?: import('react').ReactNode,
 *   hero?: import('react').ReactNode,
 * }} props
 */
export function StudioShell({
  cohortName = WEEK2_COHORT_NAME,
  squadName,
  children,
  sidebar,
  hero,
}) {
  return (
    <div className="animate-spike-fade-in pb-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={ROUTES.ventureBlueprint}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-spike"
        >
          <ArrowLeft size={16} aria-hidden />
          Build
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Cloud size={14} className="text-spike" aria-hidden />
          <span>Cohort {cohortName}</span>
          {squadName ? (
            <>
              <span aria-hidden>·</span>
              <span className="text-spike">{squadName}</span>
            </>
          ) : null}
        </div>
      </div>

      <header className="mb-8 space-y-2">
        <p className="spike-label text-spike">Week 2 · Customer Discovery</p>
        <h1 className="spike-mission-hero">Research Studio</h1>
        <p className="spike-mission-sub max-w-xl">
          Talk to real people. No pitches — discover their life first.
        </p>
      </header>

      {hero}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,16rem)_1fr]">
        {sidebar ? (
          <aside className="lg:sticky lg:top-24 lg:self-start">{sidebar}</aside>
        ) : null}
        <main className="min-w-0 space-y-6">{children}</main>
      </div>
    </div>
  );
}
