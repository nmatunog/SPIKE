/**
 * Unified venture document — canonical shape for squad venture data.
 * @see supabase/migrations/20260719_venture_document.sql
 */

export const VENTURE_DOCUMENT_SCHEMA_VERSION = '1';

/** @returns {import('../types/venture.js').VentureIdentity} */
export function emptyVentureIdentity() {
  return {
    squadName: '',
    ventureName: '',
    tagline: '',
    vision: '',
  };
}

/** @returns {import('../types/venture.js').VentureResearch} */
export function emptyVentureResearch() {
  return {
    customerSegment: '',
    insights: [],
    evidence: [],
    opportunityStatement: '',
    ventureOpportunity: '',
  };
}

/** @returns {import('../types/venture.js').VentureFec} */
export function emptyVentureFec() {
  return {
    uniqueVentureProposition: '',
    clientExperience: {},
    growthEngine: {},
    financialEngine: {},
    roadmap: {
      months12: '',
      months24: '',
      months36: '',
      successNarrative: '',
    },
  };
}

/** @returns {import('../types/venture.js').VenturePitch} */
export function emptyVenturePitch() {
  return {
    story: '',
    speakerAssignments: [],
    presentationDeck: null,
    readinessScore: 0,
  };
}

/** @returns {import('../types/venture.js').VentureStage} */
export function emptyVentureStage() {
  return {
    currentWeek: 1,
    currentDay: 1,
    completedMilestones: [],
    unlockedModules: [],
  };
}

/** @returns {import('../types/venture.js').VentureDocument} */
export function emptyVentureDocument() {
  return {
    schemaVersion: VENTURE_DOCUMENT_SCHEMA_VERSION,
    identity: emptyVentureIdentity(),
    research: emptyVentureResearch(),
    fec: emptyVentureFec(),
    pitch: emptyVenturePitch(),
    stage: emptyVentureStage(),
  };
}

/**
 * @param {import('../types/venture.js').VentureDocument | Record<string, unknown> | null | undefined} raw
 * @returns {import('../types/venture.js').VentureDocument}
 */
export function normalizeVentureDocument(raw) {
  const base = emptyVentureDocument();
  if (!raw || typeof raw !== 'object') return base;

  return {
    schemaVersion: String(raw.schemaVersion ?? base.schemaVersion),
    identity: { ...base.identity, ...(/** @type {object} */ (raw.identity ?? {})) },
    research: {
      ...base.research,
      ...(/** @type {object} */ (raw.research ?? {})),
      insights: Array.isArray(raw.research?.insights) ? raw.research.insights : base.research.insights,
      evidence: Array.isArray(raw.research?.evidence) ? raw.research.evidence : base.research.evidence,
    },
    fec: {
      ...base.fec,
      ...(/** @type {object} */ (raw.fec ?? {})),
      roadmap: {
        ...base.fec.roadmap,
        ...(/** @type {object} */ (raw.fec?.roadmap ?? {})),
      },
    },
    pitch: {
      ...base.pitch,
      ...(/** @type {object} */ (raw.pitch ?? {})),
      speakerAssignments: Array.isArray(raw.pitch?.speakerAssignments)
        ? raw.pitch.speakerAssignments
        : base.pitch.speakerAssignments,
    },
    stage: {
      ...base.stage,
      ...(/** @type {object} */ (raw.stage ?? {})),
      completedMilestones: Array.isArray(raw.stage?.completedMilestones)
        ? raw.stage.completedMilestones
        : base.stage.completedMilestones,
      unlockedModules: Array.isArray(raw.stage?.unlockedModules)
        ? raw.stage.unlockedModules
        : base.stage.unlockedModules,
    },
  };
}

/**
 * Deep-merge a partial venture patch into an existing document.
 * @param {import('../types/venture.js').VentureDocument} existing
 * @param {Partial<import('../types/venture.js').VentureDocument>} patch
 */
export function mergeVentureDocument(existing, patch) {
  const base = normalizeVentureDocument(existing);
  if (!patch) return base;

  return normalizeVentureDocument({
    ...base,
    ...patch,
    identity: { ...base.identity, ...(patch.identity ?? {}) },
    research: { ...base.research, ...(patch.research ?? {}) },
    fec: {
      ...base.fec,
      ...(patch.fec ?? {}),
      roadmap: { ...base.fec.roadmap, ...(patch.fec?.roadmap ?? {}) },
    },
    pitch: { ...base.pitch, ...(patch.pitch ?? {}) },
    stage: { ...base.stage, ...(patch.stage ?? {}) },
  });
}

/**
 * @param {import('../types/venture.js').VentureDocument} doc
 */
export function ventureDocumentFromRow(row) {
  if (!row) return emptyVentureDocument();
  return normalizeVentureDocument({
    schemaVersion: row.schema_version ?? row.schemaVersion ?? VENTURE_DOCUMENT_SCHEMA_VERSION,
    identity: row.identity,
    research: row.research,
    fec: row.fec,
    pitch: row.pitch,
    stage: row.stage,
  });
}

/**
 * @param {import('../types/venture.js').VentureDocument} doc
 */
export function ventureDocumentToRowPayload(doc) {
  const normalized = normalizeVentureDocument(doc);
  return {
    schema_version: normalized.schemaVersion,
    identity: normalized.identity,
    research: normalized.research,
    fec: normalized.fec,
    pitch: normalized.pitch,
    stage: normalized.stage,
  };
}
