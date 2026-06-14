import { KeyRound, RefreshCw } from 'lucide-react';
import { useDailyActivationCode } from '../../hooks/useDailyActivationCode.js';

/**
 * Today's intern signup code — shown on Admin, Program Coach, and Mentor dashboards.
 * @param {{ showRegenerate?: boolean, className?: string }} props
 */
export function DailyActivationCodeCard({ showRegenerate = false, className = '' }) {
  const {
    code,
    loading,
    error,
    refresh,
    regenerate,
    regenerating,
    enabled,
    canRegenerate,
    timezone,
  } = useDailyActivationCode();

  if (!enabled) return null;

  const expiryLabel = code?.expires_at
    ? new Date(code.expires_at).toLocaleString('en-PH', { timeZone: timezone })
    : null;

  return (
    <section
      className={`rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-5 shadow-card sm:p-6 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-900">
            <KeyRound size={16} /> Today&apos;s intern activation code
          </p>
          <p className="mt-1 text-sm text-amber-950/80">
            Auto-generated at midnight ({timezone}). Share with new interns at orientation — they enter
            it on the welcome page to self-register.
          </p>
          {loading ? (
            <p className="mt-3 text-sm text-gray-500">Loading code…</p>
          ) : code ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Code</p>
              <p className="text-3xl font-black tracking-[0.2em] text-spike sm:text-4xl">{code.code}</p>
              {expiryLabel ? (
                <p className="mt-1 text-xs text-gray-500">Valid until {expiryLabel}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No code for today yet. Refresh to generate.</p>
          )}
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {showRegenerate && canRegenerate ? (
            <button
              type="button"
              onClick={() => regenerate()}
              disabled={regenerating}
              className="inline-flex min-h-[44px] items-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {regenerating ? 'Regenerating…' : 'Regenerate code'}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
