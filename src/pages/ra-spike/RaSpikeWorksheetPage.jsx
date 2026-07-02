import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { getRaSpikeWorksheet, isRaSpikeWorksheetComplete, saveRaSpikeWorksheet } from '../../lib/raSpikeWorksheetStorage.js';
import { setRaSpikeStepStatus } from '../../lib/raSpikeWeekProgress.js';
import { ROUTES } from '../../routes/paths.js';

const WORKSHEET_META = {
  prospecting: { title: 'Prospecting list & script', week: 5, placeholder: 'List prospects and your opening script…' },
  'discovery-log': { title: 'Discovery conversation log', week: 6, placeholder: 'Notes from discovery conversations…' },
};

/**
 * @param {{ user?: { id?: string }, kind?: string }} props
 */
export function RaSpikeWorksheetPage({ user, kind = 'prospecting' }) {
  const meta = WORKSHEET_META[kind] ?? WORKSHEET_META.prospecting;
  const participantId = user?.id ?? '';
  const [text, setText] = useState(() => getRaSpikeWorksheet(participantId, kind));
  const [saved, setSaved] = useState(false);

  async function markComplete() {
    saveRaSpikeWorksheet(participantId, kind, text);
    await setRaSpikeStepStatus(participantId, meta.week, 'assignment', 'complete');
    setSaved(true);
  }

  const canComplete = isRaSpikeWorksheetComplete(participantId, kind) || text.trim().length >= 30;

  return (
    <RaSpikeShell user={user} showContextBar={false}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-4">
          <Link to={ROUTES.raSpikePlaybook} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-spike">
            <ArrowLeft size={16} /> Playbook
          </Link>
          <header>
            <h1 className="text-2xl font-bold text-slate-900">{meta.title}</h1>
          </header>
          <textarea
            rows={12}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder={meta.placeholder}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              saveRaSpikeWorksheet(participantId, kind, e.target.value);
            }}
          />
          <button type="button" disabled={!canComplete || saved} onClick={markComplete} className="spike-btn-primary min-h-[48px] w-full">
            {saved ? 'Worksheet saved' : 'Save & complete assignment'}
          </button>
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
