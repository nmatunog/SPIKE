#!/usr/bin/env node
/**
 * Smoke test: SPIKE LIFE workshop domain — both session modes, domain-driven cycles.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const domainDist = join(root, 'SPIKE_LIFE/packages/domain/dist/index.js')

function fail(message) {
  console.error(`smoke:spike-life-workshop FAIL — ${message}`)
  process.exit(1)
}

async function main() {
  const {
    configureCampaign,
    configureCalendarEvents,
    configureYearLoop,
    createCampaignSession,
    createWorkshopSession,
    setDreamBoard,
    startRoomCycle,
    submitDecision,
    submitReflection,
    advanceTurn,
    computeCampaignLifeSummary,
    configureEncounterRepository,
    canTransitionCyclePhase,
  } = await import(domainDist)

  const { PHILIPPINES_CAMPAIGN, PHILIPPINES_YEAR_LOOP } = await import(
    join(root, 'SPIKE_LIFE/packages/content-philippines/dist/index.js'),
  )

  const encounters = JSON.parse(
    readFileSync(
      join(root, 'SPIKE_LIFE/packages/content-philippines/src/data/encounters/all.json'),
      'utf8',
    ),
  )

  if (!Array.isArray(encounters) || encounters.length < 60) {
    fail(`expected ≥60 encounters, got ${encounters?.length ?? 0}`)
  }

  const byDomain = new Map()
  for (const enc of encounters) {
    byDomain.set(enc.domainId, (byDomain.get(enc.domainId) ?? 0) + 1)
  }
  for (const [domainId, count] of byDomain) {
    if (count < 5) fail(`domain ${domainId} has only ${count} encounters`)
  }

  configureCampaign(PHILIPPINES_CAMPAIGN)
  configureCalendarEvents(PHILIPPINES_CAMPAIGN.calendarEvents)
  configureYearLoop(PHILIPPINES_YEAR_LOOP)
  configureEncounterRepository({
    getAll: () => encounters,
    getByDomain: (id) => encounters.filter((e) => e.domainId === id),
    getById: (id) => encounters.find((e) => e.id === id) ?? null,
  })

  const currency = { code: 'PHP', symbol: '₱' }
  const reflection = [
    { promptId: 'what_happened', response: 'Test' },
    { promptId: 'why_happened', response: 'Test' },
    { promptId: 'what_worked', response: 'Test' },
    { promptId: 'what_change', response: 'Test' },
    { promptId: 'advise_other', response: 'Test' },
  ]

  let campaign = createCampaignSession('smoke-campaign', currency)
  if (campaign.dreamBoard?.goals) {
    campaign = setDreamBoard(campaign, campaign.dreamBoard.goals)
  }
  expect(campaign.sessionMode, 'campaign')
  expect(campaign.maxTurns, 20)

  campaign = startRoomCycle('smoke-campaign', campaign)
  if (!campaign.selectedDomainId || !campaign.encounterId) {
    fail('startRoomCycle should set domain + encounter')
  }
  campaign = submitDecision(campaign, 'maintain_lifestyle_discipline')
  campaign = submitReflection(campaign, reflection)
  campaign = advanceTurn(campaign)
  expect(campaign.turnNumber, 2)
  expect(campaign.cycleIndex, 2)

  let compressed = createWorkshopSession('smoke-ws', currency, undefined, 'workshop_compressed')
  if (compressed.dreamBoard?.goals) {
    compressed = setDreamBoard(compressed, compressed.dreamBoard.goals)
  }
  expect(compressed.maxTurns, 5)
  compressed = startRoomCycle('smoke-ws', compressed)
  compressed = submitDecision(compressed, 'maintain_lifestyle_discipline')
  compressed = submitReflection(compressed, reflection)
  compressed = advanceTurn(compressed)
  expect(compressed.turnNumber, 2)
  expect(compressed.cycleIndex, 5)

  if (!canTransitionCyclePhase('created', 'situation_presented')) {
    fail('planning cycle FSM missing expected transition')
  }

  const summary = computeCampaignLifeSummary([campaign, compressed], {})
  if (!summary.players.length) fail('life summary should include players')

  console.log('smoke:spike-life-workshop OK')
}

function expect(actual, expected) {
  if (actual !== expected) {
    fail(`expected ${expected}, got ${actual}`)
  }
}

main().catch((err) => fail(err.message))
