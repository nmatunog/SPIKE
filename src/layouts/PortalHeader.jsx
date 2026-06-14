import { LogOut } from 'lucide-react';
import { formatUiRoleLabel } from '../lib/terminology.js';

export function PortalHeader({ userRole, user, setupMeta, onLogout }) {
  return (
    <header className="safe-top relative z-50 border-b border-spike-dark/20 bg-spike text-white">
      <div className="mx-auto flex max-w-projection flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:py-3 2xl:px-10 2xl:py-3.5">
        <div className="flex min-w-0 items-center gap-2.5 lg:gap-3">
          <div
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-spike shadow-sm lg:h-10 lg:w-10 lg:text-base 2xl:h-11 2xl:w-11"
          >
            S
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight sm:text-base lg:text-lg 2xl:text-xl">
              SPIKE
            </p>
            <p className="truncate text-2xs text-red-100/90 lg:text-xs">AIA PH Matunog District</p>
          </div>
        </div>

        {userRole === 'guest' ? (
          <p className="text-xs leading-relaxed text-red-100 sm:max-w-md sm:text-right sm:text-sm lg:text-base">
            {setupMeta?.needsBootstrap
              ? 'Create the first admin account, or sign in if setup is complete.'
              : 'Sign in with your program account.'}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
            <span className="max-w-[9rem] truncate text-xs text-red-100 sm:max-w-none sm:text-sm lg:text-base">
              {user?.name}
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-white lg:px-2.5 lg:py-1 lg:text-xs">
              {formatUiRoleLabel(userRole)}
            </span>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sign out"
              className="inline-flex min-h-[40px] touch-manipulation items-center gap-1 rounded-lg px-2 text-red-100 transition hover:bg-white/10 hover:text-white lg:min-h-[44px] lg:px-3"
            >
              <LogOut size={16} className="lg:h-[18px] lg:w-[18px]" />
              <span className="text-xs font-medium sm:text-sm lg:text-base">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
