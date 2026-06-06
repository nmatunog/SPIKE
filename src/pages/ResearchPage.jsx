import { FlaskConical } from 'lucide-react';

const SUBSECTIONS = ['Surveys', 'Respondents', 'Research Reports', 'Opportunity Maps'];

export function ResearchPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Research Squad</h2>
        <p className="mt-1 text-gray-600">
          Research activities workspace — empty placeholder UI for Sprint 01. No backend logic yet.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUBSECTIONS.map((name) => (
          <div
            key={name}
            className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center shadow-sm"
          >
            <FlaskConical size={28} className="mb-3 text-[#8B0000]" />
            <h3 className="font-bold text-gray-900">{name}</h3>
            <p className="mt-2 text-xs text-gray-500">Coming soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}
