import { VENTURE_PATH_CARDS } from '../../../lib/day1BuilderConstants.js';

/**
 * @param {{
 *   draft: Record<string, unknown>,
 *   completed: boolean,
 *   onChange: (d: Record<string, unknown>) => void,
 *   onComplete: (d: Record<string, unknown>) => void,
 * }} props
 */
export function FutureVentureSnapshotBuilder({ draft, completed, onChange, onComplete }) {
  const selected = String(draft.pathPreference ?? '');

  function select(path) {
    onChange({ ...draft, pathPreference: path });
  }

  return (
    <div className="space-y-6">
      <section className="spike-card">
        <h4 className="mb-1 text-lg font-semibold text-slate-900">
          Which path interests you today?
        </h4>
        <p className="mb-6 text-sm text-slate-600">
          No commitment yet — just share your preference. You&apos;ll formally choose your ACS track
          after Week 1.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {VENTURE_PATH_CARDS.map((card) => {
            const active = selected === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => select(card.id)}
                className={`rounded-2xl border-2 p-6 text-left transition hover:shadow-lg ${
                  active
                    ? 'border-spike bg-spike-muted ring-2 ring-spike/20'
                    : 'border-slate-200 bg-white hover:border-spike/30'
                }`}
              >
                <p className="text-lg font-bold text-slate-900">{card.label}</p>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {selected ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="spike-label text-amber-800">Career Track Explorer</p>
          <p className="mt-2 text-sm text-amber-950">
            Today you&apos;re exploring the{' '}
            <strong>{VENTURE_PATH_CARDS.find((c) => c.id === selected)?.label}</strong> path. This
            feeds your Venture Blueprint career interest — not your final track selection.
          </p>
        </section>
      ) : null}

      {!completed ? (
        <button
          type="button"
          disabled={!selected}
          onClick={() => onComplete({ pathPreference: selected })}
          className="spike-btn-primary disabled:opacity-50"
        >
          Save Career Interest
        </button>
      ) : (
        <p className="text-sm font-semibold text-emerald-700">✓ Saved to Career Track Explorer</p>
      )}
    </div>
  );
}
