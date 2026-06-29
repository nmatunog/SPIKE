import { useEffect, useRef, useState } from 'react';
import { Check, Save } from 'lucide-react';
import {
  getWeek2WrapUpState,
  saveWeek2WrapUp,
  WEEK2_WRAP_UP_PROMPTS,
} from '../../lib/customerDiscovery/week2WrapUpService.js';
import {
  hydrateParticipantWeek2Discovery,
  syncWeek2DiscoveryToCloud,
} from '../../lib/customerDiscovery/week2DiscoverySync.js';
import { SquadScoringExplainer } from '../venturePortfolio/SquadScoringExplainer.jsx';
import { PortfolioPanelistFeedbackPanel } from '../venturePortfolio/PortfolioPanelistFeedbackPanel.jsx';
import { Week2SyncStatus } from './Week2SyncStatus.jsx';

/**
 * Week 2 Friday — portfolio week wrap-up + scoring guide.
 * @param {{ participantId: string, onSaved?: () => void }} props
 */
export function Week2WrapUpTask({ participantId, onSaved }) {
  const initial = getWeek2WrapUpState(participantId);
  const [fields, setFields] = useState(initial.fields);
  const [saveState, setSaveState] = useState('idle');
  const [syncTick, setSyncTick] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const fieldsRef = useRef(fields);

  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await hydrateParticipantWeek2Discovery(participantId);
      if (cancelled) return;
      const fresh = getWeek2WrapUpState(participantId);
      setFields(fresh.fields);
      setSyncTick((n) => n + 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [participantId]);

  function updateField(id, value) {
    setFields((prev) => ({ ...prev, [id]: value }));
  }

  async function saveNow({ finalize = false, notify = false } = {}) {
    const f = fieldsRef.current;
    setSyncing(true);
    try {
      const next = saveWeek2WrapUp(participantId, f, { finalize });
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
    const timer = window.setTimeout(() => {
      saveWeek2WrapUp(participantId, fieldsRef.current);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [participantId, fields]);

  const complete = getWeek2WrapUpState(participantId).complete;

  return (
    <div className="space-y-8 pb-20 sm:pb-6">
      <section className="spike-surface space-y-2">
        <p className="spike-label">Week 2 · Day 5</p>
        <h2 className="text-xl font-bold text-slate-900">Week wrap-up &amp; Week 3 bridge</h2>
        <p className="text-sm text-slate-600">
          After your pitch and empathy lab, capture what you learned. This saves to your Venture Portfolio,
          sets your focus for Week 3 — Discover Your Business Model, and helps your mentor see your growth — separate from guest panel scores.
        </p>
        <Week2SyncStatus
          participantId={participantId}
          syncing={syncing}
          refreshKey={syncTick}
          className="hidden sm:flex"
        />
      </section>

      <SquadScoringExplainer variant="task" participantId={participantId} />

      <PortfolioPanelistFeedbackPanel participantId={participantId} />

      <div className="space-y-5">
        {WEEK2_WRAP_UP_PROMPTS.map((prompt) => (
          <label key={prompt.id} className="block space-y-2">
            <span className="text-sm font-semibold text-slate-900">{prompt.label}</span>
            <textarea
              value={fields[prompt.id] ?? ''}
              onChange={(e) => updateField(prompt.id, e.target.value)}
              rows={3}
              placeholder={prompt.placeholder}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void saveNow({ finalize: true, notify: true })}
          disabled={syncing}
          className="spike-btn-primary inline-flex min-h-[44px] items-center gap-2 disabled:opacity-60"
        >
          {complete ? <Check size={16} aria-hidden /> : <Save size={16} aria-hidden />}
          {syncing ? 'Saving…' : complete ? 'Update wrap-up' : 'Save to portfolio'}
        </button>
        {saveState === 'saved' ? (
          <span className="text-sm font-medium text-emerald-700">Saved</span>
        ) : null}
      </div>
    </div>
  );
}
