import { Briefcase } from 'lucide-react';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';
import { portfolioSectionProgress } from '../lib/sprint01Metrics.js';

const SECTIONS = [
  'Identity & Purpose',
  'Market Intelligence',
  'Financial Blueprint',
  'Professional Development',
  'Advisor Startup Blueprint',
  '3-Year Blueprint',
];

export function PortfolioPage({ hours = 0 }) {
  return (
    <PageContainer>
      <div className="mb-6 sm:mb-8">
        <PageTitle>Venture Portfolio</PageTitle>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          Participant venture portfolio — section progress uses traction hours until Phase 3 persistence.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((section, idx) => {
          const pct = portfolioSectionProgress(hours, idx);
          const completed = Math.floor(pct / 25);
          const pending = Math.max(3 - completed, 0);
          return (
            <div key={section} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-start gap-2">
                <Briefcase size={18} className="mt-0.5 shrink-0 text-[#8B0000]" />
                <h3 className="font-bold text-gray-900">{section}</h3>
              </div>
              <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-[#8B0000] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs font-bold text-gray-500">Progress: {pct}%</p>
              <p className="mt-2 text-sm text-gray-600">
                Completed: {completed} · Pending: {pending}
              </p>
              <p className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                Deliverables for this section will be editable in a later sprint.
              </p>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
