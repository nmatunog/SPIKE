import { BuilderSubmissionFooter } from '../BuilderSubmissionFooter.jsx';
import { RESEARCH_MARKETS } from '../../../lib/day1BuilderConstants.js';

/**
 * @param {{
 *   draft: Record<string, unknown>,
 *   completed: boolean,
 *   editLocked?: boolean,
 *   completedAt?: string | null,
 *   firstCompletedAt?: string | null,
 *   canRefine?: boolean,
 *   onStartRefine?: () => void,
 *   onChange: (d: Record<string, unknown>) => void,
 *   onComplete: (d: Record<string, unknown>) => void,
 * }} props
 */
export function SquadFormationBuilder({
  draft,
  completed,
  editLocked = false,
  completedAt,
  firstCompletedAt,
  canRefine = false,
  onStartRefine,
  onChange,
  onComplete,
}) {
  const selected = /** @type {string[]} */ (draft.marketPreferences ?? []);

  function toggle(marketId) {
    const next = selected.includes(marketId)
      ? selected.filter((id) => id !== marketId)
      : [...selected, marketId];
    onChange({ ...draft, marketPreferences: next });
  }

  return (
    <div className="space-y-6">
      <div className={`space-y-6 ${editLocked ? 'pointer-events-none opacity-75' : ''}`}>
      <section className="spike-card">
        <h4 className="mb-1 text-lg font-semibold text-slate-900">Startup Squad Formation</h4>
        <p className="mb-2 text-sm text-slate-600">
          Select the research markets that interest you. Your program coach will finalize squad assignments.
        </p>
        <p className="mb-6 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
          Think startup formation — you&apos;re choosing where your squad will build market intelligence.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RESEARCH_MARKETS.map((market) => {
            const active = selected.includes(market.id);
            return (
              <button
                key={market.id}
                type="button"
                onClick={() => toggle(market.id)}
                className={`rounded-xl border-2 px-4 py-4 text-left font-semibold transition ${
                  active
                    ? 'border-spike bg-spike text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-spike/40'
                }`}
              >
                {market.label}
              </button>
            );
          })}
        </div>
      </section>

      {selected.length > 0 ? (
        <p className="text-sm text-slate-600">
          Preferences submitted:{' '}
          {selected
            .map((id) => RESEARCH_MARKETS.find((m) => m.id === id)?.label)
            .filter(Boolean)
            .join(', ')}
        </p>
      ) : null}
      </div>

      <BuilderSubmissionFooter
        completed={completed}
        editLocked={editLocked}
        completedAt={completedAt}
        firstCompletedAt={firstCompletedAt}
        canRefine={canRefine}
        onStartRefine={onStartRefine}
        completeDisabled={selected.length < 1}
        completeLabel="Submit Squad Preferences"
        updateLabel="Update Squad Preferences"
        savedLabel="✓ Squad preferences saved"
        onComplete={() => onComplete({ marketPreferences: selected })}
      />
    </div>
  );
}
