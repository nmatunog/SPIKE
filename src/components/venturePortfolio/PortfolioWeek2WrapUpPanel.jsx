import { Link } from 'react-router-dom';
import { getWeek2WrapUpState, WEEK2_WRAP_UP_PROMPTS } from '../../lib/customerDiscovery/week2WrapUpService.js';
import { playbookWeek2MissionHref } from '../../lib/customerDiscovery/week2MissionService.js';
import { SquadScoringExplainer } from './SquadScoringExplainer.jsx';

/**
 * Week 2 learnings + scoring — portfolio overview section.
 * @param {{ participantId: string }} props
 */
export function PortfolioWeek2WrapUpPanel({ participantId }) {
  const wrap = getWeek2WrapUpState(participantId);
  const hasAny = WEEK2_WRAP_UP_PROMPTS.some((p) => String(wrap.fields[p.id] ?? '').trim());

  return (
    <section className="spike-card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="spike-label text-spike">Week 2 wrap-up</p>
          <h2 className="text-lg font-bold text-slate-900">Learnings & squad scoring</h2>
          <p className="mt-1 text-sm text-slate-600">
            Your Friday reflection plus how guest panelists and mentors score your squad.
          </p>
        </div>
        <Link
          to={playbookWeek2MissionHref('week-wrap-up', { day: 5 })}
          className="inline-flex min-h-[40px] items-center rounded-xl border border-spike/30 px-4 py-2 text-sm font-semibold text-spike hover:bg-spike/5"
        >
          {wrap.complete ? 'Edit wrap-up' : 'Complete wrap-up'}
        </Link>
      </div>

      {hasAny ? (
        <dl className="grid gap-4 sm:grid-cols-2">
          {WEEK2_WRAP_UP_PROMPTS.map((prompt) => {
            const text = String(wrap.fields[prompt.id] ?? '').trim();
            if (!text) return null;
            return (
              <div key={prompt.id} className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{prompt.label}</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{text}</dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          After your Market Validation Pitch, capture your biggest learnings and Week 3 focus — about 5 minutes.
        </p>
      )}

      <SquadScoringExplainer variant="portfolio" participantId={participantId} />
    </section>
  );
}
