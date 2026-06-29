import { FileText } from 'lucide-react';

export const WEEK3_DAY1_ID = 'day-segment-1-week-3-day-1';
export const WEEK3_DAY1_HERO_IMAGE = '/content/segment-1/week-3/day-1/deck-01/slide-01.png';
export const WEEK3_DAY1_PDF_URL = '/content/segment-1/week-3/day-1/faculty-deck-01.pdf';

/**
 * Week 3 Day 1 playbook hero — cover slide from Program Coach Deck 01 (PDF).
 * @param {{ className?: string }} props
 */
export function Week3Day1PlaybookHero({ className = '' }) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card ${className}`}
      aria-label="Week 3 Day 1 hero"
    >
      <img
        src={WEEK3_DAY1_HERO_IMAGE}
        alt="Week 3 Day 1 — Underwriting Principles and Risk Assessment"
        className="block h-auto w-full"
        width={1920}
        height={1080}
        decoding="async"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-5">
        <p className="text-sm font-semibold text-slate-700">Program Coach Deck 01 — Why Underwriting Exists</p>
        <a
          href={WEEK3_DAY1_PDF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-spike hover:underline"
        >
          <FileText size={16} aria-hidden />
          Open full deck (PDF)
        </a>
      </div>
    </section>
  );
}
