import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import {
  getGatePrepChecklist,
  getGatePrepState,
  isGatePrepComplete,
  saveGatePrepState,
} from '../../lib/raSpikeGateService.js';
import { RA_SPIKE_PROGRAM } from '../../lib/programs/ra-spike.js';
import { setRaSpikeStepStatus } from '../../lib/raSpikeWeekProgress.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ user?: { id?: string, internProgress?: object | null }, gate?: number }} props
 */
export function RaSpikeStageGatePrepPage({ user, gate = 1 }) {
  const participantId = user?.id ?? '';
  const gateMeta = RA_SPIKE_PROGRAM.stageGates.find((g) => (gate === 1 ? g.week === 4 : g.week === 8));
  const week = gate === 1 ? 4 : 8;
  const items = getGatePrepChecklist(gate);
  const [state, setState] = useState(() => getGatePrepState(participantId, gate));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isGatePrepComplete(participantId, gate)) {
      void setRaSpikeStepStatus(participantId, week, 'assignment', 'complete');
      setSaved(true);
    }
  }, [participantId, gate, week]);

  function toggle(id) {
    const next = { ...state, [id]: !state[id] };
    setState(next);
    saveGatePrepState(participantId, gate, next);
  }

  async function markComplete() {
    saveGatePrepState(participantId, gate, state);
    await setRaSpikeStepStatus(participantId, week, 'assignment', 'complete');
    setSaved(true);
  }

  const allChecked = items.every((item) => state[item.id]);

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
            <p className="mt-2 text-sm text-slate-600">
              Complete this checklist before your panel. Your coach will record pass/fail after evaluation.
            </p>
          </header>
          <ul className="spike-card space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm">
                  <input type="checkbox" checked={Boolean(state[item.id])} onChange={() => toggle(item.id)} className="h-5 w-5 rounded border-slate-300" />
                  <span className="text-slate-800">{item.label}</span>
                </label>
              </li>
            ))}
          </ul>
          <button type="button" disabled={!allChecked || saved} onClick={markComplete} className="spike-btn-primary min-h-[48px] w-full">
            {saved ? 'Prep checklist complete' : 'Mark assignment complete'}
          </button>
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
