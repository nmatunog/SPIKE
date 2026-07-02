import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { getProgramForIntern } from '../../lib/programs/index.js';

/**
 * @param {{ user?: { name?: string, email?: string, internProgress?: object | null } }} props
 */
export function RaSpikeProfilePage({ user }) {
  const program = getProgramForIntern(user?.internProgress);

  return (
    <PageContainer>
      <section className="spike-card mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
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
        </dl>
        <p className="text-sm text-slate-500">Full profile editing arrives in Phase 2 onboarding.</p>
      </section>
    </PageContainer>
  );
}
