import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getProgramContext } from '../../lib/programContext.js';
import { ROUTES, internNavActiveModule } from '../../routes/paths.js';

/**
 * Persistent week/day context + primary continue action for interns.
 * @param {{ internProgress?: object | null, participantId?: string }} props
 */
export function ProgramWeekRibbon({ internProgress, participantId = '' }) {
  const { pathname } = useLocation();
  const active = internNavActiveModule(pathname);
  const showRibbon =
    active === ROUTES.ventureBlueprint
    || active === ROUTES.playbook
    || active === ROUTES.myVenturePortfolio;

  if (!showRibbon || !internProgress) return null;

  const ctx = getProgramContext(internProgress, participantId);
  const onContinueTarget = pathname.startsWith(ctx.continueHref.split('?')[0]);

  return (
    <div className="border-b border-slate-200/80 bg-slate-50/95">
      <div className="mx-auto flex max-w-projection flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8 2xl:px-10">
        <p className="min-w-0 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">
            Week {ctx.week} · Day {ctx.day}
          </span>
          <span className="mx-2 text-slate-300" aria-hidden>
            ·
          </span>
          <span className="text-slate-600">{ctx.taskLabel}</span>
        </p>
        {!onContinueTarget ? (
          <Link
            to={ctx.continueHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-spike px-3 py-1.5 text-xs font-semibold text-white hover:bg-spike-light sm:text-sm"
          >
            {ctx.continueLabel}
            <ArrowRight size={14} />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
