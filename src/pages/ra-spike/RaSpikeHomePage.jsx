import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { getProgramForIntern } from '../../lib/programs/index.js';

/**
 * RA-SPIKE home — Phase 0 placeholder (full dashboard in Phase 3).
 * @param {{ user?: { name?: string, internProgress?: object | null } }} props
 */
export function RaSpikeHomePage({ user }) {
  const program = getProgramForIntern(user?.internProgress);
  const firstName = (user?.name || 'Participant').split(' ')[0];
  const week = user?.internProgress?.ra_spike_current_week ?? 1;
  const segment = user?.internProgress?.ra_spike_segment ?? 1;
  const segmentLabel = segment >= 2 ? 'ADVISE' : 'DISCOVER';

  return (
    <PageContainer>
      <section className="spike-card mx-auto max-w-2xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-spike">{program.tagline}</p>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {firstName}</h1>
        <p className="text-slate-600">{program.theme}</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-spike/10 px-3 py-1 text-sm font-semibold text-spike">
            Week {week} of {program.totalWeeks}
          </span>
          <span className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700">
            {segmentLabel}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Your task-focused home dashboard arrives in Phase 3. Use Playbook, Squad, and Profile from the navigation above.
        </p>
      </section>
    </PageContainer>
  );
}
