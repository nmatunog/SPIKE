import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { SuperuserAddCoachPanel } from '../../components/admin/SuperuserAddCoachPanel.jsx';
import { RaSpikeBatchManagementPanel } from '../../components/staff/RaSpikeBatchManagementPanel.jsx';
import { RaSpikeCoachPlaybookPanel } from '../../components/staff/RaSpikeCoachPlaybookPanel.jsx';
import { RaSpikeGateEvaluationPanel } from '../../components/staff/RaSpikeGateEvaluationPanel.jsx';
import { RaSpikeWeekPublishPanel } from '../../components/staff/RaSpikeWeekPublishPanel.jsx';
import { internshipEntryHref, ROUTES } from '../../routes/paths.js';
import { RA_SPIKE_PROGRAM } from '../../lib/programs/ra-spike.js';
import { filterRaSpikeInterns } from '../../lib/raSpikeStaffGateService.js';
import { isSuperuserDbRole } from '../../lib/roles.js';

/**
 * @param {{
 *   role?: 'faculty' | 'mentor',
 *   user?: { id?: string, role?: string | null },
 *   interns: Array<object>,
 *   showToast?: (msg: string) => void,
 *   onRefresh?: () => void,
 * }} props
 */
export function RaSpikeCoachPage({
  role = 'faculty',
  user,
  interns,
  showToast,
  onRefresh,
}) {
  const raInterns = filterRaSpikeInterns(interns);
  const internshipHref = internshipEntryHref(role === 'mentor' ? 'mentor' : 'faculty');
  const roleLabel = role === 'mentor' ? 'Mentor' : 'Program Coach';
  const isSuperuser = isSuperuserDbRole(user?.role);

  return (
    <PageContainer wide>
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{roleLabel}</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{RA_SPIKE_PROGRAM.title}</h1>
          <p className="text-slate-600">{RA_SPIKE_PROGRAM.tagline} — coach hub</p>
        </header>

        <RaSpikeCoachPlaybookPanel />

        {isSuperuser ? (
          <SuperuserAddCoachPanel
            onCreated={async () => {
              showToast?.('Program coach account created.', 'success');
              await onRefresh?.();
            }}
          />
        ) : (
          <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Add another coach</p>
            <p className="mt-1">
              Staff self-signup is disabled. Only a <span className="font-semibold">Superuser</span> can
              create Program Coach accounts — sign in with your superuser account, or open{' '}
              <Link to={ROUTES.admin} className="font-semibold text-spike hover:underline">
                Admin
              </Link>
              {' '}if you have access.
            </p>
          </section>
        )}

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
