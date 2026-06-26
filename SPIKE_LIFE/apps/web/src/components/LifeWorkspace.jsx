import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BoardHUD,
  BoardLegend,
  BoardOverlay,
  DicePanel,
  EncounterModal,
  FinancialHUD,
  GameBoard,
  TurnIndicator,
} from '@spike-life/ui'
import ActionDock from './gameboard/ActionDock.jsx'
import ObjectiveCard from './gameboard/ObjectiveCard.jsx'
import SituationSideCard from './gameboard/SituationSideCard.jsx'
import PrioritiesSideCard from './gameboard/PrioritiesSideCard.jsx'
import FnaSummaryCard from './gameboard/FnaSummaryCard.jsx'
import RecentDecisionsCard from './gameboard/RecentDecisionsCard.jsx'
import { impactTagsForSpaceType } from './gameboard/encounter-impact.js'
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
import {
  toBoardViewModel,
  toFinancialHUD,
  toTurnHUD,
} from '../lib/board-view-adapter.js'
import { useBoardUIStore } from '../store/board-ui-store.js'
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

  const {
    expandedCard,
    expandedPanel,
    showEncounterModal,
    highlightSpaceIndex,
    setExpandedCard,
    setExpandedPanel,
    setShowEncounterModal,
    setHighlightSpaceIndex,
    resetPanels,
  } = useBoardUIStore()

  const refresh = useCallback(async () => {
    await ensureSessionStarted()
    const [dash, spatial, plan, journey, grow] = await Promise.all([
      getDashboard(),
      getSpatialBoard(),
      getLensView('plan'),
      getLensView('journey'),
      getLensView('grow'),
    ])
    setDashboard(dash)
    setBoard(spatial)
    setPlanView(plan)
    setJourneyView(journey)
    setGrowView(grow)
    setLoading(false)
    return { dash, spatial, plan, journey, grow }
  }, [])

  useEffect(() => {
    refresh().catch((err) => {
      setError(err.message)
      setLoading(false)
    })
  }, [refresh])

  const boardView = useMemo(() => toBoardViewModel(board), [board])
  const turnHUD = useMemo(() => toTurnHUD(dashboard, board), [dashboard, board])
  const financialHUD = useMemo(
    () => toFinancialHUD(dashboard, growView, planView),
    [dashboard, growView, planView],
  )

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
      setJourneyView(await getLensView('journey'))
    }
    if (panel === 'fna' || panel === 'decision') {
      setPlanView(await getLensView('plan'))
    }
  }

  async function handleRollDice() {
    setRolling(true)
    setBusy(true)
    setError(null)
    setExpandedPanel(null)
    setShowEncounterModal(false)
    try {
      await rollDice()
      setExpandedCard('situation')
      await refresh()
      setShowEncounterModal(true)
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
    setShowEncounterModal(false)
    try {
      await submitDecision(strategy)
      setExpandedPanel('reflect')
      setJourneyView(await getLensView('journey'))
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
      resetPanels()
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
  const recommendations = planView?.lens === 'plan' ? planView.data.recommendations : []
  const landedSpace = board?.spaces.find((s) => s.index === board.landedSpaceIndex)
  const priorityLabels = recommendations.slice(0, 3).map((r) => r.title)
  const impactTags = landedSpace ? impactTagsForSpaceType(landedSpace.type) : []

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-slate-100">
      <BoardHUD hud={turnHUD} onRoll={handleRollDice} rolling={rolling} />

      {onOpenWorkshop && (
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-1">
          <div className="mx-auto flex max-w-[100rem] justify-end">
            <button
              type="button"
              onClick={onOpenWorkshop}
              className="text-xs font-semibold text-[#8B0000] hover:underline md:text-sm"
            >
              Workshop ({GAME_ROOM_MAX_PLAYERS} players) →
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto grid min-h-0 w-full max-w-[100rem] flex-1 grid-cols-1 gap-3 overflow-hidden px-3 py-3 lg:grid-cols-[minmax(11rem,14%)_minmax(0,1fr)_minmax(12rem,16%)] lg:gap-4 lg:px-4">
        <aside className="hidden min-h-0 flex-col gap-3 overflow-y-auto lg:flex">
          <BoardLegend compact />
          <ObjectiveCard
            expanded={expandedCard}
            onToggle={toggleCard}
            encounter={board?.activeEncounter}
            dashboard={dashboard}
            planView={planView}
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <TurnIndicator phase={board?.phase ?? 'ready_to_roll'} />
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Roll the dice, land on a space, review your situation, then decide how to respond.
            </p>
          </div>
        </aside>

        <main className="relative flex min-h-0 min-w-0 flex-col items-center justify-center">
          <section className="relative flex h-full w-full max-w-[min(72vw,56rem)] flex-col items-center justify-center rounded-3xl border border-slate-700/60 bg-gradient-to-b from-slate-900 to-slate-950 p-3 shadow-2xl lg:p-4">
            {board?.gameComplete && (
              <p className="absolute left-4 right-4 top-3 z-10 rounded-xl bg-emerald-500/20 px-4 py-2 text-center text-sm font-medium text-emerald-200">
                Journey complete — all {board.maxRounds} years played.
              </p>
            )}

            {loading ? (
              <p className="text-base text-slate-400">Loading board…</p>
            ) : (
              <GameBoard
                board={boardView}
                rolling={rolling}
                highlightSpaceIndex={highlightSpaceIndex}
                onSpaceSelect={(space) => setHighlightSpaceIndex(space.boardIndex)}
                className="h-full"
              />
            )}

            <BoardOverlay
              visible={showEncounterModal && inDecisionPhase && !rolling}
              onDismiss={() => setShowEncounterModal(false)}
            >
              <EncounterModal
                encounter={board?.activeEncounter ?? null}
                spaceCategory={landedSpace?.category}
                impactTags={impactTags}
                priorityLabels={priorityLabels}
                onViewAnalysis={() => {
                  setShowEncounterModal(false)
                  handleExpandPanel('fna')
                }}
                onMakeDecision={() => {
                  setShowEncounterModal(false)
                  handleExpandPanel('decision')
                }}
                onDismiss={() => setShowEncounterModal(false)}
              />
            </BoardOverlay>

            {error && (
              <p className="absolute bottom-3 left-3 right-3 rounded-xl bg-red-500/20 px-4 py-2 text-center text-sm text-red-200">
                {error}
              </p>
            )}
          </section>
        </main>

        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          <div className="lg:hidden">
            <DicePanel
              canRoll={board?.canRoll ?? false}
              rolling={rolling}
              lastDiceRoll={board?.lastDiceRoll ?? null}
              onRoll={handleRollDice}
            />
          </div>

          <SituationSideCard
            encounter={board?.activeEncounter}
            expanded={expandedCard}
            onToggle={toggleCard}
          />
          <FnaSummaryCard planView={planView} expanded={expandedCard} onToggle={toggleCard} />
          <PrioritiesSideCard planView={planView} expanded={expandedCard} onToggle={toggleCard} />
          <RecentDecisionsCard
            journeyView={journeyView}
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

      <FinancialHUD
        data={financialHUD}
        onOpenGrow={async () => {
          await ensureLens('grow')
          handleExpandPanel('grow')
        }}
        onOpenProtect={async () => {
          await ensureLens('protect')
          handleExpandPanel('protect')
        }}
      />
    </div>
  )
}
