import { FacultyDeckDownloadButton } from '../FacultyDeckDownloadButton.jsx';
import {
  WEEK4_DAY2_DECK_URL,
  WEEK4_DAY2_HERO_IMAGE,
  WEEK4_DAY2_SLIDE_COUNT,
} from '../../../lib/week4Day2/missionConstants.js';

/**
 * Week 4 Day 2 playbook hero — Talent Growth Engine.
 * @param {{ className?: string, allowDownload?: boolean }} props
 */
export function Week4Day2PlaybookHero({ className = '', allowDownload = false }) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card ${className}`}
      aria-label="Week 4 Day 2 hero"
    >
      <img
        src={WEEK4_DAY2_HERO_IMAGE}
        alt="Week 4 Day 2 — Talent Growth Engine. How can we grow 5× faster without working 5× harder?"
        className="block h-auto w-full"
        width={1024}
        height={576}
        decoding="async"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-gradient-to-r from-slate-950 via-[#0f172a] to-slate-900 px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-semibold text-white">Program Coach Deck 01 — Talent Growth Engine</p>
          <p className="mt-0.5 text-xs text-amber-200/90 italic">
            How can we grow 5× faster without working 5× harder?
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {WEEK4_DAY2_SLIDE_COUNT} scenes · Discover capacity limits, redesign one Growth Engine stage, and
            build a talent growth engine that scales leadership and impact.
          </p>
        </div>
        {allowDownload ? (
          <FacultyDeckDownloadButton
            href={WEEK4_DAY2_DECK_URL}
            label="Open full deck (PDF)"
            variant="link"
          />
        ) : null}
      </div>
    </section>
  );
}
