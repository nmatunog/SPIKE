import { SuperuserPreviewPills } from './SuperuserPreviewPills.jsx';
import { StaffProgramSwitcher } from './StaffProgramSwitcher.jsx';
import { isStaffUiRole } from '../../lib/roles.js';

/**
 * Sticky staff bar — program switcher for coaches; role preview for superusers.
 * @param {{ viewAsRole: string | null, onViewAs: (role: string) => void, compact?: boolean, userRole?: string }} props
 */
export function SuperuserPreviewBar({ viewAsRole, onViewAs, compact = false, userRole = 'superuser' }) {
  const showSwitcher = isStaffUiRole(userRole);
  const showPreview = userRole === 'superuser';
  if (!showSwitcher && !showPreview) return null;

  return (
    <div className="sticky top-0 z-[45] border-b border-amber-200/90 bg-amber-50/98 backdrop-blur supports-[backdrop-filter]:bg-amber-50/95">
      <div className="mx-auto flex max-w-projection flex-wrap items-center gap-2 px-4 py-2 sm:px-6 lg:px-8 2xl:px-10">
        {showSwitcher ? <StaffProgramSwitcher userRole={userRole} /> : null}
        {showPreview ? (
          <SuperuserPreviewPills viewAsRole={viewAsRole} onViewAs={onViewAs} compact={compact} />
        ) : null}
      </div>
    </div>
  );
}
