import { ClipboardCheck } from 'lucide-react';
import { formatPlaybookAudience } from '../../lib/terminology.js';

/**
 * @param {{ templates: Array<Record<string, unknown>> }} props
 */
export function EvaluationTemplatesPanel({ templates }) {
  if (!templates?.length) return null;

  return (
    <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5">
      <h3 className="inline-flex items-center gap-2 text-lg font-bold text-amber-950">
        <ClipboardCheck size={20} /> Day 1 evaluation templates
      </h3>
      <p className="text-sm text-amber-900">
        Rubrics and observation forms for program coaches and mentors — Day 1 only.
      </p>
      <div className="space-y-3">
        {templates.map((template) => (
          <article key={String(template.id)} className="rounded-lg bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-gray-900">{String(template.title)}</p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase text-amber-900">
                {String(template.type ?? 'template')} · {formatPlaybookAudience(String(template.audience ?? 'faculty'))}
              </span>
            </div>
            {template.description ? (
              <p className="mt-2 text-gray-600">{String(template.description)}</p>
            ) : null}
            {Array.isArray(template.criteria) ? (
              <ul className="mt-3 space-y-2">
                {template.criteria.map((criterion) => (
                  <li key={String(criterion.label)} className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="font-semibold text-gray-800">{String(criterion.label)}</p>
                    {Array.isArray(criterion.indicators) ? (
                      <ul className="mt-1 list-inside list-disc text-gray-600">
                        {criterion.indicators.map((ind) => (
                          <li key={String(ind)}>{String(ind)}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {Array.isArray(template.fields) ? (
              <ul className="mt-3 space-y-1 text-gray-700">
                {template.fields.map((field) => (
                  <li key={String(field.id)}>
                    • {String(field.label)} ({String(field.type)})
                  </li>
                ))}
              </ul>
            ) : null}
            {Array.isArray(template.prompts) ? (
              <ul className="mt-3 space-y-1 text-gray-700">
                {template.prompts.map((prompt) => (
                  <li key={String(prompt)}>• {String(prompt)}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
