import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookMarked, ChevronRight } from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import { useCohortProgramDay } from '../../hooks/useCohortProgramDay.js';
import { listPendingPlaybookReflections } from '../../lib/pendingPlaybookReflectionService.js';
import { playbookReflectionHref, ROUTES } from '../../routes/paths.js';

/**
 * Persistent top-of-screen prompt — sends interns to today's Playbook reflection.
 */
export function InternPendingReflectionBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, internCloudSyncing, internWorkStatus } = useAuth();
  const { programDay, ready: calendarReady } = useCohortProgramDay();
  const [tick, setTick] = useState(0);

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

  if (user?.role !== 'INTERN' || !pending.length) return null;

  const active = pending[0];
  const moreCount = pending.length - 1;
  const onPlaybook =
    location.pathname === ROUTES.playbook
    && Number(new URLSearchParams(location.search).get('week')) === active.week
    && Number(new URLSearchParams(location.search).get('day')) === active.day;

  if (onPlaybook) return null;

  function openPlaybookReflection() {
    navigate(playbookReflectionHref({ segment: 1, week: active.week, day: active.day }));
  }

  return (
    <button
      type="button"
      onClick={openPlaybookReflection}
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
            Open Playbook to complete your {active.label} closing reflection — {active.title}
            {moreCount > 0 ? ` (+${moreCount} earlier)` : ''}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
          Open Playbook
          <ChevronRight size={14} aria-hidden />
        </span>
      </div>
    </button>
  );
}
