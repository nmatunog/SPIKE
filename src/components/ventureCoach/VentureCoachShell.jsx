import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { COACH_WELCOME } from '../../lib/ventureCoachConstants.js';
import {
  getCoachProgress,
  markCoachStarted,
} from '../../lib/ventureCoachService.js';
import { CoachProgressSidebar } from './CoachProgressSidebar.jsx';
import {
  AmbitionCoachFlow,
  FutureSelfCoachFlow,
  PurposeCoachFlow,
  ValuesCoachFlow,
  VentureDirectionCoachFlow,
} from './CoachSectionFlows.jsx';
import { ROUTES } from '../../routes/paths.js';

const SECTION_TITLES = {
  ambition: 'My Ambition',
  purpose: 'My Purpose',
  values: 'My Values',
  'future-self': 'My Future Self',
  'venture-direction': 'My Venture Direction',
};

/**
 * @param {{ participantId: string, section?: string }} props
 */
export function VentureCoachShell({ participantId, section }) {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const progress = getCoachProgress(participantId);

  function bumpProgress() {
    setRefreshKey((k) => k + 1);
  }

  if (!section) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-4">
        <section className="overflow-hidden rounded-3xl border border-spike/15 bg-gradient-to-br from-slate-900 via-slate-800 to-spike-dark p-8 text-white shadow-projection sm:p-10">
          <div className="mb-4 flex items-center gap-2 text-spike-light">
            <Sparkles size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">AI Venture Coach™</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Build your future — one conversation at a time.</h2>
          <pre className="mt-6 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
            {COACH_WELCOME}
          </pre>
          <button
            type="button"
            onClick={() => {
              markCoachStarted(participantId);
              navigate(`${ROUTES.ventureBlueprint}/coach/ambition`);
            }}
            className="mt-8 inline-flex min-h-[48px] items-center rounded-xl bg-spike px-6 py-3 text-sm font-semibold text-white hover:bg-spike-light"
          >
            Start My Journey
          </button>
        </section>

        {progress.startedAt ? (
          <div className="spike-card">
            <p className="spike-label">Your progress</p>
            <p className="text-2xl font-bold text-slate-900">{progress.percent}% complete</p>
            <Link to={`${ROUTES.ventureBlueprint}/coach/ambition`} className="mt-3 inline-block text-sm font-semibold text-spike hover:underline">
              Continue coaching →
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  const title = SECTION_TITLES[section] ?? 'AI Venture Coach';

  function renderSection() {
    switch (section) {
      case 'ambition':
        return <AmbitionCoachFlow participantId={participantId} onProgress={bumpProgress} />;
      case 'purpose':
        return <PurposeCoachFlow participantId={participantId} onProgress={bumpProgress} />;
      case 'values':
        return <ValuesCoachFlow participantId={participantId} onProgress={bumpProgress} />;
      case 'future-self':
        return <FutureSelfCoachFlow participantId={participantId} onProgress={bumpProgress} />;
      case 'venture-direction':
        return <VentureDirectionCoachFlow participantId={participantId} onProgress={bumpProgress} />;
      default:
        return (
          <p className="text-sm text-slate-600">
            Unknown section.{' '}
            <Link to={`${ROUTES.ventureBlueprint}/coach`} className="font-semibold text-spike">
              Return to coach home
            </Link>
          </p>
        );
    }
  }

  return (
    <div className="space-y-4" key={refreshKey}>
      <Link
        to={section ? `${ROUTES.ventureBlueprint}/coach` : ROUTES.ventureBlueprint}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-spike"
      >
        <ArrowLeft size={16} /> Coach home
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <CoachProgressSidebar progress={progress} activeSection={section} />
        <div className="min-w-0 space-y-4">
          <header>
            <p className="spike-label text-spike">AI Venture Coach™</p>
            <h3 className="text-xl font-semibold text-slate-900 lg:text-2xl">{title}</h3>
          </header>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
