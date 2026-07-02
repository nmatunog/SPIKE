import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{
 *   squadName?: string | null,
 *   memberCount?: number,
 *   squadObjective?: string,
 *   forming?: boolean,
 * }} props
 */
export function RaSpikeSquadSummaryCard({
  squadName,
  memberCount = 0,
  squadObjective = '',
  forming = false,
}) {
  return (
    <section className="spike-card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="shrink-0 text-spike" size={20} aria-hidden />
          <p className="text-sm font-semibold text-slate-900">Your squad</p>
        </div>
        <Link
          to={ROUTES.raSpikeSquad}
          className="text-2xs font-semibold uppercase tracking-wide text-spike hover:underline"
        >
          View squad
        </Link>
      </div>

      {forming || !squadName ? (
        <div>
          <p className="text-lg font-bold text-slate-900">Squad forming</p>
          <p className="mt-1 text-sm text-slate-600">
            Your coach will assign squads before the first workshop. Check back soon.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-lg font-bold text-slate-900">{squadName}</p>
          <p className="mt-1 text-sm text-slate-600">
            {memberCount > 1
              ? `${memberCount} members in your cohort team`
              : 'You are the first member — teammates joining soon'}
          </p>
        </div>
      )}

      {squadObjective ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
          <p className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
            Squad objective this week
          </p>
          <p className="mt-1 text-sm text-slate-700">{squadObjective}</p>
        </div>
      ) : null}

      <Link
        to={ROUTES.raSpikeSquad}
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-spike hover:underline"
      >
        Squad hub
        <ArrowRight size={16} aria-hidden />
      </Link>
    </section>
  );
}
