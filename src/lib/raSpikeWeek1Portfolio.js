import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { isMockUserId } from './mockAuth.js';

const STORAGE_KEY = 'ra_spike_week1_portfolio_v1';

/** @typedef {'welcome' | 'discover' | 'dream_builder' | 'squad' | 'reflection'} Week1CardId */

export const WEEK1_CARD_ORDER = /** @type {const} */ ([
  'welcome',
  'discover',
  'dream_builder',
  'squad',
  'reflection',
]);

export const WEEK1_REFLECTION_PROMPTS = [
  { id: 'inspired', label: 'What inspired you today?' },
  { id: 'fears', label: 'What fears do you need to overcome?' },
  { id: 'excites', label: 'What excites you most?' },
];

/** @returns {import('./raSpikeWeek1PortfolioTypes.js').RaSpikeWeek1Portfolio} */
export function emptyWeek1Portfolio() {
  return {
    lifestyleAnswer: '',
    incomePhp: null,
    incomeNotes: '',
    travelAnswer: '',
    lifestyleImageUrl: null,
    incomeImageUrl: null,
    destinationImageUrl: null,
    personalVision: '',
    blueprintWhy: '',
    blueprintGoals: ['', '', ''],
    blueprintIncomeTarget: '',
    blueprintPeopleToImpact: '',
    blueprintCommitment: '',
    reflectionAnswers: { inspired: '', fears: '', excites: '' },
    cardsCompleted: {},
    submittedAt: null,
    locked: false,
    facultyStatus: 'pending',
    facultyReviewedAt: null,
    reopenedAt: null,
    updatedAt: null,
  };
}

/** @param {string} participantId */
function storageKey(participantId) {
  return `${STORAGE_KEY}:${participantId}`;
}

/** @param {string} participantId */
export function getWeek1PortfolioLocal(participantId) {
  if (!participantId) return emptyWeek1Portfolio();
  try {
    const raw = localStorage.getItem(storageKey(participantId));
    if (!raw) return emptyWeek1Portfolio();
    return { ...emptyWeek1Portfolio(), ...JSON.parse(raw) };
  } catch {
    return emptyWeek1Portfolio();
  }
}

/** @param {string} participantId @param {object} patch */
function writeWeek1PortfolioLocal(participantId, patch) {
  if (!participantId) return emptyWeek1Portfolio();
  const next = {
    ...getWeek1PortfolioLocal(participantId),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(storageKey(participantId), JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}

/** @param {Record<string, unknown> | null | undefined} row */
function mapDbRow(row) {
  if (!row) return emptyWeek1Portfolio();
  const goals = Array.isArray(row.blueprint_goals) ? row.blueprint_goals.map(String) : ['', '', ''];
  while (goals.length < 3) goals.push('');
  const reflection = row.reflection_answers && typeof row.reflection_answers === 'object'
    ? row.reflection_answers
    : {};
  const cards = row.cards_completed && typeof row.cards_completed === 'object'
    ? row.cards_completed
    : {};
  return {
    lifestyleAnswer: String(row.lifestyle_answer ?? ''),
    incomePhp: row.income_php == null ? null : Number(row.income_php),
    incomeNotes: String(row.income_notes ?? ''),
    travelAnswer: String(row.travel_answer ?? ''),
    lifestyleImageUrl: row.lifestyle_image_url ?? null,
    incomeImageUrl: row.income_image_url ?? null,
    destinationImageUrl: row.destination_image_url ?? null,
    personalVision: String(row.personal_vision ?? ''),
    blueprintWhy: String(row.blueprint_why ?? ''),
    blueprintGoals: goals.slice(0, 3),
    blueprintIncomeTarget: String(row.blueprint_income_target ?? ''),
    blueprintPeopleToImpact: String(row.blueprint_people_to_impact ?? ''),
    blueprintCommitment: String(row.blueprint_commitment ?? ''),
    reflectionAnswers: {
      inspired: String(reflection.inspired ?? ''),
      fears: String(reflection.fears ?? ''),
      excites: String(reflection.excites ?? ''),
    },
    cardsCompleted: cards,
    submittedAt: row.submitted_at ?? null,
    locked: Boolean(row.locked),
    facultyStatus: row.faculty_status ?? 'pending',
    facultyReviewedAt: row.faculty_reviewed_at ?? null,
    reopenedAt: row.reopened_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

/** @param {object} portfolio */
function toDbPayload(portfolio) {
  return {
    lifestyle_answer: portfolio.lifestyleAnswer ?? '',
    income_php: portfolio.incomePhp,
    income_notes: portfolio.incomeNotes ?? '',
    travel_answer: portfolio.travelAnswer ?? '',
    lifestyle_image_url: portfolio.lifestyleImageUrl,
    income_image_url: portfolio.incomeImageUrl,
    destination_image_url: portfolio.destinationImageUrl,
    personal_vision: portfolio.personalVision ?? '',
    blueprint_why: portfolio.blueprintWhy ?? '',
    blueprint_goals: portfolio.blueprintGoals ?? ['', '', ''],
    blueprint_income_target: portfolio.blueprintIncomeTarget ?? '',
    blueprint_people_to_impact: portfolio.blueprintPeopleToImpact ?? '',
    blueprint_commitment: portfolio.blueprintCommitment ?? '',
    reflection_answers: portfolio.reflectionAnswers ?? {},
    cards_completed: portfolio.cardsCompleted ?? {},
    submitted_at: portfolio.submittedAt,
    locked: Boolean(portfolio.locked),
    faculty_status: portfolio.facultyStatus ?? 'pending',
    updated_at: new Date().toISOString(),
  };
}

/** @param {string} participantId */
export async function fetchWeek1Portfolio(participantId) {
  const local = getWeek1PortfolioLocal(participantId);
  if (!participantId || isMockUserId(participantId) || !isSupabaseConfigured || !supabase) {
    return local;
  }

  const { data, error } = await supabase
    .from('ra_spike_week1_portfolio')
    .select('*')
    .eq('user_id', participantId)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01' || /does not exist|schema cache/i.test(error.message ?? '')) {
      return local;
    }
    throw error;
  }

  if (!data) return local;
  const remote = mapDbRow(data);
  const merged = { ...local, ...remote };
  writeWeek1PortfolioLocal(participantId, merged);
  return merged;
}

/**
 * @param {string} participantId
 * @param {Partial<ReturnType<typeof emptyWeek1Portfolio>>} patch
 */
export async function saveWeek1Portfolio(participantId, patch) {
  if (!participantId) throw new Error('Sign in required.');
  const current = getWeek1PortfolioLocal(participantId);
  if (current.locked) {
    throw new Error('Portfolio is locked. Ask your coach to reopen it.');
  }

  const next = writeWeek1PortfolioLocal(participantId, patch);
  if (isMockUserId(participantId) || !isSupabaseConfigured || !supabase) {
    return next;
  }

  const payload = { user_id: participantId, ...toDbPayload(next) };
  const { error } = await supabase.from('ra_spike_week1_portfolio').upsert(payload, {
    onConflict: 'user_id',
  });
  if (error && !(error.code === '42P01' || /does not exist|schema cache/i.test(error.message ?? ''))) {
    throw error;
  }
  return next;
}

/** @param {ReturnType<typeof emptyWeek1Portfolio>} portfolio @param {Week1CardId} cardId */
export function isWeek1CardComplete(portfolio, cardId) {
  return Boolean(portfolio?.cardsCompleted?.[cardId]);
}

/** @param {ReturnType<typeof emptyWeek1Portfolio>} portfolio */
export function isDreamBuilderComplete(portfolio) {
  return Boolean(
    portfolio.lifestyleAnswer?.trim()
    && portfolio.incomePhp != null
    && Number(portfolio.incomePhp) > 0
    && portfolio.travelAnswer?.trim()
    && portfolio.lifestyleImageUrl
    && portfolio.incomeImageUrl
    && portfolio.destinationImageUrl,
  );
}

/** @param {ReturnType<typeof emptyWeek1Portfolio>} portfolio */
export function isVisionBlueprintComplete(portfolio) {
  const goals = portfolio.blueprintGoals ?? [];
  return Boolean(
    portfolio.personalVision?.trim()
    && portfolio.blueprintWhy?.trim()
    && goals.filter((g) => String(g).trim()).length >= 3
    && portfolio.blueprintIncomeTarget?.trim()
    && portfolio.blueprintPeopleToImpact?.trim()
    && portfolio.blueprintCommitment?.trim(),
  );
}

/** @param {ReturnType<typeof emptyWeek1Portfolio>} portfolio */
export function isReflectionComplete(portfolio) {
  const a = portfolio.reflectionAnswers ?? {};
  return Boolean(a.inspired?.trim() && a.fears?.trim() && a.excites?.trim());
}

/** @param {ReturnType<typeof emptyWeek1Portfolio>} portfolio */
export function areAllWeek1CardsComplete(portfolio) {
  return WEEK1_CARD_ORDER.every((id) => isWeek1CardComplete(portfolio, id));
}

/** @param {ReturnType<typeof emptyWeek1Portfolio>} portfolio */
export function canSubmitWeek1Portfolio(portfolio) {
  if (portfolio.locked || portfolio.submittedAt) return false;
  return (
    areAllWeek1CardsComplete(portfolio)
    && isDreamBuilderComplete(portfolio)
    && isVisionBlueprintComplete(portfolio)
    && isReflectionComplete(portfolio)
  );
}

/** @param {string} participantId @param {Week1CardId} cardId */
export async function markWeek1CardComplete(participantId, cardId) {
  const current = getWeek1PortfolioLocal(participantId);
  const cardsCompleted = { ...current.cardsCompleted, [cardId]: true };
  return saveWeek1Portfolio(participantId, { cardsCompleted });
}

/** @param {string} participantId */
export async function submitWeek1Portfolio(participantId) {
  const current = await fetchWeek1Portfolio(participantId);
  if (!canSubmitWeek1Portfolio(current)) {
    throw new Error('Complete all lesson cards, Dream Builder, Vision & Blueprint, and Reflection first.');
  }
  const submittedAt = new Date().toISOString();
  const next = await saveWeek1Portfolio(participantId, {
    submittedAt,
    locked: true,
    facultyStatus: 'pending',
  });

  // Mark playbook steps complete without advancing week.
  if (!isMockUserId(participantId) && isSupabaseConfigured && supabase) {
    const now = new Date().toISOString();
    await supabase.from('ra_spike_week_progress').upsert({
      user_id: participantId,
      week: 1,
      learn_status: 'complete',
      workshop_status: 'complete',
      assignment_status: 'complete',
      reflection_status: 'complete',
      submit_status: 'complete',
      reflection_notes: [
        current.reflectionAnswers?.inspired,
        current.reflectionAnswers?.fears,
        current.reflectionAnswers?.excites,
      ].filter(Boolean).join('\n\n'),
      week_submitted_at: submittedAt,
      updated_at: now,
    }, { onConflict: 'user_id,week' });
  }

  return next;
}

/**
 * @param {string} participantId
 * @param {'complete' | 'incomplete'} status
 * @param {{ reopen?: boolean }} [opts]
 */
export async function staffSetWeek1FacultyStatus(participantId, status, opts = {}) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Cloud sync is not configured.');
  const { data, error } = await supabase.rpc('staff_set_ra_spike_week1_status', {
    p_user_id: participantId,
    p_status: status,
    p_reopen: Boolean(opts.reopen),
  });
  if (error) throw error;
  return mapDbRow(data);
}

export async function staffPublishWeek2() {
  if (!isSupabaseConfigured || !supabase) throw new Error('Cloud sync is not configured.');
  const { data, error } = await supabase.rpc('publish_ra_spike_week', { p_week: 1 });
  if (error) throw error;
  return Number(data ?? 0);
}

/** @returns {Promise<Array<object>>} */
export async function staffListWeek1Portfolios() {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('ra_spike_week1_portfolio')
    .select('user_id, submitted_at, locked, faculty_status, personal_vision, income_php, updated_at')
    .order('updated_at', { ascending: false });
  if (error) {
    if (error.code === '42P01' || /does not exist|schema cache/i.test(error.message ?? '')) return [];
    throw error;
  }
  return data ?? [];
}

/**
 * @param {string} participantId
 * @param {boolean} present
 * @param {string} [sessionDate]
 */
export async function staffMarkWeek1Attendance(participantId, present, sessionDate) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Cloud sync is not configured.');
  const day = sessionDate || new Date().toISOString().slice(0, 10);
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('ra_spike_week1_attendance').upsert({
    user_id: participantId,
    session_date: day,
    present,
    marked_by: auth.user?.id ?? null,
    marked_at: new Date().toISOString(),
  }, { onConflict: 'user_id,session_date' });
  if (error) throw error;
}

/** @param {string} [sessionDate] */
export async function staffListWeek1Attendance(sessionDate) {
  if (!isSupabaseConfigured || !supabase) return [];
  const day = sessionDate || new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('ra_spike_week1_attendance')
    .select('user_id, present, session_date, marked_at')
    .eq('session_date', day);
  if (error) {
    if (error.code === '42P01' || /does not exist|schema cache/i.test(error.message ?? '')) return [];
    throw error;
  }
  return data ?? [];
}

/**
 * Upload a Dream Builder image as a data URL (no storage bucket required).
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Choose an image.'));
      return;
    }
    const okType = /image\/(jpeg|png|webp)/i.test(file.type);
    if (!okType) {
      reject(new Error('Use JPG, PNG, or WEBP.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image must be 5 MB or smaller.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.readAsDataURL(file);
  });
}
