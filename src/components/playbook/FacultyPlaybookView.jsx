import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { Day4VentureDesignHero } from './ventureDesign/Day4VentureDesignHero.jsx';
import { Week2ActivateHero } from './week2/Week2ActivateHero.jsx';
import { Week3Day1PlaybookHero } from './week3/Week3Day1PlaybookHero.jsx';
import { Week3Day3PlaybookHero } from './week3/Week3Day3PlaybookHero.jsx';
import { Week3Day3PortfolioMission } from './week3/Week3Day3PortfolioMission.jsx';
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
  const week2DayMatch = bundle.day.id.match(/day-segment-1-week-2-day-(\d+)/);
  const week2Day = week2DayMatch ? Number(week2DayMatch[1]) : 0;

  return (
    <div className="space-y-6">
      {isWeek2Day1 ? <Week2ActivateHero variant="faculty" /> : null}
      {isWeek3Day1 ? <Week3Day1PlaybookHero /> : null}
      {isWeek3Day3 ? (
        <>
          <Week3Day3PlaybookHero />
          <Week3Day3PortfolioMission participantId="" staffPreview />
        </>
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
      ) : resolvePresentations(bundle, bundle.day.presentations ?? []).length ? (
        resolvePresentations(bundle, bundle.day.presentations ?? []).map((pres) => (
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
