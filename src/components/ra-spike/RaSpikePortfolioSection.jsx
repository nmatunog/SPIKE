import { Link } from 'react-router-dom';
import {
  getRaSpikeWeekContent,
  isRaSpikeWeekContentReady,
  listRaSpikePortfolioArtifacts,
} from '../../lib/raSpikeContentLoader.js';
import { RA_SPIKE_PROGRAM } from '../../lib/programs/ra-spike.js';
import { ROUTES, raSpikePlaybookStepHref } from '../../routes/paths.js';

/**
 * Participant portfolio — only authored weeks list artifacts; others stay blank.
 * @param {{ user?: { internProgress?: object | null } }} props
 */
export function RaSpikePortfolioSection({ user: _user }) {
  const weeks = Array.from({ length: RA_SPIKE_PROGRAM.totalWeeks }, (_, i) => i + 1);

  return (
    <section className="spike-card space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">Portfolio</p>
        <p className="mt-1 text-sm text-slate-600">
          Artifacts you build in RA-SPIKE. Empty weeks mean content is not published yet.
        </p>
      </div>

      <ul className="space-y-3">
        {weeks.map((week) => {
          const content = getRaSpikeWeekContent(week);
          const ready = isRaSpikeWeekContentReady(week);
          const artifacts = listRaSpikePortfolioArtifacts(week);

          return (
            <li
              key={week}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-slate-900">
                  Week {week}: {content.title}
                </p>
                <span
                  className={`text-2xs font-semibold uppercase tracking-wide ${
                    ready ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {ready ? 'Open' : 'Blank'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{content.theme}</p>

              {ready && artifacts.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {artifacts.map((a) => (
                    <li key={a.id}>· {a.label}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No artifacts yet.</p>
              )}

              {ready ? (
                <Link
                  to={raSpikePlaybookStepHref('portfolio', week)}
                  className="mt-2 inline-block text-sm font-semibold text-spike hover:underline"
                >
                  Open Week {week} portfolio
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>

      <Link to={ROUTES.raSpikePlaybook} className="text-sm font-semibold text-spike hover:underline">
        Go to Playbook
      </Link>
    </section>
  );
}
