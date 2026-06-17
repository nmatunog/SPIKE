/**
 * Tap-to-append keyword suggestions for venture design fields.
 * @param {{ keywords: string[], onSelect: (keyword: string) => void, disabled?: boolean }} props
 */
export function VentureDesignKeywordChips({ keywords, onSelect, disabled = false }) {
  if (!keywords.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <span className="w-full text-2xs font-bold uppercase tracking-widest text-stone-400">
        Suggested keywords
      </span>
      {keywords.map((word) => (
        <button
          key={word}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(word)}
          className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 transition hover:border-spike/40 hover:bg-spike-muted/30 hover:text-spike disabled:opacity-50"
        >
          + {word}
        </button>
      ))}
    </div>
  );
}
