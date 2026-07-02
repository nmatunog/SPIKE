/**
 * Demo accounts for local QA and staging (password: password123).
 * Only active when mock auth is enabled — see mockAuth.js.
 */

/** @type {Record<string, { password: string, user: object }>} */
export const MOCK_AUTH_ACCOUNTS = {
  'ra-spike@example.com': {
    password: 'password123',
    user: {
      id: 'mock-user-ra-spike',
      email: 'ra-spike@example.com',
      name: 'Rae Academy',
      role: 'INTERN',
      mobile: '+63 917 000 0000',
      avatarUrl: null,
      internProgress: {
        program_slug: 'ra-spike',
        ra_spike_segment: 1,
        ra_spike_current_week: 1,
        segment: 1,
        hours: 0,
        licensed: false,
        squad: 'Alpha Squad',
        university: 'Demo Agency',
        career_track: null,
        career_track_selected_at: null,
        current_week: 1,
        current_day: 1,
        onboarding_complete: true,
      },
      mustChangePassword: false,
      isMockUser: true,
    },
  },
  'john@example.com': {
    password: 'password123',
    user: {
      id: 'mock-user-john',
      email: 'john@example.com',
      name: 'John Intern',
      role: 'INTERN',
      internProgress: {
        program_slug: 'spike-internship',
        segment: 1,
        hours: 12,
        licensed: false,
        squad: 'Squad Alpha',
        university: 'Demo University',
        career_track: null,
        career_track_selected_at: null,
        current_week: 1,
        current_day: 1,
      },
      mustChangePassword: false,
      isMockUser: true,
    },
  },
  'admin@example.com': {
    password: 'password123',
    user: {
      id: 'mock-user-admin',
      email: 'admin@example.com',
      name: 'Demo Admin',
      role: 'ADMIN',
      internProgress: null,
      mustChangePassword: false,
      isMockUser: true,
    },
  },
  'mentor@example.com': {
    password: 'password123',
    user: {
      id: 'mock-user-mentor',
      email: 'mentor@example.com',
      name: 'Maria Mentor',
      role: 'MENTOR',
      internProgress: null,
      mustChangePassword: false,
      isMockUser: true,
    },
  },
  'faculty@example.com': {
    password: 'password123',
    user: {
      id: 'mock-user-faculty',
      email: 'faculty@example.com',
      name: 'Dr. Ana Reyes',
      role: 'FACULTY',
      internProgress: null,
      mustChangePassword: false,
      isMockUser: true,
    },
  },
};

/** @returns {Array<{ email: string, label: string, role: string }>} */
export function listMockAuthAccountHints() {
  return Object.entries(MOCK_AUTH_ACCOUNTS).map(([email, entry]) => ({
    email,
    label: entry.user.name,
    role: entry.user.role,
  }));
}
