import { NavLink } from 'react-router-dom';
import {
  BarChart,
  BookOpen,
  Briefcase,
  FlaskConical,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { moduleNavForRole } from '../../routes/paths.js';

const ICONS = {
  dashboard: LayoutDashboard,
  playbook: BookOpen,
  portfolio: Briefcase,
  research: FlaskConical,
  reports: BarChart,
  admin: Settings,
};

function NavItems({ userRole, variant }) {
  const items = moduleNavForRole(userRole);
  const isMobile = variant === 'mobile';

  return items.map(({ path, label, icon }) => {
    const Icon = ICONS[icon] || LayoutDashboard;
    return (
      <NavLink
        key={`${variant}-${path}`}
        to={path}
        className={({ isActive }) =>
          isMobile
            ? `flex min-h-[52px] min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-bold transition-colors ${
                isActive ? 'text-[#8B0000]' : 'text-gray-500'
              }`
            : `border-b-[3px] px-2 py-3 transition-colors sm:px-3 ${
                isActive
                  ? 'border-[#8B0000] text-[#8B0000]'
                  : 'border-transparent hover:text-gray-900'
              }`
        }
      >
        <Icon size={isMobile ? 20 : 16} aria-hidden />
        <span className={isMobile ? 'max-w-[4.5rem] truncate text-center leading-tight' : ''}>
          {label}
        </span>
      </NavLink>
    );
  });
}

export function ModuleNav({ userRole }) {
  const items = moduleNavForRole(userRole);
  if (items.length === 0) return null;

  return (
    <>
      {/* Tablet / desktop — sticky top bar */}
      <div className="sticky top-0 z-40 hidden border-b border-gray-200 bg-white md:block">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="scrollbar-thin flex gap-1 overflow-x-auto whitespace-nowrap text-sm font-bold text-gray-600 sm:gap-4 lg:gap-6">
            <NavItems userRole={userRole} variant="desktop" />
          </div>
        </div>
      </div>

      {/* Mobile — fixed bottom tab bar */}
      <nav
        aria-label="Module navigation"
        className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur md:hidden"
      >
        <div className="flex items-stretch justify-around px-1">
          <NavItems userRole={userRole} variant="mobile" />
        </div>
      </nav>
    </>
  );
}
