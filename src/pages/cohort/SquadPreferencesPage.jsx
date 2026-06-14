import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import {
  getActiveTheme,
  getSquadPreferences,
  saveSquadPreferences,
} from '../../lib/cohortFormationService.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ participantId: string }} props
 */
export function SquadPreferencesPage({ participantId }) {
  const theme = getActiveTheme();
  const existing = getSquadPreferences(participantId);
  const [first, setFirst] = useState(existing?.rankings?.[0] ?? '');
  const [second, setSecond] = useState(existing?.rankings?.[1] ?? '');
  const [third, setThird] = useState(existing?.rankings?.[2] ?? '');
  const [saved, setSaved] = useState(Boolean(existing));

  function pick(rank, itemId) {
    if (rank === 1) setFirst(itemId);
    if (rank === 2) setSecond(itemId);
    if (rank === 3) setThird(itemId);
  }

  function handleSave() {
    saveSquadPreferences(participantId, [first, second, third].filter(Boolean));
    setSaved(true);
  }

  const selected = new Set([first, second, third].filter(Boolean));

  return (
    <PageContainer wide>
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <p className="spike-label text-spike">Squad Formation</p>
          <h1 className="text-2xl font-bold text-slate-900">Rank your squad preferences</h1>
          <p className="mt-2 text-sm text-slate-600">
            Theme: <strong>{theme.name}</strong> — your program coach will finalize assignments from your
            rankings.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {theme.items.map((item) => {
            const rank =
              first === item.id ? 1 : second === item.id ? 2 : third === item.id ? 3 : 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (rank === 1) setFirst('');
                  else if (rank === 2) setSecond('');
                  else if (rank === 3) setThird('');
                  else if (!first) pick(1, item.id);
                  else if (!second) pick(2, item.id);
                  else if (!third) pick(3, item.id);
                }}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  rank
                    ? 'border-spike bg-spike-muted ring-2 ring-spike/20'
                    : 'border-slate-200 bg-white hover:border-spike/40'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <p className="mt-2 font-bold text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-600">{item.description}</p>
                {rank ? (
                  <span className="mt-2 inline-block rounded-full bg-spike px-2 py-0.5 text-2xs font-bold text-white">
                    {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} choice
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="spike-card">
          <p className="spike-label">Your rankings</p>
          <ol className="mt-2 space-y-1 text-sm text-slate-700">
            <li>1st: {theme.items.find((i) => i.id === first)?.name ?? '—'}</li>
            <li>2nd: {theme.items.find((i) => i.id === second)?.name ?? '—'}</li>
            <li>3rd: {theme.items.find((i) => i.id === third)?.name ?? '—'}</li>
          </ol>
          {!saved ? (
            <button
              type="button"
              disabled={selected.size < 1}
              onClick={handleSave}
              className="mt-4 spike-btn-primary disabled:opacity-50"
            >
              Submit preferences
            </button>
          ) : (
            <p className="mt-4 text-sm font-semibold text-emerald-700">✓ Preferences saved</p>
          )}
          {saved ? (
            <Link to={ROUTES.squad} className="mt-3 inline-flex spike-btn-secondary">
              View squad dashboard
            </Link>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
