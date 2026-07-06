import { Printer } from 'lucide-react';
import { buildWeek4Day1FecPreview } from '../../../lib/week4Day1/previewData.js';

/**
 * Read-only Week 4 FEC preview — polished canvas layout, no edit controls.
 * @param {{
 *   participantId: string,
 *   participantName?: string,
 *   className?: string,
 * }} props
 */
export function Week4Day1FecPreview({ participantId, participantName = '', className = '' }) {
  const preview = buildWeek4Day1FecPreview(participantId);

  return (
    <div className={`mx-auto w-full max-w-[1100px] ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">FEC Preview</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {participantName ? `${participantName} · ` : ''}Financial Entrepreneurship Canvas
          </h1>
          <p className="mt-1 text-sm text-slate-600">Final approved data only · read-only</p>
        </div>
        <button type="button" onClick={() => window.print()} className="spike-btn-secondary inline-flex items-center gap-2">
          <Printer size={16} aria-hidden />
          Print
        </button>
      </div>

      {preview.isEmpty ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
          No finalized FEC content yet. Complete Week 4 Day 1 missions to populate this preview.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {preview.sections.map((section) => (
            <article
              key={section.id}
              className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:break-inside-avoid ${
                section.id === 'venture_proposition' ? 'sm:col-span-2 lg:col-span-4' : ''
              } ${section.id === 'growth_engines' ? 'sm:col-span-2' : ''}`}
            >
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-spike">{section.label}</h2>
              <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {section.value || '—'}
              </p>
            </article>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-400 print:mt-4">
        SPIKE Venture Studio · Week 4 · Financial Entrepreneurship Canvas
      </p>
    </div>
  );
}
