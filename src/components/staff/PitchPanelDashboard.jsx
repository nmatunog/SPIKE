import { useMemo, useState } from 'react';
import { ClipboardCopy, ExternalLink, Loader2, Lock, RefreshCw, Star } from 'lucide-react';
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

const ACTION_BTN =
  'inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition active:scale-[0.98] hover:bg-slate-50';

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
          className="mb-4 min-h-[44px] touch-manipulation text-sm font-semibold text-spike active:opacity-80"
        >
          ← Back to panel dashboard
        </button>
        <PitchPanelGuestPage />
      </div>
    );
  }

  return (
    <section className={`spike-surface space-y-4 sm:space-y-5 ${embedded ? '' : 'p-4 sm:p-5'}`}>
      <div className="space-y-4">
        <div>
          <p className="spike-label">Week 2 pitch panel</p>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Guest scoring dashboard</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Share the guest link with panelists — they score on their phones with PIN{' '}
            <strong className="font-mono tracking-wide">{PITCH_PANEL_ACCESS_PIN}</strong>.
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <button type="button" onClick={copyGuestLink} className={`${ACTION_BTN} w-full sm:w-auto`}>
            <ClipboardCopy size={16} /> Copy guest link
          </button>
          <a
            href={ROUTES.pitchPanel}
            target="_blank"
            rel="noopener noreferrer"
            className={`${ACTION_BTN} w-full sm:w-auto`}
          >
            <ExternalLink size={16} /> Open guest page
          </a>
          <button
            type="button"
            onClick={() => void refresh()}
            className={`${ACTION_BTN} w-full sm:w-auto`}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>
      ) : null}
      {!ready ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Syncing panel scores…
        </p>
      ) : null}

      {finalized ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-900">
          <Lock size={18} className="mt-0.5 shrink-0" />
          <span>
            Finalized {finalized.finalizedAt ? new Date(finalized.finalizedAt).toLocaleTimeString() : ''}
            — Week 2 panel XP locked on Squad XP cards.
          </span>
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
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
            <li key={squad.name} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 sm:text-lg">{squad.name}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {liveRow.panelistCount ?? finalRow?.panelistCount ?? 0} panel submission(s)
                    {source === 'mentor_proxy' ? ' · mentor proxy' : ''}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
                  <p className="flex items-center gap-1.5 text-xl font-bold text-amber-600 sm:justify-end">
                    <Star size={18} fill="currentColor" />
                    {avg != null ? avg.toFixed(1) : '—'}
                    <span className="text-sm font-semibold text-slate-400">/ 5</span>
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

      <details className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <summary className="min-h-[44px] cursor-pointer touch-manipulation py-2 font-semibold text-slate-800">
          Scoring rubric (share with panelists)
        </summary>
        <ul className="mt-2 space-y-3 border-t border-slate-200/80 pt-3 text-slate-600">
          {PITCH_PANEL_DIMENSIONS.map((d) => (
            <li key={d.id} className="leading-relaxed">
              <strong className="text-slate-800">{d.label}:</strong> {d.hint}
            </li>
          ))}
        </ul>
      </details>

      {!finalized ? (
        <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 -mx-1 sm:static sm:mx-0">
          <button
            type="button"
            disabled={busy || !staffId}
            onClick={() => void handleFinalize()}
            className="min-h-[52px] w-full touch-manipulation rounded-xl bg-spike px-4 py-3 text-base font-bold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-50 sm:shadow-none"
          >
            {busy ? 'Finalizing…' : 'Finalize panel scores & apply Week 2 XP'}
          </button>
        </div>
      ) : null}
    </section>
  );
}
