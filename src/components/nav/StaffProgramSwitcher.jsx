import { useLocation } from 'react-router-dom';
import {
  internshipEntryHref,
  isRaSpikeAppPath,
  raSpikeStaffEntryHref,
} from '../../routes/paths.js';
import { isStaffUiRole } from '../../lib/roles.js';

/**
 * SPIKE Internship vs RA-SPIKE coach context switcher (top nav).
 * Uses full-page navigation so portal.1cma.online switches between the
 * internship Pages project and the RA-SPIKE /ra-spike proxy (separate DBs).
 * @param {{ userRole: string }} props
 */
export function StaffProgramSwitcher({ userRole }) {
  const { pathname } = useLocation();
  if (!isStaffUiRole(userRole)) return null;

  const onRaSpike = isRaSpikeAppPath(pathname);
  const raSpikeHref = raSpikeStaffEntryHref(userRole);
  const internshipHref = internshipEntryHref(userRole);

  const pill =
    'inline-flex min-h-[40px] items-center rounded-full px-4 py-2 text-xs font-bold transition sm:text-sm';

  if (onRaSpike) {
    return (
      <span
        className={`${pill} shrink-0 bg-spike text-white shadow-sm`}
        aria-current="page"
      >
        RA-SPIKE™
      </span>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1"
      role="group"
      aria-label="Program"
    >
      <a
        href={internshipHref}
        className={`${pill} ${!onRaSpike ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        aria-current={!onRaSpike ? 'page' : undefined}
      >
        SPIKE Internship
      </a>
      <a
        href={raSpikeHref}
        className={`${pill} ${onRaSpike ? 'bg-spike text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        aria-current={onRaSpike ? 'page' : undefined}
      >
        RA-SPIKE™
      </a>
    </div>
  );
}
