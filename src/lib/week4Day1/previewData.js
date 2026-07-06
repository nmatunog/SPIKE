import { getFecField, getFecUnifiedVentureProposition } from '../fecCanvasService.js';
import { getSectionFields } from '../blueprintSectionStore.js';
import { loadWeek4Day1Mission } from './storage.js';
import { WEEK4_BLUEPRINT_SECTION_SLUG } from './missionConstants.js';
import { loadGrowthEngineWorksheet } from '../growthEngineWorksheet/storage.js';
import { loadFinancialEngineWorksheet } from '../financialEngineWorksheet/storage.js';

/** @param {unknown} value */
function clean(value) {
  return String(value ?? '').trim();
}

/** @param {string} participantId */
export function buildWeek4Day1FecPreview(participantId) {
  const mission = loadWeek4Day1Mission(participantId);

  const ventureProposition =
    clean(getFecUnifiedVentureProposition(participantId))
    || clean(mission.drafts.mission1.finalProposition);

  const clientSegment = clean(getFecField(participantId, 'create_value', 'customer_segments'));
  const valueCreation = clean(getFecField(participantId, 'create_value', 'customer_problem'));
  const clientExperience =
    clean(getFecField(participantId, 'create_value', 'value_offering'))
    || clean(mission.drafts.mission2.clientExperience);
  const winningStrategy =
    clean(getFecField(participantId, 'agency_leadership', 'growth_multipliers'))
    || clean(mission.drafts.mission3.winningStrategy);

  const growthAdvisor = clean(getFecField(participantId, 'create_value', 'channels'));
  const growthTeam = clean(getFecField(participantId, 'agency_talent', 'talent_development_system'));
  const growthSystems = clean(getFecField(participantId, 'agency_leadership', 'expansion_strategy'));
  const growthEngines = [growthAdvisor, growthTeam, growthSystems].filter(Boolean).join('\n\n');

  const revenueEngine = clean(getFecField(participantId, 'capture_value', 'revenue_streams'));
  const partners = clean(getFecField(participantId, 'enable_value', 'key_partners'));

  const sections = [
    { id: 'client_segment', label: 'Client Segment', value: clientSegment },
    { id: 'venture_proposition', label: 'Venture Proposition', value: ventureProposition },
    { id: 'value_creation', label: 'Value Creation', value: valueCreation },
    { id: 'client_experience', label: 'Client Experience', value: clientExperience },
    { id: 'winning_strategy', label: 'Winning Strategy', value: winningStrategy },
    { id: 'growth_engines', label: 'Growth Engines', value: growthEngines },
    { id: 'revenue_engine', label: 'Revenue Engine', value: revenueEngine },
    { id: 'partners_alliances', label: 'Partners & Alliances', value: partners },
  ];

  const filled = sections.filter((row) => row.value.length > 0).length;

  return {
    sections,
    filledCount: filled,
    totalCount: sections.length,
    isEmpty: filled === 0,
  };
}

/** @param {string} participantId */
export function buildWeek4Day1BlueprintPreview(participantId) {
  const mission = loadWeek4Day1Mission(participantId);
  const vision = getSectionFields(participantId, 'vision-purpose');
  const market = getSectionFields(participantId, 'market-intelligence');
  const execution = getSectionFields(participantId, WEEK4_BLUEPRINT_SECTION_SLUG);
  const growthWorksheet = loadGrowthEngineWorksheet(participantId);
  const financialWorksheet = loadFinancialEngineWorksheet(participantId);

  const ventureProposition =
    clean(getFecUnifiedVentureProposition(participantId))
    || clean(mission.drafts.mission1.finalProposition);
  const clientExperience = clean(getFecField(participantId, 'create_value', 'value_offering'));
  const winningStrategy = clean(getFecField(participantId, 'agency_leadership', 'growth_multipliers'));
  const growthEngines = clean(getFecField(participantId, 'agency_talent', 'recruitment_channels'));
  const revenueEngine = clean(getFecField(participantId, 'capture_value', 'revenue_streams'));

  const sections = [
    { id: 'vision', label: 'Vision', value: clean(vision.vision_statement) },
    { id: 'mission', label: 'Mission', value: clean(vision.mission_statement) },
    { id: 'target_market', label: 'Target Market', value: clean(market.market_segment_insights) },
    { id: 'venture_proposition', label: 'Venture Proposition', value: ventureProposition },
    {
      id: 'business_model_summary',
      label: 'Business Model Summary',
      value: clean(market.opportunity_notes),
    },
    { id: 'client_experience', label: 'Client Experience', value: clientExperience },
    { id: 'winning_strategy', label: 'Winning Strategy', value: winningStrategy },
    { id: 'growth_engines', label: 'Growth Engines', value: growthEngines },
    {
      id: 'key_activities',
      label: 'Key Activities',
      value: clean(execution.key_activities) || clean(mission.drafts.blueprint.keyActivities),
    },
    {
      id: 'key_resources',
      label: 'Key Resources',
      value: clean(execution.key_resources) || clean(mission.drafts.blueprint.keyResources),
    },
    { id: 'revenue_engine', label: 'Revenue Engine', value: revenueEngine },
    {
      id: 'growth_strategy',
      label: 'Growth Strategy',
      value: clean(growthWorksheet.growthStrategy),
    },
    {
      id: 'three_year_targets',
      label: '3-Year Targets',
      value: [
        growthWorksheet.fecYear1Launch,
        growthWorksheet.fecYear2Expand,
        growthWorksheet.fecYear3Multiply,
        financialWorksheet.year1RevenueTarget,
      ]
        .map(clean)
        .filter(Boolean)
        .join('\n\n'),
    },
  ];

  const filled = sections.filter((row) => row.value.length > 0).length;

  return {
    sections,
    filledCount: filled,
    totalCount: sections.length,
    isEmpty: filled === 0,
  };
}

/** @param {string} participantId @param {number} step */
export function getWeek4Day1FinalizedFieldPreview(participantId, step) {
  const fec = buildWeek4Day1FecPreview(participantId);
  if (step === 2) return fec.sections.find((s) => s.id === 'client_experience')?.value ?? '';
  if (step === 3) return fec.sections.find((s) => s.id === 'winning_strategy')?.value ?? '';
  if (step === 4) return fec.sections.find((s) => s.id === 'growth_engines')?.value ?? '';
  if (step === 1) return fec.sections.find((s) => s.id === 'venture_proposition')?.value ?? '';
  return '';
}
