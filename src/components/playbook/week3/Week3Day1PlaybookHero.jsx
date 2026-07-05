import { FacultyDeckDownloadButton } from '../FacultyDeckDownloadButton.jsx';

export const WEEK3_DAY1_ID = 'day-segment-1-week-3-day-1';
export const WEEK3_DAY1_HERO_IMAGE = '/content/segment-1/week-3/day-1/deck-01/slide-01.png';
export const WEEK3_DAY1_PDF_URL = '/api/coach/faculty-deck/segment-1/week-3/day-1/faculty-deck-01.pdf';

/**
 * Week 3 Day 1 playbook hero — cover slide from Program Coach Deck 01 (PDF).
 * @param {{ className?: string, allowDownload?: boolean }} props
 */
export function Week3Day1PlaybookHero({ className = '', allowDownload = false }) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card ${className}`}
      aria-label="Week 3 Day 1 hero"
    >
      <img
        src={WEEK3_DAY1_HERO_IMAGE}
        alt="Week 3 Day 1 — Opportunity Analysis"
        className="block h-auto w-full"
        width={1920}
        height={1080}
        decoding="async"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-5">
        <p className="text-sm font-semibold text-slate-700">Program Coach Deck 01 — Opportunity Analysis</p>
        {allowDownload ? (
          <FacultyDeckDownloadButton
            href={WEEK3_DAY1_PDF_URL}
            label="Open full deck (PDF)"
            variant="link"
          />
        ) : null}
      </div>
    </section>
  );
}
