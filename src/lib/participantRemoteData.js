/**
 * Production participant data — read directly from Supabase (staff / mentor views).
 * Does not depend on browser localStorage on the coach device.
 */
import { fetchDay1BuilderProgress } from './supabase/day1BuilderProgress.js';
import { fetchBlueprintEntries } from './supabase/blueprintEntries.js';
import { DAY1_BUILDERS } from './day1BuilderConstants.js';

const COACH_PREFIX = 'coach:';

/**
 * @param {string} participantId
 */
export async function fetchRemoteDay1Rows(participantId) {
  if (!participantId || String(participantId).startsWith('mock-')) {
    return { builderRows: [], blueprintRows: [] };
  }
  const [builderRows, blueprintRows] = await Promise.all([
    fetchDay1BuilderProgress(participantId).catch(() => []),
    fetchBlueprintEntries(participantId).catch(() => []),
  ]);
  return { builderRows, blueprintRows };
}

/**
 * @param {Array<{ builder_id: string, payload?: Record<string, unknown> }>} builderRows
 */
function buildersFromRows(builderRows) {
  /** @type {Record<string, Record<string, unknown>>} */
  const builders = {};
  /** @type {Record<string, Record<string, unknown>>} */
  const coachSections = {};

  for (const row of builderRows) {
    const id = String(row.builder_id);
    const payload = row.payload ?? {};
    if (id.startsWith(COACH_PREFIX)) {
      coachSections[id.slice(COACH_PREFIX.length)] = payload;
    } else {
      builders[id] = payload;
    }
  }
  return { builders, coachSections };
}

/**
 * @param {Array<{ section_slug: string, field_key: string, field_value?: string }>} blueprintRows
 */
function visionFieldsFromBlueprint(blueprintRows) {
  /** @type {Record<string, string>} */
  const fields = {};
  for (const row of blueprintRows) {
    if (row.section_slug === 'vision-purpose' && row.field_key) {
      fields[row.field_key] = String(row.field_value ?? '');
    }
  }
  return fields;
}

/**
 * Mentor-visible summary built only from Supabase rows.
 * @param {string} participantId
 */
export async function fetchRemoteParticipantSummary(participantId) {
  const { builderRows, blueprintRows } = await fetchRemoteDay1Rows(participantId);
  const { builders, coachSections } = buildersFromRows(builderRows);
  const vision = visionFieldsFromBlueprint(blueprintRows);

  const ambitionBuilder = builders['ambition-builder']?.data ?? {};
  const impactBuilder =
    builders['impact-builder']?.data ?? builders['purpose-builder']?.data ?? {};
  const valuesBuilder = builders['values-builder']?.data ?? {};
  const futureSelfBuilder = builders['future-self']?.data ?? {};
  const coachAmbition = coachSections.ambition?.data ?? {};
  const coachImpact = coachSections.impact?.data ?? coachSections.purpose?.data ?? {};
  const coachValues = coachSections.values?.data ?? {};
  const coachTagline = coachSections.tagline?.data ?? {};
  const coachFutureSelf = coachSections['future-self']?.data ?? {};

  const ambition =
    String(coachAmbition.finalText ?? ambitionBuilder.ambitionStatement ?? vision.vision_statement ?? '').trim();
  const impact =
    String(
      coachImpact.finalText
      ?? impactBuilder.impactStatement
      ?? impactBuilder.purposeStatement
      ?? vision.mission_statement
      ?? '',
    ).trim();
  const tagline =
    String(coachTagline.finalText ?? builders['tagline-builder']?.data?.finalText ?? vision.personal_tagline ?? vision.tagline ?? '').trim();
  const futureSelf =
    String(
      coachFutureSelf.finalText
      ?? futureSelfBuilder.futureSelfNarrative
      ?? vision.future_self_narrative
      ?? '',
    ).trim();
  const topThree =
    coachValues.topThree
    ?? valuesBuilder.topThree
    ?? [];

  const completedBuilders = DAY1_BUILDERS.filter((b) => {
    const entry = builders[b.id];
    return Boolean(entry?.completedAt || entry?.data);
  }).length;

  return {
    hasRemoteData: builderRows.length > 0 || blueprintRows.length > 0,
    builderRowCount: builderRows.length,
    blueprintRowCount: blueprintRows.length,
    completedBuilders,
    totalBuilders: DAY1_BUILDERS.length,
    progressPercent: Math.round((completedBuilders / DAY1_BUILDERS.length) * 100),
    ambition,
    impact,
    purpose: impact,
    tagline,
    futureSelf,
    futureSelfSummary: String(coachFutureSelf.futureSelfSummary ?? futureSelfBuilder.futureSelfSummary ?? '').trim(),
    topThreeValues: Array.isArray(topThree) ? topThree : [],
    valuesProfile: String(coachValues.valuesProfile ?? valuesBuilder.valuesProfile ?? vision.my_values ?? '').trim(),
    ventureDirection: String(coachSections['venture-direction']?.data?.track ?? '').trim(),
    dreamBoardAssetCount: Array.isArray(builders['dream-board']?.data?.assets)
      ? builders['dream-board'].data.assets.length
      : 0,
    squadCharterSigned: Boolean(builders['squad-charter']?.completedAt),
  };
}

/**
 * @param {string[]} participantIds
 */
export async function fetchCohortRemoteSyncStatus(participantIds) {
  const ids = participantIds.filter((id) => id && !String(id).startsWith('mock-'));
  const results = await Promise.all(
    ids.map(async (id) => {
      const summary = await fetchRemoteParticipantSummary(id);
      return { id, ...summary };
    }),
  );
  const synced = results.filter((r) => r.hasRemoteData).length;
  return {
    total: ids.length,
    synced,
    unsynced: ids.length - synced,
    participants: results,
  };
}
