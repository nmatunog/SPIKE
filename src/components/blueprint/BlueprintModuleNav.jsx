import { NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/paths.js';
import {
  blueprintModulePath,
  blueprintModulesGroupedForTrack,
} from '../../lib/blueprintModules.js';

function moduleLinkClass(isActive, variant) {
  if (variant === 'sidebar') {
    return isActive
      ? 'block rounded-xl bg-spike px-3 py-2 text-sm font-semibold text-white shadow-sm'
      : 'block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-spike-muted hover:text-spike';
  }

  return isActive
    ? 'shrink-0 rounded-full bg-spike px-3 py-1.5 text-xs font-semibold text-white'
    : 'shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200';
}

/**
 * @param {{
 *   careerTrack: string,
 *   activeSlug?: string,
 *   variant?: 'sidebar' | 'mobile' | 'select',
 * }} props
 */
export function BlueprintModuleNav({ careerTrack, activeSlug = 'overview', variant = 'sidebar' }) {
  const navigate = useNavigate();
  const base = ROUTES.ventureBlueprint;
  const groups = blueprintModulesGroupedForTrack(careerTrack);

  if (variant === 'select') {
    return (
      <label className="block lg:hidden">
        <span className="sr-only">Blueprint section</span>
        <select
          value={activeSlug}
          onChange={(event) => {
            navigate(blueprintModulePath(event.target.value, base));
          }}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-card focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
        >
          {groups.map((group) => (
            <optgroup key={group.id} label={group.label}>
              {group.modules.map((mod) => (
                <option key={mod.slug} value={mod.slug}>
                  {mod.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    );
  }

  if (variant === 'mobile') {
    return (
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.id}>
            <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-slate-500">
              {group.label}
            </p>
            <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-0.5">
              {group.modules.map((mod) => {
                const to = blueprintModulePath(mod.slug, base);
                return (
                  <NavLink
                    key={mod.slug}
                    to={to}
                    end={mod.slug === 'overview'}
                    className={({ isActive }) => moduleLinkClass(isActive, 'mobile')}
                  >
                    {mod.shortLabel}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <nav aria-label="Blueprint modules" className="space-y-4">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-1 px-1 text-2xs font-semibold uppercase tracking-wide text-slate-400">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.modules.map((mod) => {
              const to = blueprintModulePath(mod.slug, base);
              return (
                <NavLink
                  key={mod.slug}
                  to={to}
                  end={mod.slug === 'overview'}
                  className={({ isActive }) => moduleLinkClass(isActive, 'sidebar')}
                >
                  {mod.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
