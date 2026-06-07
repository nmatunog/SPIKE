/**
 * AI Venture Coach™ — local persistence (Supabase migration ready).
 */
import { COACH_SECTIONS } from './ventureCoachConstants.js';

const STORAGE_KEY = 'spike_venture_coach_v1';

function emptySection() {
  return { step: 0, data: {}, draftVersions: [], completedAt: null };
}

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
export function ensureCoachUser(participantId) {
  const all = readAll();
  if (!all[participantId]) {
    all[participantId] = {
      startedAt: null,
      sections: Object.fromEntries(COACH_SECTIONS.map((s) => [s.id, emptySection()])),
      badges: [],
    };
    writeAll(all);
  } else {
    const user = all[participantId];
    let changed = false;
    for (const s of COACH_SECTIONS) {
      if (!user.sections[s.id]) {
        user.sections[s.id] = emptySection();
        changed = true;
      }
    }
    if (changed) {
      all[participantId] = user;
      writeAll(all);
    }
  }
  return all[participantId];
}

/** @param {string} participantId */
export function getCoachProfile(participantId) {
  return readAll()[participantId] ?? null;
}

/** @param {string} participantId @param {string} sectionId */
export function getCoachSection(participantId, sectionId) {
  const profile = getCoachProfile(participantId);
  return profile?.sections?.[sectionId] ?? emptySection();
}

/**
 * @param {string} participantId
 * @param {string} sectionId
 * @param {Record<string, unknown>} patch
 */
export function patchCoachSection(participantId, sectionId, patch) {
  const all = readAll();
  const user = ensureCoachUser(participantId);
  const current = user.sections[sectionId] ?? emptySection();
  user.sections[sectionId] = {
    ...current,
    ...patch,
    data: { ...current.data, ...(patch.data ?? {}) },
    draftVersions: patch.draftVersions ?? current.draftVersions,
  };
  all[participantId] = user;
  writeAll(all);
  return user.sections[sectionId];
}

/** @param {string} participantId */
export function markCoachStarted(participantId) {
  const all = readAll();
  const user = ensureCoachUser(participantId);
  if (!user.startedAt) {
    user.startedAt = new Date().toISOString();
    all[participantId] = user;
    writeAll(all);
  }
}

/**
 * @param {string} participantId
 * @param {string} sectionId
 * @param {string} badge
 */
export function completeCoachSection(participantId, sectionId, badge) {
  const all = readAll();
  const user = ensureCoachUser(participantId);
  const section = user.sections[sectionId] ?? emptySection();
  section.completedAt = new Date().toISOString();
  user.sections[sectionId] = section;
  if (badge && !user.badges.includes(badge)) {
    user.badges.push(badge);
  }
  all[participantId] = user;
  writeAll(all);
  return section;
}

/** @param {string} participantId @param {string} sectionId */
export function isCoachSectionComplete(participantId, sectionId) {
  return Boolean(getCoachSection(participantId, sectionId).completedAt);
}

/** @param {string} participantId */
export function getCoachProgress(participantId) {
  const profile = getCoachProfile(participantId);
  if (!profile) {
    return { percent: 0, completed: 0, total: COACH_SECTIONS.length, badges: [], sections: [] };
  }
  const sections = COACH_SECTIONS.map((s) => ({
    ...s,
    completed: Boolean(profile.sections[s.id]?.completedAt),
  }));
  const completed = sections.filter((s) => s.completed).length;
  return {
    percent: Math.round((completed / COACH_SECTIONS.length) * 100),
    completed,
    total: COACH_SECTIONS.length,
    badges: profile.badges ?? [],
    sections,
    startedAt: profile.startedAt,
  };
}

/** Aggregate analytics across all stored profiles (demo / shared-browser). */
export function aggregateCoachAnalytics() {
  const all = readAll();
  const profiles = Object.values(all);
  const motivators = {};
  const values = {};
  const taglines = {};
  const tracks = { agency_builder: 0, specialist_consultant: 0, undecided: 0 };
  const purposeDrivers = {};
  let profileCount = 0;

  for (const profile of profiles) {
    if (!profile.startedAt) continue;
    profileCount += 1;
    const ambition = profile.sections?.ambition?.data ?? {};
    for (const id of ambition.rankedMotivators ?? ambition.selectedMotivators ?? []) {
      motivators[id] = (motivators[id] ?? 0) + 1;
    }
    const purpose = profile.sections?.purpose?.data ?? {};
    for (const id of purpose.drivers ?? []) {
      purposeDrivers[id] = (purposeDrivers[id] ?? 0) + 1;
    }
    const vals = profile.sections?.values?.data?.topThree ?? profile.sections?.values?.data?.topFive ?? [];
    for (const id of vals.slice(0, 3)) {
      values[id] = (values[id] ?? 0) + 1;
    }
    const tagline = String(profile.sections?.tagline?.data?.finalText ?? '').trim().toLowerCase();
    if (tagline) {
      taglines[tagline] = (taglines[tagline] ?? 0) + 1;
    }
    const track = profile.sections?.['venture-direction']?.data?.track;
    if (track && tracks[track] != null) tracks[track] += 1;
  }

  const trackTotal = tracks.agency_builder + tracks.specialist_consultant + tracks.undecided;
  return {
    profileCount,
    topMotivators: topEntries(motivators, 8),
    topValues: topEntries(values, 8),
    topPurposeDrivers: topEntries(purposeDrivers, 8),
    topTaglines: topEntries(taglines, 8),
    trackDistribution: trackTotal
      ? {
          agency_builder: Math.round((tracks.agency_builder / trackTotal) * 100),
          specialist_consultant: Math.round((tracks.specialist_consultant / trackTotal) * 100),
          undecided: Math.round((tracks.undecided / trackTotal) * 100),
        }
      : { agency_builder: 0, specialist_consultant: 0, undecided: 0 },
  };
}

/** @param {Record<string, number>} map @param {number} limit */
function topEntries(map, limit) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ id, count }));
}

/** @param {string} participantId @param {string} sectionId */
export function resetCoachSection(participantId, sectionId) {
  const all = readAll();
  const user = all[participantId];
  if (!user?.sections?.[sectionId]) return;
  user.sections[sectionId] = { step: 0, data: {}, draftVersions: [], completedAt: null };
  user.badges = (user.badges ?? []).filter(
    (badge) => !COACH_SECTIONS.find((s) => s.id === sectionId && s.badge === badge),
  );
  all[participantId] = user;
  writeAll(all);
}

export { readAll as readCoachStore };
