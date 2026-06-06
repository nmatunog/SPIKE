import { Clock, Target } from 'lucide-react';
import { PresentationViewer } from './PresentationViewer.jsx';
import { ActivityViewer } from './ActivityViewer.jsx';
import { WorksheetViewer } from './WorksheetViewer.jsx';
import { AssessmentPanel } from './AssessmentPanel.jsx';
import { DayContributionChips } from './DayContributionChips.jsx';

/**
 * @typedef {import('../../lib/contentLoader.js').DayContentBundle} DayContentBundle
 */

function SectionTitle({ children }) {
  return (
    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{children}</h4>
  );
}

function SectionCard({ title, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-gray-100 bg-gray-50/60 p-4 ${className}`}>
      {title ? <SectionTitle>{title}</SectionTitle> : null}
      {children}
    </section>
  );
}

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
    <div className="space-y-6">
      <header className="border-b border-gray-100 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <Target className="mt-1 shrink-0 text-[#8B0000]" size={20} />
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{day.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{day.theme}</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-600 ring-1 ring-gray-200">
            <Clock size={14} /> {day.durationHours}h
          </span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Learning objectives">
          <ul className="space-y-1.5 text-sm text-gray-700">
            {day.learningObjectives.map((obj) => (
              <li key={obj} className="rounded-lg border border-white bg-white px-3 py-2 shadow-sm">
                {obj}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Expected outputs">
          <ul className="space-y-1 text-sm text-gray-700">
            {day.expectedOutputs.map((out) => (
              <li key={out}>• {out}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Portfolio deliverables">
          <ul className="space-y-1 text-sm text-gray-700">
            {day.portfolioDeliverables.map((d) => (
              <li key={d}>• {d}</li>
            ))}
          </ul>
          <p className="mt-3 border-t border-gray-200 pt-3 text-sm text-gray-600">
            <span className="font-semibold text-gray-800">Business plan:</span>{' '}
            {day.businessPlanIntegration}
          </p>
        </SectionCard>

        <SectionCard title="Blueprint mapping">
          <DayContributionChips contributions={contributions} />
        </SectionCard>
      </div>

      <section>
        <SectionTitle>Presentation</SectionTitle>
        <PresentationViewer
          presentation={presentation.presentation}
          slides={presentation.slides}
        />
      </section>

      <section>
        <SectionTitle>Activities</SectionTitle>
        <div className="grid gap-4 xl:grid-cols-2">
          {activities.activities.map((activity) => (
            <ActivityViewer key={activity.id} activity={activity} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Worksheets</SectionTitle>
        <div className="max-w-3xl">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <SectionTitle>Assessment</SectionTitle>
          <AssessmentPanel
            assessment={assessment.assessment}
            rubric={assessment.rubric}
          />
        </section>

        <section>
          <SectionTitle>Survey (definition)</SectionTitle>
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
    </div>
  );
}
