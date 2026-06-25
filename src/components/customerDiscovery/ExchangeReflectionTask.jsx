import { useEffect, useRef, useState } from 'react';
import { Check, Save } from 'lucide-react';
import {
  getExchangeReflectionText,
  getWeek2State,
  saveExchangeReflection,
} from '../../lib/customerDiscovery/week2DiscoveryService.js';
import {
  hydrateParticipantWeek2Discovery,
  syncWeek2DiscoveryToCloud,
} from '../../lib/customerDiscovery/week2DiscoverySync.js';
import { Week2SyncStatus } from './Week2SyncStatus.jsx';

/**
 * Tuesday PM — Market Intelligence Exchange reflection.
 * @param {{ participantId: string, onSaved?: () => void }} props
 */
export function ExchangeReflectionTask({ participantId, onSaved }) {
  const [response, setResponse] = useState(() => getExchangeReflectionText(getWeek2State(participantId)));
  const [saveState, setSaveState] = useState('idle');
  const [syncTick, setSyncTick] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const responseRef = useRef(response);

  useEffect(() => {
    responseRef.current = response;
  }, [response]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await hydrateParticipantWeek2Discovery(participantId);
      if (cancelled) return;
      setSyncTick((n) => n + 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [participantId]);

  function persist(value) {
    setResponse(value);
    saveExchangeReflection(participantId, value);
  }

  async function saveNow({ notify = false } = {}) {
    const next = saveExchangeReflection(participantId, responseRef.current);
    setSyncing(true);
    try {
      await syncWeek2DiscoveryToCloud(participantId, next);
    } finally {
      setSyncing(false);
      setSyncTick((n) => n + 1);
    }
    setSaveState('saved');
    window.setTimeout(() => setSaveState('idle'), 2000);
    if (notify) onSaved?.();
  }

  useEffect(() => {
    const saveLocal = () => {
      saveExchangeReflection(participantId, responseRef.current);
    };
    window.addEventListener('pagehide', saveLocal);
    const onHide = () => {
      if (document.visibilityState === 'hidden') saveLocal();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', saveLocal);
      document.removeEventListener('visibilitychange', onHide);
      saveLocal();
    };
  }, [participantId]);

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <section className="spike-surface space-y-2">
        <p className="spike-label">Market Intelligence Exchange</p>
        <h2 className="text-xl font-bold text-slate-900">Midweek intelligence reflection</h2>
        <p className="text-sm text-slate-600">
          One interview is a story. Thirty interviews are evidence. What pattern are you beginning to notice?
        </p>
        <Week2SyncStatus
          participantId={participantId}
          syncing={syncing}
          refreshKey={syncTick}
          className="hidden sm:flex"
        />
      </section>

      <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <button
          type="button"
          onClick={() => void saveNow({ notify: true })}
          disabled={syncing}
          className="spike-btn-primary inline-flex min-h-[44px] items-center gap-2 disabled:opacity-60"
        >
          <Save size={16} aria-hidden />
          {syncing ? 'Saving…' : 'Save reflection'}
        </button>
        {saveState === 'saved' ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-venture-discover">
            <Check size={14} aria-hidden />
            Saved
          </span>
        ) : null}
      </div>

      <textarea
        value={response}
        onChange={(e) => persist(e.target.value)}
        rows={6}
        placeholder="What surprised you most? Which assumption changed? What quote stayed with you?"
        className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-spike focus:outline-none focus:ring-1 focus:ring-spike"
      />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
        <Week2SyncStatus participantId={participantId} syncing={syncing} refreshKey={syncTick} className="mb-2" />
        <button
          type="button"
          onClick={() => void saveNow({ notify: true })}
          disabled={syncing}
          className="spike-btn-primary inline-flex min-h-[48px] w-full items-center justify-center gap-2 disabled:opacity-60"
        >
          <Save size={18} aria-hidden />
          {syncing ? 'Saving…' : 'Save reflection'}
        </button>
        {saveState === 'saved' ? (
          <p className="mt-2 text-center text-xs font-medium text-venture-discover">Saved to device + cloud</p>
        ) : null}
      </div>
    </div>
  );
}
