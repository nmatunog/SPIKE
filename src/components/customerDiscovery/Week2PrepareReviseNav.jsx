import { getWeek2TasksForDay } from '../../lib/customerDiscovery/week2JourneyConstants.js';
import { playbookWeek2MissionHref } from '../../lib/customerDiscovery/week2MissionService.js';

/**
 * Quick links to Day 1 prepare tasks — visible on Days 2–5 for revisions.
 * @param {{ activeSlug?: string, onNavigate?: (slug: string, day: number) => void }} props
 */
export function Week2PrepareReviseNav({ activeSlug, onNavigate }) {
  const prepareTasks = getWeek2TasksForDay(1).filter((t) => t.slug !== 'mission');

  return (
    <nav aria-label="Revise Day 1 prepare work" className="space-y-1 border-t border-slate-100 pt-4">
      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
        Revise prepare
      </p>
      {prepareTasks.map((task) => {
        const isActive = activeSlug === task.slug;
        const href = playbookWeek2MissionHref(task.slug, { day: 1 });
        return (
          <a
            key={task.id}
            href={href}
            onClick={(e) => {
              if (!onNavigate) return;
              e.preventDefault();
              onNavigate(task.slug, 1);
            }}
            className={`block rounded-lg px-3 py-2 text-xs font-medium transition ${
              isActive ? 'bg-spike/10 text-spike' : 'text-slate-600 hover:bg-slate-50 hover:text-spike'
            }`}
          >
            {task.shortLabel}
          </a>
        );
      })}
    </nav>
  );
}
