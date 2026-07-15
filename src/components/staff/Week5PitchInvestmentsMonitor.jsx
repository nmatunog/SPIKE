import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Database, ExternalLink, Loader2, RefreshCw, Trophy, Wallet } from 'lucide-react';
import { usePitchPanelLive } from '../../hooks/usePitchPanelLive.js';
import {
  PITCH_PANEL_ACCESS_PIN,
  PITCH_PANEL_SESSION_ID,
  formatPitchPeso,
  sortPitchPanelSquads,
} from '../../lib/staff/pitchPanelConstants.js';
import {
  pitchPanelGuestHref,
  readFinalizedPanelCache,
  readLivePanelCache,
} from '../../lib/staff/pitchPanelService.js';
import { ROUTES } from '../../routes/paths.js';
import { PitchPanelDashboard } from './PitchPanelDashboard.jsx';

/**
 * Week 5 coach placeholder — monitor live panelist VC investments (Supabase).
 *
 * Storage (session {@link PITCH_PANEL_SESSION_ID}):
 * - public.pitch_panel_investments — per-squad amount + reason
 * - public.pitch_panel_panelist_capital — ₱1M capital + finalize flag
 * - public.pitch_panel_finalize — coach lock of Demo Day results
 *
 * @param {{
 *   interns: Array<object>,
 *   staffId?: string,
 *   role?: 'faculty' | 'mentor',
 *   showToast?: (msg: string) => void,
 *   embedDashboard?: boolean,
 * }} props
 */
export function Week5PitchInvestmentsMonitor({
  interns,
  staffId = '',
  role = 'faculty',
  showToast,
  embedDashboard = true,
}) {
  const [demoDayOpen, setDemoDayOpen] = useState(false);
  const { ready, version, error, refresh } = usePitchPanelLive(true);
  void version;

  const live = readLivePanelCache();
  const finalized = readFinalizedPanelCache();
  const panelists = live?.panelists ?? [];
  const finalizedCount = panelists.filter((p) => p.isFinalized).length;
  const guestUrl = pitchPanelGuestHref();
  const dashboardHref =
    role === 'mentor' ? ROUTES.mentorPitchPanel : ROUTES.programCoachPitchPanel;

  const squadTotals = sortPitchPanelSquads(
    Object.keys(live?.liveSquads ?? {}).length
      ? Object.keys(live.liveSquads)
      : ['Cassiopeia', 'Pegasus', 'Argo Navis'],
  ).map((name) => ({
    name,
    total:
      live?.liveSquads?.[name]?.finalInvestment
      ?? live?.liveSquads?.[name]?.totalInvestment
      ?? 0,
  }));

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-amber-200/80 bg-white shadow-sm ring-1 ring-amber-500/10">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-5 py-5 text-white sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
            Week 5 · Execute · Placeholder
          </p>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl">Pitch investments monitor</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            Live panelist VC allocations for today&apos;s pitch. Guest scores write to Supabase; coaches
            refresh here or open the full coach tools when needed.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={16} /> Refresh live
            </button>
            <a
              href={guestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink size={16} /> Investor page
            </a>
            <Link
              to={dashboardHref}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-spike px-4 py-2 text-sm font-bold text-white hover:bg-spike-dark"
            >
              <Trophy size={16} /> Full coach dashboard
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Panelists</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">
                {!ready ? '—' : panelists.length}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {finalizedCount} finalized · PIN {PITCH_PANEL_ACCESS_PIN}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session</p>
              <p className="mt-1 truncate font-mono text-sm font-bold text-slate-900">
                {PITCH_PANEL_SESSION_ID}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {finalized ? 'Results locked' : 'Open for investments'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Storage</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Database size={14} className="text-amber-600" aria-hidden />
                Supabase
              </p>
              <p className="mt-0.5 text-xs leading-snug text-slate-500">
                pitch_panel_investments · panelist_capital · finalize
              </p>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>
          ) : null}

          {!ready ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" /> Syncing investments…
            </p>
          ) : null}

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Squad funding (live)</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              {squadTotals.map((row) => (
                <li
                  key={row.name}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                >
                  <span className="text-sm font-semibold text-slate-800">{row.name}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-orange-600">
                    <Wallet size={14} aria-hidden />
                    {formatPitchPeso(row.total)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {!panelists.length && ready ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              No panelist investments yet for this session. Share{' '}
              <a href={guestUrl} className="font-semibold text-spike underline" target="_blank" rel="noopener noreferrer">
                {guestUrl}
              </a>{' '}
              with PIN <span className="font-mono font-bold">{PITCH_PANEL_ACCESS_PIN}</span>.
            </p>
          ) : null}
        </div>
      </div>

      {embedDashboard ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setDemoDayOpen((v) => !v)}
            aria-expanded={demoDayOpen}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 sm:px-5"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Week 5 · Coach tools
              </p>
              <p className="text-sm font-semibold text-slate-800">
                Demo Day score review
                <span className="ml-2 font-normal text-slate-500">
                  {demoDayOpen ? 'Hide' : 'Show panelist matrix, lock & export'}
                </span>
              </p>
            </div>
            <ChevronDown
              size={18}
              className={`shrink-0 text-slate-500 transition ${demoDayOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {demoDayOpen ? (
            <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
              <PitchPanelDashboard
                interns={interns}
                staffId={staffId}
                showToast={showToast}
                embedded
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
