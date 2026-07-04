import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { RaSpikeContentPending } from '../../components/ra-spike/RaSpikeContentPending.jsx';
import { getGatePrepChecklist } from '../../lib/raSpikeGateService.js';
import { RA_SPIKE_PROGRAM } from '../../lib/programs/ra-spike.js';
import { getRaSpikeWeekContent, isRaSpikeWeekContentReady } from '../../lib/raSpikeContentLoader.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * Stage gate prep — blank until that week’s RA-SPIKE content is authored.
 * @param {{ user?: { id?: string, internProgress?: object | null }, gate?: number, assignmentWeek?: number }} props
 */
export function RaSpikeStageGatePrepPage({ user, gate = 1, assignmentWeek }) {
  const gateMeta = RA_SPIKE_PROGRAM.stageGates.find((g) => (gate === 1 ? g.week === 4 : g.week === 8));
  const week = assignmentWeek ?? (gate === 1 ? 4 : 8);
  const weekContent = getRaSpikeWeekContent(week);
  const contentReady = isRaSpikeWeekContentReady(week);
  const items = getGatePrepChecklist(gate);

  return (
    <RaSpikeShell user={user} showContextBar={false}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-4">
          <Link to={ROUTES.raSpikePlaybook} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-spike">
            <ArrowLeft size={16} /> Playbook
          </Link>
          <header>
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">{gateMeta?.label}</p>
            <h1 className="text-2xl font-bold text-slate-900">{gateMeta?.title}</h1>
          </header>

          {!contentReady || items.length === 0 ? (
            <RaSpikeContentPending
              week={week}
              title={weekContent.title}
              theme={weekContent.theme}
            />
          ) : (
            <ul className="spike-card space-y-3">
              {items.map((item) => (
                <li key={item.id} className="text-sm text-slate-800">{item.label}</li>
              ))}
            </ul>
          )}
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
