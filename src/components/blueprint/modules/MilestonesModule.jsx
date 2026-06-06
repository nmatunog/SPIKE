import { CheckCircle, Circle } from 'lucide-react';
import {
  getBusinessPlanChapterById,
  getCompetencyById,
  getMilestoneById,
  getMilestonesForSegment,
  getPortfolioSectionById,
  getWeekIntegrations,
} from '../../../lib/playbookSeeds.js';

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-3 font-bold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

/**
 * PR4 — Segment milestone gates + week integration map.
 * @param {{ state: { segment: number, hours: number, week: number } }} props
 */
export function MilestonesModule({ state }) {
  const segmentId = `segment-${state.segment}`;
  const milestones = getMilestonesForSegment(segmentId);
  const integrations = getWeekIntegrations();

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Hour gates for Segment {state.segment}. Each milestone connects weekly Playbook work to
        portfolio, business plan, and competency evidence.
      </p>

      <SectionCard title="Milestone gates">
        <ul className="space-y-3">
          {milestones.map((m) => {
            const reached = state.hours >= m.targetHour;
            const Icon = reached ? CheckCircle : Circle;
            return (
              <li
                key={m.id}
                className={`flex gap-3 rounded-xl border p-4 ${
                  reached ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white'
                }`}
              >
                <Icon
                  size={20}
                  className={`mt-0.5 shrink-0 ${reached ? 'text-green-600' : 'text-gray-400'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-bold text-gray-900">{m.title}</p>
                    <span className="text-xs font-bold text-gray-500">Hour {m.targetHour}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{m.description}</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-[#8B0000] transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((state.hours / m.targetHour) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard title="Week integrations (Segment 1)">
        <div className="space-y-3">
          {integrations.map((row, idx) => {
            const weekNum = idx + 1;
            const active = state.week === weekNum;
            let chapterTitle = row.businessPlanChapter;
            let portfolioTitle = row.portfolioSection;
            try {
              chapterTitle = getBusinessPlanChapterById(row.businessPlanChapter).title;
            } catch {
              /* seed id fallback */
            }
            try {
              portfolioTitle = getPortfolioSectionById(row.portfolioSection).title;
            } catch {
              /* seed id fallback */
            }
            let milestoneTitle = row.milestoneReview;
            try {
              milestoneTitle = getMilestoneById(row.milestoneReview).title;
            } catch {
              /* seed id fallback */
            }

            return (
              <div
                key={row.weekId}
                className={`rounded-xl border p-4 text-sm ${
                  active ? 'border-[#8B0000] bg-red-50/40' : 'border-gray-200'
                }`}
              >
                <p className="font-bold text-gray-900">
                  Week {weekNum}
                  {active ? ' · Current week' : ''}
                </p>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-gray-500">Business plan</dt>
                    <dd className="text-gray-800">{chapterTitle}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-gray-500">Portfolio</dt>
                    <dd className="text-gray-800">{portfolioTitle}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[11px] font-bold uppercase text-gray-500">Competencies</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {row.competencyTargets.map((id) => {
                        let label = id;
                        try {
                          label = getCompetencyById(id).title;
                        } catch {
                          /* fallback */
                        }
                        return (
                          <span
                            key={id}
                            className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-700 ring-1 ring-gray-200"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-gray-500">Milestone review</dt>
                    <dd className="text-gray-800">{milestoneTitle}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
