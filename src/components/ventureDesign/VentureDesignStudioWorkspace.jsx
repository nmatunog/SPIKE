import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Layout, Lock, Sparkles } from 'lucide-react';
import { VentureDesignSquadPanel } from './VentureDesignSquadPanel.jsx';
import {
  VentureDesignCoachFeedback,
  VentureDesignFinalSummary,
  VentureDesignLanding,
  VentureDesignStep1,
  VentureDesignStep2,
  VentureDesignStep3,
  VentureDesignStep4,
  VentureDesignStep5,
  VentureDesignWorkshopHeader,
} from './VentureDesignSteps.jsx';
import { VENTURE_DESIGN_STEPS_UI } from '../../lib/ventureDesignStudioConstants.js';
import {
  VENTURE_DESIGN_COACH_THINK_MS,
  requestVentureDesignCoachFeedback,
} from '../../lib/ventureDesignStudioCoach.js';
import { downloadVentureDesignHtml } from '../../lib/ventureDesignExport.js';
import {
  applyResearchHydration,
  commitVentureDesignToPortfolio,
  hydrateFromResearchStudio,
  loadSquadDesignRecord,
  loadVentureDesignRecord,
  resolveSquadContext,
  saveSquadDesignRecord,
  saveVentureDesignRecord,
} from '../../lib/ventureDesignStudioService.js';
import { BLUEPRINT_LINKS } from '../../routes/paths.js';
import { markActivityCompleted } from '../../lib/playbookProgress.js';
import { isMockUserId } from '../../lib/mockAuth.js';

const DAY4_CANVAS_WORKSHOP_ID = 'activity-day-4-canvas-workshop';
const DAY4_PLAYBOOK_ID = 'day-segment-1-week-1-day-4';

/**
 * @param {{
 *   participantId: string,
 *   participantName?: string,
 *   squadNameFallback?: string,
 *   coachMode?: boolean,
 *   readOnly?: boolean,
 * }} props
 */
export function VentureDesignStudioWorkspace({
  participantId,
  participantName = 'Builder',
  squadNameFallback = '',
  coachMode = false,
  readOnly = false,
}) {
  const squadCtx = useMemo(() => resolveSquadContext(participantId), [participantId]);
  const hydratedMeta = useMemo(
    () => hydrateFromResearchStudio(participantId, squadNameFallback),
    [participantId, squadNameFallback],
  );

  const [record, setRecord] = useState(() => loadVentureDesignRecord(participantId));
  const [squadRecord, setSquadRecord] = useState(() => loadSquadDesignRecord(squadCtx.squadId));
  const [squadName, setSquadName] = useState(hydratedMeta.squadName || squadCtx.squadName || squadNameFallback);
  const [currentStep, setCurrentStep] = useState(record.currentStep);
  const [highestStepReached, setHighestStepReached] = useState(record.highestStepReached);
  const [isStarted, setIsStarted] = useState(record.isStarted);
  const [isComplete, setIsComplete] = useState(record.isComplete);
  const [showCoachFeedback, setShowCoachFeedback] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState(/** @type {{ title: string, coach: string } | null} */ (null));
  const [coachLoading, setCoachLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);
  const completedMarkedRef = useRef(false);

  const activeDraft = coachMode ? squadRecord.consolidated : record.individual;
  const effectiveReadOnly = readOnly || (coachMode === false && false);

  useEffect(() => {
    const loaded = loadVentureDesignRecord(participantId);
    const { draft } = applyResearchHydration(participantId, loaded.individual, squadNameFallback);
    if (JSON.stringify(draft) !== JSON.stringify(loaded.individual)) {
      saveVentureDesignRecord(participantId, { individual: draft });
      loaded.individual = draft;
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('start') === '1' && !loaded.isStarted) {
        loaded.isStarted = true;
        saveVentureDesignRecord(participantId, { isStarted: true });
      }
    }
    setRecord(loaded);
    setIsStarted(loaded.isStarted);
    setCurrentStep(loaded.currentStep);
    setHighestStepReached(loaded.highestStepReached);
    setIsComplete(loaded.isComplete);
    if (!squadName && hydratedMeta.squadName) setSquadName(hydratedMeta.squadName);
    setSquadRecord(loadSquadDesignRecord(squadCtx.squadId));
  }, [participantId, squadNameFallback, squadCtx.squadId]);

  useEffect(() => {
    if (
      readOnly
      || coachMode
      || !isComplete
      || !participantId
      || isMockUserId(participantId)
      || completedMarkedRef.current
    ) {
      return;
    }
    completedMarkedRef.current = true;
    markActivityCompleted(participantId, DAY4_CANVAS_WORKSHOP_ID, DAY4_PLAYBOOK_ID, {
      title: 'Venture Design Studio',
      outputs: ['FEC canvas draft', 'Brand identity snapshot'],
    });
  }, [readOnly, coachMode, isComplete, participantId]);

  const persistRecord = useCallback(
    (patch) => {
      saveVentureDesignRecord(participantId, patch);
      setRecord(loadVentureDesignRecord(participantId));
    },
    [participantId],
  );

  const updateDraft = useCallback(
    (patch) => {
      if (coachMode) {
        const next = {
          ...squadRecord,
          consolidated: {
            ...squadRecord.consolidated,
            step1: { ...squadRecord.consolidated.step1, ...(patch.step1 ?? {}) },
            step2: { ...squadRecord.consolidated.step2, ...(patch.step2 ?? {}) },
            step3: { ...squadRecord.consolidated.step3, ...(patch.step3 ?? {}) },
            step4: {
              ...squadRecord.consolidated.step4,
              ...(patch.step4 ?? {}),
              personality: {
                ...squadRecord.consolidated.step4.personality,
                ...(patch.step4?.personality ?? {}),
              },
            },
          },
        };
        saveSquadDesignRecord(squadCtx.squadId, next, participantId);
        setSquadRecord(loadSquadDesignRecord(squadCtx.squadId));
        return;
      }
      const individual = {
        ...record.individual,
        step1: { ...record.individual.step1, ...(patch.step1 ?? {}) },
        step2: { ...record.individual.step2, ...(patch.step2 ?? {}) },
        step3: { ...record.individual.step3, ...(patch.step3 ?? {}) },
        step4: {
          ...record.individual.step4,
          ...(patch.step4 ?? {}),
          personality: {
            ...record.individual.step4.personality,
            ...(patch.step4?.personality ?? {}),
          },
        },
      };
      setRecord((prev) => ({ ...prev, individual }));
      saveVentureDesignRecord(participantId, { individual });
    },
    [coachMode, participantId, record.individual, squadCtx.squadId, squadRecord],
  );

  function appendKeyword(step, field, keyword) {
    if (effectiveReadOnly) return;
    if (step === 1 && field === 'customer') {
      const cur = activeDraft.step1.customer;
      updateDraft({ step1: { customer: cur ? `${cur}, ${keyword}` : keyword } });
    } else if (step === 2) {
      const cur = field === 'beforeFeeling' ? activeDraft.step2.beforeFeeling : activeDraft.step2.afterFeeling;
      const next = cur ? `${cur}, ${keyword}` : keyword;
      updateDraft({ step2: { [field]: next } });
    } else if (step === 3) {
      const cur = activeDraft.step3.transformation;
      updateDraft({ step3: { transformation: cur ? `${cur}, ${keyword}` : keyword } });
    } else if (step === 4) {
      const cur = activeDraft.step4.clientFeeling;
      updateDraft({ step4: { clientFeeling: cur ? `${cur}, ${keyword}` : keyword } });
    }
  }

  function togglePersonality(trait) {
    if (effectiveReadOnly) return;
    const personality = { ...activeDraft.step4.personality, [trait]: !activeDraft.step4.personality[trait] };
    updateDraft({ step4: { personality } });
  }

  async function handleVerifyCoach() {
    setCoachLoading(true);
    await new Promise((r) => setTimeout(r, VENTURE_DESIGN_COACH_THINK_MS));
    const feedback = await requestVentureDesignCoachFeedback(currentStep, activeDraft, squadName);
    setCoachFeedback(feedback);
    setShowCoachFeedback(true);
    setCoachLoading(false);
  }

  function handleNextStep() {
    setShowCoachFeedback(false);
    if (currentStep < 5) {
      const next = currentStep + 1;
      setCurrentStep(next);
      const highest = Math.max(highestStepReached, next);
      setHighestStepReached(highest);
      persistRecord({ currentStep: next, highestStepReached: highest, isStarted: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsComplete(true);
      persistRecord({ isComplete: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function jumpToStep(stepId) {
    if (stepId <= highestStepReached || isComplete) {
      setCurrentStep(stepId);
      setIsComplete(false);
      setShowCoachFeedback(false);
      persistRecord({ currentStep: stepId, isComplete: false });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleStart() {
    setIsStarted(true);
    persistRecord({ isStarted: true });
  }

  async function handleSavePortfolio() {
    setIsSaving(true);
    const draft = coachMode ? squadRecord.consolidated : record.individual;
    commitVentureDesignToPortfolio(participantId, draft, squadName);
    if (squadCtx.squadId) {
      saveSquadDesignRecord(squadCtx.squadId, { consolidated: draft }, participantId);
    }
    setIsSaving(false);
    setSaveComplete(true);
    setIsComplete(true);
    persistRecord({ isComplete: true });
    setTimeout(() => setSaveComplete(false), 4000);
  }

  if (!isStarted && !coachMode) {
    return (
      <VentureDesignLanding
        squadName={squadName}
        researchSynced={hydratedMeta.researchSynced}
        onStart={handleStart}
      />
    );
  }

  const stepProps = {
    draft: activeDraft,
    readOnly: effectiveReadOnly,
    onChange: updateDraft,
    onAppend: appendKeyword,
  };

  return (
    <div className="-mx-4 min-h-screen bg-stone-100 font-sans md:-mx-0">
      <VentureDesignWorkshopHeader squadName={squadName} onSquadNameChange={setSquadName} readOnly={effectiveReadOnly} />

      <div className="container mx-auto flex max-w-[100rem] flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-8 lg:py-10">
        {!isComplete ? (
          <aside className="lg:w-64 xl:w-72 shrink-0">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-md lg:sticky lg:top-28">
              <h3 className="mb-4 hidden border-b-2 border-spike pb-3 text-sm font-black uppercase tracking-widest text-stone-900 lg:flex lg:items-center lg:gap-2">
                <Layout size={18} className="text-spike" />
                Design Progress
              </h3>
              <div className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
                {VENTURE_DESIGN_STEPS_UI.map((step) => {
                  const isActive = currentStep === step.id;
                  const isAccessible = step.id <= highestStepReached;
                  const isStepComplete = step.id < highestStepReached;
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => isAccessible && jumpToStep(step.id)}
                      disabled={!isAccessible}
                      className={`flex shrink-0 items-center gap-3 rounded-xl border-2 p-3 text-left transition lg:w-full lg:p-4 ${
                        isActive
                          ? 'border-spike bg-spike font-bold text-white shadow-lg'
                          : isAccessible
                            ? 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                            : 'cursor-not-allowed border-transparent bg-stone-50 text-stone-400 opacity-60'
                      }`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isActive ? 'bg-white/20 text-yellow-400' : isStepComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-200 text-stone-400'}`}>
                        {isStepComplete && !isActive ? <CheckCircle size={14} /> : isActive ? <Icon size={14} /> : <Lock size={12} />}
                      </span>
                      <div>
                        <span className={`block text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-red-200' : 'text-stone-400'}`}>{step.action}</span>
                        <span className="text-sm font-bold">{step.title}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <Link to={BLUEPRINT_LINKS.canvasEdit} className="mt-6 hidden w-full items-center justify-center gap-2 rounded-xl border border-stone-200 py-3 text-sm font-semibold text-spike hover:bg-stone-50 lg:flex">
                Full FEC Workshop <ArrowRight size={16} />
              </Link>
            </div>
          </aside>
        ) : null}

        <div className={`min-w-0 flex-1 ${isComplete ? 'w-full' : ''}`}>
          {coachMode ? (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
              Coach mode — consolidate squad member inputs into one central venture concept.
            </p>
          ) : null}

          {isComplete ? (
            <VentureDesignFinalSummary
              draft={activeDraft}
              squadName={squadName}
              onJumpToStep={jumpToStep}
              onDownload={() => downloadVentureDesignHtml(activeDraft, squadName)}
              onSave={handleSavePortfolio}
              isSaving={isSaving}
              saveComplete={saveComplete}
            />
          ) : (
            <div className="min-h-[400px] rounded-2xl border border-stone-200 bg-white p-6 shadow-xl md:rounded-[2rem] md:p-12">
              {currentStep === 1 ? (
                <VentureDesignStep1 {...stepProps} researchSynced={hydratedMeta.researchSynced} />
              ) : null}
              {currentStep === 2 ? <VentureDesignStep2 {...stepProps} /> : null}
              {currentStep === 3 ? <VentureDesignStep3 {...stepProps} /> : null}
              {currentStep === 4 ? <VentureDesignStep4 {...stepProps} onTogglePersonality={togglePersonality} /> : null}
              {currentStep === 5 ? <VentureDesignStep5 draft={activeDraft} /> : null}

              {currentStep < 5 ? (
                showCoachFeedback && coachFeedback ? (
                  <VentureDesignCoachFeedback feedback={coachFeedback} onRefine={() => setShowCoachFeedback(false)} onContinue={handleNextStep} />
                ) : (
                  <button
                    type="button"
                    disabled={coachLoading || effectiveReadOnly}
                    onClick={() => void handleVerifyCoach()}
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-spike py-4 font-bold text-white shadow-lg hover:bg-spike-light disabled:opacity-60"
                  >
                    <Sparkles size={18} className="text-yellow-400" />
                    {coachLoading ? 'Coach reviewing…' : 'Verify with Venture Coach'}
                  </button>
                )
              ) : (
                <button type="button" onClick={handleNextStep} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-5 font-bold text-white hover:bg-stone-800">
                  <Sparkles size={18} className="text-yellow-500" />
                  Generate Portfolio View
                </button>
              )}
            </div>
          )}
        </div>

        {!isComplete ? (
          <aside className="hidden w-72 shrink-0 xl:block">
            <div className="sticky top-28 space-y-4">
              <VentureDesignSquadPanel
                memberIds={squadCtx.memberIds.length ? squadCtx.memberIds : [participantId]}
                squadName={squadCtx.squadName || squadNameFallback}
                nameById={{ [participantId]: participantName }}
                consolidated={squadRecord.consolidated}
                coachSummary={squadRecord.coachSummary}
                coachFocus={squadRecord.coachFocus}
                mentorRating={squadRecord.mentorRating}
                mentorNotes={squadRecord.mentorNotes}
                coachMode={coachMode}
                onApplySuggestion={(patch) => {
                  saveSquadDesignRecord(squadCtx.squadId, { consolidated: { ...squadRecord.consolidated, ...patch, step3: { ...squadRecord.consolidated.step3, ...(patch.step3 ?? {}) }, step1: { ...squadRecord.consolidated.step1, ...(patch.step1 ?? {}) } } }, participantId);
                  setSquadRecord(loadSquadDesignRecord(squadCtx.squadId));
                }}
                onCoachSummaryChange={(v) => {
                  saveSquadDesignRecord(squadCtx.squadId, { coachSummary: v }, participantId);
                  setSquadRecord(loadSquadDesignRecord(squadCtx.squadId));
                }}
                onCoachFocusChange={(v) => {
                  saveSquadDesignRecord(squadCtx.squadId, { coachFocus: v }, participantId);
                  setSquadRecord(loadSquadDesignRecord(squadCtx.squadId));
                }}
                onMentorRatingChange={(v) => {
                  saveSquadDesignRecord(squadCtx.squadId, { mentorRating: v }, participantId);
                  setSquadRecord(loadSquadDesignRecord(squadCtx.squadId));
                }}
                onMentorNotesChange={(v) => {
                  saveSquadDesignRecord(squadCtx.squadId, { mentorNotes: v }, participantId);
                  setSquadRecord(loadSquadDesignRecord(squadCtx.squadId));
                }}
              />
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
