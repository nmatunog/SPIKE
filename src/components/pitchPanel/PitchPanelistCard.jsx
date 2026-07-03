import { Building2, Lock, Unlock, User } from 'lucide-react';
import {
  formatPitchPeso,
  PITCH_PANEL_CAPITAL,
} from '../../lib/staff/pitchPanelConstants.js';

const INPUT_CLASS =
  'mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-spike focus:ring-2 focus:ring-spike/20';

/** @param {string} name */
function panelistInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

/**
 * @param {{ isFinalized?: boolean, className?: string }} props
 */
export function PanelistStatusBadge({ isFinalized = false, className = '' }) {
  if (isFinalized) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 ${className}`}
      >
        <Lock size={10} aria-hidden />
        Finalized
      </span>
    );
  }
  return (
    <span
      className={`inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ${className}`}
    >
      Provisional
    </span>
  );
}

/**
 * @param {{
 *   allocated?: number,
 *   total?: number,
 *   className?: string,
 * }} props
 */
export function PanelistCapitalBar({ allocated = 0, total = PITCH_PANEL_CAPITAL, className = '' }) {
  const safeTotal = Math.max(1, Number(total) || PITCH_PANEL_CAPITAL);
  const safeAllocated = Math.max(0, Math.min(safeTotal, Number(allocated) || 0));
  const pct = Math.round((safeAllocated / safeTotal) * 100);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-600">Allocated</span>
        <span className="font-bold tabular-nums text-slate-800">
          {formatPitchPeso(safeAllocated)}
          <span className="font-normal text-slate-400"> / {formatPitchPeso(safeTotal)}</span>
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500">
        {formatPitchPeso(Math.max(0, safeTotal - safeAllocated))} remaining
      </p>
    </div>
  );
}

/**
 * Guest investor identity card — name, org, capital progress.
 * @param {{
 *   panelistName: string,
 *   panelistOrg?: string,
 *   allocatedCapital?: number,
 *   remainingCapital?: number,
 *   isFinalized?: boolean,
 *   readOnly?: boolean,
 *   showCapitalBar?: boolean,
 *   onNameChange?: (v: string) => void,
 *   onOrgChange?: (v: string) => void,
 *   className?: string,
 * }} props
 */
export function PanelistIdentityCard({
  panelistName,
  panelistOrg = '',
  allocatedCapital,
  remainingCapital,
  isFinalized = false,
  readOnly = false,
  showCapitalBar = true,
  onNameChange,
  onOrgChange,
  className = '',
}) {
  const allocated =
    allocatedCapital != null
      ? allocatedCapital
      : Math.max(0, PITCH_PANEL_CAPITAL - (remainingCapital ?? PITCH_PANEL_CAPITAL));
  const displayName = panelistName.trim() || 'Investor';

  return (
    <article
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg ring-1 ring-orange-500/10 ${className}`}
    >
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-5 py-4 text-white">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-lg font-black text-white shadow-md"
            aria-hidden
          >
            {panelistInitials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-400">
                SPIKE Venture Capital
              </p>
              <PanelistStatusBadge isFinalized={isFinalized} />
            </div>
            <p className="mt-1 truncate text-xl font-bold">{displayName}</p>
            {panelistOrg.trim() ? (
              <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-slate-400">
                <Building2 size={13} aria-hidden />
                {panelistOrg.trim()}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        {!readOnly ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <User size={14} aria-hidden />
                Your name
              </span>
              <input
                value={panelistName}
                onChange={(e) => onNameChange?.(e.target.value)}
                className={INPUT_CLASS}
                required
                placeholder="Dr. Jane Santos"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Building2 size={14} aria-hidden />
                Organization
              </span>
              <input
                value={panelistOrg}
                onChange={(e) => onOrgChange?.(e.target.value)}
                className={INPUT_CLASS}
                placeholder="Acme Ventures"
              />
            </label>
          </div>
        ) : null}

        {showCapitalBar ? <PanelistCapitalBar allocated={allocated} /> : null}
      </div>
    </article>
  );
}

/**
 * Single panelist investment — used on intern portfolio and coach summaries.
 * @param {{
 *   panelistName: string,
 *   panelistOrg?: string,
 *   amount: number,
 *   comment?: string,
 *   isFinalized?: boolean,
 *   className?: string,
 * }} props
 */
export function PanelistInvestmentCard({
  panelistName,
  panelistOrg = '',
  amount,
  comment = '',
  isFinalized = false,
  className = '',
}) {
  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md ${className}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 text-sm font-bold text-orange-300"
          aria-hidden
        >
          {panelistInitials(panelistName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-slate-900">{panelistName}</p>
              {panelistOrg?.trim() ? (
                <p className="text-xs text-slate-500">{panelistOrg.trim()}</p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-lg font-black tabular-nums text-orange-600">{formatPitchPeso(amount)}</p>
              {amount > 0 ? <PanelistStatusBadge isFinalized={isFinalized} className="mt-1" /> : null}
            </div>
          </div>
          {comment?.trim() ? (
            <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs italic leading-relaxed text-slate-600">
              &ldquo;{comment.trim()}&rdquo;
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Coach dashboard summary card — panelist overview with capital stats.
 * @param {{
 *   panelistName: string,
 *   panelistOrg?: string,
 *   allocatedCapital?: number,
 *   remainingCapital?: number,
 *   isFinalized?: boolean,
 *   canReopen?: boolean,
 *   reopenBusy?: boolean,
 *   onReopen?: () => void,
 *   className?: string,
 * }} props
 */
export function PanelistCoachSummaryCard({
  panelistName,
  panelistOrg = '',
  allocatedCapital = 0,
  remainingCapital,
  isFinalized = false,
  canReopen = false,
  reopenBusy = false,
  onReopen,
  className = '',
}) {
  const remaining =
    remainingCapital != null ? remainingCapital : Math.max(0, PITCH_PANEL_CAPITAL - allocatedCapital);

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-sm font-bold text-white"
          aria-hidden
        >
          {panelistInitials(panelistName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900">{panelistName}</p>
            <PanelistStatusBadge isFinalized={isFinalized} />
          </div>
          {panelistOrg?.trim() ? (
            <p className="mt-0.5 text-xs text-slate-500">{panelistOrg.trim()}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <p>
              <span className="text-slate-500">Allocated </span>
              <span className="font-bold tabular-nums text-orange-600">
                {formatPitchPeso(allocatedCapital)}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Remaining </span>
              <span className="font-semibold tabular-nums text-slate-700">
                {formatPitchPeso(remaining)}
              </span>
            </p>
          </div>
          <PanelistCapitalBar allocated={allocatedCapital} className="mt-3" />
          {canReopen && isFinalized && onReopen ? (
            <button
              type="button"
              onClick={onReopen}
              disabled={reopenBusy}
              className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
            >
              <Unlock size={14} aria-hidden />
              {reopenBusy ? 'Reopening…' : 'Reopen portfolio'}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
