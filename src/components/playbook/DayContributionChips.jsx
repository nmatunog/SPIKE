import {
  getBusinessPlanChapterById,
  getCompetencyById,
  getPortfolioSectionById,
} from '../../lib/playbookSeeds.js';

function Chip({ label, sub, tone = 'red' }) {
  const tones = {
    red: 'border-red-200 bg-red-50 text-[#8B0000]',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    green: 'border-green-200 bg-green-50 text-green-900',
  };

  return (
    <span
      className={`inline-flex flex-col rounded-lg border px-3 py-2 text-xs font-bold ${tones[tone]}`}
    >
      <span>{label}</span>
      {sub ? <span className="mt-0.5 font-medium opacity-80">{sub}</span> : null}
    </span>
  );
}

function safePortfolio(id) {
  try {
    return getPortfolioSectionById(id);
  } catch {
    return { title: id };
  }
}

function safeChapter(id) {
  try {
    return getBusinessPlanChapterById(id);
  } catch {
    return { title: id };
  }
}

function safeCompetency(id) {
  try {
    return getCompetencyById(id);
  } catch {
    return { title: id };
  }
}

/**
 * @param {{ contributions: {
 *   contributesToPortfolio: string[],
 *   contributesToBusinessPlan: string[],
 *   contributesToCompetencies: string[],
 * }}} props
 */
export function DayContributionChips({ contributions }) {
  return (
    <div className="grid gap-3 sm:grid-cols-1">
      <div>
        <h5 className="mb-1.5 text-[11px] font-bold uppercase text-gray-500">Portfolio</h5>
        <div className="flex flex-wrap gap-1.5">
          {contributions.contributesToPortfolio.map((id) => {
            const s = safePortfolio(id);
            return <Chip key={id} label={s.title} sub="Portfolio" tone="red" />;
          })}
        </div>
      </div>
      <div>
        <h5 className="mb-1.5 text-[11px] font-bold uppercase text-gray-500">Business plan</h5>
        <div className="flex flex-wrap gap-1.5">
          {contributions.contributesToBusinessPlan.map((id) => {
            const c = safeChapter(id);
            return <Chip key={id} label={c.title} sub="Chapter" tone="blue" />;
          })}
        </div>
      </div>
      <div>
        <h5 className="mb-1.5 text-[11px] font-bold uppercase text-gray-500">Competencies</h5>
        <div className="flex flex-wrap gap-1.5">
          {contributions.contributesToCompetencies.map((id) => {
            const comp = safeCompetency(id);
            return <Chip key={id} label={comp.title} sub="Skill" tone="green" />;
          })}
        </div>
      </div>
    </div>
  );
}
