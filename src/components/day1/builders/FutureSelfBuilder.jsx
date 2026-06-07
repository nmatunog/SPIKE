import { useState } from 'react';

/**
 * @param {{
 *   draft: Record<string, unknown>,
 *   completed: boolean,
 *   onChange: (d: Record<string, unknown>) => void,
 *   onComplete: (d: Record<string, unknown>) => void,
 * }} props
 */
export function FutureSelfBuilder({ draft, completed, onChange, onComplete }) {
  const [narrative, setNarrative] = useState(String(draft.futureSelfNarrative ?? ''));

  function handleChange(value) {
    setNarrative(value);
    onChange({ ...draft, futureSelfNarrative: value });
  }

  const canComplete = narrative.trim().length >= 100;

  return (
    <div className="space-y-6">
      <section className="spike-card">
        <h4 className="mb-1 text-lg font-semibold text-slate-900">My Future Self</h4>
        <p className="mb-4 text-sm text-slate-600">
          If everything goes well, what does your life and career look like in 3 years?
        </p>
        <textarea
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-relaxed focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
          rows={10}
          value={narrative}
          placeholder="In three years, I see myself… Describe your lifestyle, career, impact, and what success looks like."
          onChange={(e) => handleChange(e.target.value)}
        />
        <p className="mt-2 text-xs text-slate-500">
          {narrative.trim().length}/100 characters minimum
        </p>
      </section>

      {narrative.trim().length >= 50 ? (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <p className="spike-label text-sky-800">Future Self Narrative</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-sky-950">{narrative.trim()}</p>
        </section>
      ) : null}

      {!completed ? (
        <button
          type="button"
          disabled={!canComplete}
          onClick={() => onComplete({ futureSelfNarrative: narrative.trim() })}
          className="spike-btn-primary disabled:opacity-50"
        >
          Save Future Self to Blueprint
        </button>
      ) : (
        <p className="text-sm font-semibold text-emerald-700">✓ Saved to Ambition & Purpose</p>
      )}
    </div>
  );
}
