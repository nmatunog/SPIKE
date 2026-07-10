import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { RaSpikeProfilePhotoUpload } from '../../components/ra-spike/RaSpikeProfilePhotoUpload.jsx';
import { RaSpikeProgressTimeline } from '../../components/ra-spike/RaSpikeProgressTimeline.jsx';
import { useAuth } from '../../AuthContext.jsx';
import { getRaSpikeContext } from '../../lib/programs/ra-spike-context.js';
import { getProgramForIntern } from '../../lib/programs/index.js';

/**
 * @param {{ user?: { id?: string, name?: string, email?: string, mobile?: string | null, avatarUrl?: string | null, internProgress?: object | null } }} props
 */
export function RaSpikeProfilePage({ user }) {
  const { refreshUser } = useAuth();
  const program = getProgramForIntern(user?.internProgress);
  const ctx = getRaSpikeContext(user?.internProgress);
  const agency = user?.internProgress?.university;
  const homeUnit = user?.internProgress?.home_unit;
  const squad = user?.internProgress?.squad;

  return (
    <RaSpikeShell user={user} showContextBar={false}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-5">
          <header className="space-y-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-slate-900">{user?.name || 'Profile'}</h1>
              <p className="mt-1 text-slate-600">{program.tagline}</p>
            </div>
            {user?.id ? (
              <RaSpikeProfilePhotoUpload
                userId={user.id}
                name={user.name}
                avatarUrl={user.avatarUrl}
                onUpdated={() => void refreshUser?.()}
              />
            ) : null}
          </header>

          <section className="spike-card space-y-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-500">Email</dt>
                <dd className="text-slate-900">{user?.email || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Mobile</dt>
                <dd className="text-slate-900">{user?.mobile || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Home agency</dt>
                <dd className="text-slate-900">{agency || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Home unit</dt>
                <dd className="text-slate-900">{homeUnit || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Squad</dt>
                <dd className="text-slate-900">{squad || '—'}</dd>
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
          </section>
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
