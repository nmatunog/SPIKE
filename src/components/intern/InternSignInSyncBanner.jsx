import { CloudUpload, Loader2 } from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';

export function InternSignInSyncBanner() {
  const { user, internCloudSyncing } = useAuth();

  if (user?.role !== 'INTERN' || !internCloudSyncing) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] border-b border-sky-200 bg-sky-50 px-4 py-3 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-4xl items-center gap-3 text-sm text-sky-900">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-600" aria-hidden />
        <CloudUpload className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />
        <p>
          <span className="font-semibold">Syncing your work with the cloud…</span>
          {' '}
          Please keep this tab open. If your Day 1 work disappeared after login, we restore it from
          the cloud automatically when a backup exists.
        </p>
      </div>
    </div>
  );
}
