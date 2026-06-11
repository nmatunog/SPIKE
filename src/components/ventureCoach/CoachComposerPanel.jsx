import { useState } from 'react';
import {
  countWords,
  evaluateStatement,
  refineTextWithFeedback,
} from '../../lib/ventureCoachEngine.js';
import { AMBITION_TONE_OPTIONS } from '../../lib/ventureCoachPhraseBank.js';
import { AMBITION_VARIANTS, IDENTITY_REFINE_ACTIONS, WORD_LIMITS } from '../../lib/ventureCoachConstants.js';
import { CoachWordGuidance } from './CoachDraftPanel.jsx';

/**
 * @param {{
 *   title: string,
 *   draft: string,
 *   onDraftChange: (text: string) => void,
 *   onAccept: () => void,
 *   acceptLabel?: string,
 *   acceptDisabled?: boolean,
 *   wordLimits?: { max: number, targetMin?: number, targetMax?: number },
 *   variants?: { short: string, balanced: string, inspirational: string } | null,
 *   selectedVariant?: string,
 *   onVariantSelect?: (variantId: string, text: string) => void,
 *   selectedTone?: string,
 *   onToneSelect?: (toneId: string) => void,
 *   onShuffle?: () => void,
 *   shuffling?: boolean,
 *   contextChips?: string[],
 *   uniquenessWarning?: string | null,
 *   rows?: number,
 * }} props
 */
export function CoachComposerPanel({
  title,
  draft,
  onDraftChange,
  onAccept,
  acceptLabel = 'Accept statement',
  acceptDisabled = false,
  wordLimits = WORD_LIMITS.ambition,
  variants = null,
  selectedVariant = 'balanced',
  onVariantSelect,
  selectedTone = 'balanced',
  onToneSelect,
  onShuffle,
  shuffling = false,
  contextChips = [],
  uniquenessWarning = null,
  rows = 4,
}) {
  const [refineNote, setRefineNote] = useState('');
  const [undoDraft, setUndoDraft] = useState(null);
  const evaluation = evaluateStatement(draft, wordLimits);

  function applyRefine(actionId) {
    const result = refineTextWithFeedback(draft, actionId, wordLimits.max, 'ambition');
    setUndoDraft(draft);
    setRefineNote(result.note || 'Updated your draft.');
    onDraftChange(result.text);
  }

  function handleUndo() {
    if (undoDraft == null) return;
    onDraftChange(undoDraft);
    setUndoDraft(null);
    setRefineNote('');
  }

  return (
    <section className="spike-card w-full min-w-0 space-y-4 border-spike/20 bg-gradient-to-br from-white to-slate-50">
      <div>
        <p className="spike-label text-spike">Your composed draft</p>
        {title ? <h4 className="text-lg font-semibold text-slate-900">{title}</h4> : null}
      </div>

      {contextChips.length ? (
        <div className="flex flex-wrap gap-2">
          {contextChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-spike/20 bg-spike-muted px-3 py-1 text-xs font-semibold text-spike"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      {variants && onVariantSelect ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Length style</p>
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

      {onToneSelect ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Tone</p>
          <div className="flex flex-wrap gap-2">
            {AMBITION_TONE_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onToneSelect(id)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  selectedTone === id
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

      {onShuffle ? (
        <button
          type="button"
          onClick={onShuffle}
          disabled={shuffling}
          className="spike-btn-secondary text-sm disabled:opacity-50"
        >
          {shuffling ? 'Shuffling…' : 'Shuffle wording'}
        </button>
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

      <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <div className="text-center">
          <p className="text-2xs font-bold uppercase tracking-wide text-slate-500">Clarity</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{evaluation.clarity}</p>
        </div>
        <div className="text-center">
          <p className="text-2xs font-bold uppercase tracking-wide text-slate-500">Memorability</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{evaluation.memorability}</p>
        </div>
        <div className="text-center">
          <p className="text-2xs font-bold uppercase tracking-wide text-slate-500">Length</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{evaluation.lengthLabel}</p>
        </div>
      </div>

      {uniquenessWarning ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          {uniquenessWarning}
        </div>
      ) : null}

      {refineNote ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span>{refineNote}</span>
          {undoDraft != null ? (
            <button
              type="button"
              onClick={handleUndo}
              className="shrink-0 text-xs font-semibold text-spike underline hover:no-underline"
            >
              Undo
            </button>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Refine</p>
        <div className="flex flex-wrap gap-2">
          {IDENTITY_REFINE_ACTIONS.slice(0, 5).map((action) => (
            <button
              key={action.id}
              type="button"
              title={action.tooltip}
              onClick={() => applyRefine(action.id)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-spike/40"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={acceptDisabled}
        onClick={onAccept}
        className="spike-btn-primary w-full disabled:opacity-50 sm:w-auto"
      >
        {acceptLabel}
      </button>
    </section>
  );
}
