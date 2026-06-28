/** Maps CQRS read models to presentation view models — no business logic. */

export function toBoardViewModel(spatial) {
  if (!spatial) return null

  return {
    boardId: spatial.boardId,
    phase: spatial.phase,
    roundNumber: spatial.roundNumber,
    boardYear: spatial.boardYear,
    maxRounds: spatial.maxRounds,
    lastDiceRoll: spatial.lastDiceRoll,
    lastCategoryDieRoll: spatial.lastCategoryDieRoll,
    lastSituationDieRoll: spatial.lastSituationDieRoll,
    rolledCategoryLabel: spatial.rolledCategoryLabel,
    selectedDomainId: spatial.selectedDomainId,
    selectedDomainLabel: spatial.selectedDomainLabel,
    lifeDomains: spatial.lifeDomains,
    canRoll: spatial.canRoll,
    canEndTurn: spatial.canEndTurn,
    gameComplete: spatial.gameComplete,
    currentPlayerId: spatial.currentPlayerId,
    trackPath: spatial.trackPath,
    landedSpaceIndex: spatial.landedSpaceIndex,
    activeEncounter: spatial.activeEncounter,
    tokens: spatial.tokens,
    spaces: spatial.spaces.map((space) => ({
      id: space.id,
      boardIndex: space.boardIndex,
      title: space.label,
      category: space.category,
      color: space.color,
      icon: space.icon,
      description: space.description,
      encounterId: space.encounterId,
      encounterTitle: space.encounterTitle,
      x: space.x,
      y: space.y,
      angle: space.angle,
    })),
  }
}

export function toTurnHUD(dashboard, board) {
  if (!dashboard) return null
  return {
    characterName: dashboard.characterName,
    age: dashboard.age,
    boardYear: board?.boardYear ?? dashboard.simulationYear,
    roundNumber: board?.roundNumber ?? dashboard.turnNumber,
    maxRounds: board?.maxRounds ?? dashboard.maxTurns,
    phase: board?.phase ?? 'ready_to_roll',
    canRoll: board?.canRoll ?? false,
    lastDiceRoll: board?.lastDiceRoll ?? null,
    lastCategoryDieRoll: board?.lastCategoryDieRoll ?? null,
    lastSituationDieRoll: board?.lastSituationDieRoll ?? null,
    rolledCategoryLabel: board?.rolledCategoryLabel ?? null,
    selectedDomainId: board?.selectedDomainId ?? null,
    selectedDomainLabel: board?.selectedDomainLabel ?? null,
    lifeScore: dashboard.lifeScore.overall,
  }
}

export function toFinancialHUD(dashboard, growView, planView) {
  if (!dashboard) return null

  const grow = growView?.lens === 'grow' ? growView.data : null
  const fna = planView?.lens === 'plan' ? planView.data.fna : null
  const income = grow?.cashFlow.monthlyIncome.amount ?? dashboard.monthlyIncome.amount
  const surplus = dashboard.monthlySurplus.amount
  const savingsRate = income > 0 ? Math.round((surplus / income) * 100) : null
  const efProgress = fna?.emergencyFundProgress

  return {
    characterName: dashboard.characterName,
    lifeScore: dashboard.lifeScore.overall,
    netWorth: dashboard.netWorth.formatted,
    monthlySurplus: dashboard.monthlySurplus.formatted,
    protection: dashboard.lifeScore.protection,
    goals: dashboard.lifeScore.goals,
    metrics: [
      { label: 'Income', value: dashboard.monthlyIncome.formatted },
      {
        label: 'Expenses',
        value: grow ? grow.cashFlow.monthlyExpenses.formatted : '—',
      },
      {
        label: 'Savings rate',
        value: savingsRate != null ? `${savingsRate}%` : '—',
        accent: true,
      },
      {
        label: 'Emergency fund',
        value: efProgress != null ? `${(efProgress * 6).toFixed(1)} mo` : '—',
      },
    ],
  }
}
