export const WEEK3_DAY3_ID = 'day-segment-1-week-3-day-3';
export const WEEK3_DAY3_HERO_IMAGE = '/content/segment-1/week-3/day-3/hero-business-engine.png';

/**
 * Week 3 Day 3 playbook hero — The Business Engine.
 * @param {{ className?: string }} props
 */
export function Week3Day3PlaybookHero({ className = '' }) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card ${className}`}
      aria-label="Week 3 Day 3 hero"
    >
      <div className="flex min-h-[160px] items-center justify-center overflow-hidden bg-slate-950 sm:min-h-[180px] lg:min-h-[220px]">
        <img
          src={WEEK3_DAY3_HERO_IMAGE}
          alt="W3D3 Playbook — The Business Engine. Client experience at the core."
          className="block max-h-[200px] w-full object-contain object-center sm:max-h-[240px] lg:max-h-[300px]"
          width={1024}
          height={576}
          decoding="async"
        />
      </div>
      <div className="border-t border-slate-100 bg-gradient-to-r from-slate-900 to-spike-dark px-4 py-3 sm:px-5">
        <p className="text-sm font-semibold text-white">
          The Business Engine — Discover. Validate. Advise. Build.
        </p>
        <p className="mt-0.5 text-xs text-slate-300">
          Client experience at the core · A repeatable system · A growing business · A better future
        </p>
      </div>
    </section>
  );
}
