import { FileText } from 'lucide-react';

/**
 * @param {{
 *   title: string,
 *   content: string,
 *   status?: string,
 *   sourceType?: string,
 *   updatedAt?: string,
 * }} props
 */
export function ArtifactDraftCard({ title, content, status = 'draft', sourceType, updatedAt }) {
  const preview = content.length > 180 ? `${content.slice(0, 180)}…` : content;

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <FileText size={16} className="mt-0.5 shrink-0 text-[#8B0000]" />
          <h4 className="font-bold text-gray-900">{title}</h4>
        </div>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
          {status}
        </span>
      </div>
      <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 font-sans text-sm text-gray-700">
        {preview}
      </pre>
      <p className="mt-2 text-[11px] text-gray-500">
        {sourceType ? `Source: ${sourceType}` : null}
        {updatedAt ? ` · Updated ${new Date(updatedAt).toLocaleDateString()}` : null}
      </p>
    </article>
  );
}
