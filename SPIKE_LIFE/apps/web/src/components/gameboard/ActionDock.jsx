import PlanLens from '../lenses/PlanLens.jsx'
import JourneyLens from '../lenses/JourneyLens.jsx'
import GrowLens from '../lenses/GrowLens.jsx'
import ProtectLens from '../lenses/ProtectLens.jsx'

const PANEL_CLASS =
  'max-h-[min(38vh,14rem)] overflow-y-auto rounded-2xl border bg-white p-4 shadow-card-lg'

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
    <div className="flex min-h-0 flex-col gap-3">
      {expandedPanel === 'fna' && planView?.lens === 'plan' && (
        <div className={`${PANEL_CLASS} border-slate-200`}>
          <PlanLens data={planView.data} sections={['fna', 'recommendations', 'goals']} />
        </div>
      )}

      {expandedPanel === 'decision' && planView?.lens === 'plan' && (
        <div className={`${PANEL_CLASS} border-spike-brand/30`}>
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
        <div className={`${PANEL_CLASS} border-spike-brand/30`}>
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
        <div className={`${PANEL_CLASS} border-slate-200`}>
          <JourneyLens data={journeyView.data} sections={['timeline', 'completed']} />
        </div>
      )}

      {expandedPanel === 'grow' && growView?.lens === 'grow' && (
        <div className={`${PANEL_CLASS} border-slate-200`}>
          <GrowLens data={growView.data} />
        </div>
      )}

      {expandedPanel === 'protect' && protectView?.lens === 'protect' && (
        <div className={`${PANEL_CLASS} border-slate-200`}>
          <ProtectLens data={protectView.data} />
        </div>
      )}

      <div className="game-card p-3">
        <p className="mb-2 text-label uppercase text-slate-500">Actions</p>
        <div className="flex flex-col gap-2">
          {canRoll && (
            <button type="button" disabled={!canRoll} onClick={onRoll} className="btn-primary lg:hidden">
              {rolling ? 'Rolling…' : 'Roll dice'}
            </button>
          )}

          {inDecisionPhase && (
            <>
              <button
                type="button"
                onClick={() => openPanel('fna')}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  expandedPanel === 'fna'
                    ? 'border-2 border-spike-brand bg-spike-brand-muted text-spike-brand'
                    : 'btn-secondary'
                }`}
              >
                View analysis
              </button>
              <button
                type="button"
                disabled={!canDecide && expandedPanel !== 'decision'}
                onClick={() => openPanel('decision')}
                className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition ${
                  expandedPanel === 'decision'
                    ? 'bg-spike-brand-hover text-white shadow-md'
                    : 'btn-primary'
                }`}
              >
                Make decision
              </button>
              {(canReflect || expandedPanel === 'reflect') && (
                <button
                  type="button"
                  onClick={() => openPanel('reflect')}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    expandedPanel === 'reflect'
                      ? 'border-2 border-spike-brand bg-spike-brand-muted text-spike-brand'
                      : 'btn-secondary'
                  }`}
                >
                  Reflect on choice
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
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              expandedPanel === 'journey'
                ? 'bg-slate-100 text-slate-900 ring-1 ring-slate-300'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Journey timeline
          </button>
        </div>
      </div>
    </div>
  )
}
