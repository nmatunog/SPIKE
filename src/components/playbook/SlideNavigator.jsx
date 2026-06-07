import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * @param {{
 *   currentIndex: number,
 *   total: number,
 *   onPrevious: () => void,
 *   onNext: () => void,
 * }} props
 */
export function SlideNavigator({ currentIndex, total, onPrevious, onNext }) {
  const pct = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between 2xl:gap-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentIndex <= 0}
          className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 disabled:opacity-40 lg:min-h-[52px] lg:min-w-[52px] 2xl:min-h-[56px] 2xl:min-w-[56px]"
          aria-label="Previous slide"
        >
          <ChevronLeft size={22} className="2xl:h-7 2xl:w-7" />
        </button>
        <span className="text-sm font-semibold text-slate-700 lg:text-base 2xl:text-lg">
          Slide {currentIndex + 1} of {total}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={currentIndex >= total - 1}
          className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 disabled:opacity-40 lg:min-h-[52px] lg:min-w-[52px] 2xl:min-h-[56px] 2xl:min-w-[56px]"
          aria-label="Next slide"
        >
          <ChevronRight size={22} className="2xl:h-7 2xl:w-7" />
        </button>
      </div>
      <div className="flex flex-1 items-center gap-2 sm:max-w-xs lg:max-w-sm 2xl:max-w-md">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 2xl:h-2.5">
          <div className="h-full rounded-full bg-spike transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-semibold text-slate-500 lg:text-sm">{pct}%</span>
      </div>
    </div>
  );
}
