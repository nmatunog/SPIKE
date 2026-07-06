import { useCallback, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  WEEK4_CLIENT_JOURNEY_STAGES,
  WEEK4_DAY1_BLUEPRINT_STEP,
  WEEK4_DAY1_MISSIONS,
  WEEK4_FOUNDER_REVIEW_QUESTIONS,
  WEEK4_GROWTH_ENGINE_GROUPS,
  WEEK4_KEY_ACTIVITY_EXAMPLES,
  WEEK4_KEY_RESOURCE_EXAMPLES,
  WEEK4_WINNING_STRATEGY_EXAMPLES,
} from '../../../lib/week4Day1/missionConstants.js';
import {
  canCompleteWeek4Day1Step,
  completeWeek4Day1Step,
  loadWeek4Day1MissionWithSuggestions,
} from '../../../lib/week4Day1/service.js';
import { computeWeek4Day1Progress, saveWeek4Day1Mission } from '../../../lib/week4Day1/storage.js';
import { buildWeek4Day1FecPreview } from '../../../lib/week4Day1/previewData.js';
import {
  playbookWeek4BlueprintPreviewHref,
  playbookWeek4FecPreviewHref,
} from '../../../routes/paths.js';

const SECTION = 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8';
const LABEL = 'text-xs font-bold uppercase tracking-[0.2em] text-slate-500';
const TITLE = 'mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl';
const INPUT =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-spike focus:bg-white focus:ring-2 focus:ring-spike/15';
const TEXTAREA = `${INPUT} min-h-[120px] resize-y leading-relaxed`;

/**
 * @param {{
 *   participantId: string,
 *   readOnly?: boolean,
 *   onProgress?: () => void,
 * }} props
 */
export function Week4Day1MissionFlow({ participantId, readOnly = false, onProgress }) {
  const [state, setState] = useState(() => loadWeek4Day1MissionWithSuggestions(participantId));
  const [savedFlash, setSavedFlash] = useState(false);

  const step = state.currentStep;
  const mission = WEEK4_DAY1_MISSIONS.find((m) => m.id === step);
  const isBlueprintStep = step === 6;
  const progress = computeWeek4Day1Progress(state);
  const allComplete = progress.done >= progress.total;
  const fecPreview = useMemo(() => buildWeek4Day1FecPreview(participantId), [participantId, state.updatedAt]);

  const persist = useCallback(
    (mutate) => {
      if (readOnly) return;
      setState((prev) => {
        const next = mutate(prev);
        return saveWeek4Day1Mission(participantId, next);
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
    if (!canCompleteWeek4Day1Step(state, step)) return;
    const next = completeWeek4Day1Step(participantId, state, step);
    if (!next) return;
    setState(next);
    flashSaved();
  }

  function toggleGrowthItem(groupKey, item) {
    persist((prev) => {
      const selected = { ...prev.drafts.mission4.selected };
      const list = [...(selected[groupKey] ?? [])];
      const idx = list.indexOf(item);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(item);
      selected[groupKey] = list;
      return {
        ...prev,
        drafts: {
          ...prev.drafts,
          mission4: { ...prev.drafts.mission4, selected },
        },
      };
    });
  }

  const stepLabel = isBlueprintStep
    ? 'Blueprint integration'
    : `Mission ${step} of ${WEEK4_DAY1_MISSIONS.length}`;

  return (
    <div className="mx-auto w-full max-w-[920px] space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={LABEL}>{stepLabel}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {isBlueprintStep ? WEEK4_DAY1_BLUEPRINT_STEP.title : mission?.title}
            </p>
          </div>
          <p className="text-sm font-medium text-slate-600">
            {allComplete ? 'Mission complete' : `${progress.done} / ${progress.total} steps`}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-spike transition-all duration-500"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        {savedFlash ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <Check size={14} aria-hidden />
            Finalized — latest version saved to SPIKE
          </p>
        ) : null}
      </div>

      {!isBlueprintStep && mission ? (
        <section className={SECTION}>
          <p className={LABEL}>Objective</p>
          <h2 className={TITLE}>{mission.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{mission.objective}</p>

          {step === 1 ? (
            <div className="mt-8 space-y-5">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-900">
                  Is your current proposition the venture itself, or a tool/technology?
                </legend>
                <div className="flex flex-wrap gap-3">
                  {[
                    ['venture', 'The venture itself'],
                    ['tool', 'A tool / technology / platform'],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                        state.drafts.mission1.propositionKind === value
                          ? 'border-spike bg-spike/5 text-spike'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={state.drafts.mission1.propositionKind === value}
                        disabled={readOnly}
                        onChange={() =>
                          persist((prev) => ({
                            ...prev,
                            drafts: {
                              ...prev.drafts,
                              mission1: { ...prev.drafts.mission1, propositionKind: value },
                            },
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              {state.drafts.mission1.propositionKind === 'tool' ? (
                <label className="block">
                  <span className="text-sm font-semibold text-slate-800">
                    Where will you move the tool detail? (Blueprint section)
                  </span>
                  <input
                    className={INPUT}
                    value={state.drafts.mission1.toolRelocatedTo}
                    readOnly={readOnly}
                    placeholder="e.g. Key Resources → Technology"
                    onChange={(e) =>
                      persist((prev) => ({
                        ...prev,
                        drafts: {
                          ...prev.drafts,
                          mission1: { ...prev.drafts.mission1, toolRelocatedTo: e.target.value },
                        },
                      }))
                    }
                  />
                </label>
              ) : null}
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Final Venture Proposition</span>
                <p className="mt-1 text-xs text-slate-500">
                  Brainstorm on paper or with your mentor — encode only your finalized answer here.
                </p>
                <textarea
                  className={TEXTAREA}
                  value={state.drafts.mission1.finalProposition}
                  readOnly={readOnly}
                  onChange={(e) =>
                    persist((prev) => ({
                      ...prev,
                      drafts: {
                        ...prev.drafts,
                        mission1: { ...prev.drafts.mission1, finalProposition: e.target.value },
                      },
                    }))
                  }
                />
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">{mission.prompt}</span>
                <textarea
                  className={TEXTAREA}
                  value={state.drafts.mission2.clientExperience}
                  readOnly={readOnly}
                  onChange={(e) =>
                    persist((prev) => ({
                      ...prev,
                      drafts: {
                        ...prev.drafts,
                        mission2: { ...prev.drafts.mission2, clientExperience: e.target.value },
                      },
                    }))
                  }
                />
              </label>
              <div>
                <p className="text-sm font-semibold text-slate-800">Suggested journey</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {WEEK4_CLIENT_JOURNEY_STAGES.map((stage) => (
                    <label key={stage.id} className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-spike">
                        {stage.label}
                      </span>
                      <input
                        className={INPUT}
                        value={state.drafts.mission2.journey[stage.id]}
                        readOnly={readOnly}
                        onChange={(e) =>
                          persist((prev) => ({
                            ...prev,
                            drafts: {
                              ...prev.drafts,
                              mission2: {
                                ...prev.drafts.mission2,
                                journey: {
                                  ...prev.drafts.mission2.journey,
                                  [stage.id]: e.target.value,
                                },
                              },
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-8 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">{mission.prompt}</span>
                <textarea
                  className={TEXTAREA}
                  value={state.drafts.mission3.winningStrategy}
                  readOnly={readOnly}
                  onChange={(e) =>
                    persist((prev) => ({
                      ...prev,
                      drafts: {
                        ...prev.drafts,
                        mission3: { ...prev.drafts.mission3, winningStrategy: e.target.value },
                      },
                    }))
                  }
                />
              </label>
              <p className="text-xs text-slate-500">
                Examples: {WEEK4_WINNING_STRATEGY_EXAMPLES.join(' · ')}
              </p>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="mt-8 space-y-6">
              {Object.entries(WEEK4_GROWTH_ENGINE_GROUPS).map(([groupKey, group]) => (
                <div key={groupKey}>
                  <p className="text-sm font-bold text-slate-900">{group.label}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((item) => {
                      const active = state.drafts.mission4.selected[groupKey]?.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          disabled={readOnly}
                          onClick={() => toggleGrowthItem(groupKey, item)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            active
                              ? 'border-spike bg-spike text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-spike/40'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Final summary (optional)</span>
                <textarea
                  className={TEXTAREA}
                  rows={4}
                  value={state.drafts.mission4.summary}
                  readOnly={readOnly}
                  onChange={(e) =>
                    persist((prev) => ({
                      ...prev,
                      drafts: {
                        ...prev.drafts,
                        mission4: { ...prev.drafts.mission4, summary: e.target.value },
                      },
                    }))
                  }
                />
              </label>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="mt-8 space-y-6">
              <p className="flex items-start gap-2 rounded-xl border border-spike/15 bg-spike/5 px-4 py-3 text-sm text-slate-700">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-spike" aria-hidden />
                Review Boxes 4, 5, and 6 against your Venture Proposition. This step does not add new
                data — it confirms alignment before you finish.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['Box 4', fecPreview.sections.find((s) => s.id === 'client_experience')?.value],
                  ['Box 5', fecPreview.sections.find((s) => s.id === 'winning_strategy')?.value],
                  ['Box 6', fecPreview.sections.find((s) => s.id === 'growth_engines')?.value],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-800">
                      {value || '—'}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Venture Proposition
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  {fecPreview.sections.find((s) => s.id === 'venture_proposition')?.value || '—'}
                </p>
              </div>
              <ol className="space-y-2 text-sm text-slate-700">
                {WEEK4_FOUNDER_REVIEW_QUESTIONS.map((q, i) => (
                  <li key={q} className="flex gap-3">
                    <span className="font-bold text-spike">{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  disabled={readOnly}
                  checked={state.founderReviewAcknowledged}
                  onChange={(e) =>
                    persist((prev) => ({
                      ...prev,
                      founderReviewAcknowledged: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm text-slate-800">
                  Our squad has reviewed alignment — we are ready to complete Blueprint integration.
                </span>
              </label>
            </div>
          ) : null}

          {!readOnly && step < 6 ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {step > 1 ? (
                <button type="button" onClick={goBack} className="spike-btn-secondary inline-flex items-center gap-2">
                  <ChevronLeft size={16} aria-hidden />
                  Back
                </button>
              ) : null}
              <button
                type="button"
                onClick={completeCurrent}
                disabled={!canCompleteWeek4Day1Step(state, step)}
                className="spike-btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state.completedSteps.includes(step) ? 'Update finalized version' : 'Finalize & continue'}
                <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {isBlueprintStep ? (
        <section className={SECTION}>
          <p className={LABEL}>Business Blueprint</p>
          <h2 className={TITLE}>{WEEK4_DAY1_BLUEPRINT_STEP.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            {WEEK4_DAY1_BLUEPRINT_STEP.objective}
          </p>
          <div className="mt-8 space-y-6">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Key Activities</span>
              <p className="mt-1 text-xs text-slate-500">
                What activities must your venture consistently perform? Stored in Blueprint only — not
                in the FEC.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Examples: {WEEK4_KEY_ACTIVITY_EXAMPLES.join(' · ')}
              </p>
              <textarea
                className={TEXTAREA}
                value={state.drafts.blueprint.keyActivities}
                readOnly={readOnly}
                onChange={(e) =>
                  persist((prev) => ({
                    ...prev,
                    drafts: {
                      ...prev.drafts,
                      blueprint: { ...prev.drafts.blueprint, keyActivities: e.target.value },
                    },
                  }))
                }
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Key Resources</span>
              <p className="mt-1 text-xs text-slate-500">
                People, products, technology, and platform capabilities required.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Examples: {WEEK4_KEY_RESOURCE_EXAMPLES.join(' · ')}
              </p>
              <textarea
                className={TEXTAREA}
                value={state.drafts.blueprint.keyResources}
                readOnly={readOnly}
                onChange={(e) =>
                  persist((prev) => ({
                    ...prev,
                    drafts: {
                      ...prev.drafts,
                      blueprint: { ...prev.drafts.blueprint, keyResources: e.target.value },
                    },
                  }))
                }
              />
            </label>
          </div>
          {!readOnly ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={goBack} className="spike-btn-secondary inline-flex items-center gap-2">
                <ChevronLeft size={16} aria-hidden />
                Back
              </button>
              <button
                type="button"
                onClick={completeCurrent}
                disabled={!canCompleteWeek4Day1Step(state, 6)}
                className="spike-btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Finalize Blueprint
                <Check size={16} aria-hidden />
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {allComplete ? (
        <section className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/50 p-6 shadow-sm sm:p-8">
          <p className={LABEL}>Mission complete</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Your venture is integrated</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            FEC holds your final canvas. Blueprint holds operational detail. Preview both before your
            mentor review.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to={playbookWeek4FecPreviewHref(participantId)}
              className="spike-btn-primary inline-flex items-center gap-2"
            >
              <Eye size={16} aria-hidden />
              Preview FEC
            </Link>
            <Link
              to={playbookWeek4BlueprintPreviewHref(participantId)}
              className="spike-btn-secondary inline-flex items-center gap-2"
            >
              <Eye size={16} aria-hidden />
              Preview Blueprint
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
