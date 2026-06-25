import { useEffect, useRef, useState } from 'react';
import { Check, Heart, Save, ArrowRight } from 'lucide-react';
import {
  ADVISOR_REFLECTION_PROMPTS,
  EMPATHY_MAP_PROMPTS,
  getWeek2EmpathyLabState,
  saveWeek2EmpathyLab,
} from '../../lib/customerDiscovery/week2EmpathyLabService.js';
import {
  hydrateParticipantWeek2Discovery,
  syncWeek2DiscoveryToCloud,
} from '../../lib/customerDiscovery/week2DiscoverySync.js';
import { Week2SyncStatus } from './Week2SyncStatus.jsx';
import { Link } from 'react-router-dom';
import { playbookWeek2MissionHref } from '../../lib/customerDiscovery/week2MissionService.js';

/**
 * Week 2 Day 5 — Empathy Lab (Think Like Miguel) + advisor reflection.
 * @param {{ participantId: string, onSaved?: () => void }} props
 */
export function Week2EmpathyLabTask({ participantId, onSaved }) {
  const initial = getWeek2EmpathyLabState(participantId);
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
      setFields(getWeek2EmpathyLabState(participantId).fields);
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
    setSyncing(true);
    try {
      const next = saveWeek2EmpathyLab(participantId, fieldsRef.current, { finalize });
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
      saveWeek2EmpathyLab(participantId, fieldsRef.current);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [participantId, fields]);

  const { complete } = getWeek2EmpathyLabState(participantId);

  return (
    <div className="space-y-8 pb-20 sm:pb-6">
      <section className="spike-surface space-y-3">
        <p className="spike-label">Week 2 · Day 5 workshop</p>
        <h2 className="text-xl font-bold text-slate-900">Empathy Lab — Think Like Miguel</h2>
        <p className="text-sm text-slate-600">
          After your Market Validation Pitch, step into Miguel&apos;s world. Understand deeply before
          you advise — empathy builds trust.
        </p>
        <Week2SyncStatus
          participantId={participantId}
          syncing={syncing}
          refreshKey={syncTick}
          className="hidden sm:flex"
        />
      </section>

      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Meet Miguel</p>
        <p className="mt-2 text-sm text-slate-700">
          Miguel, 24 — Marketing Associate in Cebu. First job, no savings plan, no emergency fund.
          Dreams of financial independence. He is not irresponsible — he is human.
        </p>
      </section>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
          <Heart size={16} className="text-spike" aria-hidden />
          Empathy map
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {EMPATHY_MAP_PROMPTS.map((prompt) => (
            <label key={prompt.id} className="block space-y-2 rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-sm font-semibold text-slate-900">{prompt.label}</span>
              <textarea
                value={fields[prompt.id] ?? ''}
                onChange={(e) => updateField(prompt.id, e.target.value)}
                rows={3}
                placeholder={prompt.placeholder}
                className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-100 pt-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Reflect &amp; share</h3>
        {ADVISOR_REFLECTION_PROMPTS.map((prompt) => (
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
          {syncing ? 'Saving…' : complete ? 'Update empathy lab' : 'Save to portfolio'}
        </button>
        {saveState === 'saved' ? (
          <span className="text-sm font-medium text-emerald-700">Saved</span>
        ) : null}
        {complete ? (
          <Link
            to={playbookWeek2MissionHref('week-wrap-up', { day: 5 })}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-spike hover:underline"
          >
            Continue to week wrap-up
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
