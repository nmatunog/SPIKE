import { useMemo, useState } from 'react';
import { ClipboardCopy, Loader2, Lock, RefreshCw, Star } from 'lucide-react';
import { groupInternsBySquad } from '../../lib/facultyMentorFrameworkService.js';
import { usePitchPanelLive } from '../../hooks/usePitchPanelLive.js';
import {
  PITCH_PANEL_ACCESS_PIN,
  PITCH_PANEL_DIMENSIONS,
} from '../../lib/staff/pitchPanelConstants.js';
import {
  buildFinalizePayload,
  finalizePitchPanelScores,
  panelAverageToWeek2Xp,
  pitchPanelGuestHref,
  readFinalizedPanelCache,
  readLivePanelCache,
} from '../../lib/staff/pitchPanelService.js';
import { ROUTES } from '../../routes/paths.js';
import { PitchPanelGuestPage } from '../../pages/pitchPanel/PitchPanelGuestPage.jsx';

/**
 * Faculty / mentor live dashboard for guest pitch panel scoring.
 * @param {{
 *   interns: Array<{ id: string, name: string, squad?: string }>,
 *   staffId?: string,
 *   showToast?: (msg: string) => void,
 *   embedded?: boolean,
 * }} props
 */
export function PitchPanelDashboard({ interns, staffId = '', showToast, embedded = false }) {
  const squads = useMemo(() => {
    return groupInternsBySquad(interns).map((s) => ({
      name: s.name,
      memberIds: (s.members ?? []).map((m) => m.id),
    }));
  }, [interns]);

  const { version, error, refresh, ready } = usePitchPanelLive(true);
  void version;
  const finalized = readFinalizedPanelCache();
  const live = readLivePanelCache();
  const [busy, setBusy] = useState(false);
  const [showGuestPreview, setShowGuestPreview] = useState(false);

  const guestUrl = pitchPanelGuestHref();
  const previewPayload = buildFinalizePayload(squads);

  async function handleFinalize() {
    setBusy(true);
    try {
      await finalizePitchPanelScores(squads);
      await refresh();
      showToast?.('Panel scores finalized — Week 2 XP applied to all squads.');
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : 'Finalize failed');
    } finally {
      setBusy(false);
    }
  }

  function copyGuestLink() {
    void navigator.clipboard.writeText(guestUrl);
    showToast?.('Guest link copied — share with panelists (PIN: W2PITCH)');
  }

  if (showGuestPreview) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowGuestPreview(false)}
          className="mb-4 text-sm font-semibold text-spike hover:underline"
        >
          ← Back to panel dashboard
        </button>
        <PitchPanelGuestPage />
      </div>
    );
  }

  return (
    <section className={`spike-surface space-y-5 ${embedded ? '' : 'p-5'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="spike-label">Week 2 pitch panel</p>
          <h2 className="text-lg font-bold text-slate-900">Guest scoring dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">
            Panelists use PIN <strong>{PITCH_PANEL_ACCESS_PIN}</strong> at{' '}
            <a href={ROUTES.pitchPanel} className="font-semibold text-spike hover:underline">
              /pitch-panel
            </a>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyGuestLink}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ClipboardCopy size={14} /> Copy guest link
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-amber-800">{error}</p> : null}
      {!ready ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Syncing panel scores…
        </p>
      ) : null}

      {finalized ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <Lock size={16} />
          Finalized {finalized.finalizedAt ? new Date(finalized.finalizedAt).toLocaleTimeString() : ''}
          — Week 2 panel XP locked on Squad XP cards.
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Live scores show on intern Squad XP cards as pending. Tap finalize after the last pitch to apply XP
          (missing scores use mentor proxy).
        </p>
      )}

      <ul className="space-y-3">
        {squads.map((squad) => {
          const liveRow = live?.liveSquads?.[squad.name] ?? {};
          const finalRow = finalized?.squads?.[squad.name];
          const avg = finalRow?.panelAverage ?? liveRow.panelAverage ?? null;
          const xp = finalRow?.week2PanelXp
            ?? (avg ? panelAverageToWeek2Xp(avg) : previewPayload[squad.name]?.week2PanelXp ?? 0);
          const pending = !finalized && avg != null;
          const source = finalRow?.source ?? liveRow.panelAverage ? 'panel' : previewPayload[squad.name]?.source;

          return (
            <li key={squad.name} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">{squad.name}</h3>
                  <p className="text-xs text-slate-500">
                    {liveRow.panelistCount ?? finalRow?.panelistCount ?? 0} panel submission(s)
                    {source === 'mentor_proxy' ? ' · mentor proxy' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1 text-lg font-bold text-amber-600">
                    <Star size={16} fill="currentColor" />
                    {avg != null ? avg.toFixed(1) : '—'} / 5
                  </p>
                  <p className={`text-sm font-semibold tabular-nums ${pending ? 'text-slate-400' : 'text-spike'}`}>
                    {pending ? `~${xp} XP pending` : `${xp} W2 panel XP`}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-800">Scoring rubric (share with panelists)</summary>
        <ul className="mt-3 space-y-2 text-slate-600">
          {PITCH_PANEL_DIMENSIONS.map((d) => (
            <li key={d.id}>
              <strong>{d.label}:</strong> {d.hint}
            </li>
          ))}
        </ul>
      </details>

      {!finalized ? (
        <button
          type="button"
          disabled={busy || !staffId}
          onClick={() => void handleFinalize()}
          className="w-full rounded-xl bg-spike py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? 'Finalizing…' : 'Finalize panel scores & apply Week 2 XP'}
        </button>
      ) : null}
    </section>
  );
}
