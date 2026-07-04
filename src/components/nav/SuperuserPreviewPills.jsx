import { useLocation, useNavigate } from 'react-router-dom';
import { formatUiRoleLabel } from '../../lib/terminology.js';
import { viewAsRoleOptionsFor } from '../../lib/superuserViewAs.js';
import { resetSuperuserInternDreamBoard } from '../../lib/superuserInternPreviewData.js';
import { SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID } from '../../lib/superuserInternPreviewData.js';
import { resetRaSpikeWeek1PortfolioLocal } from '../../lib/raSpikeWeek1Portfolio.js';
import { isRaSpikeAppPath, ROUTES } from '../../routes/paths.js';

/**
 * Compact role-preview switcher embedded in the main nav for superusers.
 * @param {{ viewAsRole: string | null, onViewAs: (role: string) => void, compact?: boolean }} props
 */
export function SuperuserPreviewPills({ viewAsRole, onViewAs, compact = false }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const raSpikeApp = isRaSpikeAppPath(pathname);
  const roleOptions = viewAsRoleOptionsFor({ raSpikeApp });
  const activeRole = viewAsRole ?? 'superuser';

  function handleResetPreviewWork() {
    if (raSpikeApp) {
      resetRaSpikeWeek1PortfolioLocal(SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID);
      navigate(ROUTES.raSpikePlaybook, { replace: true });
      return;
    }
    resetSuperuserInternDreamBoard();
    navigate(`${ROUTES.ventureBlueprint}/day-1-builders`, { replace: true });
  }

  return (
    <div
      className={`flex shrink-0 items-center gap-2 ${compact ? 'border-b border-amber-200/80 bg-amber-50/90 px-3 py-2' : 'border-r border-amber-200/70 pr-3 sm:pr-4'}`}
      role="group"
      aria-label="Preview portal as another role"
    >
      <p className={`font-semibold text-amber-950 ${compact ? 'text-2xs' : 'hidden text-xs xl:block'}`}>
        Preview
      </p>
      <div className="flex flex-wrap items-center gap-1">
        {roleOptions.map((option) => {
          const isActive = activeRole === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onViewAs(option.id)}
              className={`touch-manipulation rounded-lg font-bold transition ${
                compact
                  ? 'min-h-[32px] px-2 py-1 text-2xs'
                  : 'min-h-[34px] px-2 py-1 text-xs sm:px-2.5'
              } ${
                isActive
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-amber-100/80 text-amber-950 ring-1 ring-amber-300/60 hover:bg-amber-200/80'
              }`}
            >
              {option.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={activeRole === 'superuser'}
          onClick={() => onViewAs('superuser')}
          className={`touch-manipulation rounded-lg font-bold transition ${
            compact
              ? 'min-h-[32px] px-2 py-1 text-2xs'
              : 'min-h-[34px] px-2 py-1 text-xs sm:px-2.5'
          } ${
            activeRole === 'superuser'
              ? 'bg-amber-700 text-white shadow-sm'
              : 'bg-amber-100/80 text-amber-950 ring-1 ring-amber-300/60 hover:bg-amber-200/80'
          }`}
        >
          Superuser
        </button>
        {viewAsRole === 'intern' ? (
          <button
            type="button"
            onClick={handleResetPreviewWork}
            className={`touch-manipulation rounded-lg bg-white font-bold text-amber-900 ring-1 ring-amber-300/80 hover:bg-amber-50 ${
              compact ? 'min-h-[32px] px-2 py-1 text-2xs' : 'min-h-[34px] px-2 py-1 text-xs'
            }`}
          >
            {raSpikeApp ? 'Reset Week 1' : 'Reset dream board'}
          </button>
        ) : null}
      </div>
      {viewAsRole && !compact ? (
        <p className="hidden min-w-[8rem] text-2xs font-medium text-amber-900/80 2xl:block">
          Viewing as {formatUiRoleLabel(viewAsRole, { raSpikeApp })}
        </p>
      ) : null}
    </div>
  );
}
