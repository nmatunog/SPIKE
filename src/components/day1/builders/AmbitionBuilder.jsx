import { useState } from 'react';
import {
  AMBITION_CARDS,
  AMBITION_EXAMPLES,
} from '../../../lib/day1BuilderConstants.js';
import { composeAmbitionFromCards } from '../../../lib/ventureCoachEngine.js';

function buildAmbitionDraft(selectedIds, pathPreference) {
  return composeAmbitionFromCards(selectedIds, AMBITION_CARDS, pathPreference);
}

/**
 * @param {{
 *   draft: Record<string, unknown>,
 *   completed: boolean,
 *   onChange: (d: Record<string, unknown>) => void,
 *   onComplete: (d: Record<string, unknown>) => void,
 * }} props
 */
export function AmbitionBuilder({ draft, completed, onChange, onComplete }) {
  const selected = /** @type {string[]} */ (draft.selectedAmbitions ?? []);
  const [statement, setStatement] = useState(
    String(draft.ambitionStatement ?? buildAmbitionDraft(selected, draft.pathPreference)),
  );
  const [draftGenerated, setDraftGenerated] = useState(Boolean(draft.ambitionStatement));

  function toggleCard(id) {
    const next = selected.includes(id)
      ? selected.filter((c) => c !== id)
      : [...selected, id];
    onChange({ ...draft, selectedAmbitions: next, ambitionStatement: statement });
  }

  function generateDraft() {
    const next = buildAmbitionDraft(selected, draft.pathPreference);
    setStatement(next);
    setDraftGenerated(true);
    onChange({ ...draft, selectedAmbitions: selected, ambitionStatement: next });
  }

  function handleStatement(value) {
    setStatement(value);
    onChange({ ...draft, selectedAmbitions: selected, ambitionStatement: value });
  }

  const canComplete = selected.length >= 1 && statement.trim().length >= 20;

  return (
    <div className="space-y-6">
      <section className="spike-card">
        <h4 className="mb-1 text-lg font-semibold text-slate-900">What future am I trying to create?</h4>
        <p className="mb-4 text-sm text-slate-600">Which ambitions excite you most? Select all that resonate.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {AMBITION_CARDS.map((card) => {
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

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="spike-label text-slate-600">Inspiration</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {AMBITION_EXAMPLES.map((example) => (
            <li key={example}>• {example}</li>
          ))}
        </ul>
      </section>

      {selected.length > 0 ? (
        <section className="spike-card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-lg font-semibold text-slate-900">My Ambition</h4>
            {!draftGenerated ? (
              <button type="button" onClick={generateDraft} className="spike-btn-secondary text-sm">
                Generate draft
              </button>
            ) : null}
          </div>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
            rows={5}
            value={statement}
            placeholder="Describe the future you are building…"
            onChange={(e) => handleStatement(e.target.value)}
          />
          <p className="text-xs text-slate-500">Edit your ambition statement before saving.</p>
        </section>
      ) : null}

      {!completed ? (
        <button
          type="button"
          disabled={!canComplete}
          onClick={() =>
            onComplete({ selectedAmbitions: selected, ambitionStatement: statement.trim() })
          }
          className="spike-btn-primary disabled:opacity-50"
        >
          Save My Ambition to Blueprint
        </button>
      ) : (
        <p className="text-sm font-semibold text-emerald-700">✓ Saved to Ambition & Purpose</p>
      )}
    </div>
  );
}
