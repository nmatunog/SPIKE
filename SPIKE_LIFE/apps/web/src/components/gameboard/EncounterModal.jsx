import { impactTagsForSpaceType } from './encounter-impact.js'

export default function EncounterModal({
  encounter,
  landedSpaceType,
  recommendations = [],
  onViewAnalysis,
  onMakeDecision,
  onDismiss,
  visible,
}) {
  if (!visible || !encounter) return null

  const impacts = impactTagsForSpaceType(landedSpaceType ?? 'career')

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 md:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onDismiss}
        aria-label="Dismiss encounter"
      />
      <article className="relative z-10 w-full max-w-md rounded-2xl border border-slate-600/80 bg-gradient-to-b from-slate-800 to-slate-900 p-5 shadow-2xl ring-1 ring-white/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
          Encounter card
        </p>
        <h2 className="mt-1 text-xl font-bold text-white">{encounter.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{encounter.teaser}</p>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            This may impact
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {impacts.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-700/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-950/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Recommended priorities
            </p>
            <ol className="mt-2 space-y-1.5">
              {recommendations.slice(0, 3).map((rec) => (
                <li key={rec.rank} className="flex gap-2 text-sm text-slate-200">
                  <span className="font-bold text-red-400">{rec.rank}.</span>
                  <span>{rec.label}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="mt-3 text-xs text-slate-500">
          <span className="font-medium text-slate-400">Learn:</span> {encounter.learningConcept}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onViewAnalysis}
            className="flex-1 rounded-xl bg-[#8B0000] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#a50000]"
          >
            View full analysis
          </button>
          <button
            type="button"
            onClick={onMakeDecision}
            className="rounded-xl border border-slate-500 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Make decision
          </button>
        </div>
      </article>
    </div>
  )
}
