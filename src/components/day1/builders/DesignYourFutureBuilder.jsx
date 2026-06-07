import { useState } from 'react';
import { FUTURE_TIMELINE } from '../../../lib/day1BuilderConstants.js';

const QUESTIONS = [
  { key: 'livingLocation', label: 'Where do you want to live?', placeholder: 'City, community, or lifestyle…' },
  { key: 'targetIncome', label: 'What income would you like?', placeholder: 'Target monthly or annual income…' },
  { key: 'impactGoal', label: 'What impact would you like to create?', placeholder: 'Who you serve and how…' },
  { key: 'careerVision', label: 'What career do you envision?', placeholder: 'Your role in 10 years…' },
];

/**
 * @param {{
 *   draft: Record<string, unknown>,
 *   completed: boolean,
 *   onChange: (d: Record<string, unknown>) => void,
 *   onComplete: (d: Record<string, unknown>) => void,
 * }} props
 */
export function DesignYourFutureBuilder({ draft, completed, onChange, onComplete }) {
  const [answers, setAnswers] = useState(() =>
    QUESTIONS.reduce(
      (acc, q) => ({ ...acc, [q.key]: String(draft[q.key] ?? '') }),
      /** @type {Record<string, string>} */ ({}),
    ),
  );

  function update(key, value) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    onChange({ ...draft, ...next });
  }

  const narrative = [
    answers.livingLocation && `Living in ${answers.livingLocation}`,
    answers.targetIncome && `earning ${answers.targetIncome}`,
    answers.careerVision && `as ${answers.careerVision}`,
    answers.impactGoal && `creating impact: ${answers.impactGoal}`,
  ]
    .filter(Boolean)
    .join(', ');

  const canComplete = QUESTIONS.every((q) => answers[q.key].trim().length >= 5);

  return (
    <div className="space-y-6">
      <section className="spike-card">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {FUTURE_TIMELINE.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`rounded-xl px-4 py-3 text-center ${
                  idx === FUTURE_TIMELINE.length - 1
                    ? 'bg-spike text-white shadow-md'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <p className="text-2xs uppercase tracking-wide opacity-80">{step.label}</p>
                {idx === 0 ? (
                  <p className="text-xs font-medium">You are here</p>
                ) : idx === FUTURE_TIMELINE.length - 1 ? (
                  <p className="text-xs font-bold">Your vision</p>
                ) : null}
              </div>
              {idx < FUTURE_TIMELINE.length - 1 ? (
                <span className="text-slate-400">↓</span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {QUESTIONS.map((q) => (
            <label key={q.key} className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">{q.label}</span>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
                value={answers[q.key]}
                placeholder={q.placeholder}
                onChange={(e) => update(q.key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      {narrative ? (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <p className="spike-label text-sky-800">Future Self Narrative</p>
          <p className="mt-2 text-sm leading-relaxed text-sky-950">
            In 10 years, I see myself {narrative}.
          </p>
        </section>
      ) : null}

      {!completed ? (
        <button
          type="button"
          disabled={!canComplete}
          onClick={() => onComplete({ ...draft, ...answers })}
          className="spike-btn-primary disabled:opacity-50"
        >
          Save Future Self to Blueprint
        </button>
      ) : (
        <p className="text-sm font-semibold text-emerald-700">✓ Saved to Vision Section</p>
      )}
    </div>
  );
}
