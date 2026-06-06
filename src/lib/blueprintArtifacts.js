/**
 * Portfolio + Business Plan artifact drafts (localStorage) with Supabase sync on submit (PR8).
 */

const STORAGE_KEY = 'spike_blueprint_artifacts';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} participantId */
function ensureUser(participantId) {
  const all = readAll();
  if (!all[participantId]) {
    all[participantId] = { portfolio: [], businessPlan: [] };
  }
  return all;
}

/**
 * @param {{
 *   participantId: string,
 *   sectionId: string,
 *   title: string,
 *   content: string,
 *   sourceType: string,
 *   sourceId: string,
 * }} input
 */
export function createPortfolioArtifactDraft(input) {
  const all = ensureUser(input.participantId);
  const list = all[input.participantId].portfolio;

  const existingIdx = list.findIndex(
    (a) => a.sectionId === input.sectionId && a.sourceId === input.sourceId,
  );

  const artifact = {
    id: existingIdx >= 0 ? list[existingIdx].id : `pa-${crypto.randomUUID()}`,
    participantId: input.participantId,
    sectionId: input.sectionId,
    title: input.title,
    content: input.content,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    list[existingIdx] = artifact;
  } else {
    list.push(artifact);
  }

  writeAll(all);
  return artifact;
}

/**
 * @param {{
 *   participantId: string,
 *   chapterId: string,
 *   title: string,
 *   content: string,
 *   sourceType: string,
 *   sourceId: string,
 * }} input
 */
export function createBusinessPlanArtifactDraft(input) {
  const all = ensureUser(input.participantId);
  const list = all[input.participantId].businessPlan;

  const existingIdx = list.findIndex(
    (a) => a.chapterId === input.chapterId && a.sourceId === input.sourceId,
  );

  const artifact = {
    id: existingIdx >= 0 ? list[existingIdx].id : `bp-${crypto.randomUUID()}`,
    participantId: input.participantId,
    chapterId: input.chapterId,
    title: input.title,
    content: input.content,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    list[existingIdx] = artifact;
  } else {
    list.push(artifact);
  }

  writeAll(all);
  return artifact;
}

/** @param {string} participantId @param {string} [sectionId] */
export function listPortfolioArtifacts(participantId, sectionId) {
  const list = readAll()[participantId]?.portfolio ?? [];
  if (!sectionId) return list;
  return list.filter((a) => a.sectionId === sectionId);
}

/** @param {string} participantId @param {string} [chapterId] */
export function listBusinessPlanArtifacts(participantId, chapterId) {
  const list = readAll()[participantId]?.businessPlan ?? [];
  if (!chapterId) return list;
  return list.filter((a) => a.chapterId === chapterId);
}

/** @param {string} participantId */
export function countPortfolioArtifacts(participantId) {
  return listPortfolioArtifacts(participantId).length;
}

/** @param {string} participantId */
export function countBusinessPlanArtifacts(participantId) {
  return listBusinessPlanArtifacts(participantId).length;
}
