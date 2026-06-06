import { Target } from 'lucide-react';
import {
  getBusinessPlanChapterById,
  getBusinessPlanChapters,
} from '../../../lib/playbookSeeds.js';
import { listBusinessPlanArtifacts } from '../../../lib/blueprintArtifacts.js';
import { ArtifactDraftCard } from '../ArtifactDraftCard.jsx';

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-3 font-bold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

const CANVAS_ENGINES = [
  'Client Growth Engine',
  'Talent Growth Engine',
  'Leadership Growth Engine',
  'Foundation (Resources, Partners, Cost)',
];

/**
 * PR4 — Business Plan / Financial Entrepreneurship Canvas module.
 * @param {{ participantId?: string }} props
 */
export function BusinessPlanModule({ participantId }) {
  const chapters = getBusinessPlanChapters();
  const allArtifacts = participantId ? listBusinessPlanArtifacts(participantId) : [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Your 3-Year Business Plan assembles automatically from Playbook worksheets and field work.
        Chapter drafts appear below as you complete activities.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Canvas structure">
          <ul className="space-y-2 text-sm text-gray-700">
            {CANVAS_ENGINES.map((name) => (
              <li key={name} className="flex items-center gap-2">
                <Target size={14} className="shrink-0 text-[#8B0000]" />
                {name}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Chapters">
          <ul className="space-y-3 text-sm">
            {chapters.map((ch) => {
              const drafts = allArtifacts.filter((a) => a.chapterId === ch.id);
              return (
                <li
                  key={ch.id}
                  className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2 last:border-0"
                >
                  <div>
                    <p className="font-bold text-gray-900">{ch.title}</p>
                    <p className="text-xs text-gray-500">Week {ch.weekOwner}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      drafts.length > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {drafts.length} draft{drafts.length === 1 ? '' : 's'}
                  </span>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      {chapters.map((ch) => {
        const drafts = allArtifacts.filter((a) => a.chapterId === ch.id);
        if (drafts.length === 0) return null;

        const chapterMeta = getBusinessPlanChapterById(ch.id);
        return (
          <SectionCard key={ch.id} title={`${chapterMeta.title} — artifacts`}>
            <div className="space-y-3">
              {drafts.map((artifact) => (
                <ArtifactDraftCard
                  key={artifact.id}
                  title={artifact.title}
                  content={artifact.content}
                  status={artifact.status}
                  sourceType={artifact.sourceType}
                  updatedAt={artifact.updatedAt}
                />
              ))}
            </div>
          </SectionCard>
        );
      })}

      {allArtifacts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          Complete Playbook Day 1 worksheets to seed Chapter 1 drafts here.
        </p>
      ) : null}
    </div>
  );
}
