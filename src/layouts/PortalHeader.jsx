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
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-4 md:flex-row">
        <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-start">
          <div className="flex items-center gap-3">
            <div className="rounded bg-white p-1.5 text-xl font-bold leading-none text-[#8B0000]">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-wide">S.P.I.K.E. PORTAL</h1>
              <p className="text-xs text-red-200">AIAPH 1Matunog District</p>
            </div>
          </div>
        </div>

        {userRole === 'guest' ? (
          <p className="text-center text-sm text-red-100 md:text-right">
            {setupMeta?.needsBootstrap
              ? 'Create the first administrator account, or sign in if the database is already set up.'
              : 'Sign in with an account your administrator created.'}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-3 md:flex-row md:gap-6">
            <span className="hidden text-sm text-red-100 md:inline">{user?.name}</span>
            <span className="rounded-full bg-red-900 px-3 py-1 text-sm font-bold uppercase tracking-wider shadow-inner">
              Role: {roleLabel(userRole)}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1 font-medium text-red-200 transition hover:text-white"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
