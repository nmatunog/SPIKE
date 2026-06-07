/**
 * Cohort Identity & Squad Formation — business logic.
 */
import squadThemesSeed from '../data/seeds/squadThemes.json';
import { setSectionField } from './blueprintSectionStore.js';
import { generateFormationCharterPdf } from './formationCharterPdf.js';
import {
  ACHIEVEMENT_BADGES,
  COHORT_MOTTO_EXAMPLES,
  COHORT_NAME_EXAMPLES,
  COHORT_THEME_EXAMPLES,
  DEFAULT_COMMITMENT,
  RESEARCH_MARKETS,
  ensureFormationStore,
  writeFormationStore,
} from './cohortFormationStorage.js';

/**
 * @typedef {{
 *   id?: string,
 *   name: string,
 *   theme_statement: string,
 *   motto: string,
 *   year: number,
 *   batch: string,
 *   status: string,
 *   approvedAt?: string,
 * }} OfficialCohort
 * @typedef {{
 *   suggestions: Array<Record<string, unknown>>,
 *   officialCohort: OfficialCohort | null,
 *   squads: Array<Record<string, unknown>>,
 *   preferences: Record<string, { rankings: string[] }>,
 *   charters: Record<string, Record<string, unknown>>,
 *   achievements: Record<string, string[]>,
 *   activeThemeId: string,
 * }} FormationStore
 */

export {
  COHORT_NAME_EXAMPLES,
  COHORT_MOTTO_EXAMPLES,
  COHORT_THEME_EXAMPLES,
  RESEARCH_MARKETS,
  DEFAULT_COMMITMENT,
  ACHIEVEMENT_BADGES,
};

export function getSquadThemes() {
  return squadThemesSeed;
}

export function getActiveTheme() {
  const store = ensureFormationStore();
  return squadThemesSeed.find((t) => t.id === store.activeThemeId) ?? squadThemesSeed[0];
}

export function setActiveTheme(themeId) {
  const store = ensureFormationStore();
  store.activeThemeId = themeId;
  writeFormationStore(store);
}

/** @param {string} itemId */
export function getThemeItem(itemId) {
  for (const theme of squadThemesSeed) {
    const item = theme.items.find((i) => i.id === itemId);
    if (item) return { ...item, themeId: theme.id, themeName: theme.name };
  }
  return null;
}

/** @param {string} participantId */
export function getParticipantCohortSubmission(participantId) {
  return ensureFormationStore().suggestions.find((s) => s.participantId === participantId) ?? null;
}

/** @param {string} participantId */
export function hasSubmittedCohortIdentity(participantId) {
  return Boolean(getParticipantCohortSubmission(participantId));
}

/**
 * @param {string} participantId
 * @param {{ suggestedName: string, suggestedMotto: string, suggestedTheme: string }} input
 */
export function submitCohortIdentity(participantId, input) {
  const store = ensureFormationStore();
  const normalized = input.suggestedName.trim().toLowerCase();
  const existingVote = store.suggestions.find(
    (s) => s.suggested_name?.trim().toLowerCase() === normalized && s.suggested_name,
  );
  if (existingVote && existingVote.participantId !== participantId) {
    existingVote.votes = (existingVote.votes ?? 1) + 1;
  }

  const priorIdx = store.suggestions.findIndex((s) => s.participantId === participantId);
  const entry = {
    id: priorIdx >= 0 ? store.suggestions[priorIdx].id : `sug-${Date.now()}`,
    participantId,
    suggested_name: input.suggestedName.trim(),
    suggested_motto: input.suggestedMotto.trim(),
    suggested_theme: input.suggestedTheme.trim(),
    votes: existingVote ? existingVote.votes : 1,
    created_at: new Date().toISOString(),
  };

  if (priorIdx >= 0) store.suggestions[priorIdx] = entry;
  else store.suggestions.push(entry);

  writeFormationStore(store);
  syncCohortIdentityToBlueprint(participantId, entry);
  awardBadge(participantId, 'founding_cohort_member');
  return entry;
}

/** @param {string} participantId @param {Record<string, unknown>} entry */
function syncCohortIdentityToBlueprint(participantId, entry) {
  const block = [
    `Cohort Name: ${entry.suggested_name}`,
    `Motto: ${entry.suggested_motto}`,
    `Theme: ${entry.suggested_theme}`,
  ].join('\n');
  setSectionField(participantId, 'vision-purpose', 'cohort_identity', block, {
    sourceType: 'cohort_identity',
    sourceId: String(entry.id),
  });
}

export function getOfficialCohort() {
  return ensureFormationStore().officialCohort ?? null;
}

/** Aggregate suggestions for admin review */
export function getCohortSuggestionSummary() {
  const store = ensureFormationStore();
  const byName = new Map();
  for (const s of store.suggestions) {
    const key = String(s.suggested_name ?? '').trim().toLowerCase();
    if (!key) continue;
    const current = byName.get(key) ?? {
      suggested_name: s.suggested_name,
      suggested_motto: s.suggested_motto,
      suggested_theme: s.suggested_theme,
      votes: 0,
      participants: [],
    };
    current.votes += s.votes ?? 1;
    current.participants.push(s.participantId);
    byName.set(key, current);
  }
  return [...byName.values()].sort((a, b) => b.votes - a.votes);
}

/**
 * @param {{ name: string, motto: string, theme_statement: string, batch?: string }} input
 */
export function approveOfficialCohort(input) {
  const store = ensureFormationStore();
  store.officialCohort = {
    id: `cohort-${Date.now()}`,
    name: input.name,
    motto: input.motto,
    theme_statement: input.theme_statement,
    year: new Date().getFullYear(),
    batch: input.batch ?? 'A',
    status: 'active',
    approvedAt: new Date().toISOString(),
  };
  writeFormationStore(store);
  return store.officialCohort;
}

/** @param {string} participantId @param {string[]} rankings — theme item ids (1st, 2nd, 3rd) */
export function saveSquadPreferences(participantId, rankings) {
  const store = ensureFormationStore();
  store.preferences[participantId] = {
    rankings: rankings.slice(0, 3),
    submittedAt: new Date().toISOString(),
  };
  writeFormationStore(store);

  const labels = rankings
    .map((id, idx) => {
      const item = getThemeItem(id);
      return item ? `${idx + 1}. ${item.name}` : null;
    })
    .filter(Boolean)
    .join('\n');
  setSectionField(participantId, 'vision-purpose', 'squad_preferences', labels, {
    sourceType: 'squad_preferences',
  });
  return store.preferences[participantId];
}

/** @param {string} participantId */
export function getSquadPreferences(participantId) {
  return ensureFormationStore().preferences[participantId] ?? null;
}

/**
 * @param {{
 *   name: string,
 *   themeItemId: string,
 *   researchMarket: string,
 *   mentorId?: string,
 *   memberIds: string[],
 * }} input
 */
export function createSquad(input) {
  const store = ensureFormationStore();
  const item = getThemeItem(input.themeItemId);
  const squad = {
    id: `squad-${Date.now()}`,
    cohortId: store.officialCohort?.id ?? null,
    themeItemId: input.themeItemId,
    name: input.name || (item ? `Squad ${item.name}` : 'New Squad'),
    researchMarket: input.researchMarket,
    mentorId: input.mentorId ?? null,
    capacity: 6,
    status: 'active',
    members: input.memberIds.map((pid, idx) => ({
      participantId: pid,
      role: idx === 0 ? 'Leader' : 'Member',
      joinedAt: new Date().toISOString(),
    })),
    createdAt: new Date().toISOString(),
  };
  store.squads.push(squad);
  store.charters[squad.id] = {
    squadId: squad.id,
    motto: store.officialCohort?.motto ?? '',
    commitment_statement: DEFAULT_COMMITMENT,
    status: 'draft',
    signatures: [],
  };
  writeFormationStore(store);

  for (const member of squad.members) {
    syncSquadMembershipToBlueprint(member.participantId, squad, member.role);
    awardBadge(member.participantId, 'research_squad_member');
    if (member.role === 'Leader') awardBadge(member.participantId, 'squad_leader');
  }
  return squad;
}

/** @param {string} participantId @param {Record<string, unknown>} squad @param {string} role */
function syncSquadMembershipToBlueprint(participantId, squad, role) {
  const item = getThemeItem(String(squad.themeItemId));
  const market = RESEARCH_MARKETS.find((m) => m.id === squad.researchMarket)?.label ?? squad.researchMarket;
  setSectionField(
    participantId,
    'vision-purpose',
    'squad_membership',
    `Squad: ${squad.name} (${item?.name ?? 'Team'})\nMarket: ${market}\nRole: ${role}`,
    { sourceType: 'squad_assignment' },
  );
}

/** @param {string} participantId */
export function getParticipantSquad(participantId) {
  const squads = ensureFormationStore().squads;
  return squads.find((s) => s.members?.some((m) => m.participantId === participantId)) ?? null;
}

/** @param {string} squadId */
export function getSquadById(squadId) {
  return ensureFormationStore().squads.find((s) => s.id === squadId) ?? null;
}

/** @param {string} squadId */
export function getSquadCharter(squadId) {
  return ensureFormationStore().charters[squadId] ?? null;
}

/**
 * @param {string} squadId
 * @param {{ motto?: string, commitment_statement?: string }} patch
 */
export function updateSquadCharter(squadId, patch) {
  const store = ensureFormationStore();
  store.charters[squadId] = {
    ...store.charters[squadId],
    squadId,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeFormationStore(store);
  return store.charters[squadId];
}

/**
 * @param {string} squadId
 * @param {string} participantId
 * @param {string} participantName
 */
export function signSquadCharter(squadId, participantId, participantName) {
  const store = ensureFormationStore();
  const charter = store.charters[squadId];
  if (!charter) return null;

  const signatures = charter.signatures ?? [];
  if (!signatures.find((s) => s.participantId === participantId)) {
    signatures.push({
      participantId,
      name: participantName,
      signedAt: new Date().toISOString(),
    });
  }
  charter.signatures = signatures;
  charter.status = 'signing';

  const squad = getSquadById(squadId);
  const allSigned = squad?.members?.every((m) =>
    signatures.some((s) => s.participantId === m.participantId),
  );

  if (allSigned) {
    charter.status = 'complete';
    void generateFormationCharterPdf(squadId);
  }

  store.charters[squadId] = charter;
  writeFormationStore(store);

  const block = [
    `Squad: ${squad?.name}`,
    `Motto: ${charter.motto}`,
    `Commitment: ${charter.commitment_statement}`,
    `Signed by ${participantName} on ${new Date().toLocaleDateString()}`,
  ].join('\n');
  setSectionField(participantId, 'vision-purpose', 'squad_charter', block, {
    sourceType: 'squad_charter',
  });
  awardBadge(participantId, 'squad_charter_signatory');
  return charter;
}

/** @param {string} squadId @param {string} facultyId */
export function approveSquadCharterByFaculty(squadId, facultyId) {
  const store = ensureFormationStore();
  const charter = store.charters[squadId];
  if (!charter) return null;
  charter.status = 'approved';
  charter.facultyApprovedBy = facultyId;
  charter.facultyApprovedAt = new Date().toISOString();
  store.charters[squadId] = charter;
  writeFormationStore(store);
  return charter;
}

/** @param {string} participantId @param {string} badgeKey */
export function awardBadge(participantId, badgeKey) {
  const store = ensureFormationStore();
  const badges = store.achievements[participantId] ?? [];
  if (!badges.includes(badgeKey)) {
    badges.push(badgeKey);
    store.achievements[participantId] = badges;
    writeFormationStore(store);
  }
}

/** @param {string} participantId */
export function getParticipantBadges(participantId) {
  return (ensureFormationStore().achievements[participantId] ?? []).map((key) => ({
    key,
    ...ACHIEVEMENT_BADGES[key],
  }));
}

export function listAllSquads() {
  return ensureFormationStore().squads;
}

export function listAllPreferences() {
  return ensureFormationStore().preferences;
}

/** Faculty overview stats */
export function getFormationFacultyStats() {
  const store = ensureFormationStore();
  const squads = store.squads ?? [];
  const charters = store.charters ?? {};
  return {
    suggestionCount: store.suggestions?.length ?? 0,
    squadCount: squads.length,
    signedCharters: Object.values(charters).filter((c) => c.status === 'complete' || c.status === 'approved').length,
    pendingSignatures: squads.filter((s) => {
      const c = charters[s.id];
      return c && (c.signatures?.length ?? 0) < (s.members?.length ?? 0);
    }).length,
  };
}
