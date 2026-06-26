import { useEffect, useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { usePitchPanelLive } from '../../hooks/usePitchPanelLive.js';
import {
  PITCH_PANEL_DIMENSIONS,
  PITCH_PANEL_FEEDBACK_FIELDS,
} from '../../lib/staff/pitchPanelConstants.js';
import { loadSquadPitchPanelSummary } from '../../lib/staff/pitchPanelSummaryService.js';

const FEEDBACK_ACCENT = {
  keep: 'text-emerald-700',
  improve: 'text-amber-700',
  explore: 'text-sky-700',
};

/**
 * Consolidated guest pitch panel scores for coach squad views.
 * @param {{
 *   squadName: string,
 *   memberIds: string[],
 *   compact?: boolean,
 *   fetchDetails?: boolean,
 *   className?: string,
 * }} props
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
        Pitch panel…
      </div>
    );
  }

  if (!summary) return null;

  const avg = summary.panelAverage;
  const xp = summary.finalized
    ? summary.week2PanelXp
    : summary.provisionalWeek2PanelXp;
  const hasScores = avg != null && avg > 0;

  if (!hasScores && !summary.cards.length) {
    if (compact) return null;
    return (
      <section className={`rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 ${className}`}>
        <p className="text-sm font-semibold text-slate-800">Week 2 pitch panel</p>
        <p className="mt-1 text-sm text-slate-600">
          No guest panel scores yet. Share the pitch panel link with panelists on pitch day.
        </p>
      </section>
    );
  }

  if (compact) {
    return (
      <div className={`rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5 ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900">Pitch panel</p>
          <p className="flex items-center gap-1 text-sm font-bold text-amber-700">
            <Star size={14} fill="currentColor" aria-hidden />
            {avg != null ? avg.toFixed(1) : '—'}
            <span className="text-xs font-semibold text-amber-600/80">/ 5</span>
          </p>
        </div>
        <p className="mt-1 text-xs text-amber-900/80">
          {summary.panelistCount} panelist{summary.panelistCount === 1 ? '' : 's'}
          {summary.finalized ? ` · ${xp} W2 XP` : xp ? ` · ~${xp} XP pending` : ''}
        </p>
        {summary.dimensionAverages ? (
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] sm:grid-cols-4">
            {PITCH_PANEL_DIMENSIONS.map((dim) => (
              <div key={dim.id} className="flex justify-between gap-1 text-amber-950/80">
                <dt className="truncate">{dim.label.split(' ')[0]}</dt>
                <dd className="font-bold tabular-nums">
                  {summary.dimensionAverages[dim.id]?.toFixed(1) ?? '—'}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    );
  }

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-spike">Week 2 pitch panel</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Guest score summary</h2>
            <p className="mt-1 text-sm text-slate-600">
              {summary.panelistCount} panelist submission{summary.panelistCount === 1 ? '' : 's'}
              {summary.finalized ? ' · finalized' : summary.pending ? ' · live (pending finalize)' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-2xl font-bold text-amber-600">
              <Star size={20} fill="currentColor" aria-hidden />
              {avg != null ? avg.toFixed(1) : '—'}
              <span className="text-sm font-semibold text-slate-400">/ 5</span>
            </p>
            <p className="text-sm font-semibold text-spike">
              {summary.finalized
                ? `${xp} W2 panel XP`
                : xp
                  ? `~${xp} XP pending`
                  : '0 W2 panel XP'}
            </p>
          </div>
        </div>
      </div>

      {summary.dimensionAverages ? (
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Average by dimension</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {PITCH_PANEL_DIMENSIONS.map((dim) => (
              <li
                key={dim.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="text-slate-700">{dim.label}</span>
                <span className="font-bold tabular-nums text-amber-700">
                  {summary.dimensionAverages[dim.id]?.toFixed(1) ?? '—'}
                  <span className="text-xs font-medium text-slate-400"> / 5</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {PITCH_PANEL_FEEDBACK_FIELDS.some((field) => summary.feedbackSummary[field.id]?.length) ? (
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Consolidated coaching notes</h3>
          <div className="mt-3 space-y-3">
            {PITCH_PANEL_FEEDBACK_FIELDS.map((field) => {
              const items = summary.feedbackSummary[field.id] ?? [];
              if (!items.length) return null;
              return (
                <div key={field.id}>
                  <p className={`text-xs font-bold uppercase tracking-wide ${FEEDBACK_ACCENT[field.id]}`}>
                    {field.label}
                  </p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-slate-800">
                    {items.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {summary.cards.length ? (
        <details className="px-5 py-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800">
            Individual score cards ({summary.cards.length})
          </summary>
          <ul className="mt-3 space-y-3">
            {summary.cards.map((card) => (
              <li
                key={`${card.panelistName}-${card.submittedAt ?? ''}`}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm"
              >
                <p className="font-semibold text-slate-900">
                  {card.panelistName}
                  {card.panelistOrg?.trim() ? (
                    <span className="font-normal text-slate-500"> · {card.panelistOrg}</span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {PITCH_PANEL_DIMENSIONS.map((dim) => `${dim.label}: ${card[dim.id]}`).join(' · ')}
                </p>
                <dl className="mt-2 space-y-1 text-xs">
                  {PITCH_PANEL_FEEDBACK_FIELDS.map((field) => {
                    const text = card[`${field.id}Feedback`];
                    if (!text) return null;
                    return (
                      <div key={field.id}>
                        <dt className={`font-bold ${FEEDBACK_ACCENT[field.id]}`}>{field.label}</dt>
                        <dd className="text-slate-700">{text}</dd>
                      </div>
                    );
                  })}
                </dl>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
