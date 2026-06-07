import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import {
  createSquad,
  getActiveTheme,
  getThemeItem,
  listAllPreferences,
  listAllSquads,
  RESEARCH_MARKETS,
} from '../../lib/cohortFormationService.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ interns: Array<{ id: string, name: string }> }} props
 */
export function AdminSquadsPage({ interns }) {
  const theme = getActiveTheme();
  const preferences = listAllPreferences();
  const squads = listAllSquads();
  const [selectedIntern, setSelectedIntern] = useState('');
  const [themeItemId, setThemeItemId] = useState(theme.items[0]?.id ?? '');
  const [market, setMarket] = useState(RESEARCH_MARKETS[0].id);
  const [squadName, setSquadName] = useState('');
  const [, setRefresh] = useState(0);

  const assigned = new Set(squads.flatMap((s) => s.members?.map((m) => m.participantId) ?? []));
  const unassigned = interns.filter((i) => !assigned.has(i.id));

  function handleCreateSquad() {
    if (!selectedIntern) return;
    const item = getThemeItem(themeItemId);
    createSquad({
      name: squadName || (item ? `Squad ${item.name}` : 'New Squad'),
      themeItemId,
      researchMarket: market,
      memberIds: [selectedIntern],
    });
    setSelectedIntern('');
    setSquadName('');
    setRefresh((r) => r + 1);
  }

  return (
    <PageContainer wide>
      <PageTitle subtitle="Assign participants to venture squads and research markets.">
        Squad assignment
      </PageTitle>

      <section className="mt-6 spike-card">
        <h3 className="mb-3 text-sm font-semibold">Create / assign squad</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={selectedIntern}
            onChange={(e) => setSelectedIntern(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option value="">Select participant…</option>
            {unassigned.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
          <select
            value={themeItemId}
            onChange={(e) => setThemeItemId(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            {theme.items.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            {RESEARCH_MARKETS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <input
            placeholder="Squad name (optional)"
            value={squadName}
            onChange={(e) => setSquadName(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm"
          />
        </div>
        <button type="button" onClick={handleCreateSquad} className="mt-3 spike-btn-primary">
          Assign to squad
        </button>
      </section>

      <section className="mt-6 spike-card overflow-x-auto">
        <h3 className="mb-3 text-sm font-semibold">Participant preferences</h3>
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b text-2xs uppercase text-slate-500">
              <th className="py-2 text-left">Participant</th>
              <th className="py-2 text-left">1st</th>
              <th className="py-2 text-left">2nd</th>
              <th className="py-2 text-left">3rd</th>
              <th className="py-2 text-left">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {interns.map((intern) => {
              const pref = preferences[intern.id];
              const squad = squads.find((s) => s.members?.some((m) => m.participantId === intern.id));
              return (
                <tr key={intern.id} className="border-b border-slate-100">
                  <td className="py-2 font-medium">{intern.name}</td>
                  <td className="py-2">{getThemeItem(pref?.rankings?.[0])?.name ?? '—'}</td>
                  <td className="py-2">{getThemeItem(pref?.rankings?.[1])?.name ?? '—'}</td>
                  <td className="py-2">{getThemeItem(pref?.rankings?.[2])?.name ?? '—'}</td>
                  <td className="py-2">{squad?.name ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="mt-6 spike-card">
        <h3 className="mb-3 text-sm font-semibold">Active squads ({squads.length})</h3>
        <ul className="space-y-2 text-sm">
          {squads.map((s) => (
            <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2">
              <strong>{s.name}</strong> · {RESEARCH_MARKETS.find((m) => m.id === s.researchMarket)?.label}
              <span className="text-slate-500"> · {s.members?.length ?? 0} members</span>
            </li>
          ))}
        </ul>
      </section>

      <Link to={ROUTES.adminCohorts} className="mt-6 inline-flex text-sm font-semibold text-spike hover:underline">
        ← Cohort admin
      </Link>
    </PageContainer>
  );
}
