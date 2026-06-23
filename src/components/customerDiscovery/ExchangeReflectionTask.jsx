import { useEffect, useState } from 'react';
import { Check, Save } from 'lucide-react';
import {
  getExchangeReflectionText,
  getWeek2State,
  saveExchangeReflection,
} from '../../lib/customerDiscovery/week2DiscoveryService.js';
import { hydrateParticipantWeek2Discovery } from '../../lib/customerDiscovery/week2DiscoverySync.js';

/**
 * Tuesday PM — Market Intelligence Exchange reflection.
 * @param {{ participantId: string, onSaved?: () => void }} props
 */
export function ExchangeReflectionTask({ participantId, onSaved }) {
  const [response, setResponse] = useState(() => getExchangeReflectionText(getWeek2State(participantId)));
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await hydrateParticipantWeek2Discovery(participantId);
      if (cancelled) return;
      setResponse(getExchangeReflectionText(getWeek2State(participantId)));
    })();
    return () => {
      cancelled = true;
    };
  }, [participantId]);

  function persist(value) {
    setResponse(value);
    saveExchangeReflection(participantId, value);
  }

  function saveNow() {
    saveExchangeReflection(participantId, response);
    setSaveState('saved');
    window.setTimeout(() => setSaveState('idle'), 2000);
    onSaved?.();
  }

  useEffect(() => {
    const save = () => saveExchangeReflection(participantId, response);
    window.addEventListener('pagehide', save);
    const onHide = () => {
      if (document.visibilityState === 'hidden') save();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', onHide);
      save();
    };
  }, [participantId, response]);

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <section className="spike-surface space-y-2">
        <p className="spike-label">Market Intelligence Exchange</p>
        <h2 className="text-xl font-bold text-slate-900">Midweek intelligence reflection</h2>
        <p className="text-sm text-slate-600">
          One interview is a story. Thirty interviews are evidence. What pattern are you beginning to notice?
        </p>
      </section>

      <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <button type="button" onClick={saveNow} className="spike-btn-primary inline-flex min-h-[44px] items-center gap-2">
          <Save size={16} aria-hidden />
          Save reflection
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
        onBlur={saveNow}
        rows={6}
        placeholder="What surprised you most? Which assumption changed? What quote stayed with you?"
        className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-spike focus:outline-none focus:ring-1 focus:ring-spike"
      />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
        <button
          type="button"
          onClick={saveNow}
          className="spike-btn-primary inline-flex min-h-[48px] w-full items-center justify-center gap-2"
        >
          <Save size={18} aria-hidden />
          Save reflection
        </button>
        {saveState === 'saved' ? (
          <p className="mt-2 text-center text-xs font-medium text-venture-discover">Saved to device + cloud</p>
        ) : null}
      </div>
    </div>
  );
}
