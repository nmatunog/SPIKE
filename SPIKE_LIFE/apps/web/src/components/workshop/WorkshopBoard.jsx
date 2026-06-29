import { StageTrack } from '../StageTrack.jsx'
import PlayerToken from './PlayerToken.jsx'

export default function WorkshopBoard({
  board,
  selectedPlayerId,
  onSelectPlayer,
  onAdvanceTurn,
  advancing = false,
}) {
  if (!board) return null

  const { boardStages, turnNumber, maxTurns, canAdvanceTurn, workshopComplete } = board
  const { done, total } = board.completionSummary
  const cycleActive = ['turn_active', 'cycle_active', 'awaiting_calendar'].includes(board.roomPhase)

  return (
    <section className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8B0000]">
            Workshop Board
          </p>
          <h2 className="text-lg font-semibold text-slate-900">
            Turn {turnNumber} of {maxTurns}
            <span className="ml-2 text-sm font-normal text-slate-500">
              · {board.lifeStageLabel}
            </span>
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {board.playerCount} players
            {cycleActive && total > 0 && (
              <span className="ml-2 font-medium text-[#8B0000]">
                · {done}/{total} finished this turn
              </span>
            )}
          </p>
        </div>
        {canAdvanceTurn && onAdvanceTurn && (
          <button
            type="button"
            disabled={advancing}
            onClick={onAdvanceTurn}
            className="rounded-lg bg-[#8B0000] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#6d0000] disabled:opacity-50"
          >
            {advancing ? 'Advancing…' : 'Advance room turn →'}
          </button>
        )}
        {workshopComplete && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            Workshop complete — all 5 life stages finished.
          </p>
        )}
      </div>

      <div className="mt-6">
        <StageTrack
          boardStages={boardStages}
          renderOnCurrentStage={() => (
            <div className="flex flex-wrap justify-center gap-1 px-1">
              {board.players.map((player) => (
                <PlayerToken
                  key={player.playerId}
                  player={player}
                  selected={selectedPlayerId === player.playerId}
                  onSelect={onSelectPlayer}
                  compact={board.players.length > 6}
                />
              ))}
            </div>
          )}
        />
      </div>

      {board.players.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">
          No players yet — share your game code so players can register and join.
        </p>
      )}

      {board.roomPhase === 'lobby' && board.playerCount > 0 && (
        <p className="mt-4 text-sm text-slate-600">
          Facilitator: start the planning cycle when everyone has joined.
        </p>
      )}
    </section>
  )
}
