import { useCallback, useEffect, useRef, useState } from 'react'
import LensNav from '../LensNav.jsx'
import LifeLens from '../lenses/LifeLens.jsx'
import PlanLens from '../lenses/PlanLens.jsx'
import ProtectLens from '../lenses/ProtectLens.jsx'
import GrowLens from '../lenses/GrowLens.jsx'
import JourneyLens from '../lenses/JourneyLens.jsx'
import DreamBoardSetup from '../gameboard/DreamBoardSetup.jsx'
import { computeFinancialHealth } from '@spike-life/domain'
import PlanningCycleShell from '../gameboard/PlanningCycleShell.jsx'
import GameStatusBar from '../gameboard/GameStatusBar.jsx'
import WorkshopBoard from './WorkshopBoard.jsx'
import RoomPanel from './RoomPanel.jsx'
import WorkshopScoreHud from './WorkshopScoreHud.jsx'
import GameCodeBadge from './GameCodeBadge.jsx'
import PersonaAssignedCard from '../gameboard/PersonaAssignedCard.jsx'
import {
  advanceRoomTurn,
  beginPlayerDecisionWindow,
  dismissPlayerCalendarEvent,
  getGameBoard,
  getPlayerDashboard,
  getPlayerLensView,
  getRoomLifeSummary,
  setActiveRoom,
  startRoomCycle,
  submitPlayerAutoAdvisor,
  submitPlayerCalendarChoice,
  submitPlayerDecision,
  submitPlayerDreamBoardGoals,
  submitPlayerReflection,
} from '../../lib/spike-life-workshop-client.js'
import { subscribeSpikeLifeRoom } from '../../lib/spike-life-realtime.js'

const ACTIVE_ROOM_PHASES = new Set(['turn_active', 'cycle_active', 'awaiting_calendar'])

export default function WorkshopWorkspace({ session, onExit }) {
  const {
    playerId,
    displayName,
    roomId,
    gameCode,
    archetypeLabel,
    archetypeTagline,
    characterName,
    age,
  } = session

  const [board, setBoard] = useState(null)
  const [playerDashboard, setPlayerDashboard] = useState(null)
  const [activePlayerId, setActivePlayerId] = useState(playerId)
  const [activeLens, setActiveLens] = useState('life')
  const [lensView, setLensView] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [lifeSummary, setLifeSummary] = useState(null)
  const [autoAdvisorNotice, setAutoAdvisorNotice] = useState(null)
  const decisionWindowKeyRef = useRef(null)

  const mySlot = board?.players.find((p) => p.playerId === playerId)
  const needsSetup =
    mySlot?.status === 'joined'
    || (playerDashboard && !playerDashboard.dreamBoardComplete && playerDashboard.dreamBoard)

  const refreshAll = useCallback(async (lens = activeLens) => {
    const nextBoard = await getGameBoard()
    setBoard(nextBoard)

    const viewId = activePlayerId ?? playerId

    const [dashboard, view] = await Promise.all([
      getPlayerDashboard(playerId),
      viewId ? getPlayerLensView(viewId, lens) : Promise.resolve(null),
    ])
    setPlayerDashboard(dashboard)
    setLensView(view)

    if (nextBoard?.workshopComplete) {
      getRoomLifeSummary().then(setLifeSummary).catch(() => {})
    }

    setLoading(false)
    return nextBoard
  }, [activePlayerId, activeLens, playerId])

  useEffect(() => {
    setActiveRoom(roomId)
    refreshAll().catch((err) => {
      setError(err.message)
      setLoading(false)
    })

    let disposed = false
    let unsubscribe = () => {}

    ;(async () => {
      let supabase = null
      try {
        const mod = await import('../../../../../../src/supabaseClient.js')
        supabase = mod.supabase
      } catch {
        // SPIKE LIFE dev sandbox — polling fallback
      }
      if (disposed) return
      unsubscribe = subscribeSpikeLifeRoom(supabase, roomId, () => {
        refreshAll().catch(() => {})
      })
    })()

    return () => {
      disposed = true
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, [roomId])

  async function selectPlayer(id) {
    setActivePlayerId(id)
    setError(null)
    setActiveLens('life')
    const view = await getPlayerLensView(id, 'life')
    setLensView(view)
    if (id === playerId) {
      const dashboard = await getPlayerDashboard(playerId)
      setPlayerDashboard(dashboard)
    }
  }

  async function changeLens(lens) {
    if (!activePlayerId) return
    if (activePlayerId !== playerId && lens !== 'life') {
      setActiveLens('life')
      return
    }
    setActiveLens(lens)
    const view = await getPlayerLensView(activePlayerId, lens)
    setLensView(view)
  }

  async function runAction(action) {
    setBusy(true)
    setError(null)
    try {
      await action()
      await refreshAll(activeLens)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const selectedPlayer = board?.players.find((p) => p.playerId === activePlayerId) ?? null
  const canPlayAsSelf =
    ACTIVE_ROOM_PHASES.has(board?.roomPhase)
    && activePlayerId === playerId
    && !needsSetup
  const showPlayerCalendar =
    playerDashboard?.pendingCalendarEvent
    && activePlayerId === playerId

  useEffect(() => {
    if (!canPlayAsSelf || !playerDashboard?.canDecide) return undefined

    const key = `${playerDashboard.cycleLabel ?? ''}:${playerDashboard.turnNumber ?? ''}`
    if (decisionWindowKeyRef.current === key) return undefined
    decisionWindowKeyRef.current = key

    let cancelled = false
    setActiveLens('plan')

    beginPlayerDecisionWindow(playerId)
      .then(() => {
        if (!cancelled) {
          return Promise.all([
            getPlayerDashboard(playerId).then(setPlayerDashboard),
            getPlayerLensView(playerId, 'plan').then(setLensView),
          ])
        }
        return undefined
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [
    canPlayAsSelf,
    playerDashboard?.canDecide,
    playerDashboard?.cycleLabel,
    playerDashboard?.turnNumber,
    playerId,
  ])

  async function handleDreamBoardSubmit(choices) {
    await runAction(() => submitPlayerDreamBoardGoals(playerId, choices))
  }

  async function handleDecide(strategy) {
    if (!canPlayAsSelf) return
    await runAction(async () => {
      await submitPlayerDecision(playerId, strategy)
      setActiveLens('journey')
      const view = await getPlayerLensView(playerId, 'journey')
      setLensView(view)
    })
  }

  async function handleReflection(answers) {
    if (!canPlayAsSelf) return
    await runAction(() => submitPlayerReflection(playerId, answers))
  }

  async function handleTimerExpire() {
    if (!canPlayAsSelf || !playerDashboard?.canDecide || busy) return
    await runAction(async () => {
      setAutoAdvisorNotice('Time is up — your advisor applied a balanced choice. Review the results in Journey.')
      await submitPlayerAutoAdvisor(playerId)
      setActiveLens('journey')
      const view = await getPlayerLensView(playerId, 'journey')
      setLensView(view)
    })
  }

  async function handleThirteenthMonth(allocationId) {
    if (activePlayerId !== playerId) return
    await runAction(() => submitPlayerCalendarChoice(playerId, allocationId))
  }

  async function handleDismissCalendar() {
    if (activePlayerId !== playerId) return
    await runAction(() => dismissPlayerCalendarEvent(playerId))
  }

  function renderLens() {
    if (loading) return <p className="text-slate-500">Loading workspace…</p>
    if (activePlayerId !== playerId) {
      if (!lensView) {
        return <p className="text-red-600">{error ?? 'Unable to load player view.'}</p>
      }
      return <LifeLens dashboard={lensView.data} />
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
            onDecide={canPlayAsSelf ? handleDecide : undefined}
            onTimerExpire={canPlayAsSelf ? handleTimerExpire : undefined}
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
            onSubmitReflection={canPlayAsSelf ? handleReflection : undefined}
            submitting={busy}
            error={error}
          />
        )
      default:
        return null
    }
  }

  if (!loading && needsSetup && playerDashboard?.dreamBoard) {
    return (
      <DreamBoardSetup
        dreamBoard={playerDashboard.dreamBoard}
        dashboard={playerDashboard}
        onSubmit={handleDreamBoardSubmit}
        busy={busy}
        error={error}
      />
    )
  }

  return (
    <PlanningCycleShell
      dashboard={showPlayerCalendar ? playerDashboard : null}
      busy={busy}
      onThirteenthMonthSelect={handleThirteenthMonth}
      onCalendarDismiss={handleDismissCalendar}
      lifeSummary={lifeSummary}
      onPlayAgain={onExit}
    >
      <div className="min-h-dvh bg-slate-50 pb-20 md:pb-0">
        <header className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B0000]">
                SPIKE LIFE™ Multiplayer
              </p>
              <h1 className="text-lg font-semibold text-slate-900">{displayName}</h1>
              {gameCode && (
                <div className="mt-2">
                  <GameCodeBadge code={gameCode} compact />
                </div>
              )}
              {archetypeLabel && (
                <div className="mt-3 max-w-md">
                  <PersonaAssignedCard
                    archetypeLabel={archetypeLabel}
                    archetypeTagline={archetypeTagline}
                    characterName={characterName}
                    age={age}
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onExit}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Leave room
            </button>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[14rem_1fr_12rem]">
          <RoomPanel
            board={board}
            busy={busy}
            gameCode={gameCode}
            onStartCycle={() => runAction(() => startRoomCycle())}
          />

          <div className="min-w-0 space-y-4">
            <WorkshopBoard
              board={board}
              selectedPlayerId={activePlayerId}
              selectedDomainId={playerDashboard?.selectedDomainId ?? null}
              onSelectPlayer={selectPlayer}
              onAdvanceTurn={
                board?.canAdvanceTurn
                  ? () => runAction(() => advanceRoomTurn())
                  : undefined
              }
              advancing={busy}
            />

            {playerDashboard && activePlayerId === playerId && (
              <GameStatusBar
                age={playerDashboard.age}
                cashFlow={playerDashboard.monthlySurplus?.formatted}
                cash={playerDashboard.netWorth?.formatted}
                netWorth={playerDashboard.netWorth?.formatted}
                lifeScore={playerDashboard.lifeScore?.overall}
                year={playerDashboard.simulationYear}
                cycleLabel={playerDashboard.cycleLabel}
                turnNumber={playerDashboard.turnNumber}
                maxTurns={playerDashboard.maxTurns}
                financialHealth={computeFinancialHealth(
                  playerDashboard.fnaRating
                    ? {
                        cashFlowScore: playerDashboard.lifeScore.cashFlow,
                        protectionScore: playerDashboard.lifeScore.protection,
                        debtScore: 70,
                        goalScore: playerDashboard.lifeScore.goals,
                        retirementScore: playerDashboard.lifeScore.retirement,
                      }
                    : null,
                )}
              />
            )}

            {autoAdvisorNotice && (
              <p
                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                role="status"
              >
                {autoAdvisorNotice}
              </p>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {activePlayerId === playerId
                      ? 'Your workspace'
                      : `Viewing: ${selectedPlayer?.displayName ?? activePlayerId}`}
                  </h2>
                  {activePlayerId !== playerId && (
                    <p className="text-xs text-slate-500">Life lens only — you play as yourself.</p>
                  )}
                  {canPlayAsSelf && (
                    <p className="text-xs text-slate-500">
                      Complete Plan → Journey to finish your turn.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-4">
                {activePlayerId === playerId && (
                  <LensNav activeLens={activeLens} onChange={changeLens} />
                )}
                <main className="min-w-0 flex-1">{renderLens()}</main>
              </div>
            </section>
          </div>

          <WorkshopScoreHud board={board} selectedPlayer={selectedPlayer} />
        </div>

        {activePlayerId === playerId && (
          <LensNav activeLens={activeLens} onChange={changeLens} compact />
        )}
      </div>
    </PlanningCycleShell>
  )
}
