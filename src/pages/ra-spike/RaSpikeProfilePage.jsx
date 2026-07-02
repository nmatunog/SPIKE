import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { RaSpikeProgressTimeline } from '../../components/ra-spike/RaSpikeProgressTimeline.jsx';
import { getRaSpikeContext } from '../../lib/programs/ra-spike-context.js';
import { getProgramForIntern } from '../../lib/programs/index.js';

/**
 * @param {{ user?: { name?: string, email?: string, internProgress?: object | null } }} props
 */
export function RaSpikeProfilePage({ user }) {
  const program = getProgramForIntern(user?.internProgress);
  const ctx = getRaSpikeContext(user?.internProgress);

  return (
    <RaSpikeShell user={user} showContextBar={false}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-5">
          <header>
            <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
            <p className="mt-1 text-slate-600">{program.tagline}</p>
          </header>

          <section className="spike-card space-y-4">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="font-medium text-slate-500">Name</dt>
                <dd className="text-slate-900">{user?.name || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Email</dt>
                <dd className="text-slate-900">{user?.email || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Program</dt>
                <dd className="text-slate-900">{program.title}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Current segment</dt>
                <dd className="text-slate-900">{ctx.segmentLabel}</dd>
              </div>
            </dl>
          </section>

          <section className="spike-card space-y-3">
            <p className="text-sm font-semibold text-slate-900">Your progress</p>
            <RaSpikeProgressTimeline currentWeek={ctx.week} />
            <p className="text-xs text-slate-500">Profile photo and agency details arrive in Phase 2 onboarding.</p>
          </section>
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
