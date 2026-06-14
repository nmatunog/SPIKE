/** @param {{
 *   assessment: { title: string, description: string },
 *   rubric: { title: string, criteria: string[] } | null,
 * }} props */
export function AssessmentPanel({ assessment, rubric }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h4 className="mb-2 font-bold text-gray-900">{assessment.title}</h4>
      <p className="mb-4 text-sm text-gray-600">{assessment.description}</p>
      {rubric ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
          <h5 className="mb-2 text-xs font-bold uppercase text-gray-500">{rubric.title}</h5>
          <ul className="space-y-2 text-sm text-gray-700">
            {rubric.criteria.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="text-[#8B0000]">✓</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-500">Program Coach observation — scoring workflow ships later.</p>
        </div>
      ) : null}
    </section>
  );
}
