import { useCallback, useEffect, useState } from 'react';
import { KeyRound, RefreshCw } from 'lucide-react';
import {
  MENTOR_LABEL_PLURAL,
  PROGRAM_COACH_LABEL_PLURAL,
} from '../../lib/terminology.js';
import {
  loadStaffRegistrationCode,
  regenerateStaffRegistrationCode,
} from '../../lib/staffRegistrationCodeService.js';

/** @param {{ className?: string, canRegenerate?: boolean }} props */
export function StaffRegistrationCodeCard({ className = '', canRegenerate = true }) {
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await loadStaffRegistrationCode();
      setRow(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load staff registration code.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const expiryLabel = row?.expires_at
    ? new Date(row.expires_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
    : null;

  return (
    <section className={`rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 p-5 shadow-card ${className}`}>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-indigo-900">
        <KeyRound size={16} /> Staff registration code
      </p>
      <p className="mt-1 text-sm text-indigo-950/80">
        Share with new {PROGRAM_COACH_LABEL_PLURAL}, {MENTOR_LABEL_PLURAL}, and Admins so they can self-register on the welcome page.
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading…</p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-700">{error}</p>
      ) : row?.code ? (
        <div className="mt-4">
          <p className="font-mono text-3xl font-black tracking-[0.2em] text-indigo-950">{row.code}</p>
          {expiryLabel ? (
            <p className="mt-2 text-xs text-slate-500">Expires {expiryLabel} (Asia/Manila)</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-amber-800">No staff code yet. Run migration 20260703 or click Refresh.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="spike-btn-secondary text-sm" disabled={busy} onClick={() => refresh()}>
          Refresh
        </button>
        {canRegenerate ? (
          <button
            type="button"
            className="spike-btn-primary inline-flex items-center gap-2 text-sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const data = await regenerateStaffRegistrationCode();
                setRow(data);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not regenerate code.');
              } finally {
                setBusy(false);
              }
            }}
          >
            <RefreshCw size={14} /> Regenerate code
          </button>
        ) : null}
      </div>
    </section>
  );
}
