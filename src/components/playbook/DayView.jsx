import { Clock, Target } from 'lucide-react';
import { PresentationViewer } from './PresentationViewer.jsx';
import { ActivityViewer } from './ActivityViewer.jsx';
import { WorksheetViewer } from './WorksheetViewer.jsx';
import { AssessmentPanel } from './AssessmentPanel.jsx';
import { DayContributionChips } from './DayContributionChips.jsx';

/**
 * @typedef {import('../../lib/contentLoader.js').DayContentBundle} DayContentBundle
 */

/**
 * @param {{
 *   bundle: DayContentBundle,
 *   participantId?: string,
 *   onWorksheetCompleted?: () => void,
 * }} props
 */
export function DayView({ bundle, participantId, onWorksheetCompleted }) {
  const { day, presentation, activities, worksheets, assessment, survey, contributions } = bundle;

  return (
    <div className="space-y-8">
      <header>
        <div className="flex flex-wrap items-start gap-2">
          <Target className="mt-1 shrink-0 text-[#8B0000]" size={20} />
          <div>
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{day.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{day.theme}</p>
          </div>
        </div>
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-gray-500">
          <Clock size={14} /> {day.durationHours} hours
        </p>
      </header>

      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Learning objectives
        </h4>
        <ul className="space-y-1 text-sm text-gray-700">
          {day.learningObjectives.map((obj) => (
            <li key={obj} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              {obj}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Expected outputs
        </h4>
        <ul className="space-y-1 text-sm text-gray-700">
          {day.expectedOutputs.map((out) => (
            <li key={out}>• {out}</li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Portfolio deliverables (day)
        </h4>
        <ul className="space-y-1 text-sm text-gray-700">
          {day.portfolioDeliverables.map((d) => (
            <li key={d}>• {d}</li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-semibold">Business plan:</span> {day.businessPlanIntegration}
        </p>
      </section>

      <section>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
          Blueprint mapping
        </h4>
        <DayContributionChips contributions={contributions} />
      </section>

      <section>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
          Presentation
        </h4>
        <PresentationViewer
          presentation={presentation.presentation}
          slides={presentation.slides}
        />
      </section>

      <section>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
          Activities
        </h4>
        <div className="space-y-4">
          {activities.activities.map((activity) => (
            <ActivityViewer key={activity.id} activity={activity} />
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
          Worksheets
        </h4>
        <div className="space-y-4">
          {worksheets.worksheets.map((ws) => (
            <WorksheetViewer
              key={ws.id}
              worksheet={ws}
              questions={worksheets.questions.filter((q) => q.worksheetId === ws.id)}
              participantId={participantId}
              onCompleted={onWorksheetCompleted}
            />
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
          Assessment
        </h4>
        <AssessmentPanel
          assessment={assessment.assessment}
          rubric={assessment.rubric}
        />
      </section>

      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Survey (definition)
        </h4>
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-bold text-gray-800">{survey.survey.title}</p>
          <p className="mt-1">{survey.survey.description}</p>
          <p className="mt-2 text-xs uppercase text-gray-500">Status: {survey.survey.status}</p>
          <ul className="mt-3 space-y-1">
            {survey.questions.map((q) => (
              <li key={q.id}>• {q.prompt}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
