import { SuperuserPreviewPills } from './SuperuserPreviewPills.jsx';
import { StaffProgramSwitcher } from './StaffProgramSwitcher.jsx';

/**
 * Sticky role-preview bar — always visible for superusers (not buried in module nav).
 * @param {{ viewAsRole: string | null, onViewAs: (role: string) => void, compact?: boolean, userRole?: string }} props
 */
export function SuperuserPreviewBar({ viewAsRole, onViewAs, compact = false, userRole = 'superuser' }) {
  return (
    <div className="sticky top-0 z-[45] border-b border-amber-200/90 bg-amber-50/98 backdrop-blur supports-[backdrop-filter]:bg-amber-50/95">
      <div className="mx-auto flex max-w-projection flex-wrap items-center gap-2 px-4 py-2 sm:px-6 lg:px-8 2xl:px-10">
        <StaffProgramSwitcher userRole={userRole} />
        <SuperuserPreviewPills viewAsRole={viewAsRole} onViewAs={onViewAs} compact={compact} />
      </div>
    </div>
  );
}
