import { useEffect, useState } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import { usePitchPanelLive } from '../../hooks/usePitchPanelLive.js';
import { formatPitchPeso } from '../../lib/staff/pitchPanelConstants.js';
import { loadSquadPitchPanelSummary } from '../../lib/staff/pitchPanelSummaryService.js';

/**
 * Consolidated Demo Day investments for coach squad views.
 */
export function PitchPanelSquadSummaryPanel({
  squadName,
  memberIds,
  compact = false,
  fetchDetails = true,
  className = '',
}) {
  const { ready: panelReady, version: panelVersion } = usePitchPanelLive(true);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(fetchDetails);

  useEffect(() => {
    let cancelled = false;
    setLoading(fetchDetails);
    (async () => {
      const next = await loadSquadPitchPanelSummary(squadName, memberIds, {
        fetchCards: fetchDetails,
      });
      if (!cancelled) {
        setSummary(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [squadName, memberIds, fetchDetails, panelVersion]);

  if (!panelReady || (fetchDetails && loading && !summary)) {
    return (
      <div className={`flex items-center gap-2 text-xs text-slate-400 ${className}`}>
        <Loader2 size={14} className="animate-spin" aria-hidden />
        Demo Day…
      </div>
    );
  }

  if (!summary) return null;

  const total = summary.totalInvestment ?? 0;
  const xp = summary.finalized ? summary.week2PanelXp : summary.provisionalWeek2PanelXp;
  const hasFunding = total > 0 || summary.cards.length > 0;

  if (!hasFunding) {
    if (compact) return null;
    return (
      <section className={`rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 ${className}`}>
        <p className="text-sm font-semibold text-slate-800">Demo Day funding</p>
        <p className="mt-1 text-sm text-slate-600">
          No investor allocations yet. Share the investor link with panelists on pitch day.
        </p>
      </section>
    );
  }

  if (compact) {
    return (
      <div className={`rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2.5 ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-orange-900">Demo Day</p>
          <p className="flex items-center gap-1 text-sm font-bold text-orange-700">
            <TrendingUp size={14} aria-hidden />
            {formatPitchPeso(total)}
          </p>
        </div>
        <p className="mt-1 text-xs text-orange-900/80">
          {summary.panelistCount} investor{summary.panelistCount === 1 ? '' : 's'}
          {summary.finalized ? ` · ${xp} W2 XP` : xp ? ` · pending` : ''}
        </p>
      </div>
    );
  }

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-spike">Demo Day</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Investment summary</h2>
            <p className="mt-1 text-sm text-slate-600">
              {summary.panelistCount} finalized investor{summary.panelistCount === 1 ? '' : 's'}
              {summary.finalized ? ' · locked' : summary.pending ? ' · provisional' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-2xl font-bold text-orange-600">
              <TrendingUp size={20} aria-hidden />
              {formatPitchPeso(total)}
            </p>
            <p className="text-sm font-semibold text-spike">
              {summary.finalized ? `${xp} W2 panel XP` : xp ? `~${xp} XP pending` : '0 W2 panel XP'}
            </p>
          </div>
        </div>
      </div>

      {summary.cards.length ? (
        <ul className="divide-y divide-slate-100 px-5 py-2">
          {summary.cards.map((card) => (
            <li key={`${card.panelistName}-${card.updatedAt ?? ''}`} className="flex justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-900">{card.panelistName}</p>
                {card.comment?.trim() ? (
                  <p className="mt-0.5 text-xs italic text-slate-500">&ldquo;{card.comment}&rdquo;</p>
                ) : null}
              </div>
              <span className="font-bold tabular-nums text-orange-600">{formatPitchPeso(card.amount)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
