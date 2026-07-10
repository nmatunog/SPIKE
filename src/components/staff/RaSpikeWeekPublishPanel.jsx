import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Loader2, Unlock } from 'lucide-react';
import { RA_SPIKE_PROGRAM } from '../../lib/programs/ra-spike.js';
import {
  fetchRaSpikeWeekPublishStats,
  staffPublishRaSpikeWeek,
} from '../../lib/staffRaSpikeWeekPublishService.js';
import { usePortalWriteAccess } from '../../hooks/usePortalWriteAccess.js';

/**
 * @param {{ showToast?: (msg: string) => void, onChanged?: () => void }} props
 */
export function RaSpikeWeekPublishPanel({ showToast, onChanged }) {
  const { canWrite } = usePortalWriteAccess();
  const [stats, setStats] = useState({ total: 0, minWeek: 1, maxWeek: 1, atWeek: {} });
  const [loading, setLoading] = useState(true);
  const [busyWeek, setBusyWeek] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStats(await fetchRaSpikeWeekPublishStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load week stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePublish(week) {
    if (!canWrite) return;
    setBusyWeek(week);
    setError('');
    try {
      const result = await staffPublishRaSpikeWeek(week);
      const count = Number(result.updated_count) || 0;
      showToast?.(
        count > 0
          ? `Week ${week} opened for ${count} participant${count === 1 ? '' : 's'}.`
          : `Week ${week} was already open for all participants.`,
      );
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish week.');
    } finally {
      setBusyWeek(0);
    }
  }

  const publishedThrough = stats.total ? stats.minWeek : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-spike">Playbook</p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">Publish weeks</h2>
        <p className="mt-1 text-sm text-slate-600">
          Open playbook weeks for all RA-SPIKE participants. Rookies still complete steps in order
          within each week.
        </p>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading participants…
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              {stats.total
                ? `${stats.total} participant${stats.total === 1 ? '' : 's'} — published through Week ${publishedThrough}`
                : 'No RA-SPIKE participants yet.'}
            </p>

            <ul className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: RA_SPIKE_PROGRAM.totalWeeks }, (_, i) => i + 1).map((week) => {
                const count = stats.atWeek[week] ?? 0;
                const isOpen = stats.total > 0 && publishedThrough >= week;
                return (
                  <li
                    key={week}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 ${
                      isOpen ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <CalendarDays size={15} className="shrink-0 text-slate-500" aria-hidden />
                        Week {week}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {count ? `${count} currently on Week ${week}` : isOpen ? 'Open for all' : 'Not yet published'}
                      </p>
                    </div>
                    {canWrite && week > 1 ? (
                      <button
                        type="button"
                        disabled={Boolean(busyWeek) || isOpen}
                        onClick={() => void handlePublish(week)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 disabled:opacity-50"
                      >
                        {busyWeek === week ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Unlock size={14} aria-hidden />
                        )}
                        {isOpen ? 'Open' : 'Publish'}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
