import { LogOut } from 'lucide-react';

function roleLabel(userRole) {
  switch (userRole) {
    case 'profile_error':
      return 'Profile pending';
    case 'intern':
      return 'Intern';
    case 'mentor':
      return 'Advisor';
    case 'admin':
      return 'Admin';
    case 'faculty':
      return 'Faculty';
    default:
      return 'Guest';
  }
}

export function PortalHeader({ userRole, user, setupMeta, onLogout }) {
  return (
    <nav className="relative z-50 bg-[#8B0000] text-white shadow-md">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded bg-white p-1.5 text-lg font-bold leading-none text-[#8B0000] sm:text-xl">
            A
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight tracking-wide sm:text-lg">
              S.P.I.K.E. PORTAL
            </h1>
            <p className="truncate text-xs text-red-200">AIA PH Matunog District</p>
          </div>
        </div>

        {userRole === 'guest' ? (
          <p className="text-sm text-red-100 sm:max-w-md sm:text-right">
            {setupMeta?.needsBootstrap
              ? 'Create the first administrator account, or sign in if the database is already set up.'
              : 'Sign in with an account your administrator created.'}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-4">
            <span className="max-w-[10rem] truncate text-sm text-red-100 sm:max-w-none">
              {user?.name}
            </span>
            <span className="rounded-full bg-red-900 px-2.5 py-1 text-xs font-bold uppercase tracking-wider shadow-inner sm:px-3 sm:text-sm">
              {roleLabel(userRole)}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 py-2 font-medium text-red-200 transition hover:bg-red-900/40 hover:text-white"
            >
              <LogOut size={18} /> <span className="text-sm">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
