import { useMemo, useState } from 'react';
import { CheckCircle, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import {
  buildRaSpikeGateRows,
  countRaSpikePendingGates,
  raSpikeGateLabel,
  raSpikeGateStatusLabel,
} from '../../lib/raSpikeStaffGateService.js';
import { staffEvaluateRaSpikeGate } from '../../lib/raSpikeGateService.js';
import { usePortalWriteAccess } from '../../hooks/usePortalWriteAccess.js';

const STATUS_CLASS = {
  pending: 'bg-amber-100 text-amber-900',
  passed: 'bg-emerald-100 text-emerald-900',
  failed: 'bg-red-100 text-red-900',
  default: 'bg-slate-100 text-slate-600',
};

/**
 * Coach panel — evaluate RA-SPIKE stage gates (pass / needs retry).
 * @param {{
 *   interns: Array<{ id: string, name?: string, squad?: string, internProgress?: object }>,
 *   showToast?: (msg: string) => void,
 *   onEvaluated?: () => void,
 * }} props
 */
export function RaSpikeGateEvaluationPanel({ interns, showToast, onEvaluated }) {
  const { canWrite } = usePortalWriteAccess();
  const rows = useMemo(() => buildRaSpikeGateRows(interns), [interns]);
  const pendingCount = useMemo(() => countRaSpikePendingGates(rows), [rows]);
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');

  if (!rows.length) return null;

  async function handleEvaluate(participantId, participantName, gateNum, result) {
    if (!canWrite) {
      showToast?.('Read-only viewer — cannot evaluate gates.');
      return;
    }
    if (
      result === 'failed'
      && !window.confirm(
        `${participantName} did not pass ${raSpikeGateLabel(gateNum)}. They can retry after coach guidance. Continue?`,
      )
    ) {
      return;
    }

    const key = `${participantId}:g${gateNum}`;
    setBusyKey(key);
    setError('');
    try {
      await staffEvaluateRaSpikeGate(participantId, gateNum, result);
      const verb = result === 'passed' ? 'passed' : 'marked for retry';
      showToast?.(`${participantName} ${verb} ${raSpikeGateLabel(gateNum)}.`);
      onEvaluated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Evaluation failed.';
      setError(message);
      showToast?.(message);
    } finally {
      setBusyKey('');
    }
  }

  function renderGateCell(row, gateNum) {
    const status = gateNum === 1 ? row.gate1 : row.gate2;
    const evaluatedAt = gateNum === 1 ? row.gate1EvaluatedAt : row.gate2EvaluatedAt;
    const badgeClass = STATUS_CLASS[status ?? 'default'] ?? STATUS_CLASS.default;
    const busy = busyKey === `${row.id}:g${gateNum}`;

    return (
      <div className="space-y-2">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${badgeClass}`}>
          {raSpikeGateStatusLabel(status)}
        </span>
        {evaluatedAt ? (
          <p className="text-[11px] text-slate-500">
            {new Date(evaluatedAt).toLocaleString()}
          </p>
        ) : null}
        {status === 'pending' && canWrite ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={Boolean(busyKey)}
              onClick={() => void handleEvaluate(row.id, row.name, gateNum, 'passed')}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Pass
            </button>
            <button
              type="button"
              disabled={Boolean(busyKey)}
              onClick={() => void handleEvaluate(row.id, row.name, gateNum, 'failed')}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
            >
              <XCircle size={14} />
              Needs retry
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-spike">RA-SPIKE</p>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-slate-900">
              <ShieldCheck size={20} className="text-spike" aria-hidden />
              Stage gate evaluation
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Record pass or needs retry after venture pitch (Week 4) and advisor revalida (Week 8).
            </p>
          </div>
          {pendingCount ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
              {pendingCount} awaiting
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              No pending gates
            </span>
          )}
        </div>
      </div>

      {error ? (
        <p className="mx-4 mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-5">{error}</p>
      ) : null}

      <div className="overflow-x-auto px-4 py-3 sm:px-5">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="py-3 pr-3 font-bold text-slate-700">Participant</th>
              <th className="px-2 py-3 font-bold text-slate-700">Week</th>
              <th className="px-2 py-3 font-bold text-slate-700">Gate 1</th>
              <th className="px-2 py-3 font-bold text-slate-700">Gate 2</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 align-top">
                <td className="py-3 pr-3">
                  <p className="font-semibold text-slate-900">{row.name}</p>
                  <p className="text-xs text-slate-500">{row.squad}</p>
                  {row.graduated ? (
                    <p className="mt-1 text-[11px] font-semibold text-emerald-700">Graduated</p>
                  ) : null}
                </td>
                <td className="px-2 py-3 tabular-nums text-slate-700">
                  W{row.week}
                  <span className="mt-0.5 block text-[11px] text-slate-400">
                    Seg {row.segment}
                  </span>
                </td>
                <td className="px-2 py-3">{renderGateCell(row, 1)}</td>
                <td className="px-2 py-3">{renderGateCell(row, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!canWrite ? (
        <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-5">
          Read-only viewer — sign in as program coach or mentor to evaluate gates.
        </p>
      ) : null}
    </section>
  );
}
