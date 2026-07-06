import { Printer } from 'lucide-react';
import { buildWeek4Day1BlueprintPreview } from '../../../lib/week4Day1/previewData.js';

/**
 * Read-only Week 4 Business Blueprint executive summary.
 * @param {{
 *   participantId: string,
 *   participantName?: string,
 *   className?: string,
 * }} props
 */
export function Week4Day1BlueprintPreview({ participantId, participantName = '', className = '' }) {
  const preview = buildWeek4Day1BlueprintPreview(participantId);

  return (
    <div className={`mx-auto w-full max-w-[900px] ${className}`}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Blueprint Preview</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {participantName ? `${participantName} · ` : ''}Venture Blueprint
          </h1>
          <p className="mt-1 text-sm text-slate-600">Executive summary · mentors · panelists · investors</p>
        </div>
        <button type="button" onClick={() => window.print()} className="spike-btn-secondary inline-flex items-center gap-2">
          <Printer size={16} aria-hidden />
          Print
        </button>
      </div>

      {preview.isEmpty ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
          Blueprint sections will appear as interns finalize Week 4 Day 1 missions.
        </p>
      ) : (
        <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10 print:border-0 print:shadow-none">
          {preview.sections.map((section) => (
            <section key={section.id} className="print:break-inside-avoid">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{section.label}</h2>
              <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-900">
                {section.value || '—'}
              </p>
            </section>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">
        SPIKE Venture Studio · Venture Blueprint · Week 4
      </p>
    </div>
  );
}
