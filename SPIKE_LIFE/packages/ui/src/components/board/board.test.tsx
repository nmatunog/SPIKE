/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  BoardAnimation,
  BoardHUD,
  BoardLegend,
  BoardSpace,
  DicePanel,
  EncounterCard,
  FinancialHUD,
  GameBoard,
  PlayerToken,
  TurnCounter,
} from './index.js'
import type { BoardViewModel, FinancialHUDViewModel, PositionedSpace, TurnHUDViewModel } from '../../types/view-models.js'

const SAMPLE_SPACE: PositionedSpace = {
  id: 'career',
  name: 'Career Lift',
  title: 'Career Lift',
  boardIndex: 0,
  category: 'career',
  color: '#E84855',
  icon: 'briefcase',
  connections: [1],
  eventPool: ['promotion'],
  encounterId: 'promotion',
  x: 0.5,
  y: 0.1,
  angle: 0,
}

const SAMPLE_BOARD: BoardViewModel = {
  boardId: 'b1',
  phase: 'ready_to_roll',
  roundNumber: 1,
  boardYear: 1,
  maxRounds: 5,
  lastDiceRoll: null,
  canRoll: true,
  canEndTurn: false,
  gameComplete: false,
  currentPlayerId: 'solo',
  trackPath: 'M 10 10 L 90 10 L 90 90 L 10 90 Z',
  landedSpaceIndex: null,
  activeEncounter: null,
  tokens: [
    {
      playerId: 'solo',
      displayName: 'Alex',
      position: 0,
      color: '#8B0000',
      isCurrent: true,
    },
  ],
  spaces: [SAMPLE_SPACE],
}

const SAMPLE_HUD: TurnHUDViewModel = {
  characterName: 'Alex',
  age: 28,
  boardYear: 1,
  roundNumber: 1,
  maxRounds: 5,
  phase: 'ready_to_roll',
  canRoll: true,
  lastDiceRoll: 4,
  lifeScore: 72,
}

const SAMPLE_FINANCIAL: FinancialHUDViewModel = {
  characterName: 'Alex',
  lifeScore: 72,
  netWorth: '₱120,000',
  monthlySurplus: '₱8,000',
  protection: 65,
  goals: 40,
  metrics: [{ label: 'Income', value: '₱35,000' }],
}

describe('Board Component Library', () => {
  it('BoardSpace renders name from props', () => {
    render(<BoardSpace space={SAMPLE_SPACE} />)
    expect(screen.getByRole('button', { name: /Career Lift/i })).toBeInTheDocument()
  })

  it('PlayerToken renders initial from displayName', () => {
    render(
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <PlayerToken token={SAMPLE_BOARD.tokens[0]!} x={50} y={50} />
      </div>,
    )
    expect(screen.getByLabelText('Alex token')).toHaveTextContent('A')
  })

  it('BoardLegend renders items from props', () => {
    render(
      <BoardLegend
        items={[{ category: 'career', label: 'Career', color: '#E84855' }]}
        title="Legend"
      />,
    )
    expect(screen.getByLabelText('Legend')).toHaveTextContent('Career')
  })

  it('EncounterCard renders encounter data', () => {
    render(
      <EncounterCard
        encounter={{
          id: 'promotion',
          title: 'Promotion Offer',
          teaser: 'A raise is on the table.',
          learningConcept: 'Income growth',
        }}
        visible
      />,
    )
    expect(screen.getByLabelText('Encounter: Promotion Offer')).toBeInTheDocument()
  })

  it('TurnCounter renders year and turn from props', () => {
    render(<TurnCounter roundNumber={2} maxRounds={5} boardYear={3} />)
    expect(screen.getByLabelText('Turn counter')).toHaveTextContent('3')
    expect(screen.getByLabelText('Turn counter')).toHaveTextContent('2/5')
  })

  it('DicePanel disables roll when canRoll is false', () => {
    render(
      <DicePanel canRoll={false} rolling={false} lastDiceRoll={null} onRoll={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /Roll dice/i })).toBeDisabled()
  })

  it('BoardHUD renders character from hud prop', () => {
    render(<BoardHUD hud={SAMPLE_HUD} />)
    expect(screen.getByLabelText('Game status')).toHaveTextContent('Alex')
  })

  it('FinancialHUD renders metrics from data prop', () => {
    render(<FinancialHUD data={SAMPLE_FINANCIAL} />)
    expect(screen.getByLabelText('Wealth summary')).toHaveTextContent('₱120,000')
  })

  it('BoardAnimation renders children', () => {
    render(
      <BoardAnimation rolling>
        <p>Board content</p>
      </BoardAnimation>,
    )
    expect(screen.getByText('Board content')).toBeInTheDocument()
  })

  it('GameBoard shows loading state when board is null', () => {
    render(<GameBoard board={null} loadingLabel="Waiting…" />)
    expect(screen.getByText('Waiting…')).toBeInTheDocument()
  })

  it('GameBoard renders board year from props', () => {
    render(<GameBoard board={SAMPLE_BOARD} />)
    expect(screen.getByLabelText('Game board')).toHaveTextContent('1')
  })
})
