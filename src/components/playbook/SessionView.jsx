import { PresentationViewer } from './PresentationViewer.jsx';
import { ActivityViewer } from './ActivityViewer.jsx';
import { WorksheetViewer } from './WorksheetViewer.jsx';
import { AssessmentPanel } from './AssessmentPanel.jsx';
import { ReflectionViewer } from './ReflectionViewer.jsx';

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
 * }} props
 */
export function SessionView({
  session,
  bundle,
  participantId,
  onProgress,
  showSpeakerNotes = false,
}) {
  const { presentation, activities, worksheets, assessment, reflections } = bundle;

  const sessionPresentations =
    session.presentationIds.length > 0 && presentation?.presentation
      ? [{ presentation: presentation.presentation, slides: presentation.slides }]
      : [];

  const sessionActivities = (activities?.activities ?? []).filter((a) =>
    session.activityIds.includes(a.id),
  );

  const sessionWorksheets = (worksheets?.worksheets ?? []).filter((w) =>
    session.worksheetIds.includes(w.id),
  );

  const sessionReflections = (reflections?.reflections ?? []).filter((r) =>
    session.reflectionIds.includes(r.id),
  );

  const showAssessment =
    session.assessmentIds.length > 0 &&
    assessment?.assessment &&
    session.assessmentIds.includes(assessment.assessment.id);

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
              />
            ))}
          </div>
        </section>
      ) : null}

      {sessionWorksheets.length > 0 ? (
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

      {showAssessment ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Assessment
          </h4>
          <AssessmentPanel assessment={assessment.assessment} rubric={assessment.rubric} />
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
