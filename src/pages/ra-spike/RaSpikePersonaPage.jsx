import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { getRaSpikePersona, isRaSpikePersonaComplete, saveRaSpikePersona } from '../../lib/raSpikePersonaStorage.js';
import { setRaSpikeStepStatus } from '../../lib/raSpikeWeekProgress.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ user?: { id?: string, internProgress?: object | null } }} props
 */
export function RaSpikePersonaPage({ user }) {
  const participantId = user?.id ?? '';
  const week = 2;
  const [persona, setPersona] = useState(() => getRaSpikePersona(participantId));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isRaSpikePersonaComplete(participantId)) {
      void setRaSpikeStepStatus(participantId, week, 'assignment', 'complete');
      setSaved(true);
    }
  }, [participantId]);

  function update(field, value) {
    const next = { ...persona, [field]: value };
    setPersona(next);
    saveRaSpikePersona(participantId, next);
  }

  async function markComplete() {
    saveRaSpikePersona(participantId, persona);
    await setRaSpikeStepStatus(participantId, week, 'assignment', 'complete');
    setSaved(true);
  }

  const canComplete = isRaSpikePersonaComplete(participantId);

  return (
    <RaSpikeShell user={user} showContextBar={false}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-4">
          <Link to={ROUTES.raSpikePlaybook} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-spike">
            <ArrowLeft size={16} /> Playbook
          </Link>
          <header>
            <h1 className="text-2xl font-bold text-slate-900">Customer Persona</h1>
            <p className="mt-1 text-sm text-slate-600">Who you serve, their problem, and their goals.</p>
          </header>
          <div className="spike-card space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-slate-800">Customer segment</span>
              <textarea rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={persona.segment} onChange={(e) => update('segment', e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-800">Main problem or need</span>
              <textarea rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={persona.problem} onChange={(e) => update('problem', e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-800">Goals and aspirations</span>
              <textarea rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={persona.goals} onChange={(e) => update('goals', e.target.value)} />
            </label>
            <button type="button" disabled={!canComplete || saved} onClick={markComplete} className="spike-btn-primary min-h-[48px] w-full">
              {saved ? 'Persona saved' : 'Save persona & complete assignment'}
            </button>
          </div>
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
