import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import {
  approveOfficialCohort,
  getCohortSuggestionSummary,
  getOfficialCohort,
  getFormationFacultyStats,
} from '../../lib/cohortFormationService.js';
import { ROUTES } from '../../routes/paths.js';

export function AdminCohortsPage() {
  const [refresh, setRefresh] = useState(0);
  void refresh;
  const suggestions = getCohortSuggestionSummary();
  const official = getOfficialCohort();
  const stats = getFormationFacultyStats();
  const [editName, setEditName] = useState('');
  const [editMotto, setEditMotto] = useState('');
  const [editTheme, setEditTheme] = useState('');

  function approveTop(top) {
    approveOfficialCohort({
      name: editName || top.suggested_name,
      motto: editMotto || top.suggested_motto,
      theme_statement: editTheme || top.suggested_theme,
    });
    setRefresh((r) => r + 1);
  }

  return (
    <PageContainer wide>
      <PageTitle subtitle="Review participant suggestions and launch the official cohort identity.">
        Cohort management
      </PageTitle>

      <div className="mb-6 mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Suggestions" value={String(stats.suggestionCount)} />
        <MiniStat label="Squads" value={String(stats.squadCount)} />
        <MiniStat label="Signed charters" value={String(stats.signedCharters)} />
        <MiniStat label="Pending signatures" value={String(stats.pendingSignatures)} />
      </div>

      {official ? (
        <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="spike-label text-emerald-800">Official cohort</p>
          <h3 className="text-xl font-bold text-emerald-950">
            SPIKE Cohort {official.name} {official.year}-{official.batch}
          </h3>
          <p className="mt-1 text-sm text-emerald-900">Motto: {official.motto}</p>
          <p className="text-sm text-emerald-800">Theme: {official.theme_statement}</p>
        </section>
      ) : null}

      <section className="spike-card overflow-x-auto">
        <h3 className="mb-3 text-sm font-semibold">Suggested names, mottos & themes</h3>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b text-2xs uppercase text-slate-500">
              <th className="py-2">Name</th>
              <th className="py-2">Motto</th>
              <th className="py-2">Theme</th>
              <th className="py-2">Votes</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((row) => (
              <tr key={row.suggested_name} className="border-b border-slate-100">
                <td className="py-3 font-medium">{row.suggested_name}</td>
                <td className="py-3">{row.suggested_motto}</td>
                <td className="py-3">{row.suggested_theme}</td>
                <td className="py-3">{row.votes}</td>
                <td className="py-3">
                  {!official ? (
                    <button
                      type="button"
                      onClick={() => approveTop(row)}
                      className="rounded-lg bg-spike px-3 py-1 text-xs font-bold text-white"
                    >
                      Approve
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Approved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {!official ? (
        <section className="mt-6 spike-card space-y-3">
          <h3 className="text-sm font-semibold">Custom approval</h3>
          <input placeholder="Cohort name" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="Motto" value={editMotto} onChange={(e) => setEditMotto(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="Theme statement" value={editTheme} onChange={(e) => setEditTheme(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" />
          <button
            type="button"
            onClick={() => {
              approveOfficialCohort({ name: editName, motto: editMotto, theme_statement: editTheme });
              setRefresh((r) => r + 1);
            }}
            className="spike-btn-primary"
          >
            Create official cohort
          </button>
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={ROUTES.adminSquadThemes} className="spike-btn-secondary">
          Squad themes
        </Link>
        <Link to={ROUTES.adminSquads} className="spike-btn-secondary">
          Assign squads
        </Link>
        <Link to={ROUTES.admin} className="text-sm font-semibold text-spike hover:underline">
          ← Admin home
        </Link>
      </div>
    </PageContainer>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="spike-card text-center">
      <p className="spike-label">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
