import { NavLink } from 'react-router-dom';
import {
  BarChart,
  BookOpen,
  Briefcase,
  FlaskConical,
  LayoutDashboard,
  Rocket,
  Settings,
} from 'lucide-react';
import { useCompactNav } from '../../hooks/useCompactNav.js';
import { moduleNavForRole } from '../../routes/paths.js';

const ICONS = {
  dashboard: LayoutDashboard,
  blueprint: Rocket,
  playbook: BookOpen,
  portfolio: Briefcase,
  research: FlaskConical,
  reports: BarChart,
  admin: Settings,
};

function linkClass(isActive, isMobile) {
  if (isMobile) {
    return isActive
      ? 'flex min-h-[52px] min-w-[3.25rem] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-2xs font-semibold text-spike'
      : 'flex min-h-[52px] min-w-[3.25rem] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-2xs font-medium text-slate-500 transition hover:text-slate-800';
  }

  return isActive
    ? 'spike-nav-pill spike-nav-pill-active'
    : 'spike-nav-pill spike-nav-pill-inactive';
}

function NavItems({ userRole, variant }) {
  const items = moduleNavForRole(userRole);
  const isMobile = variant === 'mobile';

  return items.map(({ path, label, shortLabel, icon }) => {
    const Icon = ICONS[icon] || LayoutDashboard;
    const displayLabel = isMobile ? (shortLabel ?? label) : label;

    return (
      <NavLink key={`${variant}-${path}`} to={path} className={({ isActive }) => linkClass(isActive, isMobile)}>
        <Icon
          size={isMobile ? 20 : 16}
          strokeWidth={isMobile ? 2 : 2.25}
          className={isMobile ? '' : 'lg:h-[18px] lg:w-[18px] 2xl:h-5 2xl:w-5'}
          aria-hidden
        />
        <span className={isMobile ? 'max-w-[4.25rem] truncate text-center leading-tight' : ''}>
          {displayLabel}
        </span>
      </NavLink>
    );
  });
}

export function ModuleNav({ userRole }) {
  const compact = useCompactNav();
  const items = moduleNavForRole(userRole);
  if (items.length === 0) return null;

  if (compact) {
    return (
      <nav
        aria-label="Main navigation"
        className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-nav backdrop-blur supports-[backdrop-filter]:bg-white/90"
        style={{ WebkitTransform: 'translateZ(0)' }}
      >
        <div className="mx-auto flex max-w-projection items-stretch justify-around px-1 sm:px-2">
          <NavItems userRole={userRole} variant="mobile" />
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-projection px-4 sm:px-6 lg:px-8 2xl:px-10">
        <div className="scrollbar-thin flex gap-1 overflow-x-auto py-2.5 sm:gap-2 lg:py-3">
          <NavItems userRole={userRole} variant="desktop" />
        </div>
      </div>
    </nav>
  );
}
