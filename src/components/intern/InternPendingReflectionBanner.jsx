import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookMarked, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import { useCohortProgramDay } from '../../hooks/useCohortProgramDay.js';
import { listPendingPlaybookReflections } from '../../lib/pendingPlaybookReflectionService.js';
import { ReflectionViewer } from '../playbook/ReflectionViewer.jsx';
import { playbookHref } from '../../routes/paths.js';
import { Link } from 'react-router-dom';
export function InternPendingReflectionBanner() {
  const { user, internCloudSyncing, internWorkStatus } = useAuth();
  const { programDay, ready: calendarReady } = useCohortProgramDay();
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const participantId = user?.role === 'INTERN' ? user.id : '';
  const syncBannerVisible =
    internCloudSyncing || (internWorkStatus?.showBanner && internWorkStatus.phase !== 'idle');

  const pending = useMemo(() => {
    if (!participantId || !calendarReady) return [];
    return listPendingPlaybookReflections(participantId, programDay);
  }, [participantId, calendarReady, programDay, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  useEffect(() => {
    if (activeIndex >= pending.length) setActiveIndex(0);
  }, [pending.length, activeIndex]);

  useEffect(() => {
    if (!pending.length) setOpen(false);
  }, [pending.length]);

  if (user?.role !== 'INTERN' || !pending.length) return null;

  const active = pending[activeIndex] ?? pending[0];
  const moreCount = pending.length - 1;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed inset-x-0 z-[110] border-b-2 border-amber-500 bg-gradient-to-r from-amber-500 via-amber-400 to-spike px-4 py-3 text-left text-white shadow-lg transition hover:brightness-105 ${
          syncBannerVisible ? 'top-[3.75rem]' : 'top-0'
        }`}
        aria-live="assertive"
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <BookMarked className="h-5 w-5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase tracking-wide opacity-95">Reflection required</p>
            <p className="text-sm font-semibold sm:text-base">
              Complete your {active.label} closing reflection — {active.title}
              {moreCount > 0 ? ` (+${moreCount} earlier)` : ''}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
            Open now
            <ChevronRight size={14} aria-hidden />
          </span>
        </div>
      </button>

      {open && active ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pending-reflection-title"
        >
          <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <header className="flex items-start justify-between gap-3 border-b border-amber-200 bg-amber-50 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-900">
                  {active.label} · Closing reflection
                </p>
                <h2 id="pending-reflection-title" className="mt-1 text-xl font-bold text-slate-900">
                  {active.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Week {active.week}, Day {active.day} — save your reflection before you move on.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-800"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5">
              <ReflectionViewer
                key={active.reflection.id}
                reflection={active.reflection}
                participantId={participantId}
                onCompleted={() => {
                  refresh();
                  if (pending.length <= 1) {
                    setOpen(false);
                  } else {
                    setActiveIndex(0);
                  }
                }}
                submitLabel="Save reflection"
                savedMessage="Reflection saved — your mentor can review it on your coaching card."
              />
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3">
              {pending.length > 1 ? (
                <p className="text-xs font-medium text-slate-600">
                  {pending.length} reflection{pending.length === 1 ? '' : 's'} still due
                </p>
              ) : (
                <span />
              )}
              <Link
                to={playbookHref({ segment: 1, week: active.week, day: active.day })}
                className="text-sm font-semibold text-spike hover:underline"
                onClick={() => setOpen(false)}
              >
                Open in Playbook
              </Link>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}
