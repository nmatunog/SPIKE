/** @param {{ questions: string[] }} props */
export function DiscussionPanel({ questions }) {
  if (!questions?.length) return null;

  return (
    <aside className="rounded-xl border border-blue-200 bg-blue-50/80 p-4">
      <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-900">
        Discussion questions
      </h5>
      <ul className="space-y-2 text-sm text-blue-950">
        {questions.map((q) => (
          <li key={q} className="flex gap-2">
            <span className="font-bold text-blue-700">•</span>
            <span>{q}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
