import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { COACH_SECTIONS } from '../../lib/ventureCoachConstants.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ progress: ReturnType<import('../../lib/ventureCoachService.js').getCoachProgress>, activeSection?: string }} props
 */
export function CoachProgressSidebar({ progress, activeSection }) {
  return (
    <aside className="spike-card space-y-4 p-4">
      <div>
        <p className="spike-label">Venture Blueprint Completion</p>
        <p className="text-3xl font-bold text-slate-900">{progress.percent}%</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-spike transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>

      <ul className="space-y-1">
        {COACH_SECTIONS.map((section) => {
          const done = progress.sections.find((s) => s.id === section.id)?.completed;
          const active = activeSection === section.id;
          return (
            <li key={section.id}>
              <Link
                to={`${ROUTES.ventureBlueprint}/coach/${section.route}`}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                  active ? 'bg-spike text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {done ? (
                  <CheckCircle2 size={16} className={active ? 'text-white' : 'text-emerald-600'} />
                ) : (
                  <Circle size={16} className={active ? 'text-white/70' : 'text-slate-400'} />
                )}
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {progress.badges.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Badges</p>
          <div className="flex flex-wrap gap-1">
            {progress.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-amber-50 px-2 py-1 text-2xs font-semibold text-amber-900"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {progress.percent >= 100 ? (
        <Link
          to={`${ROUTES.ventureBlueprint}/portfolio`}
          className="block rounded-xl bg-spike px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-spike-light"
        >
          View Venture Portfolio
        </Link>
      ) : null}
    </aside>
  );
}
