import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { Users } from 'lucide-react';

/**
 * @param {{ user?: { name?: string, internProgress?: object | null } }} props
 */
export function RaSpikeSquadPage({ user }) {
  const squadName = user?.internProgress?.squad?.trim();

  return (
    <RaSpikeShell user={user}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-5">
          <header>
            <h1 className="text-2xl font-bold text-slate-900">Squad</h1>
            <p className="mt-1 text-slate-600">Your cohort team for workshops and squad objectives.</p>
          </header>

          <section className="spike-card text-center">
            <Users className="mx-auto text-spike" size={40} aria-hidden />
            {squadName ? (
              <>
                <h2 className="mt-3 text-xl font-bold text-slate-900">{squadName}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Member roster, weekly objectives, and leaderboard arrive in Phase 6.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-3 text-xl font-bold text-slate-900">Squad forming</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Your squad will appear here after enrollment. Full squad experience arrives in Phase 6.
                </p>
              </>
            )}
          </section>
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
