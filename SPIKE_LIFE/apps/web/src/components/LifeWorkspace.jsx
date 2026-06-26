import { useCallback, useEffect, useState } from 'react'
import LensNav from './LensNav.jsx'
import PersistentHeader from './PersistentHeader.jsx'
import SpatialGameBoard from './gameboard/SpatialGameBoard.jsx'
import DiceControl from './gameboard/DiceControl.jsx'
import EncounterCardPanel from './gameboard/EncounterCardPanel.jsx'
import FinancialSidePanel from './gameboard/FinancialSidePanel.jsx'
import {
  ensureSessionStarted,
  endBoardTurn,
  getDashboard,
  getLensView,
  getSpatialBoard,
  rollDice,
  submitDecision,
  submitReflection,
} from '../lib/spike-life-client.js'
import { GAME_ROOM_MAX_PLAYERS } from '../lib/spike-life-workshop-client.js'

export default function LifeWorkspace({ onOpenWorkshop }) {
  const [activeLens, setActiveLens] = useState('life')
  const [dashboard, setDashboard] = useState(null)
  const [board, setBoard] = useState(null)
  const [lensView, setLensView] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async (lens = activeLens) => {
    await ensureSessionStarted()
    const [dash, spatial, view] = await Promise.all([
      getDashboard(),
      getSpatialBoard(),
      getLensView(lens),
    ])
    setDashboard(dash)
    setBoard(spatial)
    setLensView(view)
    setLoading(false)
    return { dash, spatial, view }
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

  async function handleRollDice() {
    setRolling(true)
    setBusy(true)
    setError(null)
    try {
      await rollDice()
      setActiveLens('plan')
      await refresh('plan')
    } catch (err) {
      setError(err.message)
    } finally {
      setRolling(false)
      setBusy(false)
    }
  }

  async function handleDecide(strategy) {
    setBusy(true)
    setError(null)
    try {
      await submitDecision(strategy)
      setActiveLens('journey')
      await refresh('journey')
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
      await endBoardTurn()
      setActiveLens('life')
      await refresh('life')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const inDecisionPhase = board?.phase === 'decision_phase'
  const canDecide = inDecisionPhase && dashboard?.canDecide
  const canReflect = inDecisionPhase && dashboard?.canReflect

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <PersistentHeader dashboard={dashboard} />

      {onOpenWorkshop && (
        <div className="border-b border-slate-100 bg-white px-4 py-2">
          <div className="mx-auto flex max-w-7xl justify-end">
            <button
              type="button"
              onClick={onOpenWorkshop}
              className="text-sm font-medium text-[#8B0000] hover:underline"
            >
              Open workshop room (up to {GAME_ROOM_MAX_PLAYERS} players) →
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-4 lg:grid-cols-[1fr_minmax(18rem,22rem)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8B0000]">
                  Gameboard
                </p>
                <h2 className="text-lg font-semibold text-slate-900">
                  Roll · Move · Encounter · Decide
                </h2>
              </div>
              {board?.gameComplete && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                  Journey complete — all {board.maxRounds} years played.
                </p>
              )}
            </div>

            <SpatialGameBoard board={board} rolling={rolling} />

            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
              <EncounterCardPanel encounter={board?.activeEncounter} />
              <DiceControl board={board} onRoll={handleRollDice} rolling={rolling} />
            </div>
          </section>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          {dashboard && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Financial snapshot
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-slate-500">Life score</dt>
                  <dd className="font-semibold text-slate-900">{dashboard.lifeScore.overall}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Surplus</dt>
                  <dd className="font-semibold text-slate-900">{dashboard.monthlySurplus.formatted}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Net worth</dt>
                  <dd className="font-semibold text-slate-900">{dashboard.netWorth.formatted}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Turn</dt>
                  <dd className="font-semibold text-slate-900">
                    {dashboard.turnNumber}/{dashboard.maxTurns}
                  </dd>
                </div>
              </dl>
            </section>
          )}
        </div>

        <FinancialSidePanel
          activeLens={activeLens}
          onChangeLens={changeLens}
          lensView={lensView}
          loading={loading}
          error={error}
          canDecide={canDecide}
          canReflect={canReflect}
          onDecide={handleDecide}
          onSubmitReflection={handleReflection}
          deciding={busy}
          submitting={busy}
        />
      </div>

      {dashboard && (
        <footer className="hidden border-t border-slate-200 bg-white px-4 py-3 lg:block">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm">
            <p className="font-medium text-slate-700">Financial snapshot</p>
            <dl className="flex flex-wrap gap-6">
              <div>
                <dt className="text-xs text-slate-500">Life score</dt>
                <dd className="font-semibold">{dashboard.lifeScore.overall}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Monthly surplus</dt>
                <dd className="font-semibold">{dashboard.monthlySurplus.formatted}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Net worth</dt>
                <dd className="font-semibold">{dashboard.netWorth.formatted}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Age</dt>
                <dd className="font-semibold">{dashboard.age}</dd>
              </div>
            </dl>
          </div>
        </footer>
      )}

      <LensNav activeLens={activeLens} onChange={changeLens} compact />
    </div>
  )
}
