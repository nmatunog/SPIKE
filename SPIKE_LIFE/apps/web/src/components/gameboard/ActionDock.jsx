import PlanLens from '../lenses/PlanLens.jsx'
import JourneyLens from '../lenses/JourneyLens.jsx'
import GrowLens from '../lenses/GrowLens.jsx'
import ProtectLens from '../lenses/ProtectLens.jsx'

export default function ActionDock({
  board,
  expandedPanel,
  onExpandPanel,
  onRoll,
  rolling,
  canDecide,
  canReflect,
  inDecisionPhase,
  planView,
  journeyView,
  growView,
  protectView,
  onDecide,
  onSubmitReflection,
  busy,
  error,
  onViewJourney,
}) {
  const canRoll = board?.canRoll && !rolling

  function openPanel(panel) {
    onExpandPanel(expandedPanel === panel ? null : panel)
  }

  return (
    <div className="sticky bottom-0 z-10 mt-auto space-y-2 border-t border-slate-200 bg-gradient-to-t from-slate-50 via-slate-50 to-slate-50/95 pt-2">
      {expandedPanel === 'fna' && planView?.lens === 'plan' && (
        <div className="max-h-[min(48vh,22rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-md">
          <PlanLens data={planView.data} sections={['fna', 'recommendations', 'goals']} />
        </div>
      )}

      {expandedPanel === 'decision' && planView?.lens === 'plan' && (
        <div className="max-h-[min(48vh,22rem)] overflow-y-auto rounded-lg border border-[#8B0000]/25 bg-white p-3 shadow-md">
          <PlanLens
            data={planView.data}
            sections={['decisions']}
            onDecide={canDecide ? onDecide : undefined}
            deciding={busy}
            error={error}
          />
        </div>
      )}

      {expandedPanel === 'reflect' && journeyView?.lens === 'journey' && (
        <div className="max-h-[min(48vh,22rem)] overflow-y-auto rounded-lg border border-[#8B0000]/25 bg-white p-3 shadow-md">
          <JourneyLens
            data={journeyView.data}
            sections={['reflection']}
            onSubmitReflection={canReflect ? onSubmitReflection : undefined}
            submitting={busy}
            error={error}
          />
        </div>
      )}

      {expandedPanel === 'journey' && journeyView?.lens === 'journey' && (
        <div className="max-h-[min(48vh,22rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-md">
          <JourneyLens data={journeyView.data} sections={['timeline', 'completed']} />
        </div>
      )}

      {expandedPanel === 'grow' && growView?.lens === 'grow' && (
        <div className="max-h-[min(48vh,22rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-md">
          <GrowLens data={growView.data} />
        </div>
      )}

      {expandedPanel === 'protect' && protectView?.lens === 'protect' && (
        <div className="max-h-[min(48vh,22rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-md">
          <ProtectLens data={protectView.data} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canRoll && (
          <button
            type="button"
            disabled={!canRoll}
            onClick={onRoll}
            className="flex-1 rounded-lg bg-[#8B0000] px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm hover:bg-[#6d0000] disabled:opacity-40 md:hidden"
          >
            {rolling ? 'Rolling…' : 'Roll dice'}
          </button>
        )}

        {inDecisionPhase && (
          <>
            <button
              type="button"
              onClick={() => openPanel('fna')}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                expandedPanel === 'fna'
                  ? 'border-[#8B0000] bg-red-50 text-[#8B0000]'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
              }`}
            >
              View analysis
            </button>
            <button
              type="button"
              disabled={!canDecide && expandedPanel !== 'decision'}
              onClick={() => openPanel('decision')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                expandedPanel === 'decision'
                  ? 'bg-[#6d0000] text-white'
                  : 'bg-[#8B0000] text-white hover:bg-[#6d0000] disabled:opacity-40'
              }`}
            >
              Make decision
            </button>
            {(canReflect || expandedPanel === 'reflect') && (
              <button
                type="button"
                onClick={() => openPanel('reflect')}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  expandedPanel === 'reflect'
                    ? 'border-[#8B0000] bg-red-50 text-[#8B0000]'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                }`}
              >
                Reflect
              </button>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => {
            onViewJourney?.()
            openPanel('journey')
          }}
          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            expandedPanel === 'journey'
              ? 'border-slate-400 bg-slate-100 text-slate-900'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          Journey
        </button>
      </div>
    </div>
  )
}
