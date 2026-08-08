import { useCallback, useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import { RA_SPIKE_REVALIDA_ACCESS_PIN, revalidaPanelistHref } from '../../lib/raSpikeRevalidaConstants.js';

/**
 * Coach view — panelist share link + live check-in list.
 * @param {{ showToast?: (msg: string, type?: string) => void }} props
 */
export function RaSpikeRevalidaPanelistPanel({ showToast }) {
  const panelistUrl = revalidaPanelistHref();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCheckins = useCallback(async () => {
    if (!supabase) {
      setCheckins([]);
      setLoading(false);
      return;
    }
    const { data: cohorts } = await supabase
      .from('cohorts')
      .select('id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const cohortId = cohorts?.[0]?.id;
    if (!cohortId) {
      setCheckins([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('revalida_panelist_checkins')
      .select('panelist_name, panelist_org, checked_in_at')
      .eq('cohort_id', cohortId)
      .order('checked_in_at', { ascending: false });

    setCheckins(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCheckins().catch(() => setLoading(false));
    const interval = setInterval(() => {
      loadCheckins().catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [loadCheckins]);

  async function copyPanelistLink() {
    try {
      await navigator.clipboard.writeText(panelistUrl);
      showToast?.('Panelist link copied — share with judges (PIN: REVALIDA)', 'success');
    } catch {
      showToast?.('Could not copy link', 'info');
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
    </section>
  );
}
