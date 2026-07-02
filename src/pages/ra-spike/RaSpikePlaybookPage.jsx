import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { getRaSpikeContext } from '../../lib/programs/ra-spike-context.js';

const WEEKLY_STEPS = [
  { id: 'learn', label: 'Learn', description: 'Read and reflect on this week\'s focus' },
  { id: 'workshop', label: 'Workshop', description: 'In-class activities with your cohort' },
  { id: 'assignment', label: 'Assignment', description: 'Practice task before next session' },
  { id: 'reflection', label: 'Reflection', description: 'Capture what you learned' },
  { id: 'submit', label: 'Submit', description: 'Mark this week complete' },
];

/**
 * @param {{ user?: { internProgress?: object | null } }} props
 */
export function RaSpikePlaybookPage({ user }) {
  const ctx = getRaSpikeContext(user?.internProgress);

  return (
    <RaSpikeShell user={user}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-5">
          <header>
            <h1 className="text-2xl font-bold text-slate-900">Playbook</h1>
            <p className="mt-1 text-slate-600">
              Week {ctx.week}: {ctx.weekTheme}
            </p>
          </header>

          <ol className="space-y-3">
            {WEEKLY_STEPS.map((step, index) => (
              <li
                key={step.id}
                className="spike-card flex items-start gap-4 opacity-90"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{step.label}</p>
                  <p className="text-sm text-slate-600">{step.description}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Coming in Phase 4
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
