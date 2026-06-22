import { generateVenturePortfolio } from '../../services/portfolioGenerator.js';
import { getPortfolioSections } from '../../lib/playbookSeeds.js';
import { formatVentureBoardStatus } from '../../lib/participantState.js';
import { buildParticipantState } from '../../lib/participantState.js';
import { ParticipantSquadXpCard } from '../staff/SquadXpDashboard.jsx';

/** @param {{ participantId: string, participantName?: string, internProgress?: object | null }} props */
export function StaffVentureBoardPanel({ participantId, participantName = 'Participant', internProgress }) {
  const portfolio = generateVenturePortfolio(participantId, { participantName });
  const state = buildParticipantState(participantId, internProgress);
  const boardStatus = formatVentureBoardStatus(state.venture_board_status);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Venture board</h2>
        <p className="mt-1 text-sm text-slate-600">Readiness and milestone tracking for {participantName}.</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Board status</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{boardStatus}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Blueprint</dt>
            <dd className="mt-1 text-lg font-semibold text-spike">{portfolio.cover.blueprintCompletion}%</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Venture identity</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {portfolio.identity.ambition ? <li><strong>Ambition:</strong> {portfolio.identity.ambition}</li> : null}
          {portfolio.identity.impact ? <li><strong>Impact:</strong> {portfolio.identity.impact}</li> : null}
          {portfolio.identity.tagline ? <li><strong>Tagline:</strong> {portfolio.identity.tagline}</li> : null}
          {portfolio.cover.squad ? <li><strong>Squad:</strong> {portfolio.cover.squad}</li> : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Milestones</h3>
        <ul className="mt-3 space-y-2">
          {portfolio.milestones.items.slice(0, 8).map((item) => (
            <li
              key={item.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                item.done ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-slate-600'
              }`}
            >
              <span>{item.label}</span>
              <span className="font-semibold">{item.done ? '✓' : '○'}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** @param {{ participantId: string, participantName?: string }} props */
export function StaffPortfolioPreviewPanel({ participantId, participantName = 'Participant' }) {
  const portfolio = generateVenturePortfolio(participantId, { participantName });
  const sections = getPortfolioSections();

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">Venture portfolio</h2>
        <p className="text-sm text-slate-600">
          {portfolio.cover.portfolioCompletion}% complete · {participantName}
        </p>
      </header>
      <ParticipantSquadXpCard participantId={participantId} compact />
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => {
          const pct = section.id === 'portfolio-financial-blueprint'
            ? portfolio.canvas.completionPct ?? 0
            : section.id === 'portfolio-identity-purpose'
              ? portfolio.cover.portfolioCompletion
              : 0;
          return (
            <article key={section.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-spike" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{pct}%</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
