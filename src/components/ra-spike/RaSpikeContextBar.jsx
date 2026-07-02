import { getRaSpikeContext } from '../../lib/programs/ra-spike-context.js';
import { RaSpikeProgressTimeline } from './RaSpikeProgressTimeline.jsx';

/**
 * @param {{ internProgress?: object | null }} props
 */
export function RaSpikeContextBar({ internProgress }) {
  const ctx = getRaSpikeContext(internProgress);

  return (
    <div className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white">
      <div className="mx-auto max-w-projection px-4 py-3 sm:px-6 lg:px-8 2xl:px-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-spike px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-white">
                {ctx.segmentLabel}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                Week {ctx.week} of {ctx.totalWeeks}
              </span>
              {ctx.stageGate ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-2xs font-semibold text-amber-900">
                  {ctx.stageGate.label}
                </span>
              ) : null}
            </div>
            <p className="mt-1 truncate text-base font-bold text-slate-900 sm:text-lg">{ctx.weekTheme}</p>
            <p className="text-sm text-slate-600">{ctx.weekSubtitle}</p>
          </div>
          <div className="shrink-0 overflow-x-auto pb-1 lg:pb-0">
            <RaSpikeProgressTimeline currentWeek={ctx.week} />
          </div>
        </div>
      </div>
    </div>
  );
}
