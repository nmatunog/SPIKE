import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, RotateCcw } from 'lucide-react';
import { PanelistStatusBadge } from '../pitchPanel/PitchPanelistCard.jsx';
import {
  PITCH_PANEL_INVESTMENT_INCREMENT,
  PITCH_PANEL_LABEL_XP,
  formatPitchPeso,
  sortPitchPanelSquads,
} from '../../lib/staff/pitchPanelConstants.js';
import {
  clearCoachOverrides,
  computeEffectiveSquadTotals,
  getEffectiveAmount,
  hasCoachOverrides,
  loadPitchPanelCoachMatrix,
  readCoachOverrides,
  writeCoachOverrides,
} from '../../lib/staff/pitchPanelCoachReview.js';

const INPUT_CLASS =
  'w-full min-w-[5.5rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm font-semibold tabular-nums text-slate-900 outline-none focus:border-spike focus:ring-2 focus:ring-spike/20 disabled:bg-slate-50 disabled:text-slate-500';

/**
 * Coach view of panelist investments with optional adjustments before lock.
 * @param {{
 *   squadNames: string[],
 *   sessionFinalized?: boolean,
 *   refreshKey?: number,
 *   onAdjustmentsChange?: () => void,
 *   showToast?: (msg: string) => void,
 * }} props
 */
export function PitchPanelCoachReviewPanel({
  squadNames,
  sessionFinalized = false,
  refreshKey = 0,
  onAdjustmentsChange,
  showToast,
}) {
  const [matrix, setMatrix] = useState(/** @type {object | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [overrides, setOverrides] = useState(() => readCoachOverrides());
  const [dirty, setDirty] = useState(false);

  const squads = useMemo(() => {
    const fromMatrix = Array.isArray(matrix?.squads) ? matrix.squads : [];
    const merged = sortPitchPanelSquads([...new Set([...squadNames, ...fromMatrix])]);
    return merged;
  }, [matrix, squadNames]);

  const loadMatrix = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const next = await loadPitchPanelCoachMatrix(squadNames);
      setMatrix(next);
      if (!next?.panelists?.length && squadNames.length) {
        setLoadError(
          'No panelist scores yet — share the investor link. If panelists have submitted, tap Refresh live on the dashboard.',
        );
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load panelist scores.');
    } finally {
      setLoading(false);
    }
  }, [squadNames]);

  useEffect(() => {
    void loadMatrix();
  }, [loadMatrix, refreshKey]);

  useEffect(() => {
    setOverrides(readCoachOverrides());
  }, [refreshKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const bump = () => {
      setOverrides(readCoachOverrides());
      onAdjustmentsChange?.();
    };
    window.addEventListener('spike-pitch-panel-coach-adjusted', bump);
    return () => window.removeEventListener('spike-pitch-panel-coach-adjusted', bump);
  }, [onAdjustmentsChange]);

  const panelists = matrix?.panelists ?? [];
  const readOnly = sessionFinalized;

  const effectiveTotals = useMemo(() => {
    if (!matrix?.panelists?.length) return {};
    return computeEffectiveSquadTotals(matrix, overrides, squads);
  }, [matrix, overrides, squads]);

  const adjusted = hasCoachOverrides(overrides);

  function baseAmount(panelist, squad) {
    return panelist.allocations?.find((a) => a.squadName === squad)?.amount ?? 0;
  }

  function isCellAdjusted(panelistToken, squad) {
    return overrides.cells?.[panelistToken]?.[squad] != null;
  }

  function updateCell(panelistToken, squad, rawValue) {
    if (readOnly) return;
    const amount = Math.max(0, Number(rawValue) || 0);
    const nextCells = { ...overrides.cells };
    const row = { ...(nextCells[panelistToken] ?? {}) };

    if (amount === baseAmount(panelists.find((p) => p.panelistToken === panelistToken), squad)) {
      delete row[squad];
      if (Object.keys(row).length === 0) delete nextCells[panelistToken];
      else nextCells[panelistToken] = row;
    } else {
      nextCells[panelistToken] = { ...row, [squad]: { amount } };
    }

    const next = { cells: nextCells };
    setOverrides(next);
    setDirty(true);
    writeCoachOverrides(nextCells);
  }

  function saveAdjustments() {
    writeCoachOverrides(overrides.cells);
    setDirty(false);
    showToast?.('Coach adjustments saved.');
    onAdjustmentsChange?.();
  }

  function resetAdjustments() {
    clearCoachOverrides();
    setOverrides({ cells: {} });
    setDirty(false);
    showToast?.('Reset to panelist-submitted investments.');
    onAdjustmentsChange?.();
  }

  if (loading && !matrix) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" aria-hidden />
        Loading panelist investments…
      </div>
    );
  }

  if (!panelists.length) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
        <p className="text-sm font-semibold text-slate-800">Panelist investment scores</p>
        <p className="mt-1 text-sm text-slate-600">
          {loadError
            || 'No panelist submissions yet. Share the investor link — scores appear here as panelists save and finalize portfolios.'}
        </p>
        {squads.length ? (
          <p className="mt-2 text-xs text-slate-500">
            Squads: {squads.join(' · ')}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-spike">Coach review</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Panelist investment scores</h2>
            <p className="mt-1 text-sm text-slate-600">
              {readOnly
                ? 'Results locked — investments shown as submitted (with any coach adjustments applied at lock).'
                : `Review each panelist allocation. Edit amounts before locking — adjustments apply to funding totals and ${PITCH_PANEL_LABEL_XP}.`}
            </p>
          </div>
          {!readOnly && adjusted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
              <Pencil size={12} aria-hidden />
              Coach adjusted
            </span>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto px-4 py-3 sm:px-5">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="sticky left-0 z-10 bg-white py-3 pr-3 font-bold text-slate-700">Panelist</th>
              {squads.map((squad) => (
                <th key={squad} className="px-2 py-3 text-right font-bold text-slate-700">
                  {squad}
                </th>
              ))}
              <th className="px-2 py-3 text-right font-bold text-slate-700">Allocated</th>
            </tr>
          </thead>
          <tbody>
            {panelists.map((panelist) => {
              const rowTotal = squads.reduce(
                (sum, squad) =>
                  sum
                  + getEffectiveAmount(
                    panelist.panelistToken,
                    squad,
                    baseAmount(panelist, squad),
                    overrides,
                  ),
                0,
              );

              return (
                <tr key={panelist.panelistToken} className="border-b border-slate-100">
                  <td className="sticky left-0 z-10 bg-white py-3 pr-3 align-top">
                    <p className="font-semibold text-slate-900">{panelist.panelistName}</p>
                    {panelist.panelistOrg?.trim() ? (
                      <p className="text-xs text-slate-500">{panelist.panelistOrg}</p>
                    ) : null}
                    <p className="mt-1">
                      <PanelistStatusBadge isFinalized={panelist.isFinalized} />
                    </p>
                  </td>
                  {squads.map((squad) => {
                    const base = baseAmount(panelist, squad);
                    const effective = getEffectiveAmount(
                      panelist.panelistToken,
                      squad,
                      base,
                      overrides,
                    );
                    const comment = panelist.allocations?.find((a) => a.squadName === squad)?.comment;
                    const cellAdjusted = isCellAdjusted(panelist.panelistToken, squad);

                    return (
                      <td key={squad} className="px-2 py-3 align-top">
                        {readOnly ? (
                          <div className="text-right">
                            <p className="font-bold tabular-nums text-orange-600">
                              {formatPitchPeso(effective)}
                            </p>
                            {comment?.trim() ? (
                              <p className="mt-1 text-[11px] italic text-slate-500">&ldquo;{comment}&rdquo;</p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <input
                              type="number"
                              min={0}
                              max={1_000_000}
                              step={PITCH_PANEL_INVESTMENT_INCREMENT}
                              value={effective || ''}
                              onChange={(e) =>
                                updateCell(panelist.panelistToken, squad, e.target.value)}
                              className={`${INPUT_CLASS} ${
                                cellAdjusted ? 'border-amber-300 bg-amber-50/80' : ''
                              }`}
                              aria-label={`${panelist.panelistName} investment in ${squad}`}
                            />
                            {base !== effective ? (
                              <p className="text-[10px] text-slate-400 line-through">
                                was {formatPitchPeso(base)}
                              </p>
                            ) : null}
                            {comment?.trim() ? (
                              <p className="text-[11px] italic text-slate-500">&ldquo;{comment}&rdquo;</p>
                            ) : null}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 py-3 text-right align-top font-bold tabular-nums text-slate-800">
                    {formatPitchPeso(rowTotal)}
                    {!readOnly && panelist.remainingCapital != null ? (
                      <p className="mt-1 text-[10px] font-normal text-slate-400">
                        {formatPitchPeso(panelist.remainingCapital)} left
                      </p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
              <td className="sticky left-0 z-10 bg-slate-50 py-3 pr-3 text-slate-900">Squad total</td>
              {squads.map((squad) => (
                <td key={squad} className="px-2 py-3 text-right tabular-nums text-orange-600">
                  {formatPitchPeso(effectiveTotals[squad] ?? 0)}
                </td>
              ))}
              <td className="px-2 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>

      {!readOnly ? (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-4 sm:px-5">
          <button
            type="button"
            onClick={saveAdjustments}
            disabled={!dirty && !adjusted}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-spike px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Save coach adjustments
          </button>
          <button
            type="button"
            onClick={resetAdjustments}
            disabled={!adjusted && !dirty}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <RotateCcw size={14} aria-hidden />
            Reset to panelist scores
          </button>
          <p className="self-center text-xs text-slate-500">
            Use ₱10,000 increments. Lock Demo Day results when ready — coach edits apply to XP rank.
          </p>
        </div>
      ) : null}
    </section>
  );
}
