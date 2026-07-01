import { useEffect, useMemo, useState } from 'react';
import { Check, RefreshCw, Send, TrendingUp, Wallet } from 'lucide-react';
import {
  BEC_FEC_ENGINE_SECTIONS,
  isBecFecEngineDraftSubmittable,
  loadBecFecEngineDraft,
  refreshBecFecEngineDraftFromCanvas,
  saveBecFecEngineDraft,
  submitBecFecEngineToFec,
} from '../../../../lib/businessEngineCanvas/fecEngineDraft.js';
import { ViewMyFecCanvasLink } from '../../../ventureDesign/ViewMyFecCanvasLink.jsx';

/**
 * Final card — extract Business Engine figures into FEC Growth Engine & Financial Engine.
 * @param {{
 *   participantId: string,
 *   canvasState: import('../../../../lib/businessEngineCanvas/types.js').BusinessEngineCanvasState,
 *   readOnly?: boolean,
 *   onSubmitted?: () => void,
 * }} props
 */
export function BusinessEngineFecEngineCard({
  participantId,
  canvasState,
  readOnly = false,
  onSubmitted,
}) {
  const [draft, setDraft] = useState(() => loadBecFecEngineDraft(participantId, canvasState));
  const [submitState, setSubmitState] = useState('idle');

  const canvasKey = useMemo(
    () =>
      JSON.stringify({
        weekly: canvasState.weeklyTargets,
        monthly: canvasState.monthlyTargets,
        year1: canvasState.year1Targets,
        year1Goal: canvasState.reflections.year1RevenueGoal,
        lever: canvasState.businessLever,
      }),
    [canvasState],
  );

  useEffect(() => {
    setDraft(loadBecFecEngineDraft(participantId, canvasState));
  }, [participantId, canvasKey, canvasState]);

  function updateField(key, value) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (!readOnly && participantId) {
      saveBecFecEngineDraft(participantId, { [key]: value });
    }
  }

  function handleRefreshFromCanvas() {
    if (!participantId || readOnly) return;
    const next = refreshBecFecEngineDraftFromCanvas(participantId, canvasState);
    setDraft(next);
    setSubmitState('idle');
  }

  function handleSubmit() {
    if (!participantId || readOnly || !isBecFecEngineDraftSubmittable(draft)) return;
    submitBecFecEngineToFec(participantId, draft, canvasState);
    setDraft(loadBecFecEngineDraft(participantId, canvasState));
    setSubmitState('done');
    window.setTimeout(() => setSubmitState('idle'), 3000);
    onSubmitted?.();
  }

  const canSubmit = isBecFecEngineDraftSubmittable(draft);

  return (
    <section
      id="business-engine-fec-submit"
      className="scroll-mt-24 rounded-3xl border-2 border-spike/25 bg-gradient-to-b from-white to-spike/5 p-5 shadow-card sm:p-6"
    >
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike">Final step · FEC sync</p>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Push your Business Engine to the FEC
        </h2>
        <p className="max-w-3xl text-sm text-slate-600">
          We extract your final weekly, monthly, and Year 1 figures into FEC Box 6 (Growth Engines) and
          Box 8 (Financial Engine). Review each section, edit as needed, then submit to your Venture
          Blueprint FEC.
        </p>
      </header>

      {draft.submittedAt ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Last submitted {new Date(draft.submittedAt).toLocaleString()}. Edit below and submit again to
          update your FEC.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {!readOnly ? (
          <button type="button" onClick={handleRefreshFromCanvas} className="spike-btn-secondary inline-flex min-h-[44px] items-center gap-2">
            <RefreshCw size={16} aria-hidden />
            Refresh from canvas
          </button>
        ) : null}
        <ViewMyFecCanvasLink exit="/playbook?segment=1&week=3&day=3" compact label="Open FEC canvas" />
      </div>

      <div className="mt-6 space-y-8">
        {BEC_FEC_ENGINE_SECTIONS.map((section) => {
          const SectionIcon = section.group === 'growth' ? TrendingUp : Wallet;
          return (
            <div key={section.group}>
              <div className="mb-4 flex items-center gap-2">
                <SectionIcon size={18} className="text-spike" aria-hidden />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  {section.groupLabel}
                </h3>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {section.fields.map((field) => (
                  <label
                    key={field.id}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <span className="text-sm font-bold text-slate-900">{field.label}</span>
                    <span className="mt-0.5 text-xs text-slate-500">{field.subtitle}</span>
                    <textarea
                      readOnly={readOnly}
                      rows={7}
                      value={draft[field.id] ?? ''}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      className="mt-3 min-h-[140px] flex-1 resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-relaxed text-slate-800 focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
                    />
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {String(draft[field.id] ?? '').trim().length}/20 min chars
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!readOnly ? (
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="spike-btn-primary inline-flex min-h-[48px] items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitState === 'done' ? <Check size={18} aria-hidden /> : <Send size={18} aria-hidden />}
            {submitState === 'done' ? 'Submitted to FEC' : 'Submit to FEC & portfolio'}
          </button>
          {!canSubmit ? (
            <p className="text-sm text-slate-600">Complete all six sections (at least 20 characters each).</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
