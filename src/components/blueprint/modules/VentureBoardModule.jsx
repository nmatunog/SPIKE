import {
  getVentureBoardCriteriaForBoard,
  getVentureBoardsForSegment,
} from '../../../lib/playbookSeeds.js';
import { listBusinessPlanArtifacts, listPortfolioArtifacts } from '../../../lib/blueprintArtifacts.js';

const WORKFLOW_STEPS = [
  { id: 'portfolio_ready', label: 'Portfolio Ready', fromStatus: 'not_started' },
  { id: 'mentor_review', label: 'Mentor Review', fromStatus: 'preparing' },
  { id: 'faculty_review', label: 'Faculty Review', fromStatus: 'preparing' },
  { id: 'board_scheduling', label: 'Board Scheduling', fromStatus: 'in_progress' },
  { id: 'presentation', label: 'Presentation', fromStatus: 'in_progress' },
  { id: 'scoring', label: 'Scoring', fromStatus: 'in_progress' },
  { id: 'decision', label: 'Decision', fromStatus: 'in_progress' },
];

function workflowStepIndex(status) {
  if (status === 'not_started') return 0;
  if (status === 'preparing') return 1;
  if (status === 'in_progress') return 3;
  if (status === 'submitted' || status === 'completed') return 6;
  return 0;
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-3 font-bold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

/**
 * PR4 — Venture Board read-only shell + packet readiness from artifact drafts.
 * @param {{ state: object, participantId?: string }} props
 */
export function VentureBoardModule({ state, participantId }) {
  const boards = getVentureBoardsForSegment(`segment-${state.segment}`);
  const board = boards[0];
  const criteria = board ? getVentureBoardCriteriaForBoard(board.id) : [];
  const activeStep = workflowStepIndex(state.venture_board_status);

  const portfolioCount = participantId ? listPortfolioArtifacts(participantId).length : 0;
  const planCount = participantId ? listBusinessPlanArtifacts(participantId).length : 0;

  const packetSections = [
    { label: 'Vision', ready: portfolioCount > 0 },
    { label: 'Canvas / Business Plan', ready: planCount > 0 },
    { label: 'Market Research', ready: false },
    { label: '3-Year Blueprint', ready: planCount > 0 },
  ];

  return (
    <div className="space-y-4">
      {board ? (
        <SectionCard title={board.title}>
          <p className="text-sm text-gray-600">
            Target hour {board.targetHour} · Status:{' '}
            <span className="font-bold text-gray-800">
              {state.venture_board_status.replace(/_/g, ' ')}
            </span>
          </p>
          <ul className="mt-3 space-y-2">
            {criteria.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{c.title}</span>
                <span className="text-gray-500">{c.weight}%</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <SectionCard title="Hour 200 packet readiness">
        <ul className="space-y-2 text-sm">
          {packetSections.map((s) => (
            <li key={s.label} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-800">{s.label}</span>
              <span
                className={`text-xs font-bold ${s.ready ? 'text-green-700' : 'text-gray-400'}`}
              >
                {s.ready ? 'Draft started' : 'Pending'}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Board workflow">
        <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {WORKFLOW_STEPS.map((step, idx) => (
            <li
              key={step.id}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                idx <= activeStep
                  ? 'bg-[#8B0000] text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                {idx + 1}
              </span>
              {step.label}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-gray-500">
          Workflow engine ships in a later sprint — steps preview readiness only.
        </p>
      </SectionCard>
    </div>
  );
}
