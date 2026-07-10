import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Settings } from 'lucide-react';
import { useCompactNav } from '../../hooks/useCompactNav.js';
import { ROUTES, isRaSpikePlaybookPath } from '../../routes/paths.js';
import { StaffProgramSwitcher } from '../nav/StaffProgramSwitcher.jsx';

function linkClass(isActive, isMobile) {
  if (isMobile) {
    return isActive
      ? 'flex min-h-[52px] min-w-[3.25rem] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-2xs font-semibold text-spike'
      : 'flex min-h-[52px] min-w-[3.25rem] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-2xs font-medium text-slate-500 transition hover:text-slate-800';
  }
  return isActive ? 'spike-nav-pill spike-nav-pill-active' : 'spike-nav-pill spike-nav-pill-inactive';
}

/**
 * RA-SPIKE staff navigation — Coach · Playbook · Admin (superuser).
 * @param {{ userRole: string, showAdmin?: boolean }} props
 */
export function RaSpikeStaffNav({ userRole, showAdmin = false }) {
  const compact = useCompactNav();
  const { pathname } = useLocation();

  const coachPath = userRole === 'mentor' ? ROUTES.mentorRaSpike : ROUTES.programCoachRaSpike;
  const items = [
    { path: coachPath, label: 'Coach hub', shortLabel: 'Coach', icon: LayoutDashboard, end: true },
    { path: ROUTES.raSpikePlaybook, label: 'Playbook', shortLabel: 'Playbook', icon: BookOpen, end: false },
  ];
  if (showAdmin) {
    items.push({
      path: ROUTES.raSpikeAdmin,
      label: 'Accounts',
      shortLabel: 'Accounts',
      icon: Settings,
      end: true,
    });
  }

  function isActive(path, end) {
    if (path === ROUTES.raSpikePlaybook) return isRaSpikePlaybookPath(pathname);
    if (end) return pathname === path;
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  const navItems = items.map((item) => {
    const { path, label, shortLabel, end } = item;
    const Icon = item.icon;
    const active = isActive(path, end);
    const displayLabel = compact ? shortLabel : label;
    return (
      <NavLink
        key={path}
        to={path}
        end={end}
        className={() => linkClass(active, compact)}
      >
        <Icon
          size={compact ? 20 : 16}
          strokeWidth={compact ? 2 : 2.25}
          className={compact ? '' : 'lg:h-[18px] lg:w-[18px] 2xl:h-5 2xl:w-5'}
          aria-hidden
        />
        <span className={compact ? 'max-w-[4.25rem] truncate text-center leading-tight' : ''}>
          {displayLabel}
        </span>
      </NavLink>
    );
  });

  if (compact) {
    return (
      <nav
        aria-label="RA-SPIKE staff navigation"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-nav backdrop-blur supports-[backdrop-filter]:bg-white/90"
        style={{ WebkitTransform: 'translateZ(0)' }}
      >
        <div className="mx-auto flex max-w-projection items-stretch justify-around gap-1 px-1 sm:px-2">
          <StaffProgramSwitcher userRole={userRole} />
          {navItems}
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="RA-SPIKE staff navigation"
      className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto max-w-projection px-4 sm:px-6 lg:px-8 2xl:px-10">
        <div className="scrollbar-thin flex items-center gap-2 overflow-x-auto py-2.5 sm:gap-3 lg:py-3">
          <StaffProgramSwitcher userRole={userRole} />
          <div className="flex min-w-0 flex-1 gap-1 sm:gap-2">{navItems}</div>
        </div>
      </div>
    </nav>
  );
}
