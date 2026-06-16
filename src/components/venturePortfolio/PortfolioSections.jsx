import { Link } from 'react-router-dom';
import { Award, Download, Share2, TrendingUp } from 'lucide-react';
import { ArtifactDraftCard } from '../blueprint/ArtifactDraftCard.jsx';
import { BLUEPRINT_LINKS, ROUTES } from '../../routes/paths.js';
import { exportVenturePortfolioPdf } from '../../lib/portfolioExportService.js';
import { ensurePortfolioSlug, savePortfolioSettings } from '../../lib/portfolioStorage.js';
import { DreamBoardCollage } from './DreamBoardCollage.jsx';
import { DreamBoardSlideCollage } from './DreamBoardSlideCollage.jsx';
import { ParticipantPhotoUpload } from './ParticipantPhotoUpload.jsx';
import { PortfolioCoachingTimeline } from './PortfolioCoachingTimeline.jsx';
import { PortfolioWeek1JourneyPanel } from './PortfolioWeek1JourneyPanel.jsx';
import { VentureTimeline } from './VentureTimeline.jsx';

/** @param {{ portfolio: ReturnType<import('../../services/portfolioGenerator.js').generateVenturePortfolio>, participantId?: string, participantName?: string }} props */
export function PortfolioOverviewSection({ portfolio, participantId = '', participantName = '' }) {
  const { cover, sectionScores, certifications } = portfolio;

  return (
    <div className="space-y-6">
      {participantId ? (
        <section className="spike-card">
          <p className="mb-3 text-sm font-semibold text-slate-900">Profile photo</p>
          <ParticipantPhotoUpload participantId={participantId} participantName={participantName || cover.participantName} />
        </section>
      ) : null}
      {participantId ? <PortfolioWeek1JourneyPanel participantId={participantId} /> : null}
      <section className="overflow-hidden rounded-3xl border border-spike/15 bg-gradient-to-br from-slate-900 via-slate-800 to-spike-dark p-8 text-white shadow-projection sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {cover.photoUrl ? (
            <img
              src={cover.photoUrl}
              alt=""
              className="h-24 w-24 rounded-2xl border-2 border-white/20 object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 text-3xl font-bold">
              {cover.participantName.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase tracking-widest text-spike-light">Venture Portfolio™</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{cover.participantName}</h1>
            <p className="mt-2 text-lg text-spike-light">{cover.tagline || 'Your personal brand tagline appears here.'}</p>
            <p className="mt-3 text-sm text-slate-300">
              {cover.cohort} · {cover.squad}
            </p>
            <p className="text-sm text-slate-300">{cover.careerTrack}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:text-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-2xl font-bold">{cover.blueprintCompletion}%</p>
              <p className="text-2xs uppercase tracking-wide text-slate-400">Blueprint</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-2xl font-bold">{cover.portfolioCompletion}%</p>
              <p className="text-2xs uppercase tracking-wide text-slate-400">Portfolio</p>
            </div>
          </div>
        </div>
        {certifications.allBadges.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {certifications.allBadges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 rounded-full border border-spike/30 bg-spike/20 px-3 py-1 text-xs font-semibold"
              >
                <Award size={12} /> {badge}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(sectionScores).map(([key, score]) => (
          <div key={key} className="spike-card">
            <p className="text-2xs font-bold uppercase tracking-wide text-slate-500">{formatSectionKey(key)}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{score}%</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-spike" style={{ width: `${score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** @param {string} key */
function formatSectionKey(key) {
  const labels = {
    identity: 'Identity',
    dreamBoard: 'Dream Board',
    career: 'Career',
    canvas: 'Canvas',
    research: 'Research',
    milestones: 'Milestones',
    presentations: 'Presentations',
    certifications: 'Certifications',
  };
  return labels[key] ?? key;
}

/** @param {{ portfolio: ReturnType<import('../../services/portfolioGenerator.js').generateVenturePortfolio> }} props */
export function PortfolioIdentitySection({ portfolio }) {
  const { identity } = portfolio;
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-spike/15 bg-gradient-to-br from-white to-spike-muted/30 p-6">
        <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-spike">Your SPIKE Identity</p>
        <div className="grid gap-3 md:grid-cols-3 text-center text-sm">
          <div className="rounded-xl bg-white/80 p-3 shadow-sm">
            <p className="font-bold text-slate-900">Ambition</p>
            <p className="mt-1 text-xs text-slate-600 line-clamp-3">{identity.ambition || '—'}</p>
          </div>
          <div className="rounded-xl bg-white/80 p-3 shadow-sm">
            <p className="font-bold text-slate-900">Impact</p>
            <p className="mt-1 text-xs text-slate-600 line-clamp-3">{identity.impact || '—'}</p>
          </div>
          <div className="rounded-xl bg-white/80 p-3 shadow-sm">
            <p className="font-bold text-slate-900">Values</p>
            <p className="mt-1 text-xs text-slate-600 line-clamp-3">
              {identity.topThreeValues.length ? identity.topThreeValues.join(' · ') : '—'}
            </p>
          </div>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <StatementCard title="My Ambition" text={identity.ambition} />
        <StatementCard title="My Impact" text={identity.impact} />
        <StatementCard title="My Tagline" text={identity.tagline} large />
        <StatementCard title="My Future Self" text={identity.futureSelfSummary || identity.futureSelf} />
      </div>
      <section className="spike-card space-y-3">
        <p className="spike-label text-spike">My Values</p>
        {identity.topThreeValues.length ? (
          <div className="flex flex-wrap gap-2">
            {identity.topThreeValues.map((label) => (
              <span key={label} className="rounded-full border border-spike/20 bg-spike-muted/50 px-3 py-1 text-xs font-semibold text-spike">
                {label}
              </span>
            ))}
          </div>
        ) : null}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {identity.valuesProfile || 'Complete the Values coach section to add your values profile.'}
        </p>
      </section>
    </div>
  );
}

/** @param {{ portfolio: ReturnType<import('../../services/portfolioGenerator.js').generateVenturePortfolio> }} props */
export function PortfolioDreamBoardSection({ portfolio }) {
  const dreamBoard = portfolio.dreamBoard ?? { completed: false, assets: [], evolution: [] };
  return (
    <div className="space-y-8">
      <header>
        <p className="spike-label text-spike">Dream Board</p>
        <h2 className="text-2xl font-bold text-slate-900">Your vision collage</h2>
        <p className="mt-1 text-sm text-slate-600">
          Lifestyle, family, career, business, and impact dreams — arranged like a founder vision board.
        </p>
        {!dreamBoard.completed ? (
          <Link to={BLUEPRINT_LINKS.day1Builders} className="mt-3 inline-block text-sm font-semibold text-spike hover:underline">
            Open Dream Board Studio →
          </Link>
        ) : null}
      </header>
      <DreamBoardSlideCollage assets={dreamBoard.assets} title={`${portfolio.cover.participantName}'s Dream Board`} />
      <section className="spike-card">
        <h3 className="text-sm font-semibold text-slate-900">All dream cards</h3>
        <p className="mt-1 text-xs text-slate-500">Tap any card for full-size view with complete caption.</p>
        <div className="mt-4">
          <DreamBoardCollage assets={dreamBoard.assets} showMeta />
        </div>
      </section>
      {dreamBoard.evolution.length ? (
        <section className="spike-card space-y-4">
          <p className="spike-label text-spike">Dream Evolution</p>
          <div className="space-y-3">
            {dreamBoard.evolution.map((item, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{item.dream}</p>
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-medium">Progress:</span> {item.progress}
                </p>
                {item.achievement ? (
                  <p className="mt-1 text-sm text-emerald-800">
                    <span className="font-medium">Achievement:</span> {item.achievement}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** @param {{ portfolio: ReturnType<import('../../services/portfolioGenerator.js').generateVenturePortfolio> }} props */
export function PortfolioCareerSection({ portfolio }) {
  const { career } = portfolio;
  return (
    <div className="space-y-6">
      <section className="spike-card">
        <p className="spike-label text-spike">Career Direction</p>
        <h2 className="text-2xl font-bold text-slate-900">{career.trackLabel}</h2>
        <p className="mt-2 text-sm text-slate-600">
          Current: <strong>{career.currentPosition}</strong> → Target: <strong>{career.targetPosition}</strong>
        </p>
        <p className="mt-1 text-sm text-slate-500">Projected timeline: {career.projectedTimeline}</p>
      </section>
      <section className="spike-card">
        <p className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">Career roadmap</p>
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          {career.roadmap.map((step, index) => {
            const isCurrent = step === career.currentPosition;
            const isTarget = step === career.targetPosition;
            return (
              <div key={step} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    isCurrent
                      ? 'bg-spike text-white shadow-sm'
                      : isTarget
                        ? 'border-2 border-spike bg-spike-muted text-spike'
                        : 'border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {step}
                </span>
                {index < career.roadmap.length - 1 ? (
                  <span className="hidden text-slate-300 sm:inline" aria-hidden>
                    ↓
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/** @param {{ portfolio: ReturnType<import('../../services/portfolioGenerator.js').generateVenturePortfolio> }} props */
export function PortfolioCanvasSection({ portfolio }) {
  const { canvas } = portfolio;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="spike-label text-spike">Financial Entrepreneurship Canvas</p>
          <h2 className="text-2xl font-bold text-slate-900">Executive canvas summary</h2>
          <p className="mt-1 text-sm text-slate-600">{canvas.completionPct}% canvas complete</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={BLUEPRINT_LINKS.canvas} className="spike-btn-primary text-sm">
            Edit canvas
          </Link>
          <Link to={BLUEPRINT_LINKS.canvasSummary} className="spike-btn-secondary text-sm">
            Full summary
          </Link>
        </div>
      </header>
      <section className="spike-card space-y-3">
        <p className="text-sm font-semibold text-slate-900">Strategy statement</p>
        <p className="text-sm leading-relaxed text-slate-700">{canvas.strategyStatement || '—'}</p>
      </section>
      {canvas.priorities.length ? (
        <section className="spike-card">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">90-day priorities</p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {canvas.priorities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      ) : null}
      {canvas.yearGoals.length ? (
        <section className="spike-card">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">3-year vision</p>
          <ul className="space-y-2 text-sm text-slate-700">
            {canvas.yearGoals.map((goal, index) => (
              <li key={goal}>
                <span className="font-semibold text-slate-900">Year {index + 1}:</span> {goal}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {canvas.engines.map((engine) => (
          <section key={engine.key} className="spike-card">
            <p className="mb-2 font-semibold text-slate-900">{engine.label}</p>
            <ul className="space-y-1 text-sm text-slate-600">
              {engine.fields.slice(0, 4).map((field) => (
                <li key={field.key}>
                  <span className="font-medium text-slate-800">{field.label}:</span> {field.value}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/** @param {{ portfolio: ReturnType<import('../../services/portfolioGenerator.js').generateVenturePortfolio> }} props */
export function PortfolioResearchSection({ portfolio }) {
  const { research } = portfolio;
  const { metrics } = research;
  return (
    <div className="space-y-6">
      <header>
        <p className="spike-label text-spike">Research Journey</p>
        <h2 className="text-2xl font-bold text-slate-900">Market intelligence & discovery</h2>
        {research.marketLabel ? <p className="mt-1 text-sm text-slate-600">Market: {research.marketLabel}</p> : null}
      </header>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Surveys completed" value={metrics.surveysCompleted} />
        <MetricCard label="Interviews conducted" value={metrics.interviewsConducted} />
        <MetricCard label="Insights generated" value={metrics.insightsGenerated} />
        <MetricCard label="Personas created" value={metrics.personasCreated} />
      </div>
      {research.artifacts.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {research.artifacts.map((artifact) => (
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
      ) : (
        <p className="spike-card text-sm text-slate-500">
          Complete Playbook surveys and squad research to auto-fill this section.
        </p>
      )}
      <Link
        to={`${ROUTES.myVenturePortfolio}/deliverables`}
        className="inline-flex text-sm font-semibold text-spike hover:underline"
      >
        Upload research files & presentation decks →
      </Link>
    </div>
  );
}

/** @param {{ portfolio: ReturnType<import('../../services/portfolioGenerator.js').generateVenturePortfolio> }} props */
export function PortfolioMilestonesSection({ portfolio }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="spike-label text-spike">Venture Milestones</p>
        <h2 className="text-2xl font-bold text-slate-900">Your SPIKE journey</h2>
        <p className="mt-1 text-sm text-slate-600">{portfolio.milestones.hours} program hours logged</p>
      </header>
      <VentureTimeline items={portfolio.milestones.items} currentHours={portfolio.milestones.hours} />
    </div>
  );
}

/** @param {{ portfolio: ReturnType<import('../../services/portfolioGenerator.js').generateVenturePortfolio> }} props */
/** @param {{ portfolio: ReturnType<import('../../services/portfolioGenerator.js').generateVenturePortfolio>, participantId?: string }} props */
export function PortfolioPresentationsSection({ portfolio, participantId = '' }) {
  return (
    <div className="space-y-4">
      <header>
        <p className="spike-label text-spike">Presentations & Deliverables</p>
        <h2 className="text-2xl font-bold text-slate-900">Venture board reviews</h2>
        {participantId ? (
          <Link
            to={`${ROUTES.myVenturePortfolio}/present`}
            className="mt-2 inline-flex text-sm font-semibold text-spike hover:underline"
          >
            Launch Week 1 presentation mode →
          </Link>
        ) : null}
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {portfolio.presentations.boards.map((board) => (
          <article key={board.id} className="spike-card">
            <p className="font-semibold text-slate-900">{board.title}</p>
            <p className="mt-2 text-sm capitalize text-slate-600">Status: {board.status.replace('_', ' ')}</p>
            <p className="mt-1 text-2xs text-slate-400">Gate: Hour {board.hourGate}</p>
          </article>
        ))}
      </div>
      <Link to={BLUEPRINT_LINKS.ventureBoard} className="inline-flex text-sm font-semibold text-spike hover:underline">
        Open Venture Board module →
      </Link>
    </div>
  );
}

/** @param {{ portfolio: ReturnType<import('../../services/portfolioGenerator.js').generateVenturePortfolio> }} props */
export function PortfolioCertificationsSection({ portfolio }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="spike-label text-spike">Certifications & Achievements</p>
        <h2 className="text-2xl font-bold text-slate-900">Badges and milestones earned</h2>
      </header>
      <div className="flex flex-wrap gap-2">
        {portfolio.certifications.allBadges.map((badge) => (
          <span
            key={badge}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950"
          >
            <Award size={16} /> {badge}
          </span>
        ))}
      </div>
      {!portfolio.certifications.allBadges.length ? (
        <p className="text-sm text-slate-500">Complete coach sections and Blueprint modules to earn badges.</p>
      ) : null}
    </div>
  );
}

/**
 * @param {{
 *   portfolio: ReturnType<import('../../services/portfolioGenerator.js').generateVenturePortfolio>,
 *   participantId: string,
 *   participantName: string,
 * }} props
 */
export function PortfolioExportSection({ portfolio, participantId, participantName }) {
  const slug = ensurePortfolioSlug(participantId, participantName);

  const coachingSection = participantId ? (
    <section className="spike-card space-y-3">
      <p className="spike-label text-spike">Coaching history</p>
      <PortfolioCoachingTimeline participantId={participantId} />
    </section>
  ) : null;
  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/portfolio/${slug}` : `/portfolio/${slug}`;

  return (
    <div className="space-y-6">
      <header>
        <p className="spike-label text-spike">Portfolio Export</p>
        <h2 className="text-2xl font-bold text-slate-900">Take your portfolio with you</h2>
        <p className="mt-1 text-sm text-slate-600">
          Export a PDF for mentors and boards, or share a link to your public showcase.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => exportVenturePortfolioPdf(participantId, { participantName })}
          className="spike-card flex items-start gap-3 text-left transition hover:border-spike/30"
        >
          <Download className="mt-1 text-spike" size={20} />
          <div>
            <p className="font-semibold text-slate-900">Export Portfolio PDF</p>
            <p className="mt-1 text-sm text-slate-600">Cover, identity, dream board, canvas, research, and badges.</p>
          </div>
        </button>
        <div className="spike-card">
          <div className="flex items-start gap-3">
            <Share2 className="mt-1 text-spike" size={20} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">Share link</p>
              <p className="mt-1 break-all text-sm text-slate-600">{shareUrl}</p>
              <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Privacy
                <select
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={portfolio.settings.privacy}
                  onChange={(e) =>
                    savePortfolioSettings(participantId, {
                      privacy: /** @type {'private' | 'share_link' | 'public'} */ (e.target.value),
                    })
                  }
                >
                  <option value="private">Private</option>
                  <option value="share_link">Share link</option>
                  <option value="public">Public</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      <section className="spike-card">
        <div className="flex items-center gap-2 text-spike">
          <TrendingUp size={18} />
          <p className="font-semibold">Portfolio completion: {portfolio.portfolioCompletion}%</p>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          At Hour 600, your SPIKE Venture Portfolio becomes your graduation asset — identity, canvas, research, and
          venture board reviews in one place.
        </p>
      </section>
      {coachingSection}
    </div>
  );
}

/** @param {{ title: string, text: string, large?: boolean }} props */
function StatementCard({ title, text, large = false }) {
  return (
    <article className="spike-card">
      <p className="spike-label text-spike">{title}</p>
      {text ? (
        <p className={`mt-3 font-medium leading-relaxed text-slate-900 ${large ? 'text-xl' : 'text-base'}`}>{text}</p>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Not yet defined.</p>
      )}
    </article>
  );
}

/** @param {{ label: string, value: number }} props */
function MetricCard({ label, value }) {
  return (
    <div className="spike-card text-center">
      <p className="text-3xl font-bold text-spike">{value}</p>
      <p className="mt-1 text-2xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
