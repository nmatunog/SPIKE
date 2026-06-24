import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart,
  BookOpen,
  Briefcase,
  FlaskConical,
  LayoutDashboard,
  Rocket,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { useCompactNav } from '../../hooks/useCompactNav.js';
import { useInternPlaybookNavHref } from '../../hooks/useInternPlaybookNavHref.js';
import { internNavActiveModule, moduleNavForRole, ROUTES } from '../../routes/paths.js';
import { SuperuserPreviewPills } from './SuperuserPreviewPills.jsx';

const ICONS = {
  dashboard: LayoutDashboard,
  blueprint: Rocket,
  playbook: BookOpen,
  portfolio: Briefcase,
  research: FlaskConical,
  reports: BarChart,
  people: Users,
  analytics: Sparkles,
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
  const { pathname } = useLocation();
  const internActive = userRole === 'intern' ? internNavActiveModule(pathname) : null;
  const internPlaybookHref = useInternPlaybookNavHref();

  return items.map(({ path, label, shortLabel, icon }) => {
    const Icon = ICONS[icon] || LayoutDashboard;
    const displayLabel = isMobile ? (shortLabel ?? label) : label;
    const isActive = userRole === 'intern' ? internActive === path : undefined;
    const to = userRole === 'intern' && path === ROUTES.playbook ? internPlaybookHref : path;

    return (
      <NavLink
        key={`${variant}-${path}`}
        to={to}
        end={path === '/venture-blueprint'}
        className={({ isActive: linkActive }) =>
          linkClass(userRole === 'intern' ? isActive : linkActive, isMobile)
        }
      >
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

/**
 * @param {{ userRole: string, superuserPreview?: { viewAsRole: string | null, onViewAs: (role: string) => void } }} props
 */
export function ModuleNav({ userRole, superuserPreview }) {
  const compact = useCompactNav();
  const items = moduleNavForRole(userRole);
  if (items.length === 0) return null;

  if (compact) {
    return (
      <>
        {superuserPreview ? (
          <div
            className="safe-bottom fixed inset-x-0 bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))] z-50 border-t border-amber-200/80 bg-amber-50/95 backdrop-blur"
            style={{ WebkitTransform: 'translateZ(0)' }}
          >
            <SuperuserPreviewPills {...superuserPreview} compact />
          </div>
        ) : null}
        <nav
          aria-label="Main navigation"
          className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-nav backdrop-blur supports-[backdrop-filter]:bg-white/90"
          style={{ WebkitTransform: 'translateZ(0)' }}
        >
          <div className="mx-auto flex max-w-projection items-stretch justify-around px-1 sm:px-2">
            <NavItems userRole={userRole} variant="mobile" />
          </div>
        </nav>
      </>
    );
  }

  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-projection px-4 sm:px-6 lg:px-8 2xl:px-10">
        <div className="scrollbar-thin flex items-center gap-2 overflow-x-auto py-2.5 sm:gap-3 lg:py-3">
          {superuserPreview ? <SuperuserPreviewPills {...superuserPreview} /> : null}
          <div className="flex min-w-0 flex-1 gap-1 sm:gap-2">
            <NavItems userRole={userRole} variant="desktop" />
          </div>
        </div>
      </div>
    </nav>
  );
}
