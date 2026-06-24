import { Link } from 'react-router-dom';
import { BookMarked, ChevronRight } from 'lucide-react';
import { playbookReflectionHref } from '../../routes/paths.js';

/**
 * In-playbook nudge when today's closing reflection is still due.
 * @param {{ week: number, day: number, title: string, label: string }} props
 */
export function PlaybookReflectionNudge({ week, day, title, label }) {
  return (
    <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-500 to-spike px-4 py-4 text-white shadow-md sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/90">
            <BookMarked size={14} aria-hidden />
            Finish {label}
          </p>
          <p className="mt-1 text-sm font-semibold sm:text-base">{title}</p>
          <p className="mt-1 text-sm text-white/90">
            Complete your closing reflection below before you leave today&apos;s Playbook.
          </p>
        </div>
        <Link
          to={playbookReflectionHref({ segment: 1, week, day })}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-spike shadow-sm hover:bg-amber-50"
        >
          Go to reflection
          <ChevronRight size={16} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
