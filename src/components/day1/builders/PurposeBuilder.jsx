import { useState } from 'react';
import { PURPOSE_PROMPTS } from '../../../lib/day1BuilderConstants.js';

function buildPurposeDraft(answers) {
  const parts = PURPOSE_PROMPTS.map((prompt) => {
    const value = String(answers[prompt.key] ?? '').trim();
    if (!value) return '';
    return `${prompt.label} ${value}`;
  }).filter(Boolean);
  return parts.join(' ');
}

/**
 * @param {{
 *   draft: Record<string, unknown>,
 *   completed: boolean,
 *   onChange: (d: Record<string, unknown>) => void,
 *   onComplete: (d: Record<string, unknown>) => void,
 * }} props
 */
export function PurposeBuilder({ draft, completed, onChange, onComplete }) {
  const [answers, setAnswers] = useState(() =>
    PURPOSE_PROMPTS.reduce(
      (acc, prompt) => ({ ...acc, [prompt.key]: String(draft[prompt.key] ?? '') }),
      /** @type {Record<string, string>} */ ({}),
    ),
  );

  function update(key, value) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    onChange({ ...draft, ...next, purposeStatement: buildPurposeDraft(next) });
  }

  const purposeStatement = buildPurposeDraft(answers);
  const answeredCount = PURPOSE_PROMPTS.filter((p) => answers[p.key].trim().length >= 5).length;
  const canComplete = answeredCount >= 2 && purposeStatement.length >= 30;

  return (
    <div className="space-y-6">
      <section className="spike-card">
        <h4 className="mb-1 text-lg font-semibold text-slate-900">Why does this matter to me?</h4>
        <p className="mb-4 text-sm text-slate-600">
          Answer a few guided prompts — we&apos;ll help you shape your purpose statement.
        </p>
        <div className="space-y-4">
          {PURPOSE_PROMPTS.map((prompt, idx) => (
            <label key={prompt.key} className="block rounded-xl border border-slate-200 p-4">
              <span className="mb-1 block text-sm font-semibold text-slate-800">
                {idx + 1}. {prompt.label}
              </span>
              <textarea
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
                rows={2}
                value={answers[prompt.key]}
                placeholder={prompt.placeholder}
                onChange={(e) => update(prompt.key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      {purposeStatement ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="spike-label text-emerald-800">My Purpose</p>
          <p className="mt-2 text-sm leading-relaxed text-emerald-950">{purposeStatement}</p>
        </section>
      ) : null}

      {!completed ? (
        <button
          type="button"
          disabled={!canComplete}
          onClick={() => onComplete({ ...answers, purposeStatement })}
          className="spike-btn-primary disabled:opacity-50"
        >
          Save My Purpose to Blueprint
        </button>
      ) : (
        <p className="text-sm font-semibold text-emerald-700">✓ Saved to Ambition & Purpose</p>
      )}
    </div>
  );
}
