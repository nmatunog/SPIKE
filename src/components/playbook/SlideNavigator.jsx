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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentIndex <= 0}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-800 disabled:opacity-40"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-bold text-gray-700">
          Slide {currentIndex + 1} of {total}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={currentIndex >= total - 1}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-800 disabled:opacity-40"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="flex flex-1 items-center gap-2 sm:max-w-xs">
        <div className="h-2 flex-1 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-[#8B0000] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-bold text-gray-500">{pct}%</span>
      </div>
    </div>
  );
}
