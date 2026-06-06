import { FlaskConical, Map, FileText, Users, ClipboardList } from 'lucide-react';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';

const SUBSECTIONS = [
  { name: 'Surveys', icon: ClipboardList, count: 0, hint: 'Needs analysis & market surveys' },
  { name: 'Respondents', icon: Users, count: 0, hint: 'Gen Z / millennial profiles' },
  { name: 'Research Reports', icon: FileText, count: 0, hint: 'Squad debrief outputs' },
  { name: 'Opportunity Maps', icon: Map, count: 0, hint: 'Market gap visualizations' },
];

export function ResearchPage() {
  return (
    <PageContainer>
      <div className="mb-6 sm:mb-8">
        <PageTitle>Research Squad</PageTitle>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          Research activities workspace — Sprint 01 placeholder UI. Counts stay at zero until backend wiring.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUBSECTIONS.map((item) => {
          const SubIcon = item.icon;
          return (
            <div
              key={item.name}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:min-h-[180px] sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <SubIcon size={24} className="text-[#8B0000]" />
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                  {item.count} items
                </span>
              </div>
              <h3 className="font-bold text-gray-900">{item.name}</h3>
              <p className="mt-2 flex-grow text-xs text-gray-500">{item.hint}</p>
              <button
                type="button"
                disabled
                className="mt-4 min-h-[44px] w-full rounded-lg border border-dashed border-gray-300 py-2.5 text-xs font-bold text-gray-400"
              >
                Add {item.name.slice(0, -1)} — coming soon
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center sm:mt-8 sm:p-8">
        <FlaskConical size={32} className="mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-600">
          No research squad data yet. Interns will log surveys and reports here in a future sprint.
        </p>
      </div>
    </PageContainer>
  );
}
