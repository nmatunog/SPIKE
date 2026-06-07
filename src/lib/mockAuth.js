import { MOCK_AUTH_ACCOUNTS } from './mockAuthUsers.js';

const STORAGE_KEY = 'spike_mock_user';

/**
 * Mock sign-in for allowlisted demo accounts.
 * On by default; set VITE_MOCK_AUTH=false to disable (e.g. hardened production).
 */
export function isMockAuthEnabled() {
  return import.meta.env.VITE_MOCK_AUTH !== 'false';
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
    return { ...entry.user, email: user.email.toLowerCase() };
  } catch {
    clearMockUser();
    return null;
  }
}

export function clearMockUser() {
  localStorage.removeItem(STORAGE_KEY);
}
