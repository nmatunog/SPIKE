import { Link, useParams } from 'react-router-dom';
import { findParticipantIdByPortfolioSlug } from '../lib/portfolioStorage.js';
import { generateVenturePortfolio } from '../services/portfolioGenerator.js';
import { DreamBoardSlideCollage } from '../components/venturePortfolio/DreamBoardSlideCollage.jsx';
import { ROUTES } from '../routes/paths.js';

/** Public read-only portfolio showcase — `/portfolio/:slug` */
export function PublicPortfolioPage() {
  const { slug } = useParams();
  const participantId = findParticipantIdByPortfolioSlug(slug ?? '');

  if (!participantId) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Portfolio not found</h1>
        <p className="mt-2 text-sm text-slate-600">This link may be private or expired.</p>
        <Link to={ROUTES.home} className="mt-4 inline-block text-sm font-semibold text-spike hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  const portfolio = generateVenturePortfolio(participantId, {
    participantName: portfolioParticipantName(participantId),
  });

  if (portfolio.settings.privacy === 'private') {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Private portfolio</h1>
        <p className="mt-2 text-sm text-slate-600">The owner has not shared this portfolio.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-br from-slate-900 to-spike-dark px-6 py-12 text-white">
        <div className="mx-auto flex max-w-4xl items-start gap-6">
          {portfolio.cover.photoUrl ? (
            <img src={portfolio.cover.photoUrl} alt="" className="h-24 w-24 rounded-2xl object-cover" />
          ) : null}
          <div>
          <p className="text-sm font-bold uppercase tracking-widest text-spike-light">SPIKE Venture Portfolio™</p>
          <h1 className="mt-2 text-3xl font-bold">{portfolio.cover.participantName}</h1>
          <p className="mt-2 text-lg text-spike-light">{portfolio.cover.tagline}</p>
          <p className="mt-3 text-sm text-slate-300">
            {portfolio.cover.cohort} · {portfolio.cover.squad}
          </p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl space-y-10 px-6 py-10">
        <section className="grid gap-4 md:grid-cols-2">
          <PublicCard title="Ambition" text={portfolio.identity.ambition} />
          <PublicCard title="Impact" text={portfolio.identity.impact} />
          <PublicCard title="Values" text={portfolio.identity.valuesProfile} />
          <PublicCard title="Tagline" text={portfolio.identity.tagline} />
        </section>
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">Dream Board</h2>
          <DreamBoardSlideCollage assets={portfolio.dreamBoard?.assets ?? []} title="Dream Board" />
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">Executive Canvas</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{portfolio.canvas.strategyStatement || '—'}</p>
        </section>
        {portfolio.certifications.allBadges.length ? (
          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-900">Achievements</h2>
            <div className="flex flex-wrap gap-2">
              {portfolio.certifications.allBadges.map((badge) => (
                <span key={badge} className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900">
                  {badge}
                </span>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

/** @param {string} participantId */
function portfolioParticipantName(participantId) {
  return `SPIKE Intern ${participantId.slice(0, 6)}`;
}

/** @param {{ title: string, text: string }} props */
function PublicCard({ title, text }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <p className="text-xs font-bold uppercase tracking-wide text-spike">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-800">{text || '—'}</p>
    </article>
  );
}
