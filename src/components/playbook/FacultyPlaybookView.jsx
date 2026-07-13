import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { Day4VentureDesignHero } from './ventureDesign/Day4VentureDesignHero.jsx';
import { Week2ActivateHero } from './week2/Week2ActivateHero.jsx';
import { Week3Day1PlaybookHero } from './week3/Week3Day1PlaybookHero.jsx';
import { Week3Day3PlaybookHero } from './week3/Week3Day3PlaybookHero.jsx';
import { Week3Day3PortfolioMission } from './week3/Week3Day3PortfolioMission.jsx';
import { Week3Day4PlaybookHero } from './week3/Week3Day4PlaybookHero.jsx';
import { Week4Day1PlaybookHero } from './week4/Week4Day1PlaybookHero.jsx';
import { Week4Day2PlaybookHero } from './week4/Week4Day2PlaybookHero.jsx';
import { Week5PlaybookHero } from './week5/Week5PlaybookHero.jsx';
import { Week5Day1MissionFlow } from './week5/Week5Day1MissionFlow.jsx';
import { Week5Day2MissionFlow } from './week5/Week5Day2MissionFlow.jsx';
import { GrowthEngineWorksheet } from './week3/GrowthEngineWorksheet.jsx';
import { FinancialEngineWorksheet } from './week3/FinancialEngineWorksheet.jsx';
import { BusinessEngineCanvasBlankPreview } from './week3/businessEngine/BusinessEngineCanvasBlankPreview.jsx';
import { Week3Day5FecPitchPanel } from './week3/Week3Day5FecPitchPanel.jsx';
import { Week2StudioLaunchCard } from './week2/Week2StudioLaunchCard.jsx';
import { EvaluationTemplatesPanel } from './EvaluationTemplatesPanel.jsx';
import { FacilitatorGuidePanel } from './FacilitatorGuidePanel.jsx';
import { MentorGuidePanel } from './MentorGuidePanel.jsx';
import { SessionView } from './SessionView.jsx';
import { PresentationViewer } from './PresentationViewer.jsx';
import { resolvePresentations } from '../../lib/contentLoader.js';
import { PROGRAM_COACH_LABEL } from '../../lib/terminology.js';

/**
 * @typedef {import('../../lib/contentLoader.js').DayContentBundle} DayContentBundle
 */

/**
 * @param {{ bundle: DayContentBundle }} props
 */
export function FacultyPlaybookView({ bundle }) {
  const sessions = bundle.sessions?.sessions ?? [];
  const [sessionIndex, setSessionIndex] = useState(0);
  const activeSession = sessions[sessionIndex];
  const isDay4 = bundle.day.id === 'day-segment-1-week-1-day-4';
  const isWeek2Day1 = bundle.day.id === 'day-segment-1-week-2-day-1';
  const isWeek3Day1 = bundle.day.id === 'day-segment-1-week-3-day-1';
  const isWeek3Day3 = bundle.day.id === 'day-segment-1-week-3-day-3';
  const isWeek3Day4 = bundle.day.id === 'day-segment-1-week-3-day-4';
  const isWeek3Day5 = bundle.day.id === 'day-segment-1-week-3-day-5';
  const isWeek4Day1 = bundle.day.id === 'day-segment-1-week-4-day-1';
  const isWeek4Day2 = bundle.day.id === 'day-segment-1-week-4-day-2';
  const isWeek5 = bundle.day.id?.startsWith('day-segment-1-week-5-');
  const isWeek5Day1 = bundle.day.id === 'day-segment-1-week-5-day-1';
  const isWeek5Day2 = bundle.day.id === 'day-segment-1-week-5-day-2';
  const week2DayMatch = bundle.day.id.match(/day-segment-1-week-2-day-(\d+)/);
  const week2Day = week2DayMatch ? Number(week2DayMatch[1]) : 0;
  const facultyPresentations = resolvePresentations(bundle, bundle.day.presentations ?? []).filter(
    (pres) =>
      pres.presentation.id !== 'presentation-w3-d3-deck-02'
      && pres.presentation.id !== 'presentation-w3-d4-deck-02',
  );

  return (
    <div className="space-y-6">
      {isWeek2Day1 ? <Week2ActivateHero variant="faculty" /> : null}
      {isWeek3Day1 ? <Week3Day1PlaybookHero allowDownload /> : null}
      {isWeek4Day1 ? <Week4Day1PlaybookHero allowDownload /> : null}
      {isWeek4Day2 ? <Week4Day2PlaybookHero allowDownload /> : null}
      {isWeek5 ? <Week5PlaybookHero allowDownload showDay1Deck={isWeek5Day1} /> : null}
      {isWeek5Day1 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike">Week 5 · Day 1 preview</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">Finalize the Business</h3>
          <p className="mt-2 text-sm text-slate-600">Participant mission workbook — all fields optional, no blocking validation.</p>
          <div className="mt-4">
            <Week5Day1MissionFlow participantId="" readOnly />
          </div>
        </section>
      ) : null}
      {isWeek5Day2 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike">Week 5 · Day 2 preview</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">Build the Final Pitch</h3>
          <p className="mt-2 text-sm text-slate-600">Pitch storyboard, panel bank, and readiness checklist preview.</p>
          <div className="mt-4">
            <Week5Day2MissionFlow participantId="" readOnly />
          </div>
        </section>
      ) : null}
      {isWeek3Day3 ? (
        <>
          <Week3Day3PlaybookHero />
          <BusinessEngineCanvasBlankPreview compact roleLabel={`${PROGRAM_COACH_LABEL} delivery`} />
          <Week3Day3PortfolioMission participantId="" staffPreview />
        </>
      ) : null}
      {isWeek3Day4 ? (
        <>
          <Week3Day4PlaybookHero />
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
            <GrowthEngineWorksheet readOnly />
          </section>
          <section className="rounded-3xl border border-emerald-200/80 bg-white p-4 shadow-card sm:p-6">
            <FinancialEngineWorksheet readOnly />
          </section>
        </>
      ) : null}
      {isWeek3Day5 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
          <Week3Day5FecPitchPanel participantId="" readOnly />
        </section>
      ) : null}
      {week2Day > 0 ? (
        <Week2StudioLaunchCard facultyMode day={week2Day} mission="mission" />
      ) : null}
      {isDay4 ? <Day4VentureDesignHero variant="faculty" /> : null}

      <header className="border-b border-gray-100 pb-4">
        <h3 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
          <GraduationCap size={20} className="text-indigo-700" />
          {PROGRAM_COACH_LABEL} view — {bundle.day.title}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Slides, speaker notes, facilitator guide, and debrief for delivery.
        </p>
      </header>

      {bundle.facilitator ? <FacilitatorGuidePanel guide={bundle.facilitator} /> : null}

      {bundle.evaluations?.templates?.length ? (
        <EvaluationTemplatesPanel templates={bundle.evaluations.templates} />
      ) : null}

      {bundle.mentorGuide ? <MentorGuidePanel guide={bundle.mentorGuide} /> : null}

      {sessions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sessions.map((session, idx) => (
            <button
              key={session.id}
              type="button"
              onClick={() => setSessionIndex(idx)}
              className={`min-h-[40px] rounded-lg px-3 py-2 text-sm font-bold transition ${
                sessionIndex === idx
                  ? 'bg-indigo-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Session {session.sessionNumber}: {session.title}
            </button>
          ))}
        </div>
      ) : null}

      {activeSession ? (
        <SessionView session={activeSession} bundle={bundle} showSpeakerNotes />
      ) : facultyPresentations.length ? (
        facultyPresentations.map((pres) => (
          <PresentationViewer
            key={pres.presentation.id}
            presentation={pres.presentation}
            slides={pres.slides}
            facultyMode
          />
        ))
      ) : null}
    </div>
  );
}
