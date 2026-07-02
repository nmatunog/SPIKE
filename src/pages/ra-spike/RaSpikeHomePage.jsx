import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { getRaSpikeContext } from '../../lib/programs/ra-spike-context.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ user?: { name?: string, internProgress?: object | null } }} props
 */
export function RaSpikeHomePage({ user }) {
  const ctx = getRaSpikeContext(user?.internProgress);
  const firstName = (user?.name || 'Participant').split(' ')[0];

  return (
    <RaSpikeShell user={user}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-5">
          <header>
            <p className="text-sm font-medium text-slate-500">Welcome back, {firstName}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {ctx.weekTheme}
            </h1>
            <p className="mt-2 text-slate-600">{ctx.program.theme}</p>
          </header>

          <section className="spike-card space-y-4 border-spike/20 ring-1 ring-spike/10">
            <div>
              <p className="spike-label text-spike">Current lesson</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{ctx.weekSubtitle}</p>
              <p className="mt-2 text-sm text-slate-600">
                Open Playbook to work through Learn, Workshop, Assignment, Reflection, and Submit for this week.
              </p>
            </div>
            <Link
              to={ROUTES.raSpikePlaybook}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-spike px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-spike-dark sm:w-auto"
            >
              Continue
              <ArrowRight size={18} aria-hidden />
            </Link>
          </section>

          <section className="spike-card space-y-2">
            <p className="text-sm font-semibold text-slate-900">This week</p>
            <p className="text-sm text-slate-600">
              Segment <strong>{ctx.segmentLabel}</strong> · Week <strong>{ctx.week}</strong> of{' '}
              {ctx.totalWeeks}
            </p>
            {ctx.stageGate ? (
              <p className="text-sm text-amber-800">
                Milestone week: <strong>{ctx.stageGate.title}</strong>
              </p>
            ) : null}
          </section>

          <section className="spike-card space-y-2">
            <p className="text-sm font-semibold text-slate-900">Squad</p>
            <p className="text-sm text-slate-600">
              Squad activity and weekly objectives appear on the{' '}
              <Link to={ROUTES.raSpikeSquad} className="font-semibold text-spike hover:underline">
                Squad
              </Link>{' '}
              tab.
            </p>
          </section>
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
