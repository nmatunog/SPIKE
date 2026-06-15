import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import { staffLoadDashboard } from '../../lib/cohortOnboardingService.js';
import { db } from '../../lib/cohortOnboardingService.js';
import { isSupabaseConfigured } from '../../supabaseClient.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * Live squad dashboard — reads formation squads and intern inputs from Supabase.
 * @param {{ interns: Array<{ id: string, name: string }> }} props
 */
export function AdminSquadsPage({ interns }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const dash = await staffLoadDashboard();
      setData(dash);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load squads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isSupabaseConfigured || !data?.cohort?.id) return undefined;
    const channel = db.subscribeToCohortOnboarding(data.cohort.id, () => {
      refresh();
    });
    return () => db.unsubscribeChannel(channel);
  }, [data?.cohort?.id, refresh]);

  function handleRefresh() {
    setRefreshing(true);
    refresh();
  }

  if (!isSupabaseConfigured) {
    return (
      <PageContainer wide>
        <PageTitle subtitle="Squad formation requires Supabase.">
          Squad dashboard
        </PageTitle>
        <p className="mt-4 text-sm text-amber-900">
          Connect Supabase to view intern squad inputs.
        </p>
        <Link to={ROUTES.adminCohorts} className="mt-6 inline-flex text-sm font-semibold text-spike hover:underline">
          ← Cohort admin
        </Link>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer wide>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="animate-spin" size={16} /> Loading squads…
        </div>
      </PageContainer>
    );
  }

  if (!data?.cohort) {
    return (
      <PageContainer wide>
        <PageTitle subtitle="No founding cohort yet.">
          Squad dashboard
        </PageTitle>
        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : (
          <p className="mt-4 text-sm text-amber-900">
            Set up the founding cohort first, then assign squads from cohort admin.
          </p>
        )}
        <Link to={ROUTES.adminCohorts} className="mt-6 inline-flex spike-btn-primary">
          Open cohort admin
        </Link>
      </PageContainer>
    );
  }

  const { cohort, suggestions, squads } = data;
  const suggestionByIntern = new Map(suggestions.map((s) => [s.participant_id, s]));
  const internSquadMap = new Map();
  for (const squad of squads) {
    for (const member of squad.formation_squad_members ?? []) {
      internSquadMap.set(member.participant_id, { squad, role: member.role });
    }
  }

  const phase = cohort.onboarding_phase?.replace(/_/g, ' ') ?? '—';

  return (
    <PageContainer wide>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle subtitle="Live view of squad assignments and intern inputs (name, motto, photo).">
          Squad dashboard
        </PageTitle>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Cohort phase: <strong>{phase}</strong>
        {cohort.official_name ? ` · ${cohort.official_name}` : ''}
      </p>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <section className="mt-6 spike-card overflow-x-auto">
        <h3 className="mb-3 text-sm font-semibold">Participant squad progress</h3>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b text-2xs uppercase text-slate-500">
              <th className="py-2 text-left">Participant</th>
              <th className="py-2 text-left">Cohort suggestion</th>
              <th className="py-2 text-left">Squad name</th>
              <th className="py-2 text-left">Motto</th>
              <th className="py-2 text-left">Role</th>
              <th className="py-2 text-left">Registered</th>
              <th className="py-2 text-left">Photo</th>
            </tr>
          </thead>
          <tbody>
            {interns.map((intern) => {
              const suggestion = suggestionByIntern.get(intern.id);
              const entry = internSquadMap.get(intern.id);
              const squad = entry?.squad;
              return (
                <tr key={intern.id} className="border-b border-slate-100">
                  <td className="py-2 font-medium">{intern.name}</td>
                  <td className="py-2">{suggestion?.suggested_name ?? '—'}</td>
                  <td className="py-2">{squad?.name?.trim() ? squad.name : '—'}</td>
                  <td className="max-w-[200px] truncate py-2">{squad?.motto?.trim() ? squad.motto : '—'}</td>
                  <td className="py-2">{entry?.role ?? '—'}</td>
                  <td className="py-2">{squad?.registered_at ? '✓' : '—'}</td>
                  <td className="py-2">{squad?.photo_url ? '✓' : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="mt-6 spike-card">
        <h3 className="mb-3 text-sm font-semibold">Active squads ({squads.length})</h3>
        {squads.length ? (
          <ul className="space-y-4 text-sm">
            {squads.map((s) => {
              const members = s.formation_squad_members ?? [];
              return (
                <li key={s.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start gap-4">
                    {s.photo_url ? (
                      <img
                        src={s.photo_url}
                        alt=""
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-xs text-slate-500">
                        No photo
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-slate-900">{s.name?.trim() || 'Unnamed squad'}</p>
                      {s.motto?.trim() ? (
                        <p className="mt-1 italic text-slate-600">{s.motto}</p>
                      ) : (
                        <p className="mt-1 text-slate-400">Motto not set yet</p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        {members.length}/3 members
                        {s.registered_at ? ' · Registered' : ' · Not registered'}
                        {s.onboarding_complete ? ' · Onboarding complete' : ''}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {members.map((m) => (
                          <li key={m.participant_id} className="text-slate-700">
                            {interns.find((i) => i.id === m.participant_id)?.name ?? m.participant_id.slice(0, 8)}
                            <span className="ml-1 text-xs text-slate-500">({m.role})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">
            No squads assigned yet. Create squads from cohort admin.
          </p>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={ROUTES.adminCohorts} className="spike-btn-primary">
          Assign / manage squads
        </Link>
        <Link to={ROUTES.adminCohorts} className="text-sm font-semibold text-spike hover:underline">
          ← Cohort admin
        </Link>
      </div>
    </PageContainer>
  );
}
