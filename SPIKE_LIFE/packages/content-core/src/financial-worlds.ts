/** SPIKE LIFE™ — Financial World catalog (Amendment A4) */

export type FinancialWorldId =
  | 'philippines'
  | 'singapore'
  | 'australia'
  | 'united_states'
  | 'indonesia'

export type FinancialWorldStatus = 'available' | 'planned'

export interface FinancialWorldDefinition {
  id: FinancialWorldId
  /** e.g. "Philippine Financial World" */
  title: string
  flag: string
  countryCode: string
  status: FinancialWorldStatus
  /** Content pack id when status is available */
  contentPackId?: string
}

export const MVP_FINANCIAL_WORLD_ID: FinancialWorldId = 'philippines'

export const FINANCIAL_WORLDS: FinancialWorldDefinition[] = [
  {
    id: 'philippines',
    title: 'Philippine Financial World',
    flag: '🇵🇭',
    countryCode: 'PH',
    status: 'available',
    contentPackId: 'philippines',
  },
  {
    id: 'singapore',
    title: 'Singapore Financial World',
    flag: '🇸🇬',
    countryCode: 'SG',
    status: 'planned',
  },
  {
    id: 'australia',
    title: 'Australian Financial World',
    flag: '🇦🇺',
    countryCode: 'AU',
    status: 'planned',
  },
  {
    id: 'united_states',
    title: 'American Financial World',
    flag: '🇺🇸',
    countryCode: 'US',
    status: 'planned',
  },
  {
    id: 'indonesia',
    title: 'Indonesian Financial World',
    flag: '🇮🇩',
    countryCode: 'ID',
    status: 'planned',
  },
]

const worldById = new Map(FINANCIAL_WORLDS.map((world) => [world.id, world]))

export function getFinancialWorld(id: FinancialWorldId): FinancialWorldDefinition {
  const world = worldById.get(id)
  if (!world) throw new Error(`Unknown financial world: ${id}`)
  return world
}

export function listFinancialWorlds(): FinancialWorldDefinition[] {
  return [...FINANCIAL_WORLDS]
}

export function availableFinancialWorlds(): FinancialWorldDefinition[] {
  return FINANCIAL_WORLDS.filter((world) => world.status === 'available')
}

export function isKnownFinancialWorldId(id: string): id is FinancialWorldId {
  return worldById.has(id as FinancialWorldId)
}
