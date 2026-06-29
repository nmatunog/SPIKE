import { useCallback, useEffect, useState } from 'react'
import LensNav from '../LensNav.jsx'
import LifeLens from '../lenses/LifeLens.jsx'
import PlanLens from '../lenses/PlanLens.jsx'
import ProtectLens from '../lenses/ProtectLens.jsx'
import GrowLens from '../lenses/GrowLens.jsx'
import JourneyLens from '../lenses/JourneyLens.jsx'
import { computeFinancialHealth } from '@spike-life/domain'
import PlanningCycleShell from '../gameboard/PlanningCycleShell.jsx'
import GameStatusBar from '../gameboard/GameStatusBar.jsx'
import WorkshopBoard from './WorkshopBoard.jsx'
import FacilitatorPanel from './FacilitatorPanel.jsx'
import WorkshopScoreHud from './WorkshopScoreHud.jsx'
import GameCodeBadge from './GameCodeBadge.jsx'
import PersonaAssignedCard from '../gameboard/PersonaAssignedCard.jsx'
import {
  advanceRoomTurn,
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
  submitPlayerReflection,
} from '../../lib/spike-life-workshop-client.js'
import { subscribeSpikeLifeRoom } from '../../lib/spike-life-realtime.js'

const ACTIVE_ROOM_PHASES = new Set(['turn_active', 'cycle_active', 'awaiting_calendar'])

export default function WorkshopWorkspace({ session, onExit }) {
  const {
    role,
    playerId,
    displayName,
    roomId,
    gameCode,
    archetypeLabel,
    archetypeTagline,
    characterName,
    age,
  } = session
  const isFacilitator = role === 'facilitator'

  const [board, setBoard] = useState(null)
  const [playerDashboard, setPlayerDashboard] = useState(null)
  const [activePlayerId, setActivePlayerId] = useState(
    isFacilitator ? null : playerId,
  )
  const [activeLens, setActiveLens] = useState('life')
  const [lensView, setLensView] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [lifeSummary, setLifeSummary] = useState(null)

  const refreshAll = useCallback(async (lens = activeLens) => {
    const nextBoard = await getGameBoard()
    setBoard(nextBoard)

    const targetId = activePlayerId
      ?? (isFacilitator ? nextBoard?.players[0]?.playerId : playerId)
      ?? null

    if (!activePlayerId && targetId) {
      setActivePlayerId(targetId)
    }

    if (targetId) {
      const [dashboard, view] = await Promise.all([
        getPlayerDashboard(targetId),
        getPlayerLensView(targetId, lens),
      ])
      setPlayerDashboard(dashboard)
      setLensView(view)
    } else {
      setPlayerDashboard(null)
    }

    if (nextBoard?.workshopComplete) {
      getRoomLifeSummary().then(setLifeSummary).catch(() => {})
    }

    setLoading(false)
    return nextBoard
  }, [activePlayerId, activeLens, isFacilitator, playerId])

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
    const [dashboard, view] = await Promise.all([
      getPlayerDashboard(id),
      getPlayerLensView(id, 'life'),
    ])
    setPlayerDashboard(dashboard)
    setLensView(view)
  }

  async function changeLens(lens) {
    if (!activePlayerId) return
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

  const actingPlayerId = activePlayerId ?? playerId
  const selectedPlayer = board?.players.find((p) => p.playerId === activePlayerId) ?? null
  const canPlayAsSelected =
    ACTIVE_ROOM_PHASES.has(board?.roomPhase)
    && actingPlayerId
    && (isFacilitator || actingPlayerId === playerId)
  const calendarPlayerId = isFacilitator ? actingPlayerId : playerId
  const showPlayerCalendar =
    playerDashboard?.pendingCalendarEvent
    && (!isFacilitator || actingPlayerId === playerId)

  async function handleDecide(strategy) {
    if (!canPlayAsSelected) return
    await runAction(async () => {
      await submitPlayerDecision(actingPlayerId, strategy)
      setActiveLens('journey')
      const view = await getPlayerLensView(actingPlayerId, 'journey')
      setLensView(view)
    })
  }

  async function handleReflection(answers) {
    if (!canPlayAsSelected) return
    await runAction(() => submitPlayerReflection(actingPlayerId, answers))
  }

  async function handleTimerExpire() {
    if (!canPlayAsSelected || !playerDashboard?.canDecide || busy) return
    await runAction(async () => {
      await submitPlayerAutoAdvisor(actingPlayerId)
      setActiveLens('journey')
      const view = await getPlayerLensView(actingPlayerId, 'journey')
      setLensView(view)
    })
  }

  async function handleThirteenthMonth(allocationId) {
    if (!calendarPlayerId) return
    await runAction(() => submitPlayerCalendarChoice(calendarPlayerId, allocationId))
  }

  async function handleDismissCalendar() {
    if (!calendarPlayerId) return
    await runAction(() => dismissPlayerCalendarEvent(calendarPlayerId))
  }

  function renderLens() {
    if (loading) return <p className="text-slate-500">Loading workspace…</p>
    if (!activePlayerId) {
      return (
        <p className="text-slate-600">
          Select a player token on the board to preview their financial workspace.
        </p>
      )
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
            onDecide={canPlayAsSelected ? handleDecide : undefined}
            onTimerExpire={canPlayAsSelected ? handleTimerExpire : undefined}
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
            onSubmitReflection={canPlayAsSelected ? handleReflection : undefined}
            submitting={busy}
            error={error}
          />
        )
      default:
        return null
    }
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
                SPIKE LIFE™ Workshop
              </p>
              <h1 className="text-lg font-semibold text-slate-900">
                {displayName}
                <span className="ml-2 text-sm font-normal capitalize text-slate-500">
                  ({role})
                </span>
              </h1>
              {gameCode && (
                <div className="mt-2">
                  <GameCodeBadge code={gameCode} compact />
                </div>
              )}
              {!isFacilitator && archetypeLabel && (
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

        <div
          className={`mx-auto grid max-w-7xl gap-4 px-4 py-4 ${
            isFacilitator ? 'lg:grid-cols-[14rem_1fr_12rem]' : 'lg:grid-cols-[1fr_12rem]'
          }`}
        >
          {isFacilitator && (
            <FacilitatorPanel
              board={board}
              busy={busy}
              gameCode={gameCode}
              isFacilitator={isFacilitator}
              onStartCycle={() => runAction(() => startRoomCycle())}
            />
          )}

          <div className="min-w-0 space-y-4">
            <WorkshopBoard
              board={board}
              selectedPlayerId={activePlayerId}
              onSelectPlayer={selectPlayer}
              onAdvanceTurn={
                isFacilitator ? () => runAction(() => advanceRoomTurn()) : undefined
              }
              advancing={busy}
            />

            {playerDashboard && (
              <GameStatusBar
                age={playerDashboard.age}
                cashFlow={playerDashboard.monthlySurplus?.formatted}
                cash={playerDashboard.netWorth?.formatted}
                netWorth={playerDashboard.netWorth?.formatted}
                lifeScore={playerDashboard.lifeScore?.overall}
                year={playerDashboard.simulationYear}
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

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {activePlayerId
                      ? `Viewing: ${selectedPlayer?.displayName ?? activePlayerId}`
                      : 'Player workspace'}
                  </h2>
                  {!isFacilitator && activePlayerId !== playerId && (
                    <p className="text-xs text-amber-700">You can only play as yourself.</p>
                  )}
                  {canPlayAsSelected && (
                    <p className="text-xs text-slate-500">
                      Complete Plan → Journey to finish your turn.
                    </p>
                  )}
                </div>
                {isFacilitator && board?.players.length > 1 && (
                  <select
                    className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={activePlayerId ?? ''}
                    onChange={(e) => selectPlayer(e.target.value)}
                  >
                    {board.players.map((p) => (
                      <option key={p.playerId} value={p.playerId}>
                        {p.displayName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mt-4 flex gap-4">
                <LensNav activeLens={activeLens} onChange={changeLens} />
                <main className="min-w-0 flex-1">{renderLens()}</main>
              </div>
            </section>
          </div>

          <WorkshopScoreHud board={board} selectedPlayer={selectedPlayer} />
        </div>

        <LensNav activeLens={activeLens} onChange={changeLens} compact />
      </div>
    </PlanningCycleShell>
  )
}
