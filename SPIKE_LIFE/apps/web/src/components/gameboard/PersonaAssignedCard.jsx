export default function PersonaAssignedCard({
  characterName,
  archetypeLabel,
  archetypeTagline,
  age,
  className = '',
}) {
  if (!archetypeLabel) return null

  return (
    <div
      className={`rounded-2xl border border-sky-400/25 bg-gradient-to-b from-slate-900/90 to-slate-950/95 px-5 py-4 shadow-lg ${className}`}
      aria-label="Assigned life persona"
    >
      <p className="text-label uppercase tracking-wider text-sky-300/90">Your life persona</p>
      <p className="mt-1 text-title font-bold text-white">
        {characterName ? `${characterName} · ` : ''}
        {archetypeLabel}
        {age ? ` · Age ${age}` : ''}
      </p>
      {archetypeTagline && (
        <p className="mt-2 text-body leading-relaxed text-slate-300">{archetypeTagline}</p>
      )}
      <p className="mt-2 text-caption text-slate-500">
        Assigned at random so every table gets different financial realities.
      </p>
    </div>
  )
}
