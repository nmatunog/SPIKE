import { Briefcase } from 'lucide-react';

const SECTIONS = [
  'Identity & Purpose',
  'Market Intelligence',
  'Financial Blueprint',
  'Professional Development',
  'Advisor Startup Blueprint',
  '3-Year Blueprint',
];

export function PortfolioPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Venture Portfolio</h2>
        <p className="mt-1 text-gray-600">
          Participant venture portfolio — scaffolding for Sprint 01. Progress metrics are
          placeholders until portfolio entries are wired to Supabase.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <div
            key={section}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <Briefcase size={18} className="text-[#8B0000]" />
              <h3 className="font-bold text-gray-900">{section}</h3>
            </div>
            <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 w-1/4 rounded-full bg-[#8B0000]" />
            </div>
            <p className="text-xs font-bold text-gray-500">Progress: 0%</p>
            <p className="mt-2 text-sm text-gray-600">Completed: 0 · Pending: 3</p>
            <p className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
              Placeholder content — deliverables will appear here in a later sprint.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
