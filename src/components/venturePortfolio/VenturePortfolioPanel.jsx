import { Link } from 'react-router-dom';
import { Award, Briefcase, Sparkles } from 'lucide-react';
import { ArtifactDraftCard } from '../blueprint/ArtifactDraftCard.jsx';
import { CoachIdentityTriangle } from '../ventureCoach/CoachIdentityTriangle.jsx';
import { buildVenturePortfolio } from '../../lib/venturePortfolioService.js';
import { ROUTES } from '../../routes/paths.js';
import { DreamBoardCollage } from './DreamBoardCollage.jsx';

/**
 * @param {{ participantId: string, participantName?: string }} props
 */
export function VenturePortfolioPanel({ participantId, participantName = 'You' }) {
  const portfolio = buildVenturePortfolio(participantId);
  const displayName = participantName === 'You' ? 'Your' : `${participantName}'s`;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-spike/15 bg-gradient-to-br from-slate-900 via-slate-800 to-spike-dark p-8 text-white shadow-projection sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2 text-spike-light">
              <Briefcase size={18} />
              <span className="text-sm font-bold uppercase tracking-widest">Venture Portfolio</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{displayName} Venture Identity</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Everything you created in the AI Venture Coach and Day 1 builders — your ambition, impact, values,
              future self, and dream board — in one place.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center">
            <p className="text-3xl font-bold">{portfolio.progress.percent}%</p>
            <p className="text-2xs font-semibold uppercase tracking-wide text-slate-400">Coach complete</p>
          </div>
        </div>

        {portfolio.badges.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {portfolio.badges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 rounded-full border border-spike/30 bg-spike/20 px-3 py-1 text-xs font-semibold text-spike-light"
              >
                <Award size={12} /> {badge}
              </span>
            ))}
          </div>
        ) : null}

        {!portfolio.ready ? (
          <p className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Finish all coach sections to unlock your full portfolio.{' '}
            <Link to={`${ROUTES.ventureBlueprint}/coach`} className="font-semibold underline hover:no-underline">
              Continue coaching →
            </Link>
          </p>
        ) : null}
      </section>

      <CoachIdentityTriangle />

      <div className="grid gap-4 lg:grid-cols-3">
        <PortfolioStatementCard title="My Ambition" text={portfolio.ambition} accent="spike" />
        <PortfolioStatementCard title="My Impact" text={portfolio.impact} accent="sky" />
        <PortfolioStatementCard title="My Tagline" text={portfolio.tagline} accent="emerald" large />
      </div>

      <section className="spike-card space-y-4">
        <header>
          <p className="spike-label text-spike">My Values</p>
          {portfolio.topThreeValues.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {portfolio.topThreeValues.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-spike/20 bg-spike-muted/50 px-3 py-1 text-xs font-semibold text-spike"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </header>
        {portfolio.valuesProfile ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{portfolio.valuesProfile}</p>
        ) : (
          <p className="text-sm text-slate-500">Complete the Values coach section to add your values profile.</p>
        )}
      </section>

      <section className="spike-card space-y-4">
        <header>
          <p className="spike-label text-spike">My Future Self</p>
          {portfolio.futureSelfSummary ? (
            <p className="mt-1 text-lg font-semibold text-slate-900">{portfolio.futureSelfSummary}</p>
          ) : null}
        </header>
        {portfolio.futureSelf ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{portfolio.futureSelf}</p>
        ) : (
          <p className="text-sm text-slate-500">Complete the Future Self coach section to add your narrative.</p>
        )}
      </section>

      {portfolio.ventureDirection ? (
        <section className="spike-card">
          <p className="spike-label text-spike">My Venture Direction</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{portfolio.ventureDirection}</p>
        </section>
      ) : null}

      <section className="space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="spike-label text-spike">Dream Board</p>
            <h3 className="text-xl font-semibold text-slate-900">Your vision collage</h3>
            <p className="mt-1 text-sm text-slate-600">
              Lifestyle, family, career, and financial dreams you captured in Dream Board Studio.
            </p>
          </div>
          {!portfolio.dreamBoard.completed ? (
            <Link
              to={`${ROUTES.ventureBlueprint}/day-1-builders`}
              className="text-sm font-semibold text-spike hover:underline"
            >
              Open Dream Board Studio →
            </Link>
          ) : null}
        </header>
        <DreamBoardCollage assets={portfolio.dreamBoard.assets} />
      </section>

      {portfolio.squadCharter?.completed ? (
        <section className="spike-card space-y-3">
          <p className="spike-label text-spike">Squad Charter</p>
          <h3 className="text-lg font-semibold text-slate-900">{portfolio.squadCharter.squadName}</h3>
          {portfolio.squadCharter.mission ? (
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Mission: </span>
              {portfolio.squadCharter.mission}
            </p>
          ) : null}
          {portfolio.squadCharter.teamMotto ? (
            <p className="text-sm italic text-slate-600">&ldquo;{portfolio.squadCharter.teamMotto}&rdquo;</p>
          ) : null}
          {portfolio.squadCharter.teamCommitment ? (
            <p className="text-sm text-slate-700">{portfolio.squadCharter.teamCommitment}</p>
          ) : null}
          {portfolio.squadCharter.signatureName ? (
            <p className="text-xs text-slate-500">
              Signed by {portfolio.squadCharter.signatureName}
              {portfolio.squadCharter.signedAt
                ? ` · ${new Date(portfolio.squadCharter.signedAt).toLocaleDateString()}`
                : ''}
            </p>
          ) : null}
        </section>
      ) : null}

      {portfolio.identityArtifacts.length ? (
        <section className="space-y-3">
          <header>
            <p className="spike-label text-spike">Blueprint drafts</p>
            <h3 className="text-lg font-semibold text-slate-900">Auto-generated portfolio artifacts</h3>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            {portfolio.identityArtifacts.map((artifact) => (
              <ArtifactDraftCard
                key={artifact.id}
                title={artifact.title}
                content={artifact.content}
                status={artifact.status}
                sourceType={artifact.sourceType}
                updatedAt={artifact.updatedAt}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-spike/15 bg-spike-muted/30 p-6 text-center">
        <Sparkles className="mx-auto mb-2 text-spike" size={24} />
        <p className="text-sm font-medium text-slate-800">
          This portfolio grows as you complete Playbook activities and Blueprint modules.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link to={ROUTES.ventureBlueprint} className="spike-btn-secondary text-sm">
            Blueprint overview
          </Link>
          <Link to={`${ROUTES.ventureBlueprint}/coach`} className="spike-btn-primary text-sm">
            Edit in Coach
          </Link>
        </div>
      </section>
    </div>
  );
}

/** @param {{ title: string, text: string, accent?: string, large?: boolean }} props */
function PortfolioStatementCard({ title, text, large = false }) {
  return (
    <article className={`spike-card flex flex-col ${large ? 'lg:col-span-1' : ''}`}>
      <p className="spike-label text-spike">{title}</p>
      {text ? (
        <p className={`mt-3 flex-1 font-medium leading-relaxed text-slate-900 ${large ? 'text-xl' : 'text-base'}`}>
          {text}
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Not yet defined.</p>
      )}
    </article>
  );
}
