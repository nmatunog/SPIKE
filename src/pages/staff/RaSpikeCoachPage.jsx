import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeBatchManagementPanel } from '../../components/staff/RaSpikeBatchManagementPanel.jsx';
import { RaSpikeGateEvaluationPanel } from '../../components/staff/RaSpikeGateEvaluationPanel.jsx';
import { ROUTES } from '../../routes/paths.js';
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
  const homeHref = role === 'mentor' ? ROUTES.mentorHome : ROUTES.programCoachHome;
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
            New participants use <strong>Join RA-SPIKE™</strong> on the welcome page with your batch invite code.
            Each rookie selects their home agency and unit — batches can mix advisors from many organizations.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            {raInterns.length
              ? `${raInterns.length} RA-SPIKE participant${raInterns.length === 1 ? '' : 's'} in this portal view.`
              : 'No RA-SPIKE participants enrolled yet — create a batch and share the invite code.'}
          </p>
        </section>

        <RaSpikeBatchManagementPanel showToast={showToast} onChanged={onRefresh} />

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
          <Link to={homeHref} className="mt-3 inline-flex items-center gap-1 font-semibold text-spike hover:underline">
            Open {roleLabel} home (SPIKE Internship)
            <ArrowRight size={16} aria-hidden />
          </Link>
        </section>
      </div>
    </PageContainer>
  );
}
