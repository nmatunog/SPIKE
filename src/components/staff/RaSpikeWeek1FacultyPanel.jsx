import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Unlock } from 'lucide-react';
import {
  fetchWeek1Portfolio,
  staffListWeek1Attendance,
  staffListWeek1Portfolios,
  staffMarkWeek1Attendance,
  staffPublishWeek2,
  staffSetWeek1FacultyStatus,
} from '../../lib/raSpikeWeek1Portfolio.js';
import { filterRaSpikeInterns } from '../../lib/raSpikeStaffGateService.js';
import { usePortalWriteAccess } from '../../hooks/usePortalWriteAccess.js';

/**
 * @param {{
 *   interns: Array<object>,
 *   showToast?: (msg: string) => void,
 *   onChanged?: () => void,
 * }} props
 */
export function RaSpikeWeek1FacultyPanel({ interns, showToast, onChanged }) {
  const { canWrite } = usePortalWriteAccess();
  const raInterns = useMemo(() => filterRaSpikeInterns(interns), [interns]);
  const sessionDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [rows, setRows] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [portfolios, att] = await Promise.all([
        staffListWeek1Portfolios(),
        staffListWeek1Attendance(sessionDate),
      ]);
      setRows(portfolios);
      const map = {};
      for (const a of att) map[a.user_id] = Boolean(a.present);
      setAttendance(map);
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : 'Could not load Week 1 faculty data.');
    } finally {
      setLoading(false);
    }
  }, [sessionDate, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const internName = useCallback((userId) => {
    const intern = raInterns.find((i) => i.id === userId);
    return intern?.name || intern?.email || userId.slice(0, 8);
  }, [raInterns]);

  async function openDetail(userId) {
    setSelectedId(userId);
    try {
      setDetail(await fetchWeek1Portfolio(userId));
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : 'Could not load submission.');
    }
  }

  async function setStatus(userId, status, reopen = false) {
    if (!canWrite) return;
    setBusy(`${status}-${userId}`);
    try {
      await staffSetWeek1FacultyStatus(userId, status, { reopen });
      showToast?.(reopen ? 'Portfolio reopened.' : `Marked ${status}.`);
      await load();
      if (selectedId === userId) setDetail(await fetchWeek1Portfolio(userId));
      onChanged?.();
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusy('');
    }
  }

  async function publishWeek2() {
    if (!canWrite) return;
    setBusy('publish');
    try {
      const count = await staffPublishWeek2();
      showToast?.(`Week 2 published for ${count} participant${count === 1 ? '' : 's'}.`);
      onChanged?.();
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : 'Publish failed.');
    } finally {
      setBusy('');
    }
  }

  async function toggleAttendance(userId, present) {
    if (!canWrite) return;
    setBusy(`att-${userId}`);
    try {
      await staffMarkWeek1Attendance(userId, present, sessionDate);
      setAttendance((prev) => ({ ...prev, [userId]: present }));
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : 'Attendance update failed.');
    } finally {
      setBusy('');
    }
  }

  const submitted = rows.filter((r) => r.submitted_at);
  const completeCount = rows.filter((r) => r.faculty_status === 'complete').length;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-spike-muted/40 to-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-spike">Week 1</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Faculty review</h2>
            <p className="mt-1 text-sm text-slate-600">
              Attendance · submissions · Complete / Incomplete · publish Week 2
            </p>
          </div>
          {canWrite ? (
            <button
              type="button"
              disabled={busy === 'publish' || completeCount === 0}
              onClick={() => void publishWeek2()}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-spike px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-spike/20 disabled:opacity-50"
            >
              {busy === 'publish' ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
              Publish Week 2 ({completeCount})
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </p>
        ) : (
          <>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance · {sessionDate}</h3>
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
                {raInterns.length === 0 ? (
                  <li className="px-3 py-3 text-sm text-slate-500">No RA-SPIKE participants yet.</li>
                ) : raInterns.map((intern) => (
                  <li key={intern.id} className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
                    <span className="font-medium text-slate-800">{intern.name || intern.email}</span>
                    <label className="inline-flex items-center gap-2 text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(attendance[intern.id])}
                        disabled={!canWrite || busy === `att-${intern.id}`}
                        onChange={(e) => void toggleAttendance(intern.id, e.target.checked)}
                      />
                      Present
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Submissions ({submitted.length})
              </h3>
              <ul className="mt-2 space-y-2">
                {submitted.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    No Week 1 portfolios submitted yet.
                  </li>
                ) : submitted.map((row) => (
                  <li key={row.user_id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{internName(row.user_id)}</p>
                        <p className="text-xs text-slate-500">
                          Status: {row.faculty_status}
                          {row.income_php != null ? ` · ₱${Number(row.income_php).toLocaleString('en-PH')}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                          onClick={() => void openDetail(row.user_id)}
                        >
                          View
                        </button>
                        {canWrite ? (
                          <>
                            <button
                              type="button"
                              disabled={busy.startsWith('complete')}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white"
                              onClick={() => void setStatus(row.user_id, 'complete')}
                            >
                              <Check size={12} /> Complete
                            </button>
                            <button
                              type="button"
                              className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-bold text-amber-900"
                              onClick={() => void setStatus(row.user_id, 'incomplete')}
                            >
                              Incomplete
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                              onClick={() => void setStatus(row.user_id, 'pending', true)}
                            >
                              Reopen
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {selectedId === row.user_id && detail ? (
                      <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                        <p><strong>Vision:</strong> {detail.personalVision || '—'}</p>
                        <p><strong>Lifestyle:</strong> {detail.lifestyleAnswer || '—'}</p>
                        <p><strong>Travel:</strong> {detail.travelAnswer || '—'}</p>
                        <p><strong>Why:</strong> {detail.blueprintWhy || '—'}</p>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
