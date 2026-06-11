import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AMBITION_MOTIVATOR_CARDS,
  COACH_VALUE_CARDS,
  FUTURE_SELF_GOALS,
  IMPACT_AUDIENCES,
  INCOME_SLIDER_LABELS,
  VENTURE_DIRECTION_CARDS,
  WORD_LIMITS,
} from '../../lib/ventureCoachConstants.js';
import {
  AMBITION_IMPACT_OVERLAP_WARNING,
  countWords,
  generateFutureSelfSummary,
  statementsOverlapTooMuch,
} from '../../lib/ventureCoachEngine.js';
import {
  generateFutureSelfWithAi,
  generateImpactDraftWithAi,
  generateTaglineWithAi,
  generateValuesProfileWithAi,
} from '../../lib/ventureCoachAiService.js';
import {
  ambitionContextLabels,
  findCohortStatementConflict,
  findUniqueAmbitionDraft,
} from '../../lib/ventureCoachComposer.js';
import { AMBITION_ROLE_ARCHETYPES } from '../../lib/ventureCoachPhraseBank.js';
import {
  acceptCoachSection,
  getCoachSection,
  saveCoachSectionDraft,
} from '../../lib/ventureCoachService.js';
import { CoachCardGrid, CoachMessage, CoachRadioList } from './CoachMessage.jsx';
import { CoachComposerPanel } from './CoachComposerPanel.jsx';
import { CoachDraftPanel, CoachWordGuidance } from './CoachDraftPanel.jsx';
import { CoachRankList, CoachSelectionCounter } from './CoachRankList.jsx';
import { CoachSectionHeader } from './CoachSectionHeader.jsx';
import { ROUTES } from '../../routes/paths.js';

const AMBITION_EXACT = 3;
const AMBITION_STEPS = 4;
const IMPACT_MAX = 2;
/** @deprecated */ const PURPOSE_EXACT = IMPACT_MAX;

/** @param {(() => void) | undefined} onSectionComplete @param {ReturnType<typeof useNavigate>} navigate @param {string} nextPath */
function afterSectionAccept(onSectionComplete, navigate, nextPath) {
  if (onSectionComplete) {
    onSectionComplete();
  } else {
    navigate(nextPath);
  }
}

/**
 * @param {{ participantId: string, onProgress: () => void, onSectionComplete?: () => void }} props
 */
export function AmbitionCoachFlow({ participantId, onProgress, onSectionComplete }) {
  const navigate = useNavigate();
  const stored = getCoachSection(participantId, 'ambition');
  const [step, setStep] = useState(stored.data.step ?? 1);
  const [selected, setSelected] = useState(/** @type {string[]} */ (stored.data.selectedMotivators ?? []));
  const [ranked, setRanked] = useState(
    /** @type {string[]} */ (stored.data.rankedMotivators ?? stored.data.selectedMotivators ?? []),
  );
  const [roleArchetypeId, setRoleArchetypeId] = useState(
    String(stored.data.roleArchetypeId ?? AMBITION_ROLE_ARCHETYPES[0].id),
  );
  const [compositionTone, setCompositionTone] = useState(String(stored.data.compositionTone ?? 'balanced'));
  const [patternSeed, setPatternSeed] = useState(Number(stored.data.patternSeed ?? 0));
  const [variants, setVariants] = useState(
    /** @type {{ short: string, balanced: string, inspirational: string } | null} */ (
      stored.data.draftVariants ?? null
    ),
  );
  const [selectedVariant, setSelectedVariant] = useState(String(stored.data.selectedVariant ?? 'balanced'));
  const [draft, setDraft] = useState(String(stored.data.draft ?? ''));
  const [shuffling, setShuffling] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  const rankedOrder = ranked.length === AMBITION_EXACT ? ranked : selected;

  function persist(data, nextStep = step) {
    saveCoachSectionDraft(participantId, 'ambition', { ...stored.data, ...data, step: nextStep });
  }

  function toggleMotivator(id) {
    let next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    if (next.length > AMBITION_EXACT) next = next.slice(-AMBITION_EXACT);
    setSelected(next);
    persist({ selectedMotivators: next });
  }

  function regenerateComposedDraft({
    tone = compositionTone,
    seed = patternSeed,
    variant = selectedVariant,
  } = {}) {
    const result = findUniqueAmbitionDraft(rankedOrder, roleArchetypeId, tone, participantId, seed);
    setVariants(result.variants);
    const text = result.variants[variant] ?? result.variants.balanced;
    setDraft(text);
    setPatternSeed(result.patternSeed);
    setCompositionTone(tone);
    persist({
      draftVariants: result.variants,
      draft: text,
      selectedVariant: variant,
      compositionTone: tone,
      patternSeed: result.patternSeed,
      roleArchetypeId,
      rankedMotivators: rankedOrder,
      selectedMotivators: selected,
    });
    return result;
  }

  function beginComposeStep() {
    const result = regenerateComposedDraft({ seed: patternSeed, variant: 'balanced' });
    setSelectedVariant('balanced');
    setStep(4);
    persist(
      {
        rankedMotivators: rankedOrder,
        selectedMotivators: selected,
        roleArchetypeId,
        draftVariants: result.variants,
        draft: result.variants.balanced,
        selectedVariant: 'balanced',
        compositionTone,
        patternSeed: result.patternSeed,
      },
      4,
    );
  }

  function uniquenessWarningFor(text) {
    const conflict = findCohortStatementConflict('ambition', text, participantId);
    if (!conflict) return null;
    if (conflict.type === 'exact') {
      return 'Another intern in this browser already uses this exact wording. Shuffle wording or edit yours before accepting.';
    }
    return 'This wording is very similar to another intern. Consider shuffling or editing to make it more yours.';
  }

  function handleAccept() {
    if (countWords(draft) > WORD_LIMITS.ambition.max) return;
    const conflict = findCohortStatementConflict('ambition', draft, participantId);
    if (conflict?.type === 'exact') {
      setAcceptError('That exact statement is already taken in your cohort. Shuffle wording or edit before accepting.');
      return;
    }
    setAcceptError('');
    acceptCoachSection(participantId, 'ambition', draft.trim(), {
      selectedMotivators: selected,
      rankedMotivators: rankedOrder,
      draftVariants: variants,
      selectedVariant,
      roleArchetypeId,
      compositionTone,
      patternSeed,
    });
    onProgress();
    afterSectionAccept(onSectionComplete, navigate, `${ROUTES.ventureBlueprint}/coach/impact`);
  }

  const roleLabel = AMBITION_ROLE_ARCHETYPES.find((role) => role.id === roleArchetypeId)?.label ?? '';
  const contextChips = [...ambitionContextLabels(rankedOrder), roleLabel].filter(Boolean);

  if (stored.completedAt) {
    return (
      <section className="spike-card space-y-2">
        <p className="font-semibold text-slate-900">My Ambition — complete ✓</p>
        <p className="whitespace-pre-wrap text-slate-600">{stored.data.finalText}</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {step === 1 ? (
        <>
          <CoachSectionHeader
            step={1}
            total={AMBITION_STEPS}
            title="What do I want to become?"
            description="Pick exactly 3 drivers that describe the leader or entrepreneur you want to become."
          />
          <CoachSelectionCounter count={selected.length} exact={AMBITION_EXACT} />
          <CoachCardGrid
            options={AMBITION_MOTIVATOR_CARDS}
            selected={selected}
            onToggle={toggleMotivator}
            exactSelections={AMBITION_EXACT}
          />
          <button
            type="button"
            disabled={selected.length !== AMBITION_EXACT}
            onClick={() => {
              setRanked([...selected]);
              setStep(2);
              persist({ rankedMotivators: [...selected] }, 2);
            }}
            className="spike-btn-primary disabled:opacity-50"
          >
            Continue to ranking
          </button>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <CoachSectionHeader
            step={2}
            total={AMBITION_STEPS}
            title="Which one matters most?"
            description="Rank your 3 choices — #1 is your primary driver for the composed statement."
          />
          <CoachRankList
            items={ranked}
            options={AMBITION_MOTIVATOR_CARDS}
            onChange={(next) => {
              setRanked(next);
              persist({ rankedMotivators: next });
            }}
          />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(1)} className="spike-btn-secondary">
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(3);
                persist({ rankedMotivators: ranked }, 3);
              }}
              className="spike-btn-primary"
            >
              Continue to role
            </button>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <CoachSectionHeader
            step={3}
            total={AMBITION_STEPS}
            title="What role are you growing into?"
            description="Choose a role archetype. Your statement will be composed from curated phrases — no typing required yet."
          />
          <CoachRadioList
            options={AMBITION_ROLE_ARCHETYPES}
            value={roleArchetypeId}
            onChange={(id) => {
              setRoleArchetypeId(id);
              persist({ roleArchetypeId: id });
            }}
          />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(2)} className="spike-btn-secondary">
              Back
            </button>
            <button type="button" onClick={beginComposeStep} className="spike-btn-primary">
              Compose my ambition statement
            </button>
          </div>
        </>
      ) : null}

      {step === 4 && draft ? (
        <>
          <CoachSectionHeader
            step={4}
            total={AMBITION_STEPS}
            title="Compose and finalize"
            description="Pick a length style and tone, shuffle wording if needed, then edit the final line until it sounds like you."
          />
          <CoachComposerPanel
            title="Draft Ambition Statement"
            draft={draft}
            variants={variants}
            selectedVariant={selectedVariant}
            selectedTone={compositionTone}
            contextChips={contextChips}
            uniquenessWarning={acceptError || uniquenessWarningFor(draft)}
            shuffling={shuffling}
            wordLimits={WORD_LIMITS.ambition}
            acceptDisabled={countWords(draft) > WORD_LIMITS.ambition.max}
            onVariantSelect={(id, text) => {
              setSelectedVariant(id);
              setDraft(text);
              persist({ selectedVariant: id, draft: text });
            }}
            onToneSelect={(tone) => {
              const result = regenerateComposedDraft({ tone, seed: patternSeed, variant: selectedVariant });
              if (result.conflict?.type === 'exact') {
                regenerateComposedDraft({ tone, seed: result.patternSeed + 1, variant: selectedVariant });
              }
            }}
            onShuffle={() => {
              setShuffling(true);
              try {
                regenerateComposedDraft({
                  tone: compositionTone,
                  seed: patternSeed + 1,
                  variant: selectedVariant,
                });
                setAcceptError('');
              } finally {
                setShuffling(false);
              }
            }}
            onDraftChange={(text) => {
              setDraft(text);
              setAcceptError('');
              persist({ draft: text });
            }}
            onAccept={handleAccept}
          />
          <button type="button" onClick={() => setStep(3)} className="spike-btn-secondary">
            Back to role
          </button>
        </>
      ) : null}
    </div>
  );
}

/**
 * @param {{ participantId: string, onProgress: () => void, onSectionComplete?: () => void }} props
 */
export function ImpactCoachFlow({ participantId, onProgress, onSectionComplete }) {
  const navigate = useNavigate();
  const stored = getCoachSection(participantId, 'impact');
  const ambitionStored = getCoachSection(participantId, 'ambition');
  const [step, setStep] = useState(stored.data.step ?? 1);
  const [audiences, setAudiences] = useState(
    /** @type {string[]} */ (stored.data.audiences ?? stored.data.drivers ?? []),
  );
  const [draft, setDraft] = useState(String(stored.data.draft ?? ''));
  const [customFields, setCustomFields] = useState(
    /** @type {Record<string, string>} */ (stored.data.customFields ?? {}),
  );
  const [generating, setGenerating] = useState(false);

  const ambitionText = String(ambitionStored.data.finalText ?? ambitionStored.data.draft ?? '');
  const overlapWarning =
    draft && ambitionText && statementsOverlapTooMuch(ambitionText, draft) ? AMBITION_IMPACT_OVERLAP_WARNING : null;

  function persist(data) {
    saveCoachSectionDraft(participantId, 'impact', { ...stored.data, ...data, step });
  }

  function handleAccept() {
    if (countWords(draft) > WORD_LIMITS.impact.max) return;
    acceptCoachSection(participantId, 'impact', draft.trim(), { audiences, customFields });
    onProgress();
    afterSectionAccept(onSectionComplete, navigate, `${ROUTES.ventureBlueprint}/coach/values`);
  }

  if (stored.completedAt) {
    return (
      <CoachMessage>
        <p className="font-semibold">My Impact — complete ✓</p>
        <p className="mt-2 whitespace-pre-wrap text-slate-600">{stored.data.finalText}</p>
      </CoachMessage>
    );
  }

  return (
    <div className="space-y-6">
      {step === 1 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">Who do I want to help?</p>
            <p className="mt-2 text-slate-600">
              Who would you like to serve? What difference do you want to make? Select up to 2 audiences.
            </p>
          </CoachMessage>
          <CoachSelectionCounter count={audiences.length} exact={IMPACT_MAX} />
          <CoachCardGrid
            options={IMPACT_AUDIENCES}
            selected={audiences}
            onToggle={(id) => {
              let next = audiences.includes(id) ? audiences.filter((x) => x !== id) : [...audiences, id];
              if (next.length > IMPACT_MAX) next = next.slice(-IMPACT_MAX);
              setAudiences(next);
              persist({ audiences: next, drivers: next });
            }}
            exactSelections={IMPACT_MAX}
          />
          <button
            type="button"
            disabled={audiences.length === 0 || generating}
            onClick={async () => {
              setGenerating(true);
              try {
                const { text } = await generateImpactDraftWithAi({ audiences });
                setDraft(text);
                persist({ draft: text, audiences, step: 2 });
                setStep(2);
              } finally {
                setGenerating(false);
              }
            }}
            className="spike-btn-primary disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate my impact statement'}
          </button>
        </>
      ) : null}

      {step === 2 && draft ? (
        <>
          {overlapWarning ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {overlapWarning}
            </div>
          ) : null}
          <CoachMessage>
            <p>
              Answer the coach one question at a time, then refine until you can say it confidently in under 30
              seconds.
            </p>
          </CoachMessage>
          <CoachDraftPanel
            participantId={participantId}
            title="Impact Statement"
            statementType="impact"
            draft={draft}
            coachCardContext={{ audiences }}
            enableCustomization
            savedCustomFields={customFields}
            onCustomFieldsChange={(fields) => {
              setCustomFields(fields);
              persist({ customFields: fields });
            }}
            wordLimits={WORD_LIMITS.impact}
            maxWords={WORD_LIMITS.impact.max}
            acceptDisabled={countWords(draft) > WORD_LIMITS.impact.max}
            onDraftChange={(text) => {
              setDraft(text);
              persist({ draft: text });
            }}
            onAccept={handleAccept}
          />
        </>
      ) : null}
    </div>
  );
}

/** @deprecated Use ImpactCoachFlow */
export const PurposeCoachFlow = ImpactCoachFlow;

/**
 * @param {{ participantId: string, onProgress: () => void, onSectionComplete?: () => void }} props
 */
export function ValuesCoachFlow({ participantId, onProgress, onSectionComplete }) {
  const navigate = useNavigate();
  const stored = getCoachSection(participantId, 'values');
  const [step, setStep] = useState(stored.data.step ?? 1);
  const [selected, setSelected] = useState(/** @type {string[]} */ (stored.data.selected ?? []));
  const [topFive, setTopFive] = useState(/** @type {string[]} */ (stored.data.topFive ?? []));
  const [topThree, setTopThree] = useState(
    /** @type {string[]} */ (stored.data.topThree ?? stored.data.topFive?.slice(0, 3) ?? []),
  );
  const [profile, setProfile] = useState(String(stored.data.valuesProfile ?? ''));
  const [generating, setGenerating] = useState(false);

  function persist(data) {
    saveCoachSectionDraft(participantId, 'values', { ...stored.data, ...data, step });
  }

  if (stored.completedAt) {
    return (
      <CoachMessage>
        <p className="font-semibold">My Values — complete ✓</p>
        <p className="mt-2 whitespace-pre-wrap text-slate-600">{stored.data.finalText}</p>
      </CoachMessage>
    );
  }

  return (
    <div className="space-y-6">
      {step === 1 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">How will I do it?</p>
            <p className="mt-2 text-slate-600">
              What principles guide you? What standards will you never compromise? Select up to 10 values — choose at
              least 5 to continue.
            </p>
          </CoachMessage>
          <CoachSelectionCounter count={selected.length} max={10} />
          <CoachCardGrid
            options={COACH_VALUE_CARDS}
            selected={selected}
            maxSelections={10}
            onToggle={(id) => {
              let next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
              if (next.length > 10) next = next.slice(-10);
              setSelected(next);
              persist({ selected: next });
            }}
          />
          <button
            type="button"
            disabled={selected.length < 5}
            onClick={() => setStep(2)}
            className="spike-btn-primary disabled:opacity-50"
          >
            Narrow to Top 5
          </button>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">Reduce to your Top 5 values.</p>
          </CoachMessage>
          <CoachCardGrid
            options={COACH_VALUE_CARDS.filter((c) => selected.includes(c.id))}
            selected={topFive}
            exactSelections={5}
            onToggle={(id) => {
              let next = topFive.includes(id) ? topFive.filter((x) => x !== id) : [...topFive, id];
              if (next.length > 5) next = next.slice(-5);
              setTopFive(next);
              persist({ topFive: next });
            }}
          />
          <button
            type="button"
            disabled={topFive.length !== 5}
            onClick={() => {
              setTopThree(topFive.slice(0, 3));
              persist({ topThree: topFive.slice(0, 3), step: 3 });
              setStep(3);
            }}
            className="spike-btn-primary disabled:opacity-50"
          >
            Rank Top 3
          </button>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">Rank your Top 3 public-facing values.</p>
            <p className="mt-2 text-slate-600">These three define how others experience your leadership.</p>
          </CoachMessage>
          <CoachRankList
            items={topThree}
            options={COACH_VALUE_CARDS.filter((c) => topFive.includes(c.id))}
            onChange={(next) => {
              setTopThree(next);
              persist({ topThree: next });
            }}
          />
          <button
            type="button"
            disabled={topThree.length !== 3 || generating}
            onClick={async () => {
              setGenerating(true);
              try {
                const { profile: nextProfile } = await generateValuesProfileWithAi(topThree);
                setProfile(nextProfile);
                persist({ valuesProfile: nextProfile, topThree, step: 4 });
                setStep(4);
              } finally {
                setGenerating(false);
              }
            }}
            className="spike-btn-primary disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate values profile'}
          </button>
        </>
      ) : null}

      {step === 4 && profile ? (
        <>
          <CoachMessage>
            <p className="font-semibold">Values Profile</p>
            <p className="mt-2 whitespace-pre-wrap text-slate-600">{profile}</p>
          </CoachMessage>
          <button
            type="button"
            onClick={() => {
              acceptCoachSection(participantId, 'values', profile, { topFive, topThree, valuesProfile: profile });
              onProgress();
              afterSectionAccept(onSectionComplete, navigate, `${ROUTES.ventureBlueprint}/coach/tagline`);
            }}
            className="spike-btn-primary"
          >
            Accept &amp; continue to Tagline
          </button>
        </>
      ) : null}
    </div>
  );
}

/**
 * @param {{ participantId: string, onProgress: () => void, onSectionComplete?: () => void }} props
 */
export function TaglineCoachFlow({ participantId, onProgress, onSectionComplete }) {
  const navigate = useNavigate();
  const stored = getCoachSection(participantId, 'tagline');
  const ambition = getCoachSection(participantId, 'ambition').data;
  const impact = getCoachSection(participantId, 'impact').data;
  const values = getCoachSection(participantId, 'values').data;

  const taglineContext = {
    ambition: ambition.finalText ?? ambition.draft,
    impact: impact.finalText ?? impact.draft,
    topThree: values.topThree ?? [],
  };

  const [draft, setDraft] = useState(() => (stored.data.draft ? String(stored.data.draft) : ''));
  const [draftLoading, setDraftLoading] = useState(!stored.data.draft && !stored.completedAt);
  const [customFields, setCustomFields] = useState(
    /** @type {Record<string, string>} */ (stored.data.customFields ?? {}),
  );

  useEffect(() => {
    if (stored.data.draft || stored.completedAt) return undefined;

    let cancelled = false;
    (async () => {
      const { text } = await generateTaglineWithAi(taglineContext);
      if (cancelled) return;
      setDraft(text);
      persist({ draft: text });
      setDraftLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed tagline once from identity triangle
  }, []);

  function persist(data) {
    saveCoachSectionDraft(participantId, 'tagline', { ...stored.data, ...data, step: 1 });
  }

  function handleAccept() {
    if (countWords(draft) > WORD_LIMITS.tagline.max) return;
    acceptCoachSection(participantId, 'tagline', draft.trim(), { customFields });
    onProgress();
    afterSectionAccept(onSectionComplete, navigate, `${ROUTES.ventureBlueprint}/coach/future-self`);
  }

  if (stored.completedAt) {
    return (
      <CoachMessage>
        <p className="font-semibold">My Tagline — complete ✓</p>
        <p className="mt-2 text-lg font-semibold text-spike">{stored.data.finalText}</p>
      </CoachMessage>
    );
  }

  return (
    <div className="space-y-6">
      <CoachMessage>
        <p className="font-semibold">Your personal tagline</p>
        <p className="mt-2 text-slate-600">
          Generated from your ambition, impact, and values. Edit a few beats below, regenerate, then keep it memorable — 3–6 words is ideal.
        </p>
      </CoachMessage>
      {draftLoading ? (
        <CoachMessage>Generating your tagline from ambition, impact, and values…</CoachMessage>
      ) : (
        <CoachDraftPanel
          participantId={participantId}
          title="Personal Tagline"
          statementType="tagline"
          draft={draft}
          enableCustomization
          savedCustomFields={customFields}
          onCustomFieldsChange={(fields) => {
            setCustomFields(fields);
            persist({ customFields: fields });
          }}
          wordLimits={WORD_LIMITS.tagline}
          maxWords={WORD_LIMITS.tagline.max}
          acceptDisabled={countWords(draft) > WORD_LIMITS.tagline.max}
          acceptLabel="Accept Tagline"
          rows={2}
          onDraftChange={(text) => {
            setDraft(text);
            persist({ draft: text });
          }}
          onAccept={handleAccept}
        />
      )}
    </div>
  );
}

/**
 * @param {{ participantId: string, onProgress: () => void, onSectionComplete?: () => void }} props
 */
export function FutureSelfCoachFlow({ participantId, onProgress, onSectionComplete }) {
  const navigate = useNavigate();
  const stored = getCoachSection(participantId, 'future-self');
  const [step, setStep] = useState(stored.data.step ?? 1);
  const [goals, setGoals] = useState(/** @type {string[]} */ (stored.data.goals ?? []));
  const [incomeLevel, setIncomeLevel] = useState(Number(stored.data.incomeLevel ?? 3));
  const [impact, setImpact] = useState(String(stored.data.impact ?? ''));
  const [successVision, setSuccessVision] = useState(String(stored.data.successVision ?? ''));
  const [draft, setDraft] = useState(String(stored.data.draft ?? ''));
  const [summary, setSummary] = useState(String(stored.data.futureSelfSummary ?? ''));
  const [generating, setGenerating] = useState(false);

  function persist(data) {
    saveCoachSectionDraft(participantId, 'future-self', { ...stored.data, ...data, step });
  }

  if (stored.completedAt) {
    return (
      <CoachMessage>
        <p className="font-semibold">My Future Self — complete ✓</p>
        <p className="mt-2 text-sm font-semibold text-spike">{stored.data.futureSelfSummary}</p>
        <p className="mt-3 whitespace-pre-wrap text-slate-600">{stored.data.finalText}</p>
      </CoachMessage>
    );
  }

  return (
    <div className="space-y-6">
      <CoachMessage>
        <div className="flex flex-wrap items-center justify-center gap-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
          <span className="rounded-lg bg-slate-100 px-3 py-2">Today</span>
          <span>↓</span>
          <span className="rounded-lg bg-slate-100 px-3 py-2">1 Year</span>
          <span>↓</span>
          <span className="rounded-lg bg-spike px-3 py-2 text-white">3 Years</span>
          <span>↓</span>
          <span className="rounded-lg bg-slate-100 px-3 py-2">10 Years</span>
        </div>
      </CoachMessage>

      {step === 1 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">Where do you want to be in 3 years?</p>
          </CoachMessage>
          <CoachCardGrid
            options={FUTURE_SELF_GOALS}
            selected={goals}
            onToggle={(id) => {
              const next = goals.includes(id) ? goals.filter((x) => x !== id) : [...goals, id];
              setGoals(next);
              persist({ goals: next });
            }}
          />
          <button type="button" disabled={goals.length === 0} onClick={() => setStep(2)} className="spike-btn-primary disabled:opacity-50">
            Continue
          </button>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">What income level would make you proud?</p>
          </CoachMessage>
          <input
            type="range"
            min={1}
            max={5}
            value={incomeLevel}
            onChange={(e) => {
              const val = Number(e.target.value);
              setIncomeLevel(val);
              persist({ incomeLevel: val });
            }}
            className="w-full accent-spike"
          />
          <p className="text-center text-sm font-semibold text-spike">
            {INCOME_SLIDER_LABELS.find((l) => l.value === incomeLevel)?.label}
          </p>
          <button type="button" onClick={() => setStep(3)} className="spike-btn-primary">
            Continue
          </button>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">What impact would you like to create?</p>
          </CoachMessage>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            value={impact}
            placeholder="Who you serve and how…"
            onChange={(e) => {
              setImpact(e.target.value);
              persist({ impact: e.target.value });
            }}
          />
          <CoachMessage>
            <p className="font-semibold">What would success look like?</p>
          </CoachMessage>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            value={successVision}
            placeholder="Describe success in your own words…"
            onChange={(e) => {
              setSuccessVision(e.target.value);
              persist({ successVision: e.target.value });
            }}
          />
          <button
            type="button"
            disabled={impact.trim().length < 5 || successVision.trim().length < 5 || generating}
            onClick={async () => {
              setGenerating(true);
              try {
                const { text, summary: oneLine } = await generateFutureSelfWithAi({
                  goals,
                  incomeLevel,
                  impact,
                  successVision,
                });
                setDraft(text);
                setSummary(oneLine);
                persist({ draft: text, futureSelfSummary: oneLine, step: 4 });
                setStep(4);
              } finally {
                setGenerating(false);
              }
            }}
            className="spike-btn-primary disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate Future Self Narrative'}
          </button>
        </>
      ) : null}

      {step === 4 && draft ? (
        <>
          <CoachMessage>
            <p>Your Future Self narrative (250–400 words) plus a one-sentence summary for mentors and presentations.</p>
          </CoachMessage>
          <CoachDraftPanel
            title="Future Self Narrative"
            statementType="future-self"
            showScores={false}
            draft={draft}
            refineSet="future-self"
            rows={12}
            wordLimits={WORD_LIMITS.futureSelf}
            maxWords={WORD_LIMITS.futureSelf.max}
            acceptDisabled={
              countWords(draft) > WORD_LIMITS.futureSelf.max || countWords(draft) < WORD_LIMITS.futureSelf.min
            }
            onDraftChange={(text) => {
              setDraft(text);
              const nextSummary = generateFutureSelfSummary(text, { goals });
              setSummary(nextSummary);
              persist({ draft: text, futureSelfSummary: nextSummary });
            }}
            onAccept={() => {
              acceptCoachSection(participantId, 'future-self', draft.trim(), {
                goals,
                incomeLevel,
                impact,
                successVision,
                futureSelfSummary: summary,
              });
              onProgress();
              afterSectionAccept(
                onSectionComplete,
                navigate,
                `${ROUTES.ventureBlueprint}/coach/venture-direction`,
              );
            }}
          />
          <div className="spike-card space-y-3">
            <p className="spike-label">One-Sentence Summary</p>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                persist({ futureSelfSummary: e.target.value });
              }}
            />
            <CoachWordGuidance count={countWords(summary)} limits={WORD_LIMITS.futureSelfSummary} />
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * @param {{ participantId: string, onProgress: () => void, onSectionComplete?: () => void }} props
 */
export function VentureDirectionCoachFlow({ participantId, onProgress, onSectionComplete }) {
  const stored = getCoachSection(participantId, 'venture-direction');
  const [track, setTrack] = useState(String(stored.data.track ?? ''));

  if (stored.completedAt) {
    return (
      <div className="space-y-4">
        <CoachMessage>
          <p className="font-semibold">Venture Direction — complete ✓</p>
          <p className="mt-2 text-slate-600">
            {VENTURE_DIRECTION_CARDS.find((c) => c.id === stored.data.track)?.label ?? stored.data.track}
          </p>
        </CoachMessage>
        <Link to={ROUTES.myVenturePortfolio} className="spike-btn-primary inline-flex">
          View your Venture Portfolio →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CoachMessage>
        <p className="font-semibold">Which direction currently excites you most?</p>
        <p className="mt-2 text-slate-600">No commitment yet — this helps shape your Blueprint path.</p>
      </CoachMessage>

      <div className="grid gap-4 sm:grid-cols-3">
        {VENTURE_DIRECTION_CARDS.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              setTrack(card.id);
              saveCoachSectionDraft(participantId, 'venture-direction', { track: card.id });
            }}
            className={`rounded-2xl border-2 p-5 text-left transition hover:shadow-md ${
              track === card.id
                ? 'border-spike bg-spike-muted ring-2 ring-spike/20'
                : 'border-slate-200 bg-white hover:border-spike/30'
            }`}
          >
            <p className="font-semibold text-slate-900">{card.label}</p>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!track}
        onClick={() => {
          acceptCoachSection(participantId, 'venture-direction', track, { track });
          onProgress();
          if (onSectionComplete) onSectionComplete();
        }}
        className="spike-btn-primary disabled:opacity-50"
      >
        Save venture direction to Blueprint
      </button>
    </div>
  );
}
