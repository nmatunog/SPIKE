import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { VALUE_OPTIONS } from '../../../lib/day1BuilderConstants.js';

function valueLabel(id) {
  if (id.startsWith('custom:')) return id.slice(7);
  return VALUE_OPTIONS.find((v) => v.id === id)?.label ?? id;
}

/**
 * @param {{
 *   draft: Record<string, unknown>,
 *   completed: boolean,
 *   onChange: (d: Record<string, unknown>) => void,
 *   onComplete: (d: Record<string, unknown>) => void,
 * }} props
 */
export function ValuesBuilder({ draft, completed, onChange, onComplete }) {
  const [step, setStep] = useState(Number(draft.step ?? 1));
  const [selected, setSelected] = useState(/** @type {string[]} */ (draft.selectedValues ?? []));
  const [topFive, setTopFive] = useState(/** @type {string[]} */ (draft.topFive ?? []));
  const [customValue, setCustomValue] = useState('');

  function emit(nextSelected, nextTopFive, nextStep = step) {
    onChange({
      ...draft,
      step: nextStep,
      selectedValues: nextSelected,
      topFive: nextTopFive,
    });
  }

  function toggleValue(id) {
    setSelected((prev) => {
      let next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
      if (next.length > 10) next = next.slice(-10);
      emit(next, topFive);
      return next;
    });
  }

  function addCustomValue() {
    const label = customValue.trim();
    if (!label) return;
    const id = `custom:${label}`;
    setSelected((prev) => {
      if (prev.includes(id)) return prev;
      let next = [...prev, id];
      if (next.length > 10) next = next.slice(-10);
      emit(next, topFive);
      return next;
    });
    setCustomValue('');
  }

  function toggleTopFive(id) {
    setTopFive((prev) => {
      let next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
      if (next.length > 5) next = next.slice(-5);
      emit(selected, next);
      return next;
    });
  }

  function moveRank(idx, direction) {
    setTopFive((prev) => {
      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      emit(selected, next);
      return next;
    });
  }

  const canAdvanceToRank = selected.length >= 5;
  const canAdvanceToProfile = topFive.length === 5;
  const canComplete = topFive.length === 5;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 rounded-xl px-3 py-2 text-center text-xs font-bold ${
              step === s ? 'bg-spike text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {s === 1 ? 'Select up to 10' : s === 2 ? 'Pick Top 5' : 'Rank Top 5'}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <section className="spike-card space-y-4">
          <h4 className="text-lg font-semibold text-slate-900">What principles will guide me?</h4>
          <p className="text-sm text-slate-600">Select the values that resonate most (up to 10).</p>
          <div className="flex flex-wrap gap-2">
            {VALUE_OPTIONS.map((value) => {
              const active = selected.includes(value.id);
              return (
                <button
                  key={value.id}
                  type="button"
                  onClick={() => toggleValue(value.id)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'border-spike bg-spike-muted text-spike'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-spike/40'
                  }`}
                >
                  {value.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Add a custom value…"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomValue()}
            />
            <button type="button" onClick={addCustomValue} className="spike-btn-secondary">
              <Plus size={16} />
            </button>
          </div>
          {selected.filter((id) => id.startsWith('custom:')).map((id) => (
            <span
              key={id}
              className="mr-2 inline-flex items-center gap-1 rounded-full bg-spike-muted px-3 py-1 text-xs font-semibold text-spike"
            >
              {valueLabel(id)}
              <button type="button" onClick={() => toggleValue(id)} aria-label="Remove">
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            disabled={!canAdvanceToRank}
            onClick={() => {
              setStep(2);
              emit(selected, topFive, 2);
            }}
            className="spike-btn-primary disabled:opacity-50"
          >
            Continue — narrow to Top 5 ({selected.length}/10)
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="spike-card space-y-4">
          <h4 className="text-lg font-semibold text-slate-900">Choose your Top 5 values</h4>
          <p className="text-sm text-slate-600">Select exactly 5 values that matter most.</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((id) => {
              const active = topFive.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleTopFive(id)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'border-spike bg-spike text-white'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {valueLabel(id)}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                emit(selected, topFive, 1);
              }}
              className="spike-btn-secondary"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!canAdvanceToProfile}
              onClick={() => {
                setStep(3);
                emit(selected, topFive, 3);
              }}
              className="spike-btn-primary disabled:opacity-50"
            >
              Rank Top 5 ({topFive.length}/5)
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="spike-card space-y-4">
          <h4 className="text-lg font-semibold text-slate-900">Rank your Top 5 values</h4>
          <p className="text-sm text-slate-600">#1 is your most important guiding principle.</p>
          <ol className="space-y-2">
            {topFive.map((id, idx) => (
              <li
                key={id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <span className="text-sm font-semibold text-slate-900">
                  #{idx + 1} {valueLabel(id)}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveRank(idx, 'up')}
                    className="rounded-lg p-1 hover:bg-slate-100 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === topFive.length - 1}
                    onClick={() => moveRank(idx, 'down')}
                    className="rounded-lg p-1 hover:bg-slate-100 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <p className="spike-label text-violet-800">My Values Profile</p>
            <ul className="mt-2 space-y-1 text-sm text-violet-950">
              {topFive.map((id, idx) => (
                <li key={id}>
                  {idx + 1}. {valueLabel(id)}
                </li>
              ))}
            </ul>
          </section>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep(2);
                emit(selected, topFive, 2);
              }}
              className="spike-btn-secondary"
            >
              Back
            </button>
            {!completed ? (
              <button
                type="button"
                disabled={!canComplete}
                onClick={() =>
                  onComplete({
                    selectedValues: selected,
                    topFive,
                    step: 3,
                    valuesProfile: topFive.map((id, idx) => `${idx + 1}. ${valueLabel(id)}`).join('\n'),
                  })
                }
                className="spike-btn-primary disabled:opacity-50"
              >
                Save My Values to Blueprint
              </button>
            ) : (
              <p className="self-center text-sm font-semibold text-emerald-700">✓ Saved to Ambition & Purpose</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
