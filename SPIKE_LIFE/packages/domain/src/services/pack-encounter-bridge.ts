import type { EncounterRecord } from '@spike-life/content-core'
import type { EncounterCardId } from '../gameboard/types.js'
import { ENCOUNTER_DECK } from '../gameboard/services/encounter-deck.js'
import { getEncounterRepository } from '../ports/encounter-repository.js'

const CARD_IDS_BY_LENGTH = (Object.keys(ENCOUNTER_DECK) as EncounterCardId[]).sort(
  (a, b) => b.length - a.length,
)

/** Map content-pack encounter id (e.g. career_first_job_1) to board card id (first_job). */
export function packIdToCardId(packId: string): EncounterCardId | null {
  for (const cardId of CARD_IDS_BY_LENGTH) {
    if (packId.includes(`_${cardId}_`)) return cardId
  }
  return null
}

/** Resolve board encounter card to content-pack record id for the active domain. */
export function resolvePackEncounterId(
  domainId: string,
  cardId: EncounterCardId,
): string | null {
  const token = `_${cardId}_`
  try {
    const repo = getEncounterRepository()
    const domainMatch = repo.getByDomain(domainId).find((enc) => enc.id.includes(token))
    if (domainMatch) return domainMatch.id

    const globalMatch = repo.getAll().find(
      (enc) => enc.domainId === domainId && enc.id.includes(token),
    )
    return globalMatch?.id ?? null
  } catch {
    return null
  }
}

export function packEncounterRecord(
  domainId: string,
  cardId: EncounterCardId,
): EncounterRecord | null {
  const packId = resolvePackEncounterId(domainId, cardId)
  if (!packId) return null
  try {
    return getEncounterRepository().getById(packId)
  } catch {
    return null
  }
}
