import { Link } from 'react-router-dom';
import { BookMarked, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../routes/paths.js';

/** Prominent dashboard entry to the SPIKE Brand Lexicon. */
export function BrandLexiconDashboardCard() {
  return (
    <section className="rounded-2xl border border-spike/15 bg-gradient-to-br from-white via-spike-muted/30 to-white p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-spike">
            <BookMarked size={16} /> Brand resource
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            SPIKE Brand Language &amp; Lexicon v1.0
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Official terminology for Program Coaches and Mentors — roles, venture language, UI labels,
            presentation copy, and words to avoid.
          </p>
        </div>
        <Link
          to={ROUTES.brandLexicon}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-spike px-5 py-3 text-sm font-semibold text-white transition hover:bg-spike-light"
        >
          Open lexicon
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
