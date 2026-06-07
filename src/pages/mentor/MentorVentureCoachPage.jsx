import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { getCoachSummaryForMentor } from '../../lib/ventureCoachService.js';
import { VENTURE_DIRECTION_CARDS } from '../../lib/ventureCoachConstants.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ interns?: Array<{ id: string, name: string }> }} props
 */
export function MentorVentureCoachPage({ interns = [] }) {
  const { participantId } = useParams();
  const intern = interns.find((i) => i.id === participantId);
  const summary = participantId ? getCoachSummaryForMentor(participantId) : null;
  const [note, setNote] = useState('');
  const [action, setAction] = useState('');

  if (!participantId) {
    return (
      <PageContainer>
        <p className="text-sm text-slate-600">Select a participant to view their Venture Coach progress.</p>
      </PageContainer>
    );
  }

  const trackLabel = VENTURE_DIRECTION_CARDS.find((c) => c.id === summary?.ventureDirection)?.label
    ?? summary?.ventureDirection
    ?? '—';

  return (
    <PageContainer>
      <Link to={ROUTES.dashboard} className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-spike">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>

      <header className="mb-6">
        <p className="spike-label text-spike">AI Venture Coach™</p>
        <h1 className="text-2xl font-bold text-slate-900">{intern?.name ?? 'Participant'}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Progress: {summary?.progress?.percent ?? 0}% · {summary?.progress?.completed ?? 0}/
          {summary?.progress?.total ?? 5} sections
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <SummaryCard title="Ambition Summary" text={summary?.ambition} />
        <SummaryCard title="Purpose Summary" text={summary?.purpose} />
        <SummaryCard title="Values Profile" text={summary?.valuesProfile} />
        <SummaryCard title="Future Self Snapshot" text={summary?.futureSelf} />
        <SummaryCard title="Career Interest" text={trackLabel} className="lg:col-span-2" />
      </div>

      <section className="mt-6 spike-card space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Mentor actions</h3>
        <div className="flex flex-wrap gap-2">
          {['Comment', 'Approve', 'Request Reflection'].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setAction(label)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                action === label ? 'bg-spike text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
            <MessageSquare size={14} /> Coaching notes
          </span>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={note}
            placeholder="Share coaching feedback on their venture coach journey…"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        {action ? (
          <p className="text-sm text-emerald-700">
            {action} recorded locally{note.trim() ? ' with your note.' : '.'}
          </p>
        ) : null}
      </section>
    </PageContainer>
  );
}

/** @param {{ title: string, text?: string, className?: string }} props */
function SummaryCard({ title, text, className = '' }) {
  return (
    <div className={`spike-card ${className}`}>
      <p className="spike-label">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {text?.trim() ? text : 'Not completed yet.'}
      </p>
    </div>
  );
}
