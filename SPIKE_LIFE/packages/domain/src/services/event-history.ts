export interface EventHistoryEntry {
  lifeEventId: string
  encounterId: string
  cycleIndex: number
  turnNumber: number
  simulationYear: number
  recordedAt: string
}

export function hasOccurred(
  history: EventHistoryEntry[],
  lifeEventId: string,
): boolean {
  return history.some((e) => e.lifeEventId === lifeEventId)
}

export function lastOccurrenceCycle(
  history: EventHistoryEntry[],
  lifeEventId: string,
): number | null {
  const matches = history.filter((e) => e.lifeEventId === lifeEventId)
  if (!matches.length) return null
  return matches[matches.length - 1]!.cycleIndex
}

export function isOnCooldown(
  history: EventHistoryEntry[],
  lifeEventId: string,
  currentCycle: number,
  cooldownCycles: number,
): boolean {
  const last = lastOccurrenceCycle(history, lifeEventId)
  if (last == null) return false
  return currentCycle - last < cooldownCycles
}

export function occurredWithinCycles(
  history: EventHistoryEntry[],
  lifeEventId: string,
  currentCycle: number,
  within: number,
): boolean {
  const last = lastOccurrenceCycle(history, lifeEventId)
  if (last == null) return false
  return currentCycle - last <= within
}

export function completedPrerequisiteEvents(
  history: EventHistoryEntry[],
  required: string[],
): boolean {
  return required.every((id) => hasOccurred(history, id))
}

export function appendEventHistory(
  history: EventHistoryEntry[],
  entry: EventHistoryEntry,
): EventHistoryEntry[] {
  return [...history, entry]
}
