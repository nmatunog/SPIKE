import { useMemo, useState } from 'react';
import { ClipboardCopy, Download, ExternalLink, Loader2, Lock, RefreshCw, TrendingUp } from 'lucide-react';
import { groupInternsBySquad } from '../../lib/facultyMentorFrameworkService.js';
import { usePitchPanelLive } from '../../hooks/usePitchPanelLive.js';
import {
  PITCH_PANEL_ACCESS_PIN,
  PITCH_PANEL_INVESTMENT_CRITERIA,
  buildInvestmentLeaderboard,
  formatPitchPeso,
  sortPitchPanelSquads,
} from '../../lib/staff/pitchPanelConstants.js';
import {
  buildFinalizePayload,
  exportPitchPanelResultsCsv,
  finalizePitchPanelScores,
  pitchPanelGuestHref,
  readFinalizedPanelCache,
  readLivePanelCache,
} from '../../lib/staff/pitchPanelService.js';
import { ROUTES } from '../../routes/paths.js';
import { PitchPanelGuestPage } from '../../pages/pitchPanel/PitchPanelGuestPage.jsx';
import { PitchPanelCoachReviewPanel } from './PitchPanelCoachReviewPanel.jsx';
import {
  computeEffectiveSquadTotals,
  hasCoachOverrides,
  readCoachMatrixCache,
  readCoachOverrides,
} from '../../lib/staff/pitchPanelCoachReview.js';
import { reopenPitchPanelistPortfolioRemote } from '../../lib/supabase/pitchPanel.js';
import { ConfettiCelebration } from '../pitchPanel/PitchPanelCelebration.jsx';
import { PitchFundingResults } from '../pitchPanel/PitchPanelInvestmentUI.jsx';
import { PanelistCoachSummaryCard } from '../pitchPanel/PitchPanelistCard.jsx';

const ACTION_BTN =
  'inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition active:scale-[0.98] hover:bg-slate-50';

/**
 * Faculty / mentor live dashboard for VC investment Demo Day.
 */
export function PitchPanelDashboard({ interns, staffId = '', showToast, embedded = false }) {
  const squads = useMemo(() => {
    const grouped = groupInternsBySquad(interns);
    return sortPitchPanelSquads(grouped.map((s) => s.name)).map((name) => {
      const squad = grouped.find((s) => s.name === name);
      return { name, memberIds: (squad?.members ?? []).map((m) => m.id) };
    });
  }, [interns]);

  const { version, error, refresh, ready } = usePitchPanelLive(true);
  void version;
  const finalized = readFinalizedPanelCache();
  const live = readLivePanelCache();
  const [busy, setBusy] = useState(false);
  const [showGuestPreview, setShowGuestPreview] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [coachRefreshKey, setCoachRefreshKey] = useState(0);
  const [reopeningToken, setReopeningToken] = useState('');

  const guestUrl = pitchPanelGuestHref();
  const previewPayload = buildFinalizePayload(squads);
  const coachOverrides = readCoachOverrides();
  const coachMatrix = readCoachMatrixCache();
  const coachAdjusted =
    coachMatrix?.panelists?.length && hasCoachOverrides(coachOverrides);
  const effectiveTotals = coachAdjusted
    ? computeEffectiveSquadTotals(
        coachMatrix,
        coachOverrides,
        squads.map((s) => s.name),
      )
    : null;

  const leaderboard = useMemo(() => {
    if (finalized?.leaderboard?.length) return finalized.leaderboard;
    return buildInvestmentLeaderboard(
      squads.map((s) => ({
        squadName: s.name,
        totalInvestment:
          effectiveTotals?.[s.name]
          ?? live?.liveSquads?.[s.name]?.finalInvestment
          ?? live?.liveSquads?.[s.name]?.totalInvestment
          ?? 0,
      })),
    );
  }, [finalized, live, squads, effectiveTotals]);

  const panelists = live?.panelists ?? [];

  async function handleFinalize() {
    setBusy(true);
    try {
      await finalizePitchPanelScores(squads);
      await refresh();
      setShowResults(true);
      showToast?.('Demo Day results locked — Week 2 XP applied by funding rank.');
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : 'Finalize failed');
    } finally {
      setBusy(false);
    }
  }

  function copyGuestLink() {
    void navigator.clipboard.writeText(guestUrl);
    showToast?.('Investor link copied — share with panelists (PIN: W2PITCH)');
  }

  async function handleReopenPanelist(panelistToken, panelistName) {
    setReopeningToken(panelistToken);
    try {
      await reopenPitchPanelistPortfolioRemote(panelistToken);
      await refresh();
      setCoachRefreshKey((k) => k + 1);
      showToast?.(`${panelistName} can invest again — portfolio reopened.`);
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : 'Could not reopen portfolio');
    } finally {
      setReopeningToken('');
    }
  }

  function handleExport() {
    const csv = exportPitchPanelResultsCsv(squads);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spike-demo-day-results.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast?.('Results exported');
  }

  if (showGuestPreview) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowGuestPreview(false)}
          className="mb-4 min-h-[44px] text-sm font-semibold text-spike"
        >
          ← Back to Demo Day dashboard
        </button>
        <PitchPanelGuestPage />
      </div>
    );
  }

  if (showResults && finalized) {
    return (
      <section className="space-y-4">
        <ConfettiCelebration active />
        <PitchFundingResults leaderboard={leaderboard} />
        <button type="button" onClick={() => setShowResults(false)} className={ACTION_BTN}>
          Back to dashboard
        </button>
      </section>
    );
  }

  return (
    <section className={`spike-surface space-y-4 sm:space-y-5 ${embedded ? '' : 'p-4 sm:p-5'}`}>
      <div className="space-y-4">
        <div>
          <p className="spike-label">Week 2 Demo Day</p>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Venture Capital investment dashboard</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Each panelist receives ₱1,000,000 SPIKE Venture Capital. Share the investor link — PIN{' '}
            <strong className="font-mono tracking-wide">{PITCH_PANEL_ACCESS_PIN}</strong>.
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <button type="button" onClick={copyGuestLink} className={`${ACTION_BTN} w-full sm:w-auto`}>
            <ClipboardCopy size={16} /> Copy investor link
          </button>
          <a href={ROUTES.pitchPanel} target="_blank" rel="noopener noreferrer" className={`${ACTION_BTN} w-full sm:w-auto`}>
            <ExternalLink size={16} /> Open investor page
          </a>
          <button type="button" onClick={() => void refresh()} className={`${ACTION_BTN} w-full sm:w-auto`}>
            <RefreshCw size={16} /> Refresh live
          </button>
          {finalized ? (
            <button type="button" onClick={handleExport} className={`${ACTION_BTN} w-full sm:w-auto`}>
              <Download size={16} /> Export results
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p> : null}
      {!ready ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Syncing investments…
        </p>
      ) : null}

      {finalized ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <Lock size={18} className="mt-0.5 shrink-0" />
          <span>
            Results locked {finalized.finalizedAt ? new Date(finalized.finalizedAt).toLocaleTimeString() : ''}
            — funding totals applied to Squad XP.
          </span>
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Provisional investments update live. Review panelist scores below, adjust if needed, then lock
          results after all panelists finalize portfolios.
        </p>
      )}

      <div id="coach-panelist-scores">
        <PitchPanelCoachReviewPanel
          squadNames={squads.map((s) => s.name)}
          sessionFinalized={Boolean(finalized)}
          refreshKey={version + coachRefreshKey}
          showToast={showToast}
          onAdjustmentsChange={() => setCoachRefreshKey((k) => k + 1)}
        />
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Live funding leaderboard</p>
        <ul className="mt-4 space-y-3">
          {leaderboard.map((row, idx) => (
            <li key={row.squadName} className="flex items-center justify-between gap-3">
              <span className="font-semibold">
                {idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : `#${idx + 1} `}
                {row.squadName}
              </span>
              <span className="text-lg font-bold tabular-nums text-orange-400">
                {formatPitchPeso(row.totalInvestment)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="space-y-3">
        {squads.map((squad) => {
          const liveRow = live?.liveSquads?.[squad.name] ?? {};
          const finalRow = finalized?.squads?.[squad.name];
          const total =
            finalRow?.totalInvestment
            ?? effectiveTotals?.[squad.name]
            ?? liveRow.finalInvestment
            ?? liveRow.totalInvestment
            ?? 0;
          const xp = finalRow?.week2PanelXp ?? previewPayload[squad.name]?.week2PanelXp ?? 0;
          const pending = !finalized && (liveRow.provisionalInvestment ?? 0) > 0;

          return (
            <li key={squad.name} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 sm:text-lg">{squad.name}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {liveRow.finalizedInvestorCount ?? liveRow.investorCount ?? 0} investor(s)
                    {pending ? ' · provisional' : ''}
                    {coachAdjusted && !finalized ? ' · coach adjusted' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1.5 text-xl font-bold text-orange-600">
                    <TrendingUp size={18} />
                    {formatPitchPeso(total)}
                  </p>
                  <p className={`text-sm font-semibold ${pending ? 'text-slate-400' : 'text-spike'}`}>
                    {pending ? 'Awaiting finalize' : `${xp} W2 XP`}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {panelists.length ? (
        <section className="space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-spike">Investors</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">
              Panelist cards ({panelists.length})
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {finalized
                ? 'Locked portfolios from each Demo Day investor.'
                : 'Live status as panelists save and finalize allocations.'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {panelists.map((p) => (
              <PanelistCoachSummaryCard
                key={p.panelistToken}
                panelistName={p.panelistName}
                panelistOrg={p.panelistOrg}
                allocatedCapital={p.allocatedCapital}
                remainingCapital={p.remainingCapital}
                isFinalized={p.isFinalized}
                canReopen={!finalized}
                reopenBusy={reopeningToken === p.panelistToken}
                onReopen={() => void handleReopenPanelist(p.panelistToken, p.panelistName)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <details className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-800">Investment criteria (share with panelists)</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
          {PITCH_PANEL_INVESTMENT_CRITERIA.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </details>

      {!finalized ? (
        <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10">
          <button
            type="button"
            disabled={busy || !staffId}
            onClick={() => void handleFinalize()}
            className="min-h-[52px] w-full rounded-xl bg-spike px-4 py-3 text-base font-bold text-white shadow-lg disabled:opacity-50"
          >
            {busy ? 'Locking results…' : 'Lock Demo Day results & apply Week 2 XP'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowResults(true)}
          className="min-h-[52px] w-full rounded-xl bg-amber-500 px-4 py-3 text-base font-bold text-white"
        >
          View funding ceremony
        </button>
      )}
    </section>
  );
}
