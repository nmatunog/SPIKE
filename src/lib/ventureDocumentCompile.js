/**
 * Compile a unified venture document from legacy SPIKE stores (read-only merge).
 * Used for hydration, portfolio export, and migration to public.ventures.
 */
import { fetchCanvasSummary } from './supabase/canvasSummary.js';
import { fetchBlueprintEntries } from './supabase/blueprintEntries.js';
import { loadVentureStudioState } from './ventureStudioStorage.js';
import { loadVentureDesignRecord } from './ventureDesignStudioService.js';
import { computeVentureReadinessScore } from './ventureReadinessScore.js';
import { mergeVentureDocument, emptyVentureDocument } from './ventureDocument.js';

/** @param {Record<string, string>} entries @param {string} section @param {string} key */
function field(entries, section, key) {
  return String(entries[`${section}:${key}`] ?? entries[key] ?? '').trim();
}

/**
 * @param {Array<{ section_slug?: string, field_key?: string, field_value?: string }>} rows
 */
function entriesToMap(rows) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const row of rows ?? []) {
    const section = row.section_slug ?? '';
    const key = row.field_key ?? '';
    if (!key) continue;
    map[`${section}:${key}`] = String(row.field_value ?? '');
    map[key] = String(row.field_value ?? '');
  }
  return map;
}

/**
 * @param {{
 *   participantId: string,
 *   squadName?: string,
 *   currentWeek?: number,
 *   currentDay?: number,
 *   blueprintSections?: Record<string, number>,
 * }} ctx
 */
export async function compileVentureDocumentFromLegacy(ctx) {
  const { participantId, squadName = '', currentWeek = 1, currentDay = 1, blueprintSections = {} } = ctx;
  const base = emptyVentureDocument();

  const [canvasSummary, blueprintRows] = await Promise.all([
    fetchCanvasSummary(participantId).catch(() => null),
    fetchBlueprintEntries(participantId).catch(() => []),
  ]);

  const studio = loadVentureStudioState(participantId);
  const design = loadVentureDesignRecord(participantId);
  const entries = entriesToMap(blueprintRows);
  const readiness = computeVentureReadinessScore(blueprintSections);

  const ventureOpportunity = [
    studio.step5?.suggests,
    studio.step5?.unmetNeed,
    studio.step5?.valueCreation,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const opportunityStatement = design.individual?.step3?.transformation
    || design.individual?.step1?.opportunity
    || studio.step5?.valueCreation
    || '';

  return mergeVentureDocument(base, {
    identity: {
      squadName: squadName || studio.squadName || '',
      ventureName: design.individual?.step4?.name || '',
      tagline: design.individual?.step4?.tagline || '',
      vision: field(entries, 'vision-purpose', 'vision-statement')
        || field(entries, 'vision-purpose', 'vision')
        || '',
    },
    research: {
      customerSegment: studio.targetSegment || design.individual?.step1?.customer || '',
      insights: studio.step3
        ?.filter((row) => row.problem || row.evidence)
        .map((row, index) => ({
          id: `studio-problem-${index + 1}`,
          text: [row.problem, row.evidence].filter(Boolean).join(' — '),
          source: 'venture-studio-day-3',
        })) ?? [],
      evidence: (studio.evidenceList ?? []).map((item, index) => ({
        id: String(item.id ?? `evidence-${index + 1}`),
        type: item.type === 'image' ? 'image' : 'note',
        title: item.title ?? '',
        content: item.content ?? '',
      })),
      opportunityStatement,
      ventureOpportunity,
    },
    fec: {
      uniqueVentureProposition:
        canvasSummary?.unified_venture_proposition
        || design.individual?.step3?.synthesisA
        || '',
      clientExperience: {
        customer: design.individual?.step1?.customer ?? '',
        problem: design.individual?.step1?.problem ?? '',
        beforeFeeling: design.individual?.step2?.beforeFeeling ?? '',
        afterFeeling: design.individual?.step2?.afterFeeling ?? '',
        clientFeeling: design.individual?.step4?.clientFeeling ?? '',
      },
      growthEngine: {
        whoServe: design.individual?.step3?.whoServe ?? '',
        transformation: design.individual?.step3?.transformation ?? '',
        different: design.individual?.step3?.different ?? '',
      },
      financialEngine: {
        successRevenue: canvasSummary?.success_revenue ?? '',
        successCustomers: canvasSummary?.success_customers ?? '',
        successAnnualProfit: canvasSummary?.success_annual_profit ?? '',
      },
      roadmap: {
        months12: canvasSummary?.roadmap_12mo ?? '',
        months24: canvasSummary?.roadmap_24mo ?? '',
        months36: canvasSummary?.roadmap_36mo ?? '',
        successNarrative: canvasSummary?.success_narrative ?? '',
      },
    },
    pitch: {
      story: field(entries, 'vision-purpose', 'future-self-narrative') || '',
      speakerAssignments: [],
      presentationDeck: null,
      readinessScore: readiness.composite ?? 0,
    },
    stage: {
      currentWeek,
      currentDay,
      completedMilestones: [],
      unlockedModules: [],
    },
  });
}
