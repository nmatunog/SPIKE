import { Eye } from 'lucide-react';
import { formatUiRoleLabel } from '../../lib/terminology.js';
import { VIEW_AS_ROLE_OPTIONS } from '../../lib/superuserViewAs.js';

export function SuperuserViewAsBar({ viewAsRole, onViewAs }) {
  const activeRole = viewAsRole ?? 'superuser';
  const viewingLabel = formatUiRoleLabel(activeRole);

  return (
    <div className="sticky top-0 z-40 border-b border-amber-300/80 bg-amber-50 text-amber-950 shadow-sm">
      <div className="mx-auto flex max-w-projection flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:py-2.5 2xl:px-10">
        <div className="flex min-w-0 items-center gap-2">
          <Eye size={16} className="shrink-0 text-amber-700" aria-hidden />
          <p className="text-xs font-semibold leading-snug sm:text-sm">
            {viewAsRole ? (
              <>
                Viewing as{' '}
                <span className="rounded-md bg-amber-200/80 px-1.5 py-0.5 text-amber-950">
                  {viewingLabel}
                </span>
                <span className="ml-1 font-normal text-amber-800/90">(signed in as Superuser)</span>
              </>
            ) : (
              <>
                Viewing as{' '}
                <span className="rounded-md bg-amber-200/80 px-1.5 py-0.5 text-amber-950">
                  Superuser
                </span>
              </>
            )}
          </p>
        </div>

        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Preview portal as another role"
        >
          {VIEW_AS_ROLE_OPTIONS.map((option) => {
            const isActive = activeRole === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onViewAs(option.id)}
                className={`min-h-[36px] touch-manipulation rounded-lg px-2.5 py-1 text-xs font-bold transition sm:px-3 sm:text-sm ${
                  isActive
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'bg-white text-amber-900 ring-1 ring-amber-300/80 hover:bg-amber-100'
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
            className={`min-h-[36px] touch-manipulation rounded-lg px-2.5 py-1 text-xs font-bold transition sm:px-3 sm:text-sm ${
              activeRole === 'superuser'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-white text-amber-900 ring-1 ring-amber-300/80 hover:bg-amber-100'
            }`}
          >
            Superuser
          </button>
        </div>
      </div>
    </div>
  );
}
