/**
 * Venture Design Studio — individual + squad consolidated drafts, research hydration, FEC sync.
 */
import { loadVentureStudioState } from './ventureStudioStorage.js';
import { getParticipantSquad } from './cohortFormationService.js';
import { saveFecField, saveFecSummaryField } from './fecCanvasService.js';
import { saveCanvasSummaryDebounced } from './canvasSummaryService.js';
import { appendTimelineEvent } from './timelineService.js';
import { emptyIndividualDraft } from './ventureDesignStudioConstants.js';

const STORAGE_KEY = 'spike_venture_design_studio';

export const VENTURE_DESIGN_DAY4_MODULE_ID = 'venture-design-day-4';

/**
 * @typedef {ReturnType<typeof emptyIndividualDraft>} VentureDesignIndividualDraft
 * @typedef {{
 *   isStarted: boolean,
 *   currentStep: number,
 *   highestStepReached: number,
 *   isComplete: boolean,
 *   individual: VentureDesignIndividualDraft,
 *   updatedAt: string | null,
 * }} VentureDesignParticipantRecord
 * @typedef {{
 *   consolidated: VentureDesignIndividualDraft,
 *   coachSummary: string,
 *   coachFocus: string,
 *   mentorRating: number | null,
 *   mentorNotes: string,
 *   updatedAt: string | null,
 *   updatedBy: string | null,
 * }} VentureDesignSquadRecord
 */

/** @returns {VentureDesignParticipantRecord} */
export function emptyParticipantRecord() {
  return {
    isStarted: false,
    currentStep: 1,
    highestStepReached: 1,
    isComplete: false,
    individual: emptyIndividualDraft(),
    updatedAt: null,
  };
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return { participants: {}, squads: {} };
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('[ventureDesign] save failed:', err instanceof Error ? err.message : err);
  }
}

/** @param {string} participantId */
export function loadVentureDesignRecord(participantId) {
  if (!participantId) return emptyParticipantRecord();
  const store = readStore();
  const raw = store.participants?.[participantId];
  if (!raw) return emptyParticipantRecord();
  return {
    ...emptyParticipantRecord(),
    ...raw,
    individual: mergeDraft(emptyIndividualDraft(), raw.individual),
  };
}

/**
 * @param {VentureDesignIndividualDraft} base
 * @param {Partial<VentureDesignIndividualDraft> | undefined} patch
 */
function mergeDraft(base, patch) {
  if (!patch) return base;
  return {
    step1: { ...base.step1, ...(patch.step1 ?? {}) },
    step2: { ...base.step2, ...(patch.step2 ?? {}) },
    step3: { ...base.step3, ...(patch.step3 ?? {}) },
    step4: {
      ...base.step4,
      ...(patch.step4 ?? {}),
      personality: {
        ...base.step4.personality,
        ...(patch.step4?.personality ?? {}),
      },
    },
  };
}

/**
 * @param {string} participantId
 * @param {Partial<VentureDesignParticipantRecord>} patch
 */
export function saveVentureDesignRecord(participantId, patch) {
  if (!participantId) return;
  const store = readStore();
  if (!store.participants) store.participants = {};
  if (!store.squads) store.squads = {};
  const prev = loadVentureDesignRecord(participantId);
  store.participants[participantId] = {
    ...prev,
    ...patch,
    individual: patch.individual ? mergeDraft(prev.individual, patch.individual) : prev.individual,
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
}

/** @param {string} squadId */
export function loadSquadDesignRecord(squadId) {
  if (!squadId) {
    return {
      consolidated: emptyIndividualDraft(),
      coachSummary: '',
      coachFocus: '',
      mentorRating: null,
      mentorNotes: '',
      updatedAt: null,
      updatedBy: null,
    };
  }
  const store = readStore();
  const raw = store.squads?.[squadId];
  if (!raw) {
    return {
      consolidated: emptyIndividualDraft(),
      coachSummary: '',
      coachFocus: '',
      mentorRating: null,
      mentorNotes: '',
      updatedAt: null,
      updatedBy: null,
    };
  }
  return {
    ...raw,
    consolidated: mergeDraft(emptyIndividualDraft(), raw.consolidated),
    mentorRating: raw.mentorRating ?? null,
    mentorNotes: raw.mentorNotes ?? '',
    coachSummary: raw.coachSummary ?? '',
    coachFocus: raw.coachFocus ?? '',
  };
}

/**
 * @param {string} squadId
 * @param {Partial<VentureDesignSquadRecord>} patch
 * @param {string} [updatedBy]
 */
export function saveSquadDesignRecord(squadId, patch, updatedBy) {
  if (!squadId) return;
  const store = readStore();
  if (!store.squads) store.squads = {};
  const prev = loadSquadDesignRecord(squadId);
  store.squads[squadId] = {
    ...prev,
    ...patch,
    consolidated: patch.consolidated ? mergeDraft(prev.consolidated, patch.consolidated) : prev.consolidated,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy ?? prev.updatedBy,
  };
  writeStore(store);
}

/** @param {string} participantId @param {string} [squadNameFallback] */
export function hydrateFromResearchStudio(participantId, squadNameFallback = '') {
  const research = loadVentureStudioState(participantId);
  const topProblem = research.step3.find((r) => r.problem?.trim()) ?? research.step3[0];
  const topSolution = research.step4[0];
  return {
    squadName: research.squadName?.trim() || squadNameFallback,
    segment: research.targetSegment?.trim() || research.step1.stage?.trim() || '',
    problem: topProblem?.problem?.trim() || '',
    opportunity:
      research.step5.valueCreation?.trim()
      || topSolution?.opportunity?.trim()
      || research.step5.unmetNeed?.trim()
      || '',
    researchSynced: Boolean(research.isStarted || research.targetSegment?.trim()),
  };
}

/**
 * Apply research hydration to individual draft when fields are still empty.
 * @param {string} participantId
 * @param {VentureDesignIndividualDraft} draft
 * @param {string} [squadNameFallback]
 */
export function applyResearchHydration(participantId, draft, squadNameFallback = '') {
  const hydrated = hydrateFromResearchStudio(participantId, squadNameFallback);
  const next = mergeDraft(draft, {});
  if (!next.step1.customer.trim() && hydrated.segment) next.step1.customer = hydrated.segment;
  if (!next.step1.problem.trim() && hydrated.problem) next.step1.problem = hydrated.problem;
  if (!next.step1.opportunity.trim() && hydrated.opportunity) {
    next.step1.opportunity = hydrated.opportunity;
  }
  if (!next.step3.whoServe.trim() && hydrated.segment) next.step3.whoServe = hydrated.segment;
  if (!next.step3.transformation.trim() && hydrated.opportunity) {
    next.step3.transformation = hydrated.opportunity;
  }
  if (!next.step3.synthesisA.trim() && hydrated.segment) next.step3.synthesisA = hydrated.segment;
  if (!next.step3.synthesisB.trim() && hydrated.opportunity) {
    next.step3.synthesisB = hydrated.opportunity;
  }
  return { draft: next, hydrated };
}

/** @param {string} participantId */
export function resolveSquadContext(participantId) {
  const squad = getParticipantSquad(participantId);
  return {
    squadId: squad?.id ?? '',
    squadName: squad?.name ?? '',
    memberIds: (squad?.members ?? []).map((m) => m.participantId).filter(Boolean),
  };
}

/**
 * @param {string[]} memberIds
 * @param {Record<string, string>} [nameById]
 */
export function loadSquadMemberDesignInputs(memberIds, nameById = {}) {
  return memberIds.map((id) => {
    const record = loadVentureDesignRecord(id);
    return {
      participantId: id,
      name: nameById[id] ?? `Intern ${id.slice(0, 6)}`,
      individual: record.individual,
      isComplete: record.isComplete,
    };
  });
}

/**
 * Suggest squad-level UVP parts from member inputs.
 * @param {Array<{ individual: VentureDesignIndividualDraft }>} members
 */
export function suggestSquadConsolidation(members) {
  const pick = (fn) => {
    const values = members.map(fn).map((v) => v?.trim()).filter(Boolean);
    if (!values.length) return '';
    const counts = new Map();
    for (const v of values) {
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  };

  const synthesisA = pick((m) => m.individual.step3.whoServe || m.individual.step1.customer);
  const synthesisB = pick((m) => m.individual.step3.transformation || m.individual.step1.opportunity);
  const synthesisC = pick((m) => m.individual.step3.different || m.individual.step3.whyUs);

  const themes = members
    .flatMap((m) => [
      m.individual.step3.whoServe,
      m.individual.step3.transformation,
      m.individual.step1.problem,
    ])
    .map((t) => t?.trim())
    .filter(Boolean);

  const coachFocus =
    themes.length > 1
      ? `Squad themes converge on: ${[...new Set(themes)].slice(0, 3).join(' · ')}`
      : 'Gather more distinct inputs from each intern before consolidating.';

  const coachSummary =
    synthesisA && synthesisB
      ? `We help ${synthesisA} achieve ${synthesisB}${synthesisC ? ` through ${synthesisC}` : ''}.`
      : '';

  return {
    consolidatedPatch: {
      step3: { synthesisA, synthesisB, synthesisC },
      step1: {
        customer: pick((m) => m.individual.step1.customer),
        problem: pick((m) => m.individual.step1.problem),
      },
    },
    coachFocus,
    coachSummary,
  };
}

/** @param {VentureDesignIndividualDraft} draft */
export function buildUvpSentence(draft) {
  const a = draft.step3.synthesisA || draft.step3.whoServe || draft.step1.customer || '[Target]';
  const b = draft.step3.synthesisB || draft.step3.transformation || '[Transformation]';
  const c = draft.step3.synthesisC || draft.step3.different || '[Mechanism]';
  return `We help ${a} achieve ${b} through ${c}.`;
}

/**
 * Push consolidated (or individual) design into FEC canvas fields.
 * @param {string} participantId
 * @param {VentureDesignIndividualDraft} draft
 */
export function syncVentureDesignToFec(participantId, draft) {
  if (!participantId) return;
  const uvp = buildUvpSentence(draft);
  saveFecSummaryField(participantId, {
    unified_venture_proposition: uvp,
    uvp_is_auto: false,
  });
  saveCanvasSummaryDebounced(participantId, {
    unified_venture_proposition: uvp,
    uvp_is_auto: false,
  });
  if (draft.step1.customer.trim()) {
    saveFecField(participantId, 'create_value', 'customer_segments', draft.step1.customer.trim());
  }
  if (draft.step1.problem.trim()) {
    saveFecField(participantId, 'create_value', 'customer_problem', draft.step1.problem.trim());
  }
  const valueOffering =
    draft.step1.opportunity.trim()
    || draft.step3.transformation.trim()
    || draft.step3.whyUs.trim();
  if (valueOffering) {
    saveFecField(participantId, 'create_value', 'value_offering', valueOffering);
  }
  if (draft.step3.different.trim()) {
    saveFecField(participantId, 'capture_value', 'revenue_streams', draft.step3.different.trim());
  }
}

/**
 * @param {string} participantId
 * @param {VentureDesignIndividualDraft} draft
 * @param {string} squadName
 */
export function commitVentureDesignToPortfolio(participantId, draft, squadName) {
  syncVentureDesignToFec(participantId, draft);
  saveVentureDesignRecord(participantId, { isComplete: true });
  appendTimelineEvent(participantId, {
    type: 'venture_design_complete',
    title: `Venture Design Studio — ${draft.step4.name || squadName || 'Draft 1'}`,
    module: 'financial-entrepreneurship',
    sourceType: 'venture_design',
  });
}

/** @param {VentureDesignParticipantRecord} record */
export function ventureDesignProgressPercent(record) {
  if (record.isComplete) return 100;
  if (!record.isStarted) return 0;
  return Math.min(95, Math.round(((record.highestStepReached - 1) / 5) * 90 + 5));
}
