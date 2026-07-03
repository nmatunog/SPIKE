import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../routes/paths.js';
import { isStaffUiRole } from '../../lib/roles.js';

/**
 * SPIKE Internship vs RA-SPIKE coach context switcher (top nav).
 * @param {{ userRole: string }} props
 */
export function StaffProgramSwitcher({ userRole }) {
  const { pathname } = useLocation();
  if (!isStaffUiRole(userRole)) return null;

  const onRaSpike =
    pathname === ROUTES.programCoachRaSpike
    || pathname === ROUTES.mentorRaSpike
    || pathname.startsWith(`${ROUTES.programCoachRaSpike}/`)
    || pathname.startsWith(`${ROUTES.mentorRaSpike}/`);

  const raSpikeHref =
    userRole === 'mentor' ? ROUTES.mentorRaSpike : ROUTES.programCoachRaSpike;
  const internshipHref =
    userRole === 'mentor'
      ? ROUTES.mentorHome
      : userRole === 'faculty'
        ? ROUTES.programCoachHome
        : ROUTES.dashboard;

  const pill =
    'inline-flex min-h-[40px] items-center rounded-full px-4 py-2 text-xs font-bold transition sm:text-sm';

  return (
    <div
      className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1"
      role="group"
      aria-label="Program"
    >
      <Link
        to={internshipHref}
        className={`${pill} ${!onRaSpike ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
      >
        SPIKE Internship
      </Link>
      <Link
        to={raSpikeHref}
        className={`${pill} ${onRaSpike ? 'bg-spike text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
      >
        RA-SPIKE™
      </Link>
    </div>
  );
}
