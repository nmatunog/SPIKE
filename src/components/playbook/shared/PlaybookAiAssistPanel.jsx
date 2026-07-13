import { Sparkles } from 'lucide-react';

/**
 * Non-blocking AI suggestion panel — never overwrites participant text automatically.
 * @param {{
 *   suggestion: string,
 *   readOnly?: boolean,
 *   onApply?: (text: string) => void,
 *   onInsertBelow?: (text: string) => void,
 *   onDismiss?: () => void,
 * }} props
 */
export function PlaybookAiAssistPanel({
  suggestion,
  readOnly = false,
  onApply,
  onInsertBelow,
  onDismiss,
}) {
  if (!suggestion?.trim()) return null;

  return (
    <div className="rounded-xl border border-sky-100 bg-sky-50/90 p-3" role="complementary" aria-label="AI Assist suggestion">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-900">
        <Sparkles size={14} aria-hidden />
        AI Assist
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-sky-950">{suggestion}</p>
      {!readOnly ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {onApply ? (
            <button
              type="button"
              onClick={() => onApply(suggestion)}
              className="rounded-lg bg-spike px-2.5 py-1 text-xs font-semibold text-white hover:bg-spike-dark"
            >
              Apply
            </button>
          ) : null}
          {onInsertBelow ? (
            <button
              type="button"
              onClick={() => onInsertBelow(suggestion)}
              className="rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-50"
            >
              Insert below
            </button>
          ) : null}
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:underline"
            >
              Dismiss
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
