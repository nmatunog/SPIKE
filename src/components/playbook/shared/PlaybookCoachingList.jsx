/**
 * @param {{ questions: string[], className?: string }} props
 */
export function PlaybookCoachingList({ questions, className = '' }) {
  if (!questions?.length) return null;
  return (
    <div className={`rounded-xl border border-slate-100 bg-slate-50/80 p-3 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Coaching questions</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
        {questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>
    </div>
  );
}
