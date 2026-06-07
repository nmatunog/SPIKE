import { countWords, getWordGuidanceStatus, refineText } from '../../lib/ventureCoachEngine.js';
import {
  AMBITION_VARIANTS,
  FUTURE_SELF_REFINE_ACTIONS,
  IDENTITY_REFINE_ACTIONS,
  WORD_LIMITS,
} from '../../lib/ventureCoachConstants.js';

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
 *   title: string,
 *   draft: string,
 *   onDraftChange: (text: string) => void,
 *   onAccept: () => void,
 *   refineSet?: 'identity' | 'future-self',
 *   acceptLabel?: string,
 *   maxWords?: number,
 *   wordLimits?: { max: number, targetMin?: number, targetMax?: number, min?: number },
 *   variants?: { short: string, balanced: string, inspirational: string } | null,
 *   selectedVariant?: string,
 *   onVariantSelect?: (variantId: string, text: string) => void,
 *   rows?: number,
 *   acceptDisabled?: boolean,
 * }} props
 */
export function CoachDraftPanel({
  title,
  draft,
  onDraftChange,
  onAccept,
  refineSet = 'identity',
  acceptLabel = 'Accept Draft',
  maxWords = WORD_LIMITS.ambition.max,
  wordLimits = WORD_LIMITS.ambition,
  variants = null,
  selectedVariant = 'balanced',
  onVariantSelect,
  rows = 4,
  acceptDisabled = false,
}) {
  const actions = refineSet === 'future-self' ? FUTURE_SELF_REFINE_ACTIONS : IDENTITY_REFINE_ACTIONS;

  return (
    <section className="spike-card w-full min-w-0 space-y-4 border-spike/20 bg-gradient-to-br from-white to-spike-muted/20">
      <div>
        <p className="spike-label text-spike">AI Draft</p>
        <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
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

      <textarea
        className="block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
        rows={rows}
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
      />

      <CoachWordGuidance count={countWords(draft)} limits={wordLimits} />

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Refine</p>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onDraftChange(refineText(draft, action.id, maxWords))}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-spike/40 hover:text-spike"
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
