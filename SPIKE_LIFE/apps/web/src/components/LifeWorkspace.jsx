import { useCallback, useEffect, useState } from 'react'
import LensNav from './LensNav.jsx'
import PersistentHeader from './PersistentHeader.jsx'
import LifeLens from './lenses/LifeLens.jsx'
import LifeBoard from './LifeBoard.jsx'
import PlanLens from './lenses/PlanLens.jsx'
import ProtectLens from './lenses/ProtectLens.jsx'
import GrowLens from './lenses/GrowLens.jsx'
import JourneyLens from './lenses/JourneyLens.jsx'
import {
  ensureSessionStarted,
  getActiveScenario,
  getDashboard,
  getLensView,
  startScenario,
  submitDecision,
  submitReflection,
  advanceTurn,
} from '../lib/spike-life-client.js'
import { SCENARIOS } from '../lib/scenarios.js'

export default function LifeWorkspace({ onOpenWorkshop }) {
  const [activeLens, setActiveLens] = useState('life')
  const [dashboard, setDashboard] = useState(null)
  const [lensView, setLensView] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [scenario, setScenario] = useState(null)

  const refresh = useCallback(async (lens = activeLens) => {
    await ensureSessionStarted()
    const [dash, view] = await Promise.all([
      getDashboard(),
      getLensView(lens),
    ])
    setDashboard(dash)
    setLensView(view)
    setScenario(getActiveScenario())
    setLoading(false)
  }, [activeLens])

  useEffect(() => {
    refresh().catch((err) => {
      setError(err.message)
      setLoading(false)
    })
  }, [refresh])

  async function changeLens(lens) {
    setActiveLens(lens)
    setError(null)
    const view = await getLensView(lens)
    setLensView(view)
  }

  async function handleAdvanceTurn() {
    setBusy(true)
    setError(null)
    try {
      await advanceTurn()
      setActiveLens('life')
      await refresh('life')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleStartScenario(scenarioId) {
    setBusy(true)
    setError(null)
    setLoading(true)
    try {
      await startScenario(scenarioId)
      setActiveLens('life')
      await refresh('life')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDecide(strategy) {
    setBusy(true)
    setError(null)
    try {
      await submitDecision(strategy)
      await refresh('plan')
      setActiveLens('journey')
      const journeyView = await getLensView('journey')
      setLensView(journeyView)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleReflection(answers) {
    setBusy(true)
    setError(null)
    try {
      await submitReflection(answers)
      await refresh('journey')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function renderLens() {
    if (loading) {
      return <p className="text-slate-500">Loading workspace…</p>
    }
    if (!lensView) {
      return <p className="text-red-600">{error ?? 'Unable to load lens view.'}</p>
    }

    switch (lensView.lens) {
      case 'life':
        return <LifeLens dashboard={lensView.data} />
      case 'plan':
        return (
          <PlanLens
            data={lensView.data}
            onDecide={handleDecide}
            deciding={busy}
            error={error}
          />
        )
      case 'protect':
        return <ProtectLens data={lensView.data} />
      case 'grow':
        return <GrowLens data={lensView.data} />
      case 'journey':
        return (
          <JourneyLens
            data={lensView.data}
            onSubmitReflection={handleReflection}
            submitting={busy}
            error={error}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-20 md:pb-0">
      <PersistentHeader dashboard={dashboard} />
      {onOpenWorkshop && (
        <div className="border-b border-slate-100 bg-white px-4 py-2">
          <div className="mx-auto flex max-w-6xl justify-end">
            <button
              type="button"
              onClick={onOpenWorkshop}
              className="text-sm font-medium text-[#8B0000] hover:underline"
            >
              Open workshop room (up to 10 players) →
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-6xl px-4 py-4 space-y-6">
        <LifeBoard
          dashboard={dashboard}
          onAdvanceTurn={handleAdvanceTurn}
          advancing={busy}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Mission deck</h2>
          <p className="mt-1 text-xs text-slate-500">
            {dashboard?.canStartScenario
              ? 'Pick a scenario for this turn.'
              : dashboard?.canAdvanceTurn
                ? 'Turn complete — advance to the next life stage.'
                : 'Finish the planning cycle on the Plan and Journey lenses.'}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {SCENARIOS.map((item) => {
              const active = scenario === item.id
              const disabled = busy || !dashboard?.canStartScenario
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleStartScenario(item.id)}
                  className={`rounded-lg border p-4 text-left transition ${
                    active
                      ? 'border-[#8B0000] bg-red-50/50'
                      : disabled
                        ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
                        : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                </button>
              )
            })}
          </div>
        </section>
      </div>
      <div className="mx-auto flex max-w-6xl gap-6 px-4 pb-6">
        <LensNav activeLens={activeLens} onChange={changeLens} />
        <main className="min-w-0 flex-1">{renderLens()}</main>
      </div>
      <LensNav activeLens={activeLens} onChange={changeLens} compact />
    </div>
  )
}
