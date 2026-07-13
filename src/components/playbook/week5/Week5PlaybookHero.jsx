import { FacultyDeckDownloadButton } from '../FacultyDeckDownloadButton.jsx';

export const WEEK5_HERO_IMAGE = '/content/segment-1/week-5/hero-execute.png';
export const WEEK5_DAY1_ID = 'day-segment-1-week-5-day-1';
export const WEEK5_DAY1_DECK_URL =
  '/api/coach/faculty-deck/segment-1/week-5/day-1/faculty-deck-01.pdf';

/**
 * Week 5 playbook hero — Execute / Build Your Professional Practice.
 * 16:9 safe area with object-contain so logo, copy, and graphic are never cropped.
 * @param {{ className?: string, allowDownload?: boolean, showDay1Deck?: boolean }} props
 */
export function Week5PlaybookHero({
  className = '',
  allowDownload = false,
  showDay1Deck = false,
}) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card ${className}`}
      aria-label="Week 5 hero"
    >
      <div className="flex aspect-[16/9] w-full items-center justify-center overflow-hidden bg-[#f3f2ee]">
        <img
          src={WEEK5_HERO_IMAGE}
          alt="Week 5 — Execute. Build your professional practice. From plan to impact."
          className="h-full w-full object-contain object-center"
          width={1024}
          height={576}
          decoding="async"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-gradient-to-r from-[#1a2744] via-[#1e2f52] to-[#1a2744] px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-semibold text-white">Week 5 · Execute</p>
          <p className="mt-0.5 text-xs text-amber-200/90 italic">
            Build your professional practice — from plan to impact.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Great businesses are not built by plans alone. They are built by consistent execution.
          </p>
        </div>
        {allowDownload && showDay1Deck ? (
          <FacultyDeckDownloadButton
            href={WEEK5_DAY1_DECK_URL}
            label="Open Day 1 deck (PDF)"
            variant="link"
          />
        ) : null}
      </div>
    </section>
  );
}
