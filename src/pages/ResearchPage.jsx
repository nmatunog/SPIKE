import {
  ClipboardList,
  FileText,
  FlaskConical,
  Map,
  Presentation,
  Users,
} from 'lucide-react';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';
import { getSegment1Week1Day1Bundle } from '../lib/contentLoader.js';
import {
  getMarketSegmentLabel,
  getResearchProjects,
  getResearchSquads,
  MARKET_SEGMENTS,
  RESEARCH_DELIVERABLES,
} from '../lib/researchSeeds.js';

function SectionCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        {Icon ? <Icon size={18} className="text-[#8B0000]" /> : null}
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function ResearchPage() {
  let daySurvey = null;
  try {
    const bundle = getSegment1Week1Day1Bundle();
    daySurvey = bundle.survey;
  } catch {
    daySurvey = null;
  }

  const squads = getResearchSquads();
  const projects = getResearchProjects();

  return (
    <PageContainer className="max-w-6xl">
      <div className="mb-6">
        <PageTitle>Research Squad</PageTitle>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          Squad-based market research — survey definitions from Playbook content. Live collection
          ships in a later sprint; deliverables auto-route to Portfolio → Market Intelligence.
        </p>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Research squads" icon={Users}>
          {squads.length === 0 ? (
            <p className="text-sm text-gray-500">No squads assigned yet.</p>
          ) : (
            <ul className="space-y-3">
              {squads.map((squad) => (
                <li key={squad.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="font-bold text-gray-900">{squad.name}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Market: {getMarketSegmentLabel(squad.marketSegment)}
                  </p>
                  <p className="text-xs text-gray-500">Cohort {squad.cohortId}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Market segments" icon={Map}>
          <div className="flex flex-wrap gap-2">
            {MARKET_SEGMENTS.map((seg) => (
              <span
                key={seg.id}
                className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-[#8B0000]"
              >
                {seg.label}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Research projects" icon={FlaskConical}>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-500">No active projects.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {projects.map((p) => (
                <li key={p.id} className="rounded-lg border border-gray-100 p-3">
                  <p className="font-bold text-gray-900">{p.title}</p>
                  <p className="mt-1 text-gray-600">{p.hypothesis}</p>
                  <span className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600">
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Deliverables (auto-save targets)" icon={FileText}>
          <ul className="space-y-2 text-sm text-gray-700">
            {RESEARCH_DELIVERABLES.map((d) => (
              <li key={d} className="flex items-center gap-2">
                <Presentation size={14} className="shrink-0 text-[#8B0000]" />
                {d} → <span className="font-semibold">Market Intelligence</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Playbook survey definition (Day 1)" icon={ClipboardList}>
        {daySurvey ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-bold text-gray-900">{daySurvey.survey.title}</p>
              <p className="mt-1 text-gray-600">{daySurvey.survey.description}</p>
              <p className="mt-2 text-xs font-bold uppercase text-gray-500">
                Status: {daySurvey.survey.status} · Collection disabled
              </p>
            </div>
            <ol className="list-inside list-decimal space-y-2 text-gray-700">
              {daySurvey.questions.map((q) => (
                <li key={q.id}>
                  {q.prompt}
                  <span className="ml-2 text-xs text-gray-400">({q.type})</span>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Day 1 survey content not loaded.</p>
        )}
      </SectionCard>
    </PageContainer>
  );
}
