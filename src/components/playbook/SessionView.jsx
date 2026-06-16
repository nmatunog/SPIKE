import { PresentationViewer } from './PresentationViewer.jsx';
import { ActivityViewer } from './ActivityViewer.jsx';
import { WorksheetViewer } from './WorksheetViewer.jsx';
import { AssessmentPanel } from './AssessmentPanel.jsx';
import { ReflectionViewer } from './ReflectionViewer.jsx';
import { SurveyViewer } from './SurveyViewer.jsx';
import { VentureStudioLaunchCard } from './ventureStudio/VentureStudioLaunchCard.jsx';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { resolvePresentations } from '../../lib/contentLoader.js';
import { BLUEPRINT_LINKS, ROUTES } from '../../routes/paths.js';
import { isDayClosingReflection } from '../../lib/dayClosingReflection.js';

const DAY3_ID = 'day-segment-1-week-1-day-3';
const VENTURE_STUDIO_ACTIVITY_ID = 'activity-day-3-persona-workshop';

/**
 * @typedef {import('../../lib/contentLoader.js').DayContentBundle} DayContentBundle
 * @typedef {import('../../types/playbook').Session} Session
 */

/**
 * @param {{
 *   session: Session,
 *   bundle: DayContentBundle,
 *   participantId?: string,
 *   onProgress?: () => void,
 *   showSpeakerNotes?: boolean,
 *   hideWorksheets?: boolean,
 *   hidePersonaWorksheet?: boolean,
 * }} props
 */
export function SessionView({
  session,
  bundle,
  participantId,
  onProgress,
  showSpeakerNotes = false,
  hideWorksheets = false,
  hidePersonaWorksheet = false,
}) {
  const { activities, worksheets, assessment, reflections, survey } = bundle;
  const isDay3 = bundle.day.id === DAY3_ID;
  const showVentureStudio =
    isDay3
    && (session.activityIds.includes(VENTURE_STUDIO_ACTIVITY_ID)
      || session.presentationIds.includes('presentation-day-3-deck-02'));

  const sessionPresentations =
    session.presentationIds.length > 0
      ? resolvePresentations(bundle, session.presentationIds).filter(
          (pres) => pres.presentation.id !== 'presentation-day-3-deck-02',
        )
      : [];

  const sessionActivities = (activities?.activities ?? []).filter((a) =>
    session.activityIds.includes(a.id),
  );

  const hadPersonaWorksheet =
    hidePersonaWorksheet && session.worksheetIds.includes('worksheet-day-3-persona');

  const sessionWorksheets = (worksheets?.worksheets ?? []).filter((w) =>
    session.worksheetIds.includes(w.id)
    && !(hidePersonaWorksheet && w.id === 'worksheet-day-3-persona'),
  );

  const sessionReflections = (reflections?.reflections ?? []).filter(
    (r) => session.reflectionIds.includes(r.id) && !isDayClosingReflection(r.id),
  );

  const showAssessment =
    session.assessmentIds.length > 0 &&
    assessment?.assessment &&
    session.assessmentIds.includes(assessment.assessment.id);

  const showSurvey =
    session.surveyIds?.length > 0 &&
    survey?.survey &&
    session.surveyIds.includes(survey.survey.id);

  return (
    <div className="space-y-6">
      <header className="border-b border-gray-100 pb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#8B0000]">
          Session {session.sessionNumber}
        </p>
        <h3 className="mt-1 text-lg font-bold text-gray-900">{session.title}</h3>
        <p className="mt-1 text-sm text-gray-600">{session.durationMinutes} minutes</p>
      </header>

      {sessionPresentations.map((pres, idx) => (
        <section key={`pres-${idx}`}>
          <PresentationViewer
            presentation={pres.presentation}
            slides={pres.slides}
            facultyMode={showSpeakerNotes}
          />
        </section>
      ))}

      {showVentureStudio ? (
        <section aria-label="Venture Studio interactive module">
          <VentureStudioLaunchCard
            participantId={participantId}
            facultyMode={showSpeakerNotes}
            presentMode={showSpeakerNotes}
          />
        </section>
      ) : null}

      {sessionActivities.length > 0 ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Activities
          </h4>
          <div className="grid gap-4 xl:grid-cols-2">
            {sessionActivities.map((activity) => (
              <ActivityViewer
                key={activity.id}
                activity={activity}
                participantId={participantId}
                onCompleted={onProgress}
                ventureStudioHref={
                  activity.id === VENTURE_STUDIO_ACTIVITY_ID ? ROUTES.playbookVentureStudio : undefined
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {sessionWorksheets.length > 0 && !hideWorksheets ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Worksheets
          </h4>
          <div className="max-w-3xl space-y-4">
            {sessionWorksheets.map((ws) => (
              <WorksheetViewer
                key={ws.id}
                worksheet={ws}
                questions={(worksheets?.questions ?? []).filter((q) => q.worksheetId === ws.id)}
                participantId={participantId}
                onCompleted={onProgress}
              />
            ))}
          </div>
        </section>
      ) : null}

      {hadPersonaWorksheet ? (
        <section className="rounded-2xl border border-spike/20 bg-spike-muted/50 p-5">
          <h4 className="mb-2 text-sm font-bold text-spike">Persona worksheet replaced</h4>
          <p className="mb-4 text-sm text-slate-700">
            The persona canvas worksheet is replaced by Venture Studio. Complete all five steps to
            capture your customer segment, problems, and opportunity.
          </p>
          <Link to={ROUTES.playbookVentureStudio} className="spike-btn-primary inline-flex">
            Open Venture Studio
          </Link>
        </section>
      ) : null}

      {sessionWorksheets.length > 0 && hideWorksheets ? (
        <section className="rounded-2xl border border-spike/20 bg-spike-muted/50 p-5">
          <h4 className="mb-2 text-sm font-bold text-spike">Venture Blueprint Builders™</h4>
          <p className="mb-4 text-sm text-slate-700">
            Day 1 worksheets are replaced by interactive builders. Complete your mission in the
            Blueprint Builders experience.
          </p>
          <Link to={BLUEPRINT_LINKS.day1Builders} className="spike-btn-primary inline-flex">
            <Rocket size={16} /> Open Day 1 Builders
          </Link>
        </section>
      ) : null}

      {showAssessment ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Assessment
          </h4>
          <AssessmentPanel assessment={assessment.assessment} rubric={assessment.rubric} />
        </section>
      ) : null}

      {showSurvey ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Survey</h4>
          <SurveyViewer
            survey={survey.survey}
            questions={survey.questions}
            participantId={participantId}
            onCompleted={onProgress}
          />
        </section>
      ) : null}

      {sessionReflections.length > 0 ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Reflection
          </h4>
          {sessionReflections.map((ref) => (
            <ReflectionViewer
              key={ref.id}
              reflection={ref}
              participantId={participantId}
              onCompleted={onProgress}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}
