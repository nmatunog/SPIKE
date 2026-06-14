import { MOCK_AUTH_ACCOUNTS } from './mockAuthUsers.js';

const STORAGE_KEY = 'spike_mock_user';

/** Read mock user blob from storage (ignores mock-auth-enabled gate). */
export function readPersistedMockUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Demo sign-in for local QA only.
 * Off by default — set VITE_MOCK_AUTH=true in .env for allowlisted @example.com accounts.
 */
export function isMockAuthEnabled() {
  return import.meta.env.VITE_MOCK_AUTH === 'true';
}

/**
 * @param {string} email
 * @param {string} password
 */
export function authenticateMockUser(email, password) {
  if (!isMockAuthEnabled()) return null;
  const key = email.trim().toLowerCase();
  const entry = MOCK_AUTH_ACCOUNTS[key];
  if (!entry || entry.password !== password) return null;
  return { ...entry.user, email: key };
}

/** @param {object} user */
export function persistMockUser(user) {
  if (!user?.isMockUser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

/** @returns {object | null} */
export function getStoredMockUser() {
  if (!isMockAuthEnabled()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (!user?.isMockUser || !user?.id) return null;
    const entry = MOCK_AUTH_ACCOUNTS[user.email?.toLowerCase()];
    if (!entry) {
      clearMockUser();
      return null;
    }
    return {
      ...entry.user,
      ...user,
      email: user.email.toLowerCase(),
      internProgress: {
        ...(entry.user.internProgress ?? {}),
        ...(user.internProgress ?? {}),
      },
    };
  } catch {
    clearMockUser();
    return null;
  }
}

export function clearMockUser() {
  localStorage.removeItem(STORAGE_KEY);
}

/** @param {object | null | undefined} user */
export function isMockUser(user) {
  return Boolean(user?.isMockUser);
}

/** Demo users use non-UUID ids — never send them to Supabase filters. */
export function shouldUseSupabaseForUser(user) {
  return Boolean(user?.id) && !isMockUser(user);
}

/** @param {string} userId */
export function isMockUserId(userId) {
  return String(userId ?? '').startsWith('mock-');
}

/**
 * @param {string} userId
 * @param {object} progressPatch
 */
export function updateMockInternProgress(userId, progressPatch) {
  if (!isMockUserId(userId)) return null;

  let stored = readPersistedMockUser();
  if (!stored || stored.id !== userId) {
    stored = getStoredMockUser();
  }
  if (!stored || stored.id !== userId) return null;

  const internProgress = {
    ...(stored.internProgress ?? {}),
    ...progressPatch,
  };
  const nextUser = { ...stored, internProgress, isMockUser: true };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  return internProgress;
}
