import { useCallback, useState } from 'react';
import { ArrowRight, Check, ChevronLeft } from 'lucide-react';
import {
  WEEK4_DAY2_MISSIONS,
  WEEK4_GROWTH_ENGINE_STAGES,
} from '../../../lib/week4Day2/missionConstants.js';
import {
  canCompleteWeek4Day2Step,
  completeWeek4Day2Step,
  loadWeek4Day2MissionWithSuggestions,
} from '../../../lib/week4Day2/service.js';
import { computeWeek4Day2Progress, saveWeek4Day2Mission } from '../../../lib/week4Day2/storage.js';

const SECTION = 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8';
const LABEL = 'text-xs font-bold uppercase tracking-[0.2em] text-slate-500';
const TITLE = 'mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl';
const INPUT =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-spike focus:bg-white focus:ring-2 focus:ring-spike/15';
const TEXTAREA = `${INPUT} min-h-[100px] resize-y leading-relaxed`;

/**
 * @param {{
 *   participantId: string,
 *   readOnly?: boolean,
 *   onProgress?: () => void,
 * }} props
 */
export function Week4Day2MissionFlow({ participantId, readOnly = false, onProgress }) {
  const [state, setState] = useState(() => loadWeek4Day2MissionWithSuggestions(participantId));
  const [savedFlash, setSavedFlash] = useState(false);

  const step = state.currentStep;
  const mission = WEEK4_DAY2_MISSIONS.find((m) => m.id === step);
  const progress = computeWeek4Day2Progress(state);
  const allComplete = progress.done >= progress.total;

  const persist = useCallback(
    (mutate) => {
      if (readOnly) return;
      setState((prev) => {
        const next = mutate(prev);
        return saveWeek4Day2Mission(participantId, next);
      });
    },
    [participantId, readOnly],
  );

  function flashSaved() {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
    onProgress?.();
  }

  function goBack() {
    if (step <= 1) return;
    persist((prev) => ({ ...prev, currentStep: step - 1 }));
  }

  function completeCurrent() {
    if (!canCompleteWeek4Day2Step(state, step)) return;
    const next = completeWeek4Day2Step(participantId, state, step);
    if (!next) return;
    setState(next);
    flashSaved();
  }

  return (
    <div className="mx-auto w-full max-w-[920px] space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={LABEL}>Mission {step} of {WEEK4_DAY2_MISSIONS.length}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{mission?.title}</p>
          </div>
          <p className="text-sm font-medium text-slate-600">
            {allComplete ? 'Mission complete' : `${progress.done} / ${progress.total} steps`}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-spike transition-all"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
      </div>

      <div className={SECTION}>
        <p className={LABEL}>Your mission</p>
        <h2 className={TITLE}>{mission?.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{mission?.objective}</p>
        {mission?.prompt ? (
          <p className="mt-2 text-sm italic text-slate-500">{mission.prompt}</p>
        ) : null}

        {step === 1 ? (
          <div className="mt-6">
            <label className="block text-sm font-semibold text-slate-800">
              What would 5× look like for your venture?
            </label>
            <textarea
              className={TEXTAREA}
              value={state.drafts.mission1.fiveXChallenge}
              disabled={readOnly}
              placeholder="e.g. 5× advisors activated, 5× clients served, 5× venture revenue — be specific."
              onChange={(e) =>
                persist((prev) => ({
                  ...prev,
                  drafts: {
                    ...prev.drafts,
                    mission1: { fiveXChallenge: e.target.value },
                  },
                }))
              }
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-800">
                Choose your stage to redesign
              </label>
              <select
                className={INPUT}
                value={state.drafts.mission2.stageId}
                disabled={readOnly}
                onChange={(e) =>
                  persist((prev) => ({
                    ...prev,
                    drafts: {
                      ...prev.drafts,
                      mission2: { ...prev.drafts.mission2, stageId: e.target.value },
                    },
                  }))
                }
              >
                <option value="">Select a stage…</option>
                {WEEK4_GROWTH_ENGINE_STAGES.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label} — {stage.hint}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800">Current bottleneck</label>
              <textarea
                className={TEXTAREA}
                value={state.drafts.mission2.bottleneck}
                disabled={readOnly}
                placeholder="What slows this stage down today?"
                onChange={(e) =>
                  persist((prev) => ({
                    ...prev,
                    drafts: {
                      ...prev.drafts,
                      mission2: { ...prev.drafts.mission2, bottleneck: e.target.value },
                    },
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800">Your redesigned solution</label>
              <textarea
                className={TEXTAREA}
                value={state.drafts.mission2.solution}
                disabled={readOnly}
                placeholder="How will you redesign this stage for 5× impact?"
                onChange={(e) =>
                  persist((prev) => ({
                    ...prev,
                    drafts: {
                      ...prev.drafts,
                      mission2: { ...prev.drafts.mission2, solution: e.target.value },
                    },
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800">Expected impact</label>
              <textarea
                className={TEXTAREA}
                value={state.drafts.mission2.expectedImpact}
                disabled={readOnly}
                placeholder="What measurable lift do you expect?"
                onChange={(e) =>
                  persist((prev) => ({
                    ...prev,
                    drafts: {
                      ...prev.drafts,
                      mission2: { ...prev.drafts.mission2, expectedImpact: e.target.value },
                    },
                  }))
                }
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6">
            <label className="block text-sm font-semibold text-slate-800">
              If leadership is the multiplier, how many leaders does your engine need?
            </label>
            <textarea
              className={TEXTAREA}
              value={state.drafts.mission3.leadershipMultiplier}
              disabled={readOnly}
              placeholder="Name the leaders, roles, or leadership system your engine needs to scale."
              onChange={(e) =>
                persist((prev) => ({
                  ...prev,
                  drafts: {
                    ...prev.drafts,
                    mission3: { leadershipMultiplier: e.target.value },
                  },
                }))
              }
            />
            <p className="mt-3 text-xs text-slate-500">
              Completing this step updates your Blueprint Talent Growth Engine and Growth Multipliers.
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={goBack}
            disabled={step <= 1 || readOnly}
            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronLeft size={16} aria-hidden />
            Back
          </button>
          <div className="flex items-center gap-3">
            {savedFlash ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                <Check size={16} aria-hidden />
                Saved
              </span>
            ) : null}
            {!allComplete ? (
              <button
                type="button"
                onClick={completeCurrent}
                disabled={readOnly || !canCompleteWeek4Day2Step(state, step)}
                className="inline-flex items-center gap-2 rounded-xl bg-spike px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-spike-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {step < 3 ? 'Complete & continue' : 'Complete mission'}
                <ArrowRight size={16} aria-hidden />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                <Check size={16} aria-hidden />
                All steps complete
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
