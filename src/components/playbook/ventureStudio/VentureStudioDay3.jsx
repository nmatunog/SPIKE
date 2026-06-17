import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Heart,
  Frown,
  Wrench,
  Lightbulb,
  ChevronRight,
  Sparkles,
  FileText,
  ArrowRight,
  ArrowLeft,
  Target,
  ImagePlus,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  Link as LinkIcon,
  Star,
  Loader2,
  Zap,
} from 'lucide-react';
import {
  loadVentureStudioState,
  saveVentureStudioState,
  ventureStudioProgressPercent,
  DAY3_PLAYBOOK_ID,
} from '../../../lib/ventureStudioStorage.js';
import { VENTURE_STUDIO_STEPS, GOAL_LABELS } from '../../../lib/ventureStudioTypes.js';
import { markActivityCompleted } from '../../../lib/playbookProgress.js';
import { isMockUserId } from '../../../lib/mockAuth.js';
import {
  getVentureStudioCoachFeedback,
  requestVentureStudioCoachFeedback,
} from '../../../lib/ventureStudioCoachService.js';
import { BLUEPRINT_LINKS, playbookHref } from '../../../routes/paths.js';

const STEP_ICONS = {
  1: User,
  2: Heart,
  3: Frown,
  4: Wrench,
  5: Lightbulb,
};

const GEN_MESSAGES = [
  'Processing Evidence Library…',
  'Evaluating Pain Points…',
  'Drafting Financial Proposition…',
  'Finalizing Canvas Structure…',
];

const inputClass =
  'w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70';

/**
 * Day 3 interactive Venture Studio — market discovery workspace.
 * @param {{
 *   participantId?: string,
 *   readOnly?: boolean,
 *   presentMode?: boolean,
 *   onComplete?: () => void,
 * }} props
 */
export function VentureStudioDay3({
  participantId,
  readOnly = false,
  presentMode = false,
  onComplete,
}) {
  const [state, setState] = useState(() => loadVentureStudioState(participantId));
  const [showAiFeedback, setShowAiFeedback] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState(
    /** @type {import('../../../lib/ventureStudioCoachService.js').VentureStudioCoachFeedback | null} */ (null),
  );
  const [isGeneratingDay4, setIsGeneratingDay4] = useState(false);
  const [viewingImage, setViewingImage] = useState(/** @type {string | null} */ (null));
  const [newEvidence, setNewEvidence] = useState('');
  const [genMessageIndex, setGenMessageIndex] = useState(0);
  const completedMarkedRef = useRef(false);

  const {
    currentStep,
    highestStepReached,
    isStarted,
    isCanvasComplete,
    showDay4Canvas,
    squadName,
    targetSegment,
    step1,
    step2,
    step3,
    step4,
    step5,
    evidenceList,
  } = state;

  const progressPercent = useMemo(() => ventureStudioProgressPercent(state), [state]);
  const disabled = readOnly;

  useEffect(() => {
    setState(loadVentureStudioState(participantId));
    setShowAiFeedback(false);
    setCoachFeedback(null);
    setCoachLoading(false);
    setIsGeneratingDay4(false);
    completedMarkedRef.current = false;
  }, [participantId]);

  useEffect(() => {
    if (readOnly) return undefined;
    const timer = setTimeout(() => {
      saveVentureStudioState(participantId, state);
    }, 400);
    return () => clearTimeout(timer);
  }, [readOnly, participantId, state]);

  useEffect(() => {
    if (
      readOnly
      || !state.isCanvasComplete
      || !participantId
      || isMockUserId(participantId)
      || completedMarkedRef.current
    ) {
      return;
    }
    completedMarkedRef.current = true;
    markActivityCompleted(participantId, 'activity-day-3-persona-workshop', DAY3_PLAYBOOK_ID, {
      title: 'Venture Studio',
      outputs: ['Customer persona artifact', 'Venture opportunity report'],
    });
    onComplete?.();
  }, [readOnly, state.isCanvasComplete, participantId, onComplete]);

  useEffect(() => {
    if (!isGeneratingDay4) return undefined;
    const interval = setInterval(() => {
      setGenMessageIndex((i) => (i + 1) % GEN_MESSAGES.length);
    }, 900);
    return () => clearInterval(interval);
  }, [isGeneratingDay4]);

  useEffect(() => {
    if (!isGeneratingDay4) return undefined;
    const timer = setTimeout(() => {
      setIsGeneratingDay4(false);
      setState((prev) => ({ ...prev, showDay4Canvas: true }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 3500);
    return () => clearTimeout(timer);
  }, [isGeneratingDay4]);

  const patchState = useCallback(
    /** @param {Partial<typeof state>} patch */
    (patch) => {
      if (readOnly) return;
      setState((prev) => ({ ...prev, ...patch }));
    },
    [readOnly],
  );

  const handleStart = useCallback(() => {
    setState((prev) => ({ ...prev, isStarted: true }));
  }, []);

  const handleSimulateAI = useCallback(async () => {
    setShowAiFeedback(true);
    setCoachLoading(true);
    setCoachFeedback(null);
    const feedback = await requestVentureStudioCoachFeedback(currentStep, state);
    setCoachFeedback(feedback);
    setCoachLoading(false);
  }, [currentStep, state]);

  const handleRefineCoachAnswer = useCallback(() => {
    setShowAiFeedback(false);
    setCoachFeedback(null);
    setCoachLoading(false);
  }, []);

  const handleNextStep = useCallback(() => {
    setShowAiFeedback(false);
    setCoachFeedback(null);
    setCoachLoading(false);
    if (currentStep < 5) {
      const nextStep = currentStep + 1;
      setState((prev) => ({
        ...prev,
        currentStep: nextStep,
        highestStepReached: Math.max(prev.highestStepReached, nextStep),
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setState((prev) => ({ ...prev, isCanvasComplete: true }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const jumpToStep = useCallback(
    /** @param {number} stepId */
    (stepId) => {
      if (stepId <= highestStepReached || isCanvasComplete) {
        setState((prev) => ({
          ...prev,
          currentStep: stepId,
          isCanvasComplete: false,
          showDay4Canvas: false,
        }));
        setShowAiFeedback(false);
        setCoachFeedback(null);
        setCoachLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [highestStepReached, isCanvasComplete],
  );

  const handleGenerateDay4 = useCallback(() => {
    setIsGeneratingDay4(true);
    setGenMessageIndex(0);
  }, []);

  const handleGoalToggle = useCallback(
    /** @param {string} goalKey */
    (goalKey) => {
      if (readOnly) return;
      setState((prev) => ({
        ...prev,
        step2: {
          ...prev.step2,
          goals: { ...prev.step2.goals, [goalKey]: !prev.step2.goals[goalKey] },
        },
      }));
    },
    [readOnly],
  );

  const addSolutionRow = useCallback(() => {
    if (readOnly) return;
    setState((prev) => ({
      ...prev,
      step4: [...prev.step4, { solution: '', advantages: '', limitations: '', opportunity: '' }],
    }));
  }, [readOnly]);

  const handleEvidenceUpload = useCallback(
    /** @param {React.ChangeEvent<HTMLInputElement>} event */
    (event) => {
      if (readOnly) return;
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setState((prev) => ({
          ...prev,
          evidenceList: [
            ...prev.evidenceList,
            { id: Date.now(), type: 'image', title: file.name, content: String(reader.result) },
          ],
        }));
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    },
    [readOnly],
  );

  const addTextEvidence = useCallback(() => {
    if (readOnly || newEvidence.trim() === '') return;
    setState((prev) => ({
      ...prev,
      evidenceList: [
        ...prev.evidenceList,
        { id: Date.now(), type: 'note', title: 'Field Note', content: newEvidence.trim() },
      ],
    }));
    setNewEvidence('');
  }, [readOnly, newEvidence]);

  const removeEvidence = useCallback(
    /** @param {number} id */
    (id) => {
      if (readOnly) return;
      setState((prev) => ({
        ...prev,
        evidenceList: prev.evidenceList.filter((e) => e.id !== id),
      }));
    },
    [readOnly],
  );

  const renderAIFeedback = useCallback(
    /** @param {number} stepIndex */
    (stepIndex) => {
      const feedback =
        coachFeedback ?? getVentureStudioCoachFeedback(stepIndex, state);
      const evidenceScore = feedback.evidenceScore;
      const evidenceColor =
        Number.parseInt(evidenceScore, 10) >= 8
          ? 'text-green-400'
          : Number.parseInt(evidenceScore, 10) >= 5
            ? 'text-yellow-400'
            : 'text-red-400';

      return (
        <div
          className="relative mt-6 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white opacity-100 shadow-2xl transition-opacity duration-300 md:p-6"
          role="region"
          aria-label="Venture Coach feedback"
          aria-busy={coachLoading}
        >
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-blue-500/30 bg-blue-600/20 p-2 text-blue-400">
                  {coachLoading ? (
                    <Loader2 size={24} className="animate-spin" aria-hidden />
                  ) : (
                    <Sparkles size={24} aria-hidden />
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-bold leading-none text-white">SPIKE Venture Coach</h4>
                  <p className="mt-1 text-xs text-slate-400">
                    {coachLoading
                      ? 'Reading your squad inputs…'
                      : feedback.provider === 'openai'
                        ? 'AI coach (OpenAI)'
                        : feedback.provider === 'gemini'
                          ? 'AI coach'
                          : feedback.provider === 'prototype'
                            ? 'Built-in coach — add OPENAI_API_KEY for live AI'
                            : 'Venture coach'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5">
                <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Evidence Strength
                </span>
                <span className={`text-sm font-black ${evidenceColor}`}>
                  {coachLoading ? '…' : evidenceScore}
                </span>
              </div>
            </div>

            {coachLoading ? (
              <p className="mb-6 text-base text-slate-300 md:text-lg">
                Reviewing &ldquo;{targetSegment || 'your segment'}&rdquo; and your field notes…
              </p>
            ) : (
              <>
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-900/50 bg-amber-900/20 p-3 text-sm text-amber-300 md:text-base">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
                  <span className="font-medium leading-snug">{feedback.bias}</span>
                </div>

                <p className="mb-6 border-l-4 border-blue-500 pl-2 text-base font-medium leading-relaxed text-slate-200 md:text-lg">
                  &ldquo;{feedback.coach}&rdquo;
                </p>
              </>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row">
              <button
                type="button"
                onClick={handleRefineCoachAnswer}
                disabled={coachLoading}
                className="min-h-[44px] w-full rounded-xl border border-slate-600 bg-slate-800 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2.5"
              >
                Refine Squad Answer
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                disabled={coachLoading}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold shadow-lg shadow-blue-900/50 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2.5"
              >
                Looks Good, Continue <ChevronRight size={16} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      );
    },
    [coachFeedback, coachLoading, state, targetSegment, handleNextStep, handleRefineCoachAnswer],
  );

  const coachButton = useCallback(
    /** @param {string} label */
    (label) =>
      !showAiFeedback ? (
        <button
          type="button"
          onClick={handleSimulateAI}
          className="mt-6 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-bold text-white transition hover:bg-slate-800"
        >
          <Sparkles size={18} className="shrink-0 text-yellow-400" aria-hidden />
          <span className="truncate">{label}</span>
        </button>
      ) : null,
    [showAiFeedback, handleSimulateAI],
  );

  const renderLandingPage = () => (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 p-4 md:p-8">
      <Link
        to={playbookHref({ segment: 1, week: 1, day: 3 })}
        className="absolute left-4 top-4 z-20 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm font-semibold text-spike shadow-sm backdrop-blur-sm transition hover:bg-white md:left-8 md:top-8"
      >
        <ArrowLeft size={16} aria-hidden />
        <span className="hidden sm:inline">Back to Playbook</span>
        <span className="sm:hidden">Back</span>
      </Link>
      <div className="pointer-events-none absolute inset-0 z-0 flex scale-110 items-center justify-center overflow-hidden opacity-[0.15]">
        <div className="w-full max-w-5xl rotate-[-2deg] space-y-4 blur-[2px]">
          <div className="h-16 w-full rounded-xl border-l-8 border-blue-500 bg-white shadow-lg md:h-24" />
          <div className="h-16 w-full rounded-xl border-l-8 border-emerald-500 bg-white shadow-lg md:h-24" />
          <div className="h-16 w-full rounded-xl border-l-8 border-amber-500 bg-white shadow-lg md:h-24" />
        </div>
      </div>

      <div className="relative z-10 flex h-[90vh] max-h-[900px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl md:h-auto">
        <div className="relative shrink-0 overflow-hidden bg-spike p-6 text-center md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
          <p className="relative z-10 mb-2 text-xs font-bold uppercase tracking-[0.2em] text-red-200 md:mb-3 md:text-sm">
            Day 3 — Discover The Market
          </p>
          <h1 className="relative z-10 mb-3 text-3xl font-black leading-tight text-white md:mb-4 md:text-5xl lg:text-6xl">
            Venture Studio
          </h1>
          <p className="relative z-10 mx-auto max-w-2xl text-base font-medium text-red-100 md:text-xl">
            You were given one mission: Understand your chosen customer before trying to serve them.
          </p>
        </div>

        <div className="flex flex-grow flex-col overflow-y-auto p-6 md:p-12">
          <div className="mb-8 flex flex-grow grid-cols-1 items-center gap-8 md:mb-10 md:grid md:grid-cols-2 md:gap-12">
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 md:mb-4 md:text-sm">
                  <Target size={18} className="text-spike" aria-hidden />
                  Today You Will
                </h2>
                <ul className="space-y-3 md:space-y-4">
                  {[
                    'Present your research findings',
                    'Challenge your assumptions',
                    'Identify real financial problems',
                    'Discover opportunities worth building',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-base font-bold text-slate-800 md:text-lg"
                    >
                      <span className="shrink-0 rounded-full bg-red-100 p-1 text-spike">
                        <ChevronRight size={14} aria-hidden />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex h-full flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-inner md:rounded-3xl md:p-8">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 md:mb-4 md:text-sm">
                Studio Unlocks
              </h2>
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800 shadow-sm md:p-4">
                  <Unlock size={16} className="shrink-0 text-slate-400 md:size-[18px]" aria-hidden />
                  Research Evaluated
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800 shadow-sm md:p-4">
                  <Unlock size={16} className="shrink-0 text-slate-400 md:size-[18px]" aria-hidden />
                  Opportunity Identified
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900 shadow-sm md:p-4">
                  <Lock size={16} className="shrink-0 text-amber-500 md:size-[18px]" aria-hidden />
                  Day 4 Venture Canvas Generated
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-100 pt-6 text-center md:pt-10">
            <p className="mb-6 text-base font-medium italic text-slate-600 md:mb-8 md:text-lg">
              &ldquo;Great financial entrepreneurs don&apos;t start with products. They start with
              people.&rdquo;
            </p>
            <button
              type="button"
              onClick={handleStart}
              className="group inline-flex min-h-[48px] w-full items-center justify-center gap-3 rounded-2xl bg-spike px-8 py-4 text-lg font-black text-white shadow-xl shadow-spike/30 transition hover:-translate-y-0.5 hover:bg-spike-dark md:w-auto md:px-12 md:py-5 md:text-xl"
            >
              Enter Venture Studio
              <ArrowRight
                className="transition-transform group-hover:translate-x-2"
                aria-hidden
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6 opacity-100 transition-opacity duration-500">
      <div className="w-full rounded-r-xl border-l-4 border-blue-600 bg-blue-50 p-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-blue-900">
          <User size={20} aria-hidden />
          Customer Segment Hypothesis
        </h3>
        <p className="mt-1 text-sm text-blue-800">
          Don&apos;t just fill in blanks. Discuss as a squad and write your best assumptions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
        <label className="flex flex-col">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            1. Who is the target customer?
          </span>
          <input
            type="text"
            placeholder="e.g., Freelance Graphic Designers in Cebu City"
            value={targetSegment}
            onChange={(e) => patchState({ targetSegment: e.target.value })}
            disabled={disabled}
            className={`${inputClass} flex-grow focus:ring-blue-500`}
          />
        </label>
        <label className="flex flex-col">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            2. What stage of life are they in?
          </span>
          <textarea
            rows={2}
            value={step1.stage}
            onChange={(e) => patchState({ step1: { ...step1, stage: e.target.value } })}
            disabled={disabled}
            placeholder="e.g., Recently graduated, juggling 2-3 gig clients, living at home but wanting independence."
            className={`${inputClass} flex-grow resize-y focus:ring-blue-500`}
          />
        </label>
        <label className="flex flex-col">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            3. Describe their daily financial interactions.
          </span>
          <textarea
            rows={3}
            value={step1.dayInLife}
            onChange={(e) => patchState({ step1: { ...step1, dayInLife: e.target.value } })}
            disabled={disabled}
            placeholder="What time do they wake up? When do they spend money? When do they stress about money?"
            className={`${inputClass} flex-grow resize-y focus:ring-blue-500`}
          />
        </label>
        <label className="flex flex-col">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            4. Squad Discussion: What surprised you most?
          </span>
          <textarea
            rows={3}
            value={step1.surprise}
            onChange={(e) => patchState({ step1: { ...step1, surprise: e.target.value } })}
            disabled={disabled}
            placeholder="We assumed they X, but our evidence actually shows they Y..."
            className={`${inputClass} flex-grow resize-y focus:ring-blue-500`}
          />
        </label>
      </div>

      {coachButton('Synthesize & Get Coach Feedback')}
      {showAiFeedback ? renderAIFeedback(1) : null}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 opacity-100 transition-opacity duration-500">
      <div className="w-full rounded-r-xl border-l-4 border-emerald-600 bg-emerald-50 p-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-900">
          <Heart size={20} aria-hidden />
          Emotional Drivers
        </h3>
        <p className="mt-1 text-sm text-emerald-800">
          People buy with emotion and justify with logic. What do they truly want?
        </p>
      </div>

      <fieldset disabled={disabled}>
        <legend className="mb-3 block text-sm font-bold text-slate-700">
          1. Based on your evidence, what goals repeatedly appeared?
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(GOAL_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                step2.goals[key]
                  ? 'border-emerald-500 bg-emerald-100 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-emerald-300'
              } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              <input
                type="checkbox"
                checked={Boolean(step2.goals[key])}
                onChange={() => handleGoalToggle(key)}
                disabled={disabled}
                className="h-4 w-4 shrink-0 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span
                className={`text-sm font-medium leading-tight ${step2.goals[key] ? 'text-emerald-900' : 'text-slate-700'}`}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">
          2. Why are these specific goals important to them emotionally?
        </span>
        <textarea
          rows={3}
          value={step2.whyImportant}
          onChange={(e) => patchState({ step2: { ...step2, whyImportant: e.target.value } })}
          disabled={disabled}
          placeholder="Dig deeper. Why do they want financial freedom? Is it to escape a toxic job, or to provide for aging parents?"
          className={`${inputClass} resize-y focus:ring-emerald-500`}
        />
      </label>

      {coachButton('Synthesize & Get Coach Feedback')}
      {showAiFeedback ? renderAIFeedback(2) : null}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 opacity-100 transition-opacity duration-500">
      <div className="w-full rounded-r-xl border-l-4 border-amber-500 bg-amber-50 p-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-amber-900">
          <Frown size={20} aria-hidden />
          Core Financial Pain Points
        </h3>
        <p className="mt-1 text-sm text-amber-800">
          If there is no problem, there is no venture. What keeps them awake at night?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {step3.map((item, index) => (
          <div
            key={index}
            className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-4 pt-8 shadow-sm transition-colors hover:border-amber-300 sm:p-5 sm:pt-6"
          >
            <div className="absolute -left-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 font-bold text-white shadow-md">
              {index + 1}
            </div>
            <div className="flex flex-grow flex-col space-y-4">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  The Root Problem
                </span>
                <input
                  type="text"
                  value={item.problem}
                  onChange={(e) => {
                    const next = [...step3];
                    next[index] = { ...next[index], problem: e.target.value };
                    patchState({ step3: next });
                  }}
                  disabled={disabled}
                  placeholder="e.g., Inconsistent monthly income..."
                  className="w-full border-b-2 border-slate-200 bg-transparent p-2 text-sm font-medium outline-none transition focus:border-amber-500 md:text-base"
                />
              </label>
              <div className="flex flex-grow flex-col gap-4">
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Specific Evidence / Quote
                  </span>
                  <input
                    type="text"
                    value={item.evidence}
                    onChange={(e) => {
                      const next = [...step3];
                      next[index] = { ...next[index], evidence: e.target.value };
                      patchState({ step3: next });
                    }}
                    disabled={disabled}
                    placeholder="e.g., 'I constantly worry about next month.'"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </label>
                <label className="mt-auto pt-2">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Squad Confidence Level
                  </span>
                  <select
                    value={item.confidence}
                    onChange={(e) => {
                      const next = [...step3];
                      next[index] = { ...next[index], confidence: e.target.value };
                      patchState({ step3: next });
                    }}
                    disabled={disabled}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm font-medium text-slate-700 outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="High">High (Validated by evidence)</option>
                    <option value="Medium">Medium (Mentioned a few times)</option>
                    <option value="Low">Low (Mostly our assumption)</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {coachButton('Synthesize & Get Coach Feedback')}
      {showAiFeedback ? renderAIFeedback(3) : null}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 opacity-100 transition-opacity duration-500">
      <div className="w-full rounded-r-xl border-l-4 border-violet-600 bg-violet-50 p-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-violet-900">
          <Wrench size={20} aria-hidden />
          Competitor &amp; Current Solutions
        </h3>
        <p className="mt-1 text-sm text-violet-800">
          Investigate how they are currently trying (and failing) to solve their financial
          challenges.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {step4.map((item, index) => (
          <div
            key={index}
            className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-violet-300"
          >
            <div className="flex flex-col gap-4">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  What are they using right now?
                </span>
                <input
                  type="text"
                  value={item.solution}
                  onChange={(e) => {
                    const next = [...step4];
                    next[index] = { ...next[index], solution: e.target.value };
                    patchState({ step4: next });
                  }}
                  disabled={disabled}
                  placeholder="e.g., Keeping all cash in a standard GCash/Maya wallet."
                  className="w-full border-b-2 border-slate-200 bg-transparent p-2 text-sm font-medium outline-none transition focus:border-violet-500 md:text-base"
                />
              </label>
              <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                <div className="rounded-lg border border-green-100 bg-green-50/50 p-3">
                  <label>
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-green-700">
                      Advantages (Why they use it)
                    </span>
                    <textarea
                      rows={2}
                      value={item.advantages}
                      onChange={(e) => {
                        const next = [...step4];
                        next[index] = { ...next[index], advantages: e.target.value };
                        patchState({ step4: next });
                      }}
                      disabled={disabled}
                      placeholder="It's highly liquid and easy to access."
                      className="w-full resize-y rounded border border-slate-200 bg-white p-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </label>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50/50 p-3">
                  <label>
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-red-700">
                      Limitations (The Gap)
                    </span>
                    <textarea
                      rows={2}
                      value={item.limitations}
                      onChange={(e) => {
                        const next = [...step4];
                        next[index] = { ...next[index], limitations: e.target.value };
                        patchState({ step4: next });
                      }}
                      disabled={disabled}
                      placeholder="Zero protection if they get hospitalized. Low interest."
                      className="w-full resize-y rounded border border-slate-200 bg-white p-2 text-sm outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSolutionRow}
        disabled={disabled}
        className="mt-2 min-h-[44px] w-full rounded-xl border-2 border-dashed border-violet-200 py-4 font-bold text-violet-600 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        + Add Another Solution
      </button>

      {coachButton('Synthesize & Get Coach Feedback')}
      {showAiFeedback ? renderAIFeedback(4) : null}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 opacity-100 transition-opacity duration-500">
      <div className="rounded-r-xl border-l-4 border-rose-600 bg-rose-50 p-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-rose-900">
          <Lightbulb size={20} aria-hidden />
          The Venture Opportunity
        </h3>
        <p className="mt-1 text-sm text-rose-800">
          Bring it all together. Define exactly where your agency creates unique value.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-3">
        <label className="flex flex-col">
          <span className="mb-2 block text-sm font-bold text-slate-700">1. The Insight</span>
          <span className="mb-2 text-xs text-slate-500">
            &ldquo;Our research clearly suggests that…&rdquo;
          </span>
          <textarea
            rows={4}
            value={step5.suggests}
            onChange={(e) => patchState({ step5: { ...step5, suggests: e.target.value } })}
            disabled={disabled}
            placeholder="Summarize the core truth you discovered."
            className={`${inputClass} flex-grow resize-y focus:ring-rose-500`}
          />
        </label>
        <label className="flex flex-col">
          <span className="mb-2 block text-sm font-bold text-slate-700">2. The Need</span>
          <span className="mb-2 text-xs text-slate-500">
            &ldquo;Their biggest unmet need right now is…&rdquo;
          </span>
          <textarea
            rows={4}
            value={step5.unmetNeed}
            onChange={(e) => patchState({ step5: { ...step5, unmetNeed: e.target.value } })}
            disabled={disabled}
            placeholder="What exactly is missing from their current setup?"
            className={`${inputClass} flex-grow resize-y focus:ring-rose-500`}
          />
        </label>
        <label className="flex flex-col">
          <span className="mb-2 block text-sm font-bold text-slate-700">3. The Proposition</span>
          <span className="mb-2 text-xs text-slate-500">
            &ldquo;Therefore, we create massive value by…&rdquo;
          </span>
          <textarea
            rows={4}
            value={step5.valueCreation}
            onChange={(e) => patchState({ step5: { ...step5, valueCreation: e.target.value } })}
            disabled={disabled}
            placeholder="How will you step in and solve this using your advisory skills?"
            className={`${inputClass} flex-grow resize-y focus:ring-rose-500`}
          />
        </label>
      </div>

      {coachButton('Final Coach Review')}
      {showAiFeedback ? renderAIFeedback(5) : null}
    </div>
  );

  const renderFinalSummary = () => (
    <div className="mx-auto w-full opacity-100 transition-opacity duration-500">
      <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-t-3xl bg-slate-900 p-6 text-white md:flex-row md:items-end md:p-8">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />
        <div className="relative z-10">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-red-400">
            <Sparkles size={16} aria-hidden />
            SPIKE Studio Export
          </h4>
          <h2 className="text-3xl font-black md:text-4xl">Venture Opportunity Report</h2>
        </div>
        <div className="relative z-10 border-t border-slate-700 pt-4 text-left md:border-0 md:pt-0 md:text-right">
          <p className="text-sm font-medium text-slate-400">Prepared By</p>
          <p className="text-xl font-bold md:text-2xl">{squadName || 'Your Squad'}</p>
        </div>
      </div>

      <div className="relative space-y-10 rounded-b-3xl border border-t-0 border-slate-200 bg-white p-6 shadow-2xl sm:p-8 md:p-10">
        <div className="grid grid-cols-1 items-center gap-8 rounded-2xl border border-blue-100 bg-blue-50 p-6 md:grid-cols-3 md:p-8">
          <div className="space-y-4 md:col-span-2">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Target size={20} className="text-blue-600" aria-hidden />
              Opportunity Potential Assessment
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {[
                ['Market Pain', 5],
                ['Evidence Library', Math.min(3, Math.max(1, evidenceList.length))],
                ['Market Size', 4],
                ['Differentiation', 5],
              ].map(([label, stars]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between border-b border-blue-100 pb-2"
                >
                  <span className="font-medium text-slate-600">{label}</span>
                  <span className="flex text-yellow-400" aria-label={`${stars} of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        fill={n <= stars ? 'currentColor' : 'none'}
                        className={n <= stars ? '' : 'text-slate-300'}
                        aria-hidden
                      />
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-blue-200 pt-6 text-center md:border-l md:border-t-0 md:pt-0">
            <div className="mb-2 text-5xl font-black text-green-500">82%</div>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Overall Confidence
            </p>
          </div>
        </div>

        <section>
          <h4 className="mb-4 border-b pb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
            Strategic Recommendation
          </h4>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-inner md:p-8">
            <p className="mb-4 text-lg font-medium leading-relaxed text-slate-300">
              <span className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
                Insight
              </span>
              <span className="inline-block border-b border-slate-600 pb-1 text-white">
                {step5.suggests || '[Core Insight Not Defined]'}
              </span>
            </p>
            <p className="mb-4 text-lg font-medium leading-relaxed text-slate-300">
              <span className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
                Unmet Need
              </span>
              <span className="inline-block border-b border-slate-600 pb-1 text-white">
                {step5.unmetNeed || '[Core Need Not Defined]'}
              </span>
            </p>
            <div className="mt-8 border-t border-slate-800 pt-6">
              <p className="text-xl font-bold leading-relaxed text-rose-300 md:text-2xl">
                <span className="mb-2 block text-xs uppercase tracking-wider text-rose-500/50">
                  Proposed Venture Value
                </span>
                <span className="text-white">
                  {step5.valueCreation || '[Value Proposition Not Defined]'}
                </span>
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <section>
            <h4 className="mb-4 border-b pb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              Customer Overview
            </h4>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-blue-900">
                {targetSegment || 'Undefined Segment'}
              </h3>
              <p className="text-sm text-slate-700">
                <strong className="mb-1 block text-slate-900">Life Stage &amp; Context:</strong>
                {step1.stage || 'N/A'}
              </p>
              <p className="text-sm text-slate-700">
                <strong className="mb-1 block text-slate-900">Key Insight/Surprise:</strong>
                {step1.surprise || 'N/A'}
              </p>
            </div>
          </section>

          <section>
            <h4 className="mb-4 border-b pb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              Core Emotional Drivers
            </h4>
            <ul className="mb-3 list-inside list-disc space-y-1 text-sm font-medium text-slate-800">
              {Object.entries(step2.goals)
                .filter(([, isChecked]) => isChecked)
                .map(([key]) => (
                  <li key={key} className="capitalize">
                    {GOAL_LABELS[key] ?? key}
                  </li>
                ))}
              {Object.values(step2.goals).every((v) => !v) ? (
                <li>No goals selected.</li>
              ) : null}
            </ul>
            <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm italic text-slate-600">
              &ldquo;{step2.whyImportant || 'Reason not provided.'}&rdquo;
            </p>
          </section>
        </div>

        <section>
          <h4 className="mb-4 border-b pb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
            Top Validated Challenges
          </h4>
          <ol className="list-inside list-decimal space-y-4 text-sm font-medium text-slate-800">
            {step3.map((c, i) => (
              <li
                key={i}
                className={
                  c.problem
                    ? 'rounded-xl border border-amber-100 bg-amber-50 p-4'
                    : 'font-normal text-slate-400'
                }
              >
                <span className="text-base font-bold text-amber-900">
                  {c.problem || `Challenge ${i + 1} undefined`}
                </span>
                {c.confidence === 'High' ? (
                  <span className="ml-3 inline-block align-middle rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    High Confidence
                  </span>
                ) : null}
                {c.evidence ? (
                  <p className="ml-1 mt-2 block border-l-2 border-amber-200 pl-5 text-sm italic text-amber-700">
                    &ldquo;{c.evidence}&rdquo;
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-rose-100 bg-rose-50 p-6">
          <h4 className="mb-3 flex items-center gap-2 font-bold text-rose-900">
            <Sparkles size={18} aria-hidden />
            Day 4 Coach Recommendations
          </h4>
          <ul className="space-y-2 text-sm font-medium text-rose-800">
            {[
              'Interview five more people to increase Evidence Strength.',
              'Explore how older Millennials handle this to see if the problem scales.',
              'Narrow your target segment; it is currently slightly too broad for a targeted pitch.',
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                {tip}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-slate-200 pt-8">
          <p className="mb-2 text-center text-sm font-medium text-slate-500">
            Ready to turn this research into a business model?
          </p>
          <button
            type="button"
            onClick={handleGenerateDay4}
            className="group relative flex min-h-[48px] w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-spike px-10 py-5 text-lg font-black text-white shadow-xl shadow-spike/20 transition hover:scale-[1.02] hover:bg-spike-dark sm:w-auto"
          >
            <span className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <Zap size={22} className="shrink-0" aria-hidden />
            <span className="truncate">GENERATE DAY 4 CANVAS</span>
          </button>
          <button
            type="button"
            onClick={() => jumpToStep(1)}
            className="mt-2 text-sm font-bold text-slate-400 underline transition hover:text-slate-700"
          >
            Wait, I need to edit our research
          </button>
        </div>
      </div>
    </div>
  );

  const renderDay4Generation = () => (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center p-8 text-center opacity-100 transition-opacity duration-500">
      <Link
        to={playbookHref({ segment: 1, week: 1, day: 3 })}
        className="absolute left-4 top-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-spike hover:underline md:left-8 md:top-8"
      >
        <ArrowLeft size={16} aria-hidden />
        Back
      </Link>
      <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-spike border-t-transparent" />
        <Sparkles size={32} className="animate-pulse text-spike" aria-hidden />
      </div>
      <h2 className="mb-4 text-3xl font-black text-slate-900">Synthesizing Day 3 Insights…</h2>
      <p
        key={genMessageIndex}
        className="max-w-md font-medium text-slate-500 opacity-100 transition-opacity duration-500"
        role="status"
        aria-live="polite"
      >
        {GEN_MESSAGES[genMessageIndex]}
      </p>
    </div>
  );

  const renderDay4CanvasView = () => (
    <div className="relative mx-auto w-full max-w-5xl px-4 py-6 opacity-100 transition-opacity duration-700 md:px-6 md:py-8">
      <Link
        to={playbookHref({ segment: 1, week: 1, day: 3 })}
        className="mb-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-spike hover:underline"
      >
        <ArrowLeft size={16} aria-hidden />
        Back to Playbook
      </Link>
      <div className="relative overflow-hidden rounded-t-3xl bg-spike p-8 text-center text-white md:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
        <span className="relative z-10 mb-6 inline-block rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
          Day 4: Entrepreneurship
        </span>
        <h1 className="relative z-10 mb-4 text-4xl font-black tracking-tight md:text-5xl">
          Financial Entrepreneurship Canvas
        </h1>
        <p className="relative z-10 mx-auto max-w-2xl text-lg font-medium text-red-200 md:text-xl">
          First Draft generated successfully from your Day 3 Research.
        </p>
      </div>

      <div className="rounded-b-3xl border border-t-0 border-slate-200 bg-white p-6 shadow-2xl md:p-10">
        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
          <div className="group rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition-colors hover:border-blue-400">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-blue-600">
              <User size={14} aria-hidden />
              1. Target Demographic
            </h3>
            <p className="mb-2 text-xl font-bold text-slate-900">
              {targetSegment || '[Target Segment]'}
            </p>
            <p className="text-slate-600">{step1.stage || 'Demographic stage pulled from Day 3…'}</p>
          </div>
          <div className="group rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition-colors hover:border-amber-400">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-amber-600">
              <Frown size={14} aria-hidden />
              2. Core Problem to Solve
            </h3>
            <p className="mb-2 text-xl font-bold text-slate-900">
              {step3[0]?.problem || '[Primary Challenge]'}
            </p>
            <p className="italic text-slate-600">
              &ldquo;{step3[0]?.evidence || 'Evidence pulled from Day 3…'}&rdquo;
            </p>
          </div>
          <div className="group rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition-colors hover:border-emerald-400 lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-emerald-600">
              <Sparkles size={14} aria-hidden />
              3. Unique Venture Proposition
            </h3>
            <p className="text-2xl font-black leading-tight text-slate-900">
              {step5.valueCreation ||
                'Your value proposition generated from the opportunity statement goes here…'}
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            to={BLUEPRINT_LINKS.businessPlan}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-slate-900 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-slate-800"
          >
            Enter Day 4 Workspace
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );

  const renderEvidenceLibrary = () => (
    <aside
      className="flex h-full max-h-[800px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24"
      aria-label="Evidence library"
    >
      <div className="shrink-0 border-b border-slate-800 bg-slate-900 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
          <LinkIcon size={16} className="text-blue-400" aria-hidden />
          Evidence Library
        </h3>
        <p className="mt-1 text-xs text-slate-400">Upload research to boost Venture Score.</p>

        <div className="mt-4 rounded-lg bg-slate-800 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-300">Strength</span>
            <span className="text-xs font-bold text-green-400">
              {evidenceList.length > 0 ? Math.min(evidenceList.length * 2, 10) : 0}/10
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-1.5 bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-500"
              style={{ width: `${Math.min(evidenceList.length * 20, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-grow space-y-3 overflow-y-auto bg-slate-50 p-4">
        {evidenceList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-6 text-slate-400">
            <FileText size={24} aria-hidden />
            <span className="text-sm font-medium">No evidence uploaded yet.</span>
          </div>
        ) : (
          evidenceList.map((evidence) => (
            <div
              key={evidence.id}
              className="group relative rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-blue-300"
            >
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => removeEvidence(evidence.id)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-100 p-1 text-red-600 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Remove ${evidence.title}`}
                >
                  <X size={12} aria-hidden />
                </button>
              ) : null}

              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-blue-100 p-1 text-blue-700">
                  {evidence.type === 'image' ? (
                    <ImagePlus size={12} aria-hidden />
                  ) : (
                    <FileText size={12} aria-hidden />
                  )}
                </span>
                <span className="truncate text-xs font-bold text-slate-700">{evidence.title}</span>
              </div>

              {evidence.type === 'image' ? (
                <button
                  type="button"
                  onClick={() => setViewingImage(evidence.content)}
                  className="block w-full"
                  aria-label={`View evidence image ${evidence.title}`}
                >
                  <img
                    src={evidence.content}
                    alt={evidence.title}
                    className="h-24 w-full cursor-pointer rounded-lg object-cover transition hover:opacity-80"
                  />
                </button>
              ) : (
                <p className="rounded border border-l-2 border-l-blue-400 border-slate-100 bg-slate-50 p-2 text-xs italic text-slate-600">
                  {evidence.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {!disabled ? (
        <div className="shrink-0 space-y-3 border-t border-slate-200 bg-white p-4">
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="evidence-note">
              Quick field note
            </label>
            <input
              id="evidence-note"
              type="text"
              placeholder="Quick field note…"
              value={newEvidence}
              onChange={(e) => setNewEvidence(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTextEvidence()}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addTextEvidence}
              className="min-h-[44px] min-w-[44px] rounded-lg bg-slate-900 p-2 text-white transition hover:bg-slate-800"
              aria-label="Add field note"
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>
          <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100">
            <ImagePlus size={16} aria-hidden />
            Upload Screenshot
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleEvidenceUpload}
            />
          </label>
        </div>
      ) : null}
    </aside>
  );

  const renderStepper = () => (
    <nav
      className="shrink-0 px-4 sm:px-0 lg:w-64 xl:w-72"
      aria-label="Venture Studio progress"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5 lg:sticky lg:top-24">
        <h3 className="mb-4 hidden items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-900 lg:flex">
          <Target size={16} className="text-spike" aria-hidden />
          Venture Progress
          {progressPercent > 0 ? (
            <span className="ml-auto text-spike">{progressPercent}%</span>
          ) : null}
        </h3>

        <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {VENTURE_STUDIO_STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isAccessible = step.id <= highestStepReached;
            const isComplete = step.id < highestStepReached;
            const StepIcon = STEP_ICONS[step.id];

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isAccessible && jumpToStep(step.id)}
                disabled={!isAccessible}
                aria-label={`Step ${step.id}: ${step.title}`}
                aria-current={isActive ? 'step' : undefined}
                className={`flex shrink-0 snap-start items-center gap-2 rounded-xl p-2 text-left transition-all lg:w-full lg:gap-3 lg:p-3.5 ${
                  isActive
                    ? 'bg-slate-900 font-bold text-white shadow-md'
                    : isAccessible
                      ? 'cursor-pointer border border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
                      : 'cursor-not-allowed border border-slate-100 bg-transparent text-slate-400 opacity-50'
                }`}
              >
                <div className={`shrink-0 ${isComplete && !isActive ? 'text-green-500' : ''}`}>
                  {isComplete && !isActive ? (
                    <Unlock size={16} className="lg:h-[18px] lg:w-[18px]" aria-hidden />
                  ) : isActive ? (
                    <span className="relative ml-1 mr-1 flex h-1.5 w-1.5 lg:h-2 lg:w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current lg:h-2 lg:w-2" />
                    </span>
                  ) : (
                    <Lock size={14} className="mx-0.5 lg:h-4 lg:w-4" aria-hidden />
                  )}
                </div>
                <div className="min-w-0">
                  <span
                    className={`mb-0.5 block text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-slate-400' : 'text-slate-500'}`}
                  >
                    {step.action}
                  </span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium lg:whitespace-normal lg:text-sm">
                    {StepIcon ? <StepIcon size={14} className="hidden lg:inline" aria-hidden /> : null}
                    {step.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );

  if (!isStarted) return renderLandingPage();
  if (isGeneratingDay4) return renderDay4Generation();
  if (showDay4Canvas) return renderDay4CanvasView();

  return (
    <div className="min-h-screen bg-slate-100 pb-10 font-sans md:pb-20">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6 md:py-4">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-spike p-1 text-lg font-bold leading-none text-white md:h-10 md:w-10 md:p-1.5 md:text-xl">
            S
          </div>
          <div className="overflow-hidden">
            <h1 className="truncate text-sm font-bold leading-tight tracking-wide text-slate-900 md:text-lg">
              VENTURE STUDIO
            </h1>
            <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-slate-500 md:text-xs">
              Day 3: Market Discovery
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!presentMode ? (
            <div className="flex max-w-[120px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 md:max-w-none md:gap-2 md:px-3 md:py-1.5">
              <span className="hidden text-[10px] font-bold uppercase text-slate-500 sm:inline md:text-xs">
                Squad:
              </span>
              <span className="text-[10px] font-bold uppercase text-slate-500 sm:hidden">Sq:</span>
              <label className="sr-only" htmlFor="squad-name">
                Squad name
              </label>
              <input
                id="squad-name"
                type="text"
                value={squadName}
                onChange={(e) => patchState({ squadName: e.target.value })}
                disabled={disabled}
                placeholder="Squad name"
                className="w-full truncate bg-transparent text-xs font-bold text-spike outline-none md:w-32 md:text-sm"
              />
            </div>
          ) : squadName ? (
            <span className="text-xs font-bold text-spike md:text-sm">{squadName}</span>
          ) : null}

          <Link
            to={playbookHref({ segment: 1, week: 1, day: 3 })}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 text-xs font-semibold text-spike hover:underline md:gap-2 md:text-sm"
          >
            <ArrowLeft size={16} className="sm:hidden" aria-hidden />
            <span className="hidden sm:inline">Back to Playbook</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      <div
        className={`container mx-auto flex max-w-[100rem] flex-col gap-4 px-0 py-4 sm:px-4 md:gap-6 md:px-6 md:py-8 lg:flex-row ${presentMode ? 'lg:justify-center' : ''}`}
      >
        {!isCanvasComplete ? renderStepper() : null}

        <main
          className={`flex-grow px-4 sm:px-0 ${isCanvasComplete || presentMode ? 'w-full max-w-5xl lg:mx-auto' : ''}`}
        >
          {isCanvasComplete ? (
            renderFinalSummary()
          ) : (
            <div className="min-h-[400px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:min-h-[600px] md:rounded-[2rem] md:p-10 sm:p-8">
              {currentStep === 1 ? renderStep1() : null}
              {currentStep === 2 ? renderStep2() : null}
              {currentStep === 3 ? renderStep3() : null}
              {currentStep === 4 ? renderStep4() : null}
              {currentStep === 5 ? renderStep5() : null}
            </div>
          )}
        </main>

        {!isCanvasComplete && !presentMode ? (
          <div className="mt-6 shrink-0 px-4 sm:px-0 lg:mt-0 lg:w-72">{renderEvidenceLibrary()}</div>
        ) : null}
      </div>

      {viewingImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 opacity-100 transition-opacity duration-200 sm:p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Evidence image viewer"
          onClick={() => setViewingImage(null)}
          onKeyDown={(e) => e.key === 'Escape' && setViewingImage(null)}
        >
          <button
            type="button"
            className="absolute right-2 top-2 z-10 rounded-full bg-slate-800/50 p-2 text-white transition hover:bg-slate-800 sm:right-4 sm:top-4"
            onClick={() => setViewingImage(null)}
            aria-label="Close image viewer"
          >
            <X size={24} aria-hidden />
          </button>
          <div
            className="relative flex h-full w-full items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <img
              src={viewingImage}
              alt="Expanded evidence"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
