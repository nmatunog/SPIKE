import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';
import { getPortfolioSections } from '../lib/playbookSeeds.js';
import { listPortfolioArtifacts } from '../lib/blueprintArtifacts.js';
import { ArtifactDraftCard } from '../components/blueprint/ArtifactDraftCard.jsx';
import { BLUEPRINT_LINKS, ROUTES } from '../routes/paths.js';

/**
 * Staff portfolio view — sections from seeds; interns use Venture Blueprint instead.
 * @param {{ hours?: number, participantId?: string | null }} props
 */
export function PortfolioPage({ hours = 0, participantId = null }) {
  const sections = getPortfolioSections();

  return (
    <PageContainer>
      <div className="mb-6 sm:mb-8">
        <PageTitle>Venture Portfolio</PageTitle>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          Portfolio sections align with the Venture Blueprint™. Interns manage drafts in{' '}
          <Link to={ROUTES.ventureBlueprint} className="font-bold text-[#8B0000] hover:underline">
            My Blueprint
          </Link>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const drafts = participantId
            ? listPortfolioArtifacts(participantId, section.id)
            : [];

          return (
            <div
              key={section.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="mb-3 flex items-start gap-2">
                <Briefcase size={18} className="mt-0.5 shrink-0 text-[#8B0000]" />
                <div>
                  <h3 className="font-bold text-gray-900">{section.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{section.description}</p>
                </div>
              </div>
              <p className="mb-2 text-xs font-bold text-gray-500">
                {drafts.length} draft{drafts.length === 1 ? '' : 's'}
                {participantId ? '' : ' (select participant in a later sprint)'}
              </p>
              {drafts.length > 0 ? (
                <div className="space-y-2">
                  {drafts.map((a) => (
                    <ArtifactDraftCard
                      key={a.id}
                      title={a.title}
                      content={a.content}
                      status={a.status}
                      sourceType={a.sourceType}
                      updatedAt={a.updatedAt}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                  Playbook activities auto-create drafts for interns — no manual entry.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Cohort avg traction: {hours}h ·{' '}
        <Link to={BLUEPRINT_LINKS.businessPlan} className="font-bold text-[#8B0000]">
          Business Plan module
        </Link>
      </p>
    </PageContainer>
  );
}
