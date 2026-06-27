import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BoardHUD,
  BoardLegend,
  BoardOverlay,
  DicePanel,
  EncounterModal,
  FinancialHUD,
  GameBoard,
  SPACE_CATEGORY_LEGEND,
} from '@spike-life/ui'
import ActionDock from './gameboard/ActionDock.jsx'
import SituationSideCard from './gameboard/SituationSideCard.jsx'
import TurnFlowStepper from './gameboard/TurnFlowStepper.jsx'
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
    expandedPanel,
    showEncounterModal,
    highlightSpaceIndex,
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

  const inDecisionPhase = board?.phase === 'decision_phase'
  const canDecide = inDecisionPhase && dashboard?.canDecide
  const canReflect = inDecisionPhase && dashboard?.canReflect
  const recommendations = planView?.lens === 'plan' ? planView.data.recommendations : []
  const landedSpace = board?.spaces.find((s) => s.index === board.landedSpaceIndex)
  const priorityLabels = recommendations.slice(0, 3).map((r) => r.title)
  const impactTags = landedSpace ? impactTagsForSpaceType(landedSpace.type) : []

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-slate-50">
      <BoardHUD hud={turnHUD} onRoll={handleRollDice} rolling={rolling} />

      {onOpenWorkshop && (
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-0.5">
          <div className="mx-auto flex max-w-[100rem] justify-end">
            <button
              type="button"
              onClick={onOpenWorkshop}
              className="text-xs font-semibold text-spike-brand hover:underline"
            >
              Workshop ({GAME_ROOM_MAX_PLAYERS} players) →
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto grid min-h-0 w-full max-w-[100rem] flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[13.5rem_minmax(0,1fr)_17rem] lg:gap-4 lg:px-4 lg:py-3">
        <aside className="hidden min-h-0 flex-col gap-3 overflow-hidden lg:flex">
          <TurnFlowStepper
            phase={board?.phase ?? 'ready_to_roll'}
            rolling={rolling}
            expandedPanel={expandedPanel}
            showEncounterModal={showEncounterModal}
          />
          <BoardLegend compact items={SPACE_CATEGORY_LEGEND} title="Board" />
        </aside>

        <main className="relative flex min-h-0 min-w-0 flex-col px-2 py-2 lg:px-0 lg:py-0">
          {board?.gameComplete && (
            <p className="absolute left-4 right-4 top-2 z-10 rounded-xl bg-emerald-500/90 px-4 py-2 text-center text-sm font-semibold text-white shadow-md">
              Journey complete — all {board.maxRounds} years played.
            </p>
          )}

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-body-lg text-slate-500">Loading board…</p>
            </div>
          ) : (
            <GameBoard
              board={boardView}
              rolling={rolling}
              highlightSpaceIndex={highlightSpaceIndex}
              onSpaceSelect={(space) => setHighlightSpaceIndex(space.boardIndex)}
              className="min-h-0 flex-1"
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
            <p className="absolute bottom-2 left-2 right-2 rounded-xl bg-red-600/90 px-4 py-2 text-center text-sm font-medium text-white shadow-lg">
              {error}
            </p>
          )}
        </main>

        <aside className="flex min-h-0 flex-col gap-3 overflow-hidden px-2 pb-2 lg:px-0 lg:pb-0">
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
            forceOpen
          />

          <div className="min-h-0 flex-1 overflow-hidden">
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
          </div>
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
