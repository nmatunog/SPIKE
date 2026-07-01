import DomainGridBoard from '../gameboard/DomainGridBoard.jsx'
import CycleBadge from '../gameboard/CycleBadge.jsx'
import PlayerToken from './PlayerToken.jsx'

export default function WorkshopBoard({
  board,
  selectedPlayerId,
  selectedDomainId = null,
  onSelectPlayer,
  onAdvanceTurn,
  advancing = false,
}) {
  if (!board) return null

  const {
    turnNumber,
    maxTurns,
    canAdvanceTurn,
    workshopComplete,
    cycleLabel,
    lifeDomains = [],
    domainAnimationCycle = [],
    sessionMode,
  } = board
  const { done, total } = board.completionSummary
  const cycleActive = ['turn_active', 'cycle_active', 'awaiting_calendar'].includes(board.roomPhase)
  const gridMode = cycleActive && !selectedDomainId ? 'scanning' : selectedDomainId ? 'locked' : 'idle'

  return (
    <section className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          {cycleLabel && (
            <CycleBadge
              cycleLabel={cycleLabel}
              turnNumber={turnNumber}
              maxTurns={maxTurns}
            />
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8B0000]">
              {sessionMode === 'campaign' ? 'Campaign Board' : 'Workshop Board'}
            </p>
            <h2 className="text-lg font-semibold text-slate-900">
              {board.lifeStageLabel}
              <span className="ml-2 text-sm font-normal text-slate-500">
                · Chapter {turnNumber} of {maxTurns}
              </span>
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {board.playerCount} players
              {cycleActive && total > 0 && (
                <span className="ml-2 font-medium text-[#8B0000]">
                  · {done}/{total} finished this cycle
                </span>
              )}
            </p>
          </div>
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
            Session complete — Life Score podium ready.
          </p>
        )}
      </div>

      {lifeDomains.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-900 p-4">
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Life domains
          </p>
          <DomainGridBoard
            domains={lifeDomains}
            selectedDomainId={selectedDomainId}
            animationCycle={domainAnimationCycle}
            rolling={cycleActive && !selectedDomainId}
            mode={gridMode}
          />
        </div>
      )}

      {board.players.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
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
