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

export function ModuleNav({ userRole }) {
  const items = moduleNavForRole(userRole);
  if (items.length === 0) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-gray-200 bg-white px-6 py-1 shadow-sm">
      <div className="container mx-auto flex gap-2 overflow-x-auto whitespace-nowrap text-sm font-bold text-gray-600 md:gap-6">
        {items.map(({ path, label, icon }) => {
          const Icon = ICONS[icon] || LayoutDashboard;
          return (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `border-b-[3px] px-2 py-3 transition-colors ${
                  isActive
                    ? 'border-[#8B0000] text-[#8B0000]'
                    : 'border-transparent hover:text-gray-900'
                }`
              }
            >
              <span className="flex items-center gap-2">
                <Icon size={16} /> {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
