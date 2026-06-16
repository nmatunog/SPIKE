import { AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Shown while intern playbook/portfolio data hydrates after sign-in.
 * @param {{ ready: boolean, error: string | null }} props
 */
export function InternWorkHydrationAlert({ ready, error }) {
  if (error) {
    return (
      <div
        className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        role="alert"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Could not fully reload your saved work</p>
          <p className="mt-0.5">{error}</p>
          <p className="mt-1 text-xs text-amber-900/90">
            Try refreshing the page. Your device copy is still here; sign out to trigger a backup.
          </p>
        </div>
      </div>
    );
  }

  if (ready) return null;

  return (
    <div
      className="mb-4 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-600" aria-hidden />
      <span>Loading your saved playbook and portfolio work…</span>
    </div>
  );
}
