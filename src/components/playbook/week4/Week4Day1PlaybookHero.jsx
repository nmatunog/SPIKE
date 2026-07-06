import { FacultyDeckDownloadButton } from '../FacultyDeckDownloadButton.jsx';

export const WEEK4_DAY1_ID = 'day-segment-1-week-4-day-1';
export const WEEK4_DAY1_HERO_IMAGE = '/content/segment-1/week-4/day-1/hero-platform-integration.png';
export const WEEK4_DAY1_PPTX_URL =
  '/api/coach/faculty-deck/segment-1/week-4/day-1/faculty-deck-01.pptx';

/**
 * Week 4 Day 1 playbook hero — Platform Integration (Blueprint Week kickoff).
 * @param {{ className?: string, allowDownload?: boolean }} props
 */
export function Week4Day1PlaybookHero({ className = '', allowDownload = false }) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card ${className}`}
      aria-label="Week 4 Day 1 hero"
    >
      <img
        src={WEEK4_DAY1_HERO_IMAGE}
        alt="Week 4 Day 1 — Platform Integration. How will I make it work?"
        className="block h-auto w-full"
        width={1024}
        height={576}
        decoding="async"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-gradient-to-r from-slate-950 via-[#0f172a] to-slate-900 px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-semibold text-white">Program Coach Deck 01 — Platform Integration</p>
          <p className="mt-0.5 text-xs text-amber-200/90 italic">
            How will I make my venture work in the real world?
          </p>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Connecting your venture to the AIA Platform to build a scalable, sustainable business.
          </p>
        </div>
        {allowDownload ? (
          <FacultyDeckDownloadButton
            href={WEEK4_DAY1_PPTX_URL}
            label="Open full deck (PPTX)"
            variant="link"
          />
        ) : null}
      </div>
    </section>
  );
}
