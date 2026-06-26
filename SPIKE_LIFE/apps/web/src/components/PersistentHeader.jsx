export default function PersistentHeader({ dashboard }) {
  if (!dashboard) {
    return (
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <p className="text-sm text-slate-500">Loading simulation…</p>
      </header>
    )
  }

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8B0000]">
            SPIKE LIFE™
          </p>
          <h1 className="text-lg font-semibold text-slate-900">
            {dashboard.characterName}
          </h1>
          {dashboard.scenarioLabel && (
            <p className="text-xs text-slate-500">{dashboard.scenarioLabel}</p>
          )}
        </div>
        <dl className="flex flex-wrap gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Age</dt>
            <dd className="font-semibold">{dashboard.age}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Life Stage</dt>
            <dd className="font-semibold">{dashboard.lifeStageLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Life Score™</dt>
            <dd className="font-semibold text-[#8B0000]">
              {dashboard.lifeScore.overall}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Year</dt>
            <dd className="font-semibold">{dashboard.simulationYear}</dd>
          </div>
        </dl>
      </div>
    </header>
  )
}
