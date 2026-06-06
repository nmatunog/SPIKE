import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes/paths.js';
import { blueprintModulesForTrack } from '../../lib/blueprintModules.js';

/**
 * @param {{ careerTrack: string, variant?: 'sidebar' | 'mobile' }} props
 */
export function BlueprintModuleNav({ careerTrack, variant = 'sidebar' }) {
  const modules = blueprintModulesForTrack(careerTrack);
  const base = ROUTES.ventureBlueprint;

  if (variant === 'mobile') {
    return (
      <div className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {modules.map((mod) => {
          const to = mod.slug === 'overview' ? base : `${base}/${mod.slug}`;
          return (
            <NavLink
              key={mod.slug}
              to={to}
              end={mod.slug === 'overview'}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? 'bg-[#8B0000] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`
              }
            >
              {mod.shortLabel}
            </NavLink>
          );
        })}
      </div>
    );
  }

  return (
    <nav aria-label="Blueprint modules" className="space-y-1">
      {modules.map((mod) => {
        const to = mod.slug === 'overview' ? base : `${base}/${mod.slug}`;
        return (
          <NavLink
            key={mod.slug}
            to={to}
            end={mod.slug === 'overview'}
            className={({ isActive }) =>
              `block rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                isActive
                  ? 'bg-[#8B0000] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-red-50 hover:text-[#8B0000]'
              }`
            }
          >
            <span className="block">{mod.label}</span>
            <span
              className={`mt-0.5 block text-[11px] font-medium ${
                mod.slug === 'overview' ? '' : 'opacity-80'
              }`}
            >
              {mod.description}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
