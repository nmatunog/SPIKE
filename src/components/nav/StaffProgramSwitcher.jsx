import { useLocation } from 'react-router-dom';
import {
  internshipEntryHref,
  isRaSpikeAppPath,
  raSpikeStaffEntryHref,
} from '../../routes/paths.js';

/**
 * Superuser-only switch between SPIKE Internship and RA-SPIKE portals (separate DBs).
 * @param {{ userRole: string }} props
 */
export function StaffProgramSwitcher({ userRole }) {
  const { pathname } = useLocation();
  if (userRole !== 'superuser') return null;

  const onRaSpike = isRaSpikeAppPath(pathname);
  const raSpikeHref = raSpikeStaffEntryHref(userRole);
  const internshipHref = internshipEntryHref(userRole);

  const pill =
    'inline-flex min-h-[40px] items-center rounded-full px-4 py-2 text-xs font-bold transition sm:text-sm';

  return (
    <div
      className="flex shrink-0 items-center gap-1 rounded-full border border-amber-300/80 bg-amber-100/60 p-1"
      role="group"
      aria-label="Program portal"
    >
      <a
        href={internshipHref}
        className={`${pill} ${!onRaSpike ? 'bg-amber-800 text-white shadow-sm' : 'text-amber-950 hover:bg-amber-200/80'}`}
        aria-current={!onRaSpike ? 'page' : undefined}
      >
        SPIKE Internship
      </a>
      <a
        href={raSpikeHref}
        className={`${pill} ${onRaSpike ? 'bg-amber-800 text-white shadow-sm' : 'text-amber-950 hover:bg-amber-200/80'}`}
        aria-current={onRaSpike ? 'page' : undefined}
      >
        RA-SPIKE™
      </a>
    </div>
  );
}
