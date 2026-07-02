import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, Home, User, Users } from 'lucide-react';
import { useCompactNav } from '../../hooks/useCompactNav.js';
import { RA_SPIKE_PROGRAM } from '../../lib/programs/ra-spike.js';
import { internNavActiveModuleForProgram } from '../../routes/paths.js';
import { PROGRAM_SLUGS } from '../../lib/programs/constants.js';

const ICONS = {
  dashboard: Home,
  playbook: BookOpen,
  people: Users,
  analytics: User,
};

function linkClass(isActive, isMobile) {
  if (isMobile) {
    return isActive
      ? 'flex min-h-[52px] min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-2xs font-semibold text-spike'
      : 'flex min-h-[52px] min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-2xs font-medium text-slate-500 transition hover:text-slate-800';
  }
  return isActive ? 'spike-nav-pill spike-nav-pill-active' : 'spike-nav-pill spike-nav-pill-inactive';
}

function NavItems({ variant }) {
  const items = RA_SPIKE_PROGRAM.nav;
  const isMobile = variant === 'mobile';
  const { pathname } = useLocation();
  const activePath = internNavActiveModuleForProgram(pathname, PROGRAM_SLUGS.RA_SPIKE);

  return items.map(({ path, label, shortLabel, icon }) => {
    const Icon = ICONS[icon] || Home;
    const displayLabel = isMobile ? (shortLabel ?? label) : label;
    const isActive = activePath === path;

    return (
      <NavLink
        key={`${variant}-${path}`}
        to={path}
        end={path === RA_SPIKE_PROGRAM.defaultRoute}
        className={() => linkClass(isActive, isMobile)}
      >
        <Icon size={isMobile ? 22 : 18} strokeWidth={isMobile ? 2 : 2.25} aria-hidden />
        <span className={isMobile ? 'max-w-[4.5rem] truncate text-center leading-tight' : ''}>
          {displayLabel}
        </span>
      </NavLink>
    );
  });
}

/** RA-SPIKE participant navigation — Home · Playbook · Squad · Profile */
export function RaSpikeNav() {
  const compact = useCompactNav();

  if (compact) {
    return (
      <nav
        aria-label="RA-SPIKE navigation"
        className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-nav backdrop-blur supports-[backdrop-filter]:bg-white/90"
        style={{ WebkitTransform: 'translateZ(0)' }}
      >
        <div className="mx-auto flex max-w-projection items-stretch justify-around px-1 sm:px-2">
          <NavItems variant="mobile" />
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="RA-SPIKE navigation"
      className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto max-w-projection px-4 sm:px-6 lg:px-8 2xl:px-10">
        <div className="flex items-center gap-2 py-2.5 lg:py-3">
          <div className="flex min-w-0 flex-1 gap-1 sm:gap-2">
            <NavItems variant="desktop" />
          </div>
        </div>
      </div>
    </nav>
  );
}
