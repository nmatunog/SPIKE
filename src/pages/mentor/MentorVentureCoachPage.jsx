import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { getCoachSummaryForMentor } from '../../lib/ventureCoachService.js';
import { COACH_VALUE_CARDS, VENTURE_DIRECTION_CARDS } from '../../lib/ventureCoachConstants.js';
import { labelFor } from '../../lib/ventureCoachEngine.js';
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

  const topThreeLabels = (summary?.topThreeValues ?? []).map((id) => labelFor(id, COACH_VALUE_CARDS));

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
          {summary?.progress?.total ?? 6} sections
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <SummaryCard title="Ambition" text={summary?.ambition} />
        <SummaryCard title="Impact" text={summary?.impact ?? summary?.purpose} />
        <SummaryCard
          title="Top 3 Values"
          text={topThreeLabels.length ? topThreeLabels.join(' · ') : undefined}
        />
        <SummaryCard title="Tagline" text={summary?.tagline} highlight />
        <SummaryCard title="Future Self Summary" text={summary?.futureSelfSummary} />
        <SummaryCard
          title="Full Future Self Narrative"
          text={summary?.futureSelf}
          collapsible
          defaultCollapsed
        />
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

/**
 * @param {{
 *   title: string,
 *   text?: string,
 *   className?: string,
 *   highlight?: boolean,
 *   collapsible?: boolean,
 *   defaultCollapsed?: boolean,
 * }} props
 */
function SummaryCard({ title, text, className = '', highlight = false, collapsible = false, defaultCollapsed = false }) {
  const [open, setOpen] = useState(!defaultCollapsed);
  const hasText = Boolean(text?.trim());

  return (
    <div className={`spike-card ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="spike-label">{title}</p>
        {collapsible && hasText ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-slate-500 hover:text-spike"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        ) : null}
      </div>
      {hasText && (!collapsible || open) ? (
        <p className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${highlight ? 'text-lg font-semibold text-spike' : 'text-slate-700'}`}>
          {text}
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{collapsible && hasText ? 'Tap to expand full narrative.' : 'Not completed yet.'}</p>
      )}
    </div>
  );
}
