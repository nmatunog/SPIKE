import { Sparkles } from 'lucide-react';

/**
 * Suggestive AI Assist panel for FEC intro wizard fields.
 * @param {{
 *   suggestion: string,
 *   readOnly?: boolean,
 *   onUse?: (text: string) => void,
 * }} props
 */
export function FecWizardAiAssist({ suggestion, readOnly = false, onUse }) {
  if (!suggestion.trim()) return null;

  return (
    <div className="mb-3 rounded-xl border border-sky-100 bg-sky-50/80 p-3">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-900">
        <Sparkles size={14} aria-hidden />
        AI Assist
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-sky-950">{suggestion}</p>
      {!readOnly && onUse ? (
        <button
          type="button"
          onClick={() => onUse(suggestion)}
          className="mt-2 text-xs font-semibold text-spike hover:underline"
        >
          Use suggestion in editor
        </button>
      ) : null}
    </div>
  );
}
