import { CoachMessage } from './CoachMessage.jsx';

/**
 * @param {{
 *   statementType: 'ambition' | 'impact' | 'purpose' | 'tagline',
 *   fields: Array<{ id: string, label: string, placeholder: string, hint?: string }>,
 *   values: Record<string, string>,
 *   onChange: (id: string, value: string) => void,
 *   onRegenerate: () => void,
 *   regenerating?: boolean,
 *   contextChips?: string[],
 * }} props
 */
export function CoachCustomizeChat({
  statementType,
  fields,
  values,
  onChange,
  onRegenerate,
  regenerating = false,
  contextChips = [],
}) {
  const intro =
    statementType === 'ambition'
      ? 'Your motivator cards are locked in below. Optionally tweak the three parts — leave a field blank to keep the suggestion from your picks.'
      : statementType === 'tagline'
        ? 'Optionally replace any beat below. Leave blank to keep the current draft wording.'
        : 'Your audience picks are locked in below. Optionally describe who you help and the difference you make — blanks use your card choices.';

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <CoachMessage>
        <p>{intro}</p>
        {contextChips.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {contextChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-spike/20 bg-spike-muted/60 px-3 py-1 text-xs font-semibold text-spike"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </CoachMessage>

      <div className="space-y-3">
        {fields.map((field) => (
          <label key={field.id} className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{field.label}</span>
            <input
              type="text"
              value={values[field.id] ?? ''}
              placeholder={field.placeholder}
              onChange={(e) => onChange(field.id, e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
            />
            {field.hint ? <p className="mt-1 text-2xs text-slate-500">{field.hint}</p> : null}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <p className="text-xs text-slate-500">
          Regenerate rebuilds your draft from your card picks plus anything you typed above.
        </p>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-2 rounded-xl bg-spike px-4 py-2 text-sm font-semibold text-white transition hover:bg-spike-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {regenerating ? 'Regenerating…' : 'Regenerate statement'}
        </button>
      </div>
    </div>
  );
}
