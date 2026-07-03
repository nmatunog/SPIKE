import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Loader2, Plus, Sparkles } from 'lucide-react';
import {
  fetchRaSpikeBatchesForStaff,
  staffCreateRaSpikeBatch,
  staffPatchRaSpikeBatch,
  staffSetActiveCohort,
} from '../../lib/staffRaSpikeBatchService.js';
import { usePortalWriteAccess } from '../../hooks/usePortalWriteAccess.js';

const INPUT =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20';

/**
 * @param {{ showToast?: (msg: string) => void, onChanged?: () => void }} props
 */
export function RaSpikeBatchManagementPanel({ showToast, onChanged }) {
  const { canWrite } = usePortalWriteAccess();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [batchLabel, setBatchLabel] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBatches(await fetchRaSpikeBatchesForStaff());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load batches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!canWrite) return;
    setBusy('create');
    setError('');
    try {
      const row = await staffCreateRaSpikeBatch({
        batchLabel,
        inviteCode: inviteCode || undefined,
        startDate,
        makeActive: true,
      });
      showToast?.(`Batch created — invite code ${row.batch_invite_code}`);
      setShowCreate(false);
      setBatchLabel('');
      setInviteCode('');
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create batch.');
    } finally {
      setBusy('');
    }
  }

  async function handleSetActive(cohortId) {
    if (!canWrite) return;
    setBusy(`active-${cohortId}`);
    try {
      await staffSetActiveCohort(cohortId);
      showToast?.('Active batch updated for coach tools.');
      await load();
      onChanged?.();
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : 'Could not set active batch.');
    } finally {
      setBusy('');
    }
  }

  async function handleToggleSignup(cohortId, signupOpen) {
    if (!canWrite) return;
    setBusy(`signup-${cohortId}`);
    try {
      await staffPatchRaSpikeBatch(cohortId, { signupOpen });
      await load();
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : 'Could not update signup.');
    } finally {
      setBusy('');
    }
  }

  function copyCode(code, id) {
    void navigator.clipboard.writeText(code);
    setCopiedId(id);
    showToast?.('Invite code copied.');
    window.setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-spike">Enrollment</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">RA-SPIKE batches</h2>
            <p className="mt-1 text-sm text-slate-600">
              Mixed-agency cohorts — rookies pick their home agency and unit when they sign up.
            </p>
          </div>
          {canWrite ? (
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-spike px-4 py-2 text-sm font-bold text-white"
            >
              <Plus size={16} aria-hidden />
              {showCreate ? 'Cancel' : 'New batch'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {showCreate && canWrite ? (
          <form onSubmit={(e) => void handleCreate(e)} className="rounded-2xl border border-spike/20 bg-spike-muted/30 p-4">
            <p className="text-sm font-semibold text-slate-900">Create new RA-SPIKE batch</p>
            <p className="mt-1 text-xs text-slate-600">
              Batch 1 can include advisors from Cebu Matunog and Cebu Ez Premier units.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Batch label</span>
                <input required value={batchLabel} onChange={(e) => setBatchLabel(e.target.value)} className={INPUT} placeholder="e.g. RA-SPIKE Batch 2 · July 2026" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Invite code (optional)</span>
                <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className={`${INPUT} uppercase`} placeholder="Auto-generated if blank" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Start date</span>
                <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={INPUT} />
              </label>
            </div>
            <button
              type="submit"
              disabled={busy === 'create'}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-spike px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy === 'create' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Create batch &amp; set active
            </button>
          </form>
        ) : null}

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading batches…
          </p>
        ) : !batches.length ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            No RA-SPIKE batches yet. Create one to open rookie signup with a unique invite code.
          </p>
        ) : (
          <ul className="space-y-3">
            {batches.map((batch) => {
              const label = batch.batch_label || batch.name || `Batch ${batch.id}`;
              const code = batch.batch_invite_code ?? '';
              const active = Boolean(batch.is_active);
              return (
                <li
                  key={batch.id}
                  className={`rounded-2xl border p-4 ${active ? 'border-spike/30 bg-spike-muted/20' : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{label}</p>
                      <p className="mt-0.5 text-sm text-slate-600">Mixed agencies &amp; units</p>
                      {active ? (
                        <span className="mt-2 inline-flex rounded-full bg-spike/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-spike">
                          Active batch
                        </span>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invite code</p>
                      <div className="mt-1 flex items-center justify-end gap-2">
                        <span className="font-mono text-lg font-bold text-slate-900">{code || '—'}</span>
                        {code ? (
                          <button
                            type="button"
                            onClick={() => copyCode(code, batch.id)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                            aria-label="Copy invite code"
                          >
                            {copiedId === batch.id ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!active && canWrite ? (
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => void handleSetActive(batch.id)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800"
                      >
                        {busy === `active-${batch.id}` ? 'Setting…' : 'Set as active'}
                      </button>
                    ) : null}
                    {canWrite ? (
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => void handleToggleSignup(batch.id, !batch.signup_open)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800"
                      >
                        {batch.signup_open ? 'Close signup' : 'Open signup'}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
