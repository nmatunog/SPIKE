import type { YearLoopConfig } from './year-loop-types.js'

export function validateYearLoopConfig(config: YearLoopConfig): void {
  if (!config.domains?.length) {
    throw new Error('yearLoop.domains must not be empty')
  }
  if (!config.weightBands?.length) {
    throw new Error('yearLoop.weightBands must not be empty')
  }

  const domainIds = new Set(config.domains.map((d) => d.id))
  if (domainIds.size !== config.domains.length) {
    throw new Error('yearLoop.domains contains duplicate ids')
  }

  const sorted = [...config.weightBands].sort((a, b) => a.maxAge - b.maxAge)
  for (const band of sorted) {
    const total = Object.values(band.weights).reduce((sum, w) => sum + w, 0)
    if (total <= 0) {
      throw new Error(`yearLoop weight band "${band.label}" must have positive total weight`)
    }
    for (const id of Object.keys(band.weights)) {
      if (!domainIds.has(id)) {
        throw new Error(`yearLoop weight band references unknown domain: ${id}`)
      }
    }
  }

  const prob = config.advisorInsightProbability
  if (prob != null && (prob < 0 || prob > 1)) {
    throw new Error('yearLoop.advisorInsightProbability must be between 0 and 1')
  }
}
