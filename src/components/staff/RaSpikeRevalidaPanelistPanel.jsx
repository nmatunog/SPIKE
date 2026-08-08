import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Lock, Users } from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import { supabase } from '../../supabaseClient.js';
import {
  RA_SPIKE_REVALIDA_ACCESS_PIN,
  isRevalidaFinalizeCoach,
  revalidaPanelistHref,
} from '../../lib/raSpikeRevalidaConstants.js';
import { finalizeRevalidaCohortRatingsRemote } from '../../lib/supabase/revalidaPanel.js';

/**
 * Coach view — panelist share link, live check-in list, and coach-only finalize control.
 * @param {{ showToast?: (msg: string, type?: string) => void }} props
 */
export function RaSpikeRevalidaPanelistPanel({ showToast }) {
  const { user } = useAuth();
  const panelistUrl = revalidaPanelistHref();
  const canFinalize = isRevalidaFinalizeCoach(user?.email);

  const [checkins, setCheckins] = useState([]);
  const [cohortId, setCohortId] = useState(null);
  const [squadCount, setSquadCount] = useState(0);
  const [ratingStats, setRatingStats] = useState({ total: 0, finalized: 0, panelists: 0 });
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

  const allRatingsFinalized = useMemo(
    () => ratingStats.total > 0 && ratingStats.finalized === ratingStats.total,
    [ratingStats],
  );

  const loadPanelData = useCallback(async () => {
    if (!supabase) {
      setCheckins([]);
      setLoading(false);
      return;
    }

    const { data: cohorts } = await supabase
      .from('cohorts')
      .select('id')
      .eq('is_active', true)
      .eq('program_slug', 'ra-spike')
      .order('created_at', { ascending: false })
      .limit(1);

    const activeCohortId = cohorts?.[0]?.id ?? null;
    setCohortId(activeCohortId);

    if (!activeCohortId) {
      setCheckins([]);
      setSquadCount(0);
      setRatingStats({ total: 0, finalized: 0, panelists: 0 });
      setLoading(false);
      return;
    }

    const [{ data: checkinRows }, { data: squadRows }, { data: ratingRows }] = await Promise.all([
      supabase
        .from('revalida_panelist_checkins')
        .select('panelist_name, panelist_org, checked_in_at')
        .eq('cohort_id', activeCohortId)
        .order('checked_in_at', { ascending: false }),
      supabase
        .from('formation_squads')
        .select('id')
        .eq('cohort_id', activeCohortId)
        .eq('status', 'active'),
      supabase
        .from('revalida_panel_ratings')
        .select('id, finalized, panelist_token, panelist_id')
        .eq('cohort_id', activeCohortId),
    ]);

    setCheckins(checkinRows || []);
    setSquadCount(squadRows?.length ?? 0);

    const ratings = ratingRows || [];
    const panelistKeys = new Set(
      ratings.map((row) => row.panelist_token || row.panelist_id).filter(Boolean),
    );

    setRatingStats({
      total: ratings.length,
      finalized: ratings.filter((row) => row.finalized).length,
      panelists: panelistKeys.size,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPanelData().catch(() => setLoading(false));
    const interval = setInterval(() => {
      loadPanelData().catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [loadPanelData]);

  async function copyPanelistLink() {
    try {
      await navigator.clipboard.writeText(panelistUrl);
      showToast?.('Panelist link copied — share with judges (PIN: REVALIDA)', 'success');
    } catch {
      showToast?.('Could not copy link', 'info');
    }
  }

  async function handleFinalizeCohort() {
    if (!canFinalize || !cohortId || allRatingsFinalized) return;

    const confirmed = window.confirm(
      'Finalize all Revalida panel ratings for this cohort? Panelists will no longer be able to edit their scores.',
    );
    if (!confirmed) return;

    setFinalizing(true);
    try {
      const result = await finalizeRevalidaCohortRatingsRemote(cohortId);
      await loadPanelData();
      const count = result?.finalized_count ?? result?.total_count ?? ratingStats.total;
      showToast?.(`Finalized ${count} rating${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast?.(err.message || 'Could not finalize ratings', 'info');
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <section className="rounded-2xl border border-spike/20 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-spike">REVALIDA</p>
      <h2 className="mt-1 text-base font-bold text-slate-900">Panel Rating System</h2>
      <p className="mt-2 text-sm text-slate-600">
        Share the panelist link with judges — they check in with their name (no login). PIN:{' '}
        <span className="font-mono font-bold text-spike">{RA_SPIKE_REVALIDA_ACCESS_PIN}</span>
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void copyPanelistLink()}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-spike px-4 py-2.5 text-sm font-bold text-white hover:bg-spike/90"
        >
          Copy panelist link
        </button>
        <a
          href={panelistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-spike bg-white px-4 py-2.5 text-sm font-bold text-spike hover:bg-spike-muted/30"
        >
          Open panelist page
        </a>
      </div>

      <p className="mt-3 break-all rounded-lg bg-white/80 px-3 py-2 font-mono text-xs text-slate-700">
        {panelistUrl}
      </p>

      <div className="mt-5 border-t border-spike/10 pt-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Users size={16} aria-hidden />
          Panelist check-ins
          {loading ? <Loader2 className="animate-spin text-spike" size={14} /> : null}
        </div>
        {checkins.length === 0 ? (
          <p className="text-sm text-slate-500">No panelists checked in yet.</p>
        ) : (
          <ul className="max-h-40 space-y-2 overflow-y-auto text-sm">
            {checkins.map((row) => (
              <li
                key={`${row.panelist_name}-${row.checked_in_at}`}
                className="flex items-start justify-between gap-2 rounded-lg bg-white/90 px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-slate-900">{row.panelist_name}</p>
                  {row.panelist_org?.trim() ? (
                    <p className="text-xs text-slate-500">{row.panelist_org}</p>
                  ) : null}
                </div>
                <p className="shrink-0 text-2xs text-slate-400">
                  {new Date(row.checked_in_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canFinalize ? (
        <div className="mt-5 border-t border-spike/10 pt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Lock size={16} aria-hidden />
            Coach finalize
          </div>
          <p className="text-sm text-slate-600">
            {ratingStats.total} saved rating{ratingStats.total === 1 ? '' : 's'} across{' '}
            {ratingStats.panelists} panelist{ratingStats.panelists === 1 ? '' : 's'} · {squadCount}{' '}
            squad{squadCount === 1 ? '' : 's'} in cohort
          </p>
          {allRatingsFinalized ? (
            <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              <Check size={16} />
              All ratings finalized — panelists are locked out of edits.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void handleFinalizeCohort()}
              disabled={finalizing || ratingStats.total === 0}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-spike bg-white px-4 py-3 text-sm font-bold text-spike transition hover:bg-spike hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {finalizing ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Finalizing…
                </>
              ) : (
                'Finalize all panel ratings'
              )}
            </button>
          )}
          <p className="text-xs text-slate-500">
            Only {user?.email} can finalize. Panelists save squad-by-squad; this locks everyone when
            the panel is complete.
          </p>
        </div>
      ) : null}
    </section>
  );
}
