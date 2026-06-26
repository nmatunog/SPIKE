import { useCallback, useEffect, useState } from 'react'
import GameTopBar from './gameboard/GameTopBar.jsx'
import SpatialGameBoard from './gameboard/SpatialGameBoard.jsx'
import BoardLegendCard from './gameboard/BoardLegendCard.jsx'
import ObjectiveCard from './gameboard/ObjectiveCard.jsx'
import SituationSideCard from './gameboard/SituationSideCard.jsx'
import PrioritiesSideCard from './gameboard/PrioritiesSideCard.jsx'
import ActionDock from './gameboard/ActionDock.jsx'
import FinancialSnapshotBar from './gameboard/FinancialSnapshotBar.jsx'
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
  const [dashboard, setDashboard] = useState(null)
  const [board, setBoard] = useState(null)
  const [planView, setPlanView] = useState(null)
  const [journeyView, setJourneyView] = useState(null)
  const [growView, setGrowView] = useState(null)
  const [protectView, setProtectView] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [error, setError] = useState(null)
  const [expandedCard, setExpandedCard] = useState(null)
  const [expandedPanel, setExpandedPanel] = useState(null)

  const refresh = useCallback(async () => {
    await ensureSessionStarted()
    const [dash, spatial, plan, journey] = await Promise.all([
      getDashboard(),
      getSpatialBoard(),
      getLensView('plan'),
      getLensView('journey'),
    ])
    setDashboard(dash)
    setBoard(spatial)
    setPlanView(plan)
    setJourneyView(journey)
    setLoading(false)
    return { dash, spatial, plan, journey }
  }, [])

  useEffect(() => {
    refresh().catch((err) => {
      setError(err.message)
      setLoading(false)
    })
  }, [refresh])

  async function ensureLens(lens) {
    if (lens === 'grow' && !growView) {
      const view = await getLensView('grow')
      setGrowView(view)
      return view
    }
    if (lens === 'protect' && !protectView) {
      const view = await getLensView('protect')
      setProtectView(view)
      return view
    }
    return null
  }

  async function handleExpandPanel(panel) {
    setExpandedPanel(panel)
    if (panel === 'grow') await ensureLens('grow')
    if (panel === 'protect') await ensureLens('protect')
    if (panel === 'journey' || panel === 'reflect') {
      const journey = await getLensView('journey')
      setJourneyView(journey)
    }
    if (panel === 'fna' || panel === 'decision') {
      const plan = await getLensView('plan')
      setPlanView(plan)
    }
  }

  async function handleRollDice() {
    setRolling(true)
    setBusy(true)
    setError(null)
    setExpandedPanel(null)
    try {
      await rollDice()
      setExpandedCard('situation')
      await refresh()
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
      setExpandedPanel('reflect')
      const journey = await getLensView('journey')
      setJourneyView(journey)
      setPlanView(await getLensView('plan'))
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
      setExpandedCard(null)
      setExpandedPanel(null)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function toggleCard(id) {
    setExpandedCard(id)
    if (id) setExpandedPanel(null)
  }

  const inDecisionPhase = board?.phase === 'decision_phase'
  const canDecide = inDecisionPhase && dashboard?.canDecide
  const canReflect = inDecisionPhase && dashboard?.canReflect

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100">
      <GameTopBar
        dashboard={dashboard}
        board={board}
        onRoll={handleRollDice}
        rolling={rolling}
      />

      {onOpenWorkshop && (
        <div className="border-b border-slate-200 bg-white px-3 py-1.5 md:px-4">
          <div className="mx-auto flex max-w-[90rem] justify-end">
            <button
              type="button"
              onClick={onOpenWorkshop}
              className="text-xs font-medium text-[#8B0000] hover:underline md:text-sm"
            >
              Workshop ({GAME_ROOM_MAX_PLAYERS} players) →
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col gap-2 px-2 py-2 md:grid md:min-h-0 md:grid-cols-[11rem_minmax(0,1fr)_13rem] md:gap-3 md:px-3 md:py-3 lg:grid-cols-[12rem_minmax(0,1fr)_15rem]">
        {/* Left rail — legend & objective */}
        <aside className="hidden min-h-0 flex-col gap-2 md:flex">
          <BoardLegendCard expanded={expandedCard} onToggle={toggleCard} />
          <ObjectiveCard
            expanded={expandedCard}
            onToggle={toggleCard}
            encounter={board?.activeEncounter}
            dashboard={dashboard}
            planView={planView}
          />
          <div className="mt-auto rounded-lg border border-dashed border-slate-300 bg-white/60 px-2 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Turn loop
            </p>
            <p className="mt-1 text-[11px] leading-snug text-slate-600">
              Roll → Land → Analyze → Decide → Reflect
            </p>
          </div>
        </aside>

        {/* Center — board */}
        <main className="flex min-h-0 min-w-0 flex-col">
          <section className="relative flex flex-1 flex-col rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-800 to-slate-900 p-3 shadow-lg md:p-4">
            {board?.gameComplete && (
              <p className="mb-2 rounded-lg bg-emerald-500/20 px-3 py-2 text-center text-xs font-medium text-emerald-200">
                Journey complete — all {board.maxRounds} years played.
              </p>
            )}
            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-slate-400">Loading board…</p>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center py-2">
                <SpatialGameBoard board={board} rolling={rolling} dark />
              </div>
            )}
            {error && (
              <p className="mt-2 rounded-lg bg-red-500/20 px-3 py-2 text-center text-xs text-red-200">
                {error}
              </p>
            )}
          </section>

          {/* Mobile: collapsed left cards */}
          <div className="mt-2 grid gap-2 md:hidden">
            <BoardLegendCard expanded={expandedCard} onToggle={toggleCard} />
            <ObjectiveCard
              expanded={expandedCard}
              onToggle={toggleCard}
              encounter={board?.activeEncounter}
              dashboard={dashboard}
              planView={planView}
            />
          </div>
        </main>

        {/* Right rail — situation, priorities, actions */}
        <aside className="flex min-h-0 flex-col gap-2">
          <SituationSideCard
            encounter={board?.activeEncounter}
            expanded={expandedCard}
            onToggle={toggleCard}
          />
          <PrioritiesSideCard
            planView={planView}
            expanded={expandedCard}
            onToggle={toggleCard}
          />

          <ActionDock
            board={board}
            expandedPanel={expandedPanel}
            onExpandPanel={handleExpandPanel}
            onRoll={handleRollDice}
            rolling={rolling}
            canDecide={canDecide}
            canReflect={canReflect}
            inDecisionPhase={inDecisionPhase}
            planView={planView}
            journeyView={journeyView}
            growView={growView}
            protectView={protectView}
            onDecide={handleDecide}
            onSubmitReflection={handleReflection}
            busy={busy}
            error={error}
            onViewJourney={async () => {
              setJourneyView(await getLensView('journey'))
            }}
          />
        </aside>
      </div>

      <FinancialSnapshotBar
        dashboard={dashboard}
        onOpenProtect={async () => {
          await ensureLens('protect')
          handleExpandPanel('protect')
        }}
        onOpenGrow={async () => {
          await ensureLens('grow')
          handleExpandPanel('grow')
        }}
      />
    </div>
  )
}
