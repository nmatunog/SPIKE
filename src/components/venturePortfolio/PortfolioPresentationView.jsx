import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { DreamBoardSlideCollage } from './DreamBoardSlideCollage.jsx';
import { ROUTES } from '../../routes/paths.js';

/**
 * Day 5 portfolio presentation mode — 16:9-friendly slides.
 * @param {{ portfolio: ReturnType<import('../../services/portfolioGenerator.js').generateVenturePortfolio> }} props
 */
export function PortfolioPresentationView({ portfolio }) {
  const slides = buildSlides();
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-sm font-semibold">
          Week 1 Review · {index + 1} / {slides.length}
        </p>
        <Link to={ROUTES.myVenturePortfolio} className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white">
          <X size={16} /> Exit
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center overflow-auto p-6">
        <div className="w-full max-w-5xl">
          {slide.type === 'cover' ? (
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-spike-dark p-10 shadow-projection">
              <div className="flex h-full flex-col justify-center">
                {portfolio.cover.photoUrl ? (
                  <img src={portfolio.cover.photoUrl} alt="" className="mb-6 h-24 w-24 rounded-2xl object-cover" />
                ) : null}
                <p className="text-sm font-bold uppercase tracking-widest text-spike-light">Venture Portfolio™</p>
                <h1 className="mt-2 text-4xl font-bold">{portfolio.cover.participantName}</h1>
                <p className="mt-4 text-xl text-spike-light">{portfolio.cover.tagline || 'My venture identity'}</p>
                <p className="mt-4 text-sm text-slate-300">
                  {portfolio.cover.squad} · {portfolio.cover.careerTrack}
                </p>
              </div>
            </div>
          ) : null}

          {slide.type === 'identity' ? (
            <PresentationSlide title="Venture Identity">
              <div className="grid gap-4 md:grid-cols-2">
                <SlideBlock title="Ambition" text={portfolio.identity.ambition} />
                <SlideBlock title="Impact" text={portfolio.identity.impact} />
                <SlideBlock title="Values" text={portfolio.identity.topThreeValues.join(' · ') || portfolio.identity.valuesProfile} />
                <SlideBlock title="Tagline" text={portfolio.identity.tagline} highlight />
              </div>
            </PresentationSlide>
          ) : null}

          {slide.type === 'dream-board' ? (
            <PresentationSlide title="Dream Board">
              <DreamBoardSlideCollage
                assets={portfolio.dreamBoard.assets}
                title="My Dream Board"
                layout="slide"
              />
            </PresentationSlide>
          ) : null}

          {slide.type === 'career' ? (
            <PresentationSlide title="Career Direction">
              <p className="text-2xl font-bold text-spike-light">{portfolio.career.trackLabel}</p>
              <p className="mt-4 text-lg leading-relaxed text-slate-200">
                Current focus: {portfolio.career.currentPosition} → Target: {portfolio.career.targetPosition} ({portfolio.career.projectedTimeline})
              </p>
            </PresentationSlide>
          ) : null}

          {slide.type === 'canvas' ? (
            <PresentationSlide title="Financial Entrepreneurship Canvas">
              <p className="text-sm text-slate-400">{portfolio.canvas.completionPct}% complete</p>
              <p className="mt-4 text-lg leading-relaxed">{portfolio.canvas.strategyStatement || 'Canvas in progress.'}</p>
            </PresentationSlide>
          ) : null}

          {slide.type === 'future-self' ? (
            <PresentationSlide title="My Future Self">
              <p className="text-lg font-semibold text-spike-light">{portfolio.identity.futureSelfSummary}</p>
              <p className="mt-4 line-clamp-6 text-sm leading-relaxed text-slate-300">{portfolio.identity.futureSelf}</p>
            </PresentationSlide>
          ) : null}

          {slide.type === 'close' ? (
            <PresentationSlide title="Week 1 Commitment">
              <p className="text-xl leading-relaxed">
                I am building a financial venture centered on {portfolio.identity.ambition?.split('.')[0] || 'my ambition'} —
                serving {portfolio.identity.impact?.split('.')[0] || 'my community'} with integrity.
              </p>
              <p className="mt-6 text-spike-light">Portfolio {portfolio.cover.portfolioCompletion}% · Blueprint {portfolio.cover.blueprintCompletion}%</p>
            </PresentationSlide>
          ) : null}
        </div>
      </main>

      <footer className="flex items-center justify-between border-t border-white/10 px-4 py-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-40"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <p className="text-sm text-slate-400">{slide.label}</p>
        <button
          type="button"
          disabled={index >= slides.length - 1}
          onClick={() => setIndex((i) => i + 1)}
          className="inline-flex items-center gap-1 rounded-lg bg-spike px-3 py-2 text-sm font-semibold disabled:opacity-40"
        >
          Next <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  );
}

function buildSlides() {
  return [
    { type: 'cover', label: 'Cover' },
    { type: 'identity', label: 'Identity' },
    { type: 'dream-board', label: 'Dream Board' },
    { type: 'career', label: 'Career' },
    { type: 'canvas', label: 'Canvas' },
    { type: 'future-self', label: 'Future Self' },
    { type: 'close', label: 'Commitment' },
  ];
}

/** @param {{ title: string, children: import('react').ReactNode }} props */
function PresentationSlide({ title, children }) {
  return (
    <div className="aspect-video rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-projection">
      <p className="text-xs font-bold uppercase tracking-widest text-spike-light">{title}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

/** @param {{ title: string, text?: string, highlight?: boolean }} props */
function SlideBlock({ title, text, highlight = false }) {
  return (
    <div className="rounded-xl bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
      <p className={`mt-2 text-sm leading-relaxed ${highlight ? 'text-lg font-semibold text-spike-light' : 'text-slate-200'}`}>
        {text || '—'}
      </p>
    </div>
  );
}
