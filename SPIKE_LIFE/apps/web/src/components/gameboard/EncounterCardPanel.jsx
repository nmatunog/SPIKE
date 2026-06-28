export default function EncounterCardPanel({ encounter }) {
  if (!encounter) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Encounter
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Tap Next Year when you are ready. A domain lights up and your situation appears.
        </p>
      </div>
    )
  }

  return (
    <article className="rounded-xl border border-[#8B0000]/25 bg-gradient-to-b from-red-50/60 to-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8B0000]">
        Encounter card
      </p>
      <h3 className="mt-1 text-lg font-semibold text-slate-900">{encounter.title}</h3>
      <p className="mt-2 text-sm text-slate-700">{encounter.teaser}</p>
      <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Learn:</span>{' '}
        {encounter.learningConcept}
      </p>
    </article>
  )
}
