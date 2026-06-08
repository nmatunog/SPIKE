import { useEffect, useRef, useState } from 'react';
import {
  countWords,
  evaluateStatement,
  extractCustomizationFields,
  getWordGuidanceStatus,
  regenerateFromCustomization,
} from '../../lib/ventureCoachEngine.js';
import { polishCoachStatement, regenerateCoachWithLearning } from '../../lib/ventureCoachLearning.js';
import {
  coachAiTaskForStatementType,
  formatAiUnavailableMessage,
  refineStatementWithAi,
  requestCoachAiGeneration,
} from '../../lib/ventureCoachAiService.js';
import {
  AMBITION_VARIANTS,
  FUTURE_SELF_REFINE_ACTIONS,
  IDENTITY_REFINE_ACTIONS,
  WORD_LIMITS,
} from '../../lib/ventureCoachConstants.js';
import { CoachCustomizeChat } from './CoachCustomizeChat.jsx';
import { CoachMessage } from './CoachMessage.jsx';

/**
 * @param {{ count: number, limits: { max: number, targetMin?: number, targetMax?: number, min?: number } }} props
 */
export function CoachWordGuidance({ count, limits }) {
  const guidance = getWordGuidanceStatus(count, limits);
  const tone =
    guidance.status === 'too-long'
      ? 'text-amber-800 bg-amber-50 border-amber-200'
      : guidance.status === 'excellent'
        ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
        : 'text-slate-700 bg-slate-50 border-slate-200';

  return (
    <div className={`rounded-xl border px-3 py-2 ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide">{guidance.label}</span>
        <span className="text-xs font-semibold">
          {count} / {limits.max} words
        </span>
      </div>
      {guidance.message ? <p className="mt-1 text-xs">{guidance.message}</p> : null}
    </div>
  );
}

/**
 * @param {{
 *   draft: string,
 *   wordLimits: { max: number, targetMin?: number, targetMax?: number, min?: number },
 *   onSuggestAction?: (actionId: string) => void,
 * }} props
 */
export function CoachStatementScores({ draft, wordLimits, onSuggestAction }) {
  const evaluation = evaluateStatement(draft, wordLimits);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <ScoreCell label="Clarity" value={evaluation.clarity} numeric />
        <ScoreCell label="Memorability" value={evaluation.memorability} numeric />
        <ScoreCell label="Length" value={evaluation.lengthLabel} />
      </div>

      {evaluation.recommendation ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
          <p className="text-sm font-medium text-amber-950">{evaluation.recommendation.message}</p>
          <p className="mt-1 text-xs text-amber-900">
            Suggested action:{' '}
            {onSuggestAction ? (
              <button
                type="button"
                onClick={() => onSuggestAction(evaluation.recommendation.actionId)}
                className="font-bold text-spike underline hover:no-underline"
              >
                {evaluation.recommendation.action}
              </button>
            ) : (
              <span className="font-bold">{evaluation.recommendation.action}</span>
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** @param {{ label: string, value: number | string, numeric?: boolean }} props */
function ScoreCell({ label, value, numeric = false }) {
  return (
    <div className="text-center">
      <p className="text-2xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{numeric ? value : value}</p>
    </div>
  );
}

/**
 * @param {{
 *   title: string,
 *   draft: string,
 *   onDraftChange: (text: string) => void,
 *   onAccept: () => void,
 *   refineSet?: 'identity' | 'future-self',
 *   statementType?: 'ambition' | 'impact' | 'purpose' | 'tagline' | 'future-self',
 *   acceptLabel?: string,
 *   maxWords?: number,
 *   wordLimits?: { max: number, targetMin?: number, targetMax?: number, min?: number },
 *   variants?: { short: string, balanced: string, inspirational: string } | null,
 *   selectedVariant?: string,
 *   onVariantSelect?: (variantId: string, text: string) => void,
 *   rows?: number,
 *   acceptDisabled?: boolean,
 *   showScores?: boolean,
 *   enableCustomization?: boolean,
 *   savedCustomFields?: Record<string, string>,
 *   onCustomFieldsChange?: (fields: Record<string, string>) => void,
 *   onVariantsRegenerated?: (
 *     variants: { short: string, balanced: string, inspirational: string },
 *     variantId: string,
 *     text: string,
 *   ) => void,
 *   participantId?: string,
 * }} props
 */
export function CoachDraftPanel({
  title,
  draft,
  participantId = '',
  onDraftChange,
  onAccept,
  refineSet = 'identity',
  statementType = 'ambition',
  acceptLabel = 'Accept Draft',
  maxWords = WORD_LIMITS.ambition.max,
  wordLimits = WORD_LIMITS.ambition,
  variants = null,
  selectedVariant = 'balanced',
  onVariantSelect,
  rows = 4,
  acceptDisabled = false,
  showScores = true,
  enableCustomization = false,
  savedCustomFields = null,
  onCustomFieldsChange,
  onVariantsRegenerated,
}) {
  const actions = refineSet === 'future-self' ? FUTURE_SELF_REFINE_ACTIONS : IDENTITY_REFINE_ACTIONS;
  const [refineNote, setRefineNote] = useState('');
  const [undoDraft, setUndoDraft] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [fieldDefs, setFieldDefs] = useState(() => extractCustomizationFields(draft, statementType));
  const [customFields, setCustomFields] = useState(() => savedCustomFields ?? {});
  const variantSeedRef = useRef(selectedVariant);

  useEffect(() => {
    if (!enableCustomization) return;
    if (variantSeedRef.current === selectedVariant) return;
    variantSeedRef.current = selectedVariant;
    const defs = extractCustomizationFields(draft, statementType);
    setFieldDefs(defs);
    setCustomFields({});
    onCustomFieldsChange?.({});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-seed fields when style variant changes
  }, [selectedVariant, draft, enableCustomization, statementType]);

  function updateCustomField(id, value) {
    const next = { ...customFields, [id]: value };
    setCustomFields(next);
    onCustomFieldsChange?.(next);
  }

  async function handleRegenerate() {
    const mergedFields = Object.fromEntries(
      fieldDefs.map((field) => [field.id, customFields[field.id]?.trim() || field.suggestion || '']),
    );

    setRegenerating(true);
    try {
      const aiResult = await requestCoachAiGeneration({
        task: coachAiTaskForStatementType(statementType),
        variant: selectedVariant,
        fields: mergedFields,
        statementType,
      });

      if (aiResult?.text && !aiResult.unavailable) {
        const polishedText = polishCoachStatement(aiResult.text, statementType);
        const polishedVariants = aiResult.variants
          ? Object.fromEntries(
              Object.entries(aiResult.variants).map(([key, value]) => [
                key,
                polishCoachStatement(String(value), statementType),
              ]),
            )
          : null;
        setUndoDraft(draft);
        setRefineNote(
          aiResult.provider && aiResult.provider !== 'local'
            ? `${aiResult.note} (via ${aiResult.provider})`
            : aiResult.note,
        );
        onDraftChange(polishedText);
        if (polishedVariants && onVariantsRegenerated) {
          onVariantsRegenerated(polishedVariants, selectedVariant, polishedText);
        }
        return;
      }

      const result = participantId
        ? regenerateCoachWithLearning(participantId, {
            statementType,
            variant: selectedVariant,
            fields: mergedFields,
          })
        : (() => {
            const local = regenerateFromCustomization({
              statementType,
              variant: selectedVariant,
              fields: mergedFields,
            });
            if (local.text) local.text = polishCoachStatement(local.text, statementType);
            if (local.variants) {
              for (const key of Object.keys(local.variants)) {
                local.variants[key] = polishCoachStatement(local.variants[key], statementType);
              }
            }
            return local;
          })();
      if (result.skipped) {
        setRefineNote(result.note);
        return;
      }
      setUndoDraft(draft);
      const fallbackNote = aiResult?.unavailable ? formatAiUnavailableMessage(aiResult) : '';
      setRefineNote(fallbackNote ? `${result.note} ${fallbackNote}` : result.note);
      onDraftChange(result.text);
      if (result.variants && onVariantsRegenerated) {
        onVariantsRegenerated(result.variants, selectedVariant, result.text);
      }
    } finally {
      setRegenerating(false);
    }
  }

  async function applyRefine(actionId) {
    const action = actions.find((item) => item.id === actionId);
    if (!action) return;

    setRefining(true);
    try {
      const wordMin = statementType === 'future-self' ? WORD_LIMITS.futureSelf.min : 0;
      const result = await refineStatementWithAi(
        draft,
        actionId,
        action,
        maxWords,
        statementType,
        wordMin,
      );
      setUndoDraft(draft);
      setRefineNote(
        result.provider && result.provider !== 'local'
          ? `${result.note} (via ${result.provider})`
          : result.note,
      );
      onDraftChange(result.text ? polishCoachStatement(result.text, statementType) : result.text);
    } finally {
      setRefining(false);
    }
  }

  function handleUndoRefine() {
    if (undoDraft == null) return;
    onDraftChange(undoDraft);
    setUndoDraft(null);
    setRefineNote('');
  }

  return (
    <section className="spike-card w-full min-w-0 space-y-4 border-spike/20 bg-gradient-to-br from-white to-spike-muted/20">
      <div>
        <p className="spike-label text-spike">AI Draft</p>
        {title ? <h4 className="text-lg font-semibold text-slate-900">{title}</h4> : null}
      </div>

      {variants && onVariantSelect ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Choose a style</p>
          <div className="flex flex-wrap gap-2">
            {AMBITION_VARIANTS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onVariantSelect(id, variants[id] ?? '')}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  selectedVariant === id
                    ? 'border-spike bg-spike text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-spike/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {enableCustomization && fieldDefs.length ? (
        <CoachCustomizeChat
          statementType={statementType}
          fields={fieldDefs}
          values={customFields}
          onChange={updateCustomField}
          onRegenerate={handleRegenerate}
          regenerating={regenerating}
        />
      ) : null}

      <textarea
        className="block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
        rows={rows}
        value={draft}
        onChange={(e) => {
          setRefineNote('');
          setUndoDraft(null);
          onDraftChange(e.target.value);
        }}
      />

      <CoachWordGuidance count={countWords(draft)} limits={wordLimits} />

      {showScores && refineSet === 'identity' ? (
        <CoachStatementScores draft={draft} wordLimits={wordLimits} onSuggestAction={applyRefine} />
      ) : null}

      {refineNote ? (
        <div className="space-y-2">
          <CoachMessage>{refineNote}</CoachMessage>
          {undoDraft != null ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleUndoRefine}
                className="text-xs font-semibold text-spike underline hover:no-underline"
              >
                Undo last change
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Refine</p>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              title={action.tooltip ?? ''}
              disabled={refining || regenerating}
              onClick={() => applyRefine(action.id)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-spike/40 hover:text-spike disabled:cursor-not-allowed disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={acceptDisabled} onClick={onAccept} className="spike-btn-primary disabled:opacity-50">
          {acceptLabel}
        </button>
      </div>
    </section>
  );
}
