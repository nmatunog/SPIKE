import { ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeBatchManagementPanel } from '../../components/staff/RaSpikeBatchManagementPanel.jsx';
import { RaSpikeGateEvaluationPanel } from '../../components/staff/RaSpikeGateEvaluationPanel.jsx';
import { RaSpikeWeekPublishPanel } from '../../components/staff/RaSpikeWeekPublishPanel.jsx';
import { internshipEntryHref, ROUTES } from '../../routes/paths.js';
import { RA_SPIKE_PROGRAM } from '../../lib/programs/ra-spike.js';
import { filterRaSpikeInterns } from '../../lib/raSpikeStaffGateService.js';

/**
 * @param {{
 *   role?: 'faculty' | 'mentor',
 *   interns: Array<object>,
 *   showToast?: (msg: string) => void,
 *   onRefresh?: () => void,
 * }} props
 */
export function RaSpikeCoachPage({
  role = 'faculty',
  interns,
  showToast,
  onRefresh,
}) {
  const raInterns = filterRaSpikeInterns(interns);
  const internshipHref = internshipEntryHref(role === 'mentor' ? 'mentor' : 'faculty');
  const roleLabel = role === 'mentor' ? 'Mentor' : 'Program Coach';

  return (
    <PageContainer wide>
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{roleLabel}</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{RA_SPIKE_PROGRAM.title}</h1>
          <p className="text-slate-600">{RA_SPIKE_PROGRAM.tagline} — coach hub</p>
        </header>

        <section className="rounded-2xl border border-spike/20 bg-gradient-to-br from-spike-muted/50 to-white p-5">
          <p className="text-sm font-semibold text-slate-900">Rookie signup</p>
          <p className="mt-1 text-sm text-slate-600">
            Separate program from SPIKE Internship. Batches are mixed-agency — rookies choose home
            agency and unit at signup (Cebu Matunog and Cebu Ez Premier units welcome in one batch).
          </p>
          <p className="mt-3 text-sm text-slate-600">
            {raInterns.length
              ? `${raInterns.length} RA-SPIKE participant${raInterns.length === 1 ? '' : 's'} in this portal view.`
              : 'No RA-SPIKE participants enrolled yet — create a mixed batch and share the invite code.'}
          </p>
          <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs font-medium text-slate-700">
            Coach URL: <span className="font-mono text-spike">/ra-spike/coach</span>
            {' '}— do not use <span className="font-mono">/program-coach/ra-spike</span> (internship app).
          </p>
        </section>

        <RaSpikeBatchManagementPanel showToast={showToast} onChanged={onRefresh} />

        <RaSpikeWeekPublishPanel showToast={showToast} onChanged={onRefresh} />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-0.5 shrink-0 text-spike" size={22} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">Week 2 playbook</p>
              <p className="mt-1 text-sm text-slate-600">
                Preview what rookies see this week — Customer Discovery Canvas workshop, FEC guided start,
                and step-by-step learn content.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link
                  to={`${ROUTES.raSpikePlaybook}?week=2`}
                  className="spike-btn-primary inline-flex min-h-[44px] items-center justify-center gap-1 px-4 text-sm"
                >
                  Open Week 2 playbook
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <Link
                  to={ROUTES.raSpikePlaybookDiscoveryCanvas}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-spike/30"
                >
                  Discovery Canvas
                </Link>
                <Link
                  to={ROUTES.raSpikePlaybookFecIntro}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-spike/30"
                >
                  FEC guided start
                </Link>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Use the <span className="font-semibold">Playbook</span> tab in the top nav to browse any week.
              </p>
            </div>
          </div>
        </section>

        <RaSpikeGateEvaluationPanel
          interns={interns}
          showToast={showToast}
          onEvaluated={onRefresh}
        />

        <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">SPIKE Internship tools</p>
          <p className="mt-1">
            Playbook, Demo Day, and squad XP for the internship cohort are on the main coach home.
          </p>
          <a
            href={internshipHref}
            className="mt-3 inline-flex items-center gap-1 font-semibold text-spike hover:underline"
          >
            Open {roleLabel} home (SPIKE Internship)
            <ArrowRight size={16} aria-hidden />
          </a>
        </section>
      </div>
    </PageContainer>
  );
}
