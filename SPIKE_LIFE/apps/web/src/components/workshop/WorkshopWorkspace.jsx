import { useCallback, useEffect, useState } from 'react'
import LensNav from '../LensNav.jsx'
import LifeLens from '../lenses/LifeLens.jsx'
import PlanLens from '../lenses/PlanLens.jsx'
import ProtectLens from '../lenses/ProtectLens.jsx'
import GrowLens from '../lenses/GrowLens.jsx'
import JourneyLens from '../lenses/JourneyLens.jsx'
import WorkshopBoard from './WorkshopBoard.jsx'
import FacilitatorPanel from './FacilitatorPanel.jsx'
import WorkshopScoreHud from './WorkshopScoreHud.jsx'
import {
  addDemoPlayers,
  advanceRoomTurn,
  getGameBoard,
  getPlayerDashboard,
  getPlayerLensView,
  startRoomTurn,
  submitPlayerDecision,
  submitPlayerReflection,
} from '../../lib/spike-life-workshop-client.js'

export default function WorkshopWorkspace({ session, onExit }) {
  const { role, playerId, displayName } = session
  const isFacilitator = role === 'facilitator'

  const [board, setBoard] = useState(null)
  const [activePlayerId, setActivePlayerId] = useState(
    isFacilitator ? null : playerId,
  )
  const [activeLens, setActiveLens] = useState('life')
  const [lensView, setLensView] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

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
      const [, view] = await Promise.all([
        getPlayerDashboard(targetId),
        getPlayerLensView(targetId, lens),
      ])
      setLensView(view)
    }

    setLoading(false)
    return nextBoard
  }, [activePlayerId, activeLens, isFacilitator, playerId])

  useEffect(() => {
    refreshAll().catch((err) => {
      setError(err.message)
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, [])

  async function selectPlayer(id) {
    setActivePlayerId(id)
    setError(null)
    setActiveLens('life')
    const [, view] = await Promise.all([
      getPlayerDashboard(id),
      getPlayerLensView(id, 'life'),
    ])
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
    board?.roomPhase === 'turn_active'
    && actingPlayerId
    && (isFacilitator || actingPlayerId === playerId)

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
            isFacilitator={isFacilitator}
            onAddDemoPlayers={() => runAction(() => addDemoPlayers(10))}
            onStartTurn={(scenarioId) => runAction(() => startRoomTurn(scenarioId))}
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
  )
}
