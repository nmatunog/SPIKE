import { useState } from 'react';
import { MOTIVATION_CARDS } from '../../../lib/day1BuilderConstants.js';

/**
 * @param {{
 *   draft: Record<string, unknown>,
 *   completed: boolean,
 *   onChange: (d: Record<string, unknown>) => void,
 *   onComplete: (d: Record<string, unknown>) => void,
 * }} props
 */
export function DiscoverYourWhyBuilder({ draft, completed, onChange, onComplete }) {
  const selected = /** @type {string[]} */ (draft.motivationCards ?? []);
  const [joinReason, setJoinReason] = useState(String(draft.joinReason ?? ''));

  function toggleCard(id) {
    let next = selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id];
    if (next.length > 3) next = next.slice(-3);
    onChange({ ...draft, motivationCards: next, joinReason });
  }

  function handleJoinReason(value) {
    setJoinReason(value);
    onChange({ ...draft, motivationCards: selected, joinReason: value });
  }

  const labels = selected
    .map((id) => MOTIVATION_CARDS.find((c) => c.id === id)?.label)
    .filter(Boolean);
  const preview = [
    labels.length ? `I am motivated by ${labels.join(', ')}.` : '',
    joinReason.trim() ? `I joined SPIKE because ${joinReason.trim()}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const canComplete = selected.length >= 1 && joinReason.trim().length >= 10;

  return (
    <div className="space-y-6">
      <section className="spike-card">
        <h4 className="mb-1 text-lg font-semibold text-slate-900">What motivates you most?</h4>
        <p className="mb-4 text-sm text-slate-600">Select up to 3 cards that resonate with you.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MOTIVATION_CARDS.map((card) => {
            const active = selected.includes(card.id);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => toggleCard(card.id)}
                className={`rounded-2xl border-2 p-4 text-left transition hover:shadow-md ${
                  active
                    ? 'border-spike bg-spike-muted shadow-card ring-2 ring-spike/20'
                    : 'border-slate-200 bg-white hover:border-spike/40'
                }`}
              >
                <span className="text-2xl">{card.emoji}</span>
                <p className="mt-2 text-sm font-semibold text-slate-900">{card.label}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="spike-card">
        <h4 className="mb-1 text-lg font-semibold text-slate-900">Why did you join SPIKE?</h4>
        <p className="mb-3 text-sm text-slate-600">Share your story in a few sentences.</p>
        <textarea
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
          rows={4}
          value={joinReason}
          placeholder="I chose SPIKE because…"
          onChange={(e) => handleJoinReason(e.target.value)}
        />
      </section>

      {preview ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="spike-label text-emerald-800">Personal Why Statement</p>
          <p className="mt-2 text-sm leading-relaxed text-emerald-950">{preview}</p>
        </section>
      ) : null}

      {!completed ? (
        <button
          type="button"
          disabled={!canComplete}
          onClick={() => onComplete({ motivationCards: selected, joinReason })}
          className="spike-btn-primary disabled:opacity-50"
        >
          Save to Venture Blueprint
        </button>
      ) : (
        <p className="text-sm font-semibold text-emerald-700">✓ Saved to Vision & Purpose</p>
      )}
    </div>
  );
}
