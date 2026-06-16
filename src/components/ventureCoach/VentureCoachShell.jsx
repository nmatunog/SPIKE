import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { COACH_WELCOME } from '../../lib/ventureCoachConstants.js';
import {
  getCoachProgress,
  isCoachSectionEditLocked,
  markCoachStarted,
  resetCoachSection,
} from '../../lib/ventureCoachService.js';
import { BuilderResetButton } from '../day1/BuilderResetButton.jsx';
import { CoachProgressSidebar } from './CoachProgressSidebar.jsx';
import { CoachSectionNav } from './CoachSectionNav.jsx';
import {
  AmbitionCoachFlow,
  FutureSelfCoachFlow,
  ImpactCoachFlow,
  TaglineCoachFlow,
  ValuesCoachFlow,
  VentureDirectionCoachFlow,
} from './CoachSectionFlows.jsx';
import { CoachIdentityTriangle } from './CoachIdentityTriangle.jsx';
import { ROUTES, playbookHref } from '../../routes/paths.js';
import { UNLOCK_WEEK1_DAY2_PLUS } from '../../lib/programUnlocks.js';
import { getNextCoachSectionLabel, getNextCoachSectionRoute } from '../../lib/programContext.js';

const SECTION_TITLES = {
  ambition: 'My Ambition',
  impact: 'My Impact',
  purpose: 'My Impact',
  values: 'My Values',
  tagline: 'My Tagline',
  'future-self': 'My Future Self',
  'venture-direction': 'My Venture Direction',
};

/**
 * @param {{ participantId: string, section?: string }} props
 */
export function VentureCoachShell({ participantId, section }) {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [sectionKey, setSectionKey] = useState(0);
  const progress = getCoachProgress(participantId);

  function bumpProgress() {
    setRefreshKey((k) => k + 1);
  }

  if (!section) {
    const nextRoute = getNextCoachSectionRoute(participantId);
    const nextLabel = getNextCoachSectionLabel(participantId);
    const resume = progress.startedAt && nextRoute && progress.percent < 100;

    return (
      <div className="mx-auto max-w-3xl space-y-8 py-4">
          <CoachIdentityTriangle />
          <section className="overflow-hidden rounded-3xl border border-spike/15 bg-gradient-to-br from-slate-900 via-slate-800 to-spike-dark p-8 text-white shadow-projection sm:p-10">
          <div className="mb-4 flex items-center gap-2 text-spike-light">
            <Sparkles size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Venture Identity Builder</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Build your venture identity — step by step.</h2>
          <pre className="mt-6 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
            {COACH_WELCOME}
          </pre>
          <button
            type="button"
            onClick={() => {
              markCoachStarted(participantId);
              navigate(resume ? nextRoute : `${ROUTES.ventureBlueprint}/coach/ambition`);
            }}
            className="mt-8 inline-flex min-h-[48px] items-center rounded-xl bg-spike px-6 py-3 text-sm font-semibold text-white hover:bg-spike-light"
          >
            {resume ? `Continue: ${nextLabel}` : 'Start My Journey'}
          </button>
        </section>

        {progress.startedAt ? (
          <div className="spike-card">
            <p className="spike-label">Your progress</p>
            <p className="text-2xl font-bold text-slate-900">{progress.percent}% complete</p>
            {progress.percent >= 100 ? (
              <Link
                to={ROUTES.myVenturePortfolio}
                className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-spike px-5 py-2.5 text-sm font-semibold text-white hover:bg-spike-light"
              >
                View your Venture Portfolio →
              </Link>
            ) : (
              <Link
                to={`${ROUTES.ventureBlueprint}/coach/ambition`}
                className="mt-3 inline-block text-sm font-semibold text-spike hover:underline"
              >
                Continue coaching →
              </Link>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  const title = SECTION_TITLES[section] ?? 'AI Venture Coach';
  const sectionEditLocked = section ? isCoachSectionEditLocked(participantId, section) : false;

  function handleResetSection() {
    resetCoachSection(participantId, section);
    bumpProgress();
    setSectionKey((k) => k + 1);
  }

  function renderSection() {
    switch (section) {
      case 'ambition':
        return <AmbitionCoachFlow key={sectionKey} participantId={participantId} onProgress={bumpProgress} />;
      case 'impact':
      case 'purpose':
        return <ImpactCoachFlow key={sectionKey} participantId={participantId} onProgress={bumpProgress} />;
      case 'values':
        return <ValuesCoachFlow key={sectionKey} participantId={participantId} onProgress={bumpProgress} />;
      case 'tagline':
        return <TaglineCoachFlow key={sectionKey} participantId={participantId} onProgress={bumpProgress} />;
      case 'future-self':
        return <FutureSelfCoachFlow key={sectionKey} participantId={participantId} onProgress={bumpProgress} />;
      case 'venture-direction':
        return (
          <VentureDirectionCoachFlow
            key={sectionKey}
            participantId={participantId}
            onProgress={bumpProgress}
            onSectionComplete={() => navigate(ROUTES.myVenturePortfolio)}
          />
        );
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
    <div className="space-y-4">
      <Link
        to={section ? `${ROUTES.ventureBlueprint}/coach` : ROUTES.ventureBlueprint}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-spike"
      >
        <ArrowLeft size={16} /> {section ? 'Coach home' : 'Build home'}
      </Link>

      <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]">
        <div className="order-2 min-w-0 w-full space-y-4 lg:order-none">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="spike-label text-spike">AI Venture Coach™</p>
              <h3 className="text-xl font-semibold text-slate-900 lg:text-2xl">{title}</h3>
            </div>
            <BuilderResetButton
              onReset={handleResetSection}
              disabled={sectionEditLocked}
              label="Start this section over"
              confirmMessage="Clear this coach section and start over? Your saved draft for this step will be removed."
            />
          </header>
          <CoachSectionNav activeSection={section} />
          {UNLOCK_WEEK1_DAY2_PLUS && section === 'ambition' ? (
            <p className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
              Day 2 Playbook is open even if Day 1 is incomplete.{' '}
              <Link to={playbookHref({ week: 1, day: 2 })} className="font-semibold text-spike hover:underline">
                Open Day 2 Playbook →
              </Link>
            </p>
          ) : null}
          {renderSection()}
        </div>
        <div className="order-1 lg:order-none">
          <CoachProgressSidebar key={refreshKey} progress={getCoachProgress(participantId)} activeSection={section} />
        </div>
      </div>
    </div>
  );
}
