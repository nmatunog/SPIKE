/**
 * Cohort research analytics — aggregates survey responses per squad (Sprint 05b).
 * @typedef {import('../types/playbook').SurveyQuestion} SurveyQuestion
 */

import {
  fetchResearchAnalytics,
  upsertResearchAnalytics,
} from './supabase/researchAnalytics.js';

const STORAGE_KEY = 'spike_research_analytics';

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

/**
 * @param {SurveyQuestion[]} questions
 * @param {Record<string, unknown>} answers
 */
export function buildAnswerMetrics(questions, answers) {
  /** @type {Record<string, object>} */
  const byQuestion = {};

  for (const q of questions) {
    const value = answers[q.id];
    if (value == null || value === '') continue;

    if (q.type === 'rating') {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        byQuestion[q.id] = {
          prompt: q.prompt,
          type: q.type,
          sum: num,
          count: 1,
          average: num,
        };
      }
      continue;
    }

    if (q.type === 'single_choice') {
      byQuestion[q.id] = {
        prompt: q.prompt,
        type: q.type,
        distribution: { [String(value)]: 1 },
      };
      continue;
    }

    if (q.type === 'multiple_choice' && Array.isArray(value)) {
      /** @type {Record<string, number>} */
      const distribution = {};
      for (const item of value) {
        distribution[String(item)] = (distribution[String(item)] || 0) + 1;
      }
      byQuestion[q.id] = { prompt: q.prompt, type: q.type, distribution };
      continue;
    }

    if (q.type === 'checkbox') {
      const key = value === true ? 'Yes' : 'No';
      byQuestion[q.id] = {
        prompt: q.prompt,
        type: q.type,
        distribution: { [key]: 1 },
      };
      continue;
    }

    if (q.type === 'ranking' && value && typeof value === 'object') {
      /** @type {Record<string, { sum: number, count: number }>} */
      const ranks = {};
      for (const [option, rank] of Object.entries(value)) {
        ranks[option] = { sum: Number(rank), count: 1 };
      }
      byQuestion[q.id] = { prompt: q.prompt, type: q.type, ranks };
      continue;
    }

    if (q.type === 'long_text' || q.type === 'short_text') {
      byQuestion[q.id] = {
        prompt: q.prompt,
        type: q.type,
        samples: [String(value).trim()],
      };
    }
  }

  return byQuestion;
}

/**
 * @param {Record<string, object>} existing
 * @param {Record<string, object>} incoming
 */
function mergeQuestionMetrics(existing, incoming) {
  /** @type {Record<string, object>} */
  const merged = { ...existing };

  for (const [qId, inc] of Object.entries(incoming)) {
    const prev = merged[qId];
    if (!prev) {
      merged[qId] = inc;
      continue;
    }

    if (inc.type === 'rating' && prev.type === 'rating') {
      const sum = (prev.sum || 0) + (inc.sum || 0);
      const count = (prev.count || 0) + (inc.count || 0);
      merged[qId] = {
        ...prev,
        sum,
        count,
        average: count ? sum / count : null,
      };
      continue;
    }

    if (inc.distribution && prev.distribution) {
      const distribution = { ...prev.distribution };
      for (const [k, v] of Object.entries(inc.distribution)) {
        distribution[k] = (distribution[k] || 0) + Number(v);
      }
      merged[qId] = { ...prev, distribution };
      continue;
    }

    if (inc.ranks && prev.ranks) {
      const ranks = { ...prev.ranks };
      for (const [opt, val] of Object.entries(inc.ranks)) {
        const p = ranks[opt] || { sum: 0, count: 0 };
        ranks[opt] = {
          sum: p.sum + val.sum,
          count: p.count + val.count,
        };
      }
      merged[qId] = { ...prev, ranks };
      continue;
    }

    if (inc.samples) {
      const samples = [...(prev.samples || []), ...inc.samples].slice(0, 20);
      merged[qId] = { ...prev, samples };
    }
  }

  return merged;
}

/**
 * @param {string} squadId
 * @param {string} surveyId
 * @param {SurveyQuestion[]} questions
 * @param {Record<string, unknown>} answers
 */
export function recordSurveyForSquadAnalytics(squadId, surveyId, questions, answers) {
  if (!squadId || !surveyId) return null;

  const all = readAll();
  const squad = all[squadId] || {};
  const current = squad[surveyId] || {
    responseCount: 0,
    metrics: { byQuestion: {} },
    updatedAt: null,
  };

  const incoming = buildAnswerMetrics(questions, answers);
  const byQuestion = mergeQuestionMetrics(current.metrics?.byQuestion ?? {}, incoming);

  const next = {
    responseCount: current.responseCount + 1,
    metrics: { byQuestion },
    updatedAt: new Date().toISOString(),
  };

  squad[surveyId] = next;
  all[squadId] = squad;
  writeAll(all);

  void upsertResearchAnalytics(squadId, surveyId, next.responseCount, next.metrics);

  return next;
}

/**
 * @param {string} squadId
 * @param {string} surveyId
 */
export function getLocalSquadAnalytics(squadId, surveyId) {
  return readAll()[squadId]?.[surveyId] ?? null;
}

/**
 * @param {string} squadId
 * @param {string} surveyId
 */
export async function getSquadAnalytics(squadId, surveyId) {
  const local = getLocalSquadAnalytics(squadId, surveyId);
  const remote = await fetchResearchAnalytics(squadId, surveyId);

  if (remote?.metrics?.byQuestion && local?.metrics?.byQuestion) {
    const byQuestion = mergeQuestionMetrics(
      remote.metrics.byQuestion,
      local.metrics.byQuestion,
    );
    return {
      responseCount: Math.max(remote.response_count, local.responseCount),
      metrics: { byQuestion },
      updatedAt: remote.updated_at || local.updatedAt,
      source: 'merged',
    };
  }

  if (remote) {
    return {
      responseCount: remote.response_count,
      metrics: remote.metrics,
      updatedAt: remote.updated_at,
      source: 'remote',
    };
  }

  if (local) {
    return { ...local, source: 'local' };
  }

  return null;
}

/**
 * @param {object} analytics
 */
export function extractTrends(analytics) {
  if (!analytics?.metrics?.byQuestion) return [];

  return Object.entries(analytics.metrics.byQuestion)
    .map(([id, m]) => {
      if (m.type === 'rating' && m.average != null) {
        return {
          questionId: id,
          prompt: m.prompt,
          kind: 'rating',
          value: Math.round(m.average * 10) / 10,
          detail: `avg ${m.average.toFixed(1)} (${m.count} responses)`,
        };
      }
      if (m.distribution) {
        const top = Object.entries(m.distribution).sort(([, a], [, b]) => b - a)[0];
        return {
          questionId: id,
          prompt: m.prompt,
          kind: 'distribution',
          value: top?.[0] ?? '—',
          detail: top ? `${top[1]} of ${Object.values(m.distribution).reduce((a, b) => a + b, 0)}` : '',
        };
      }
      if (m.ranks) {
        const sorted = Object.entries(m.ranks)
          .map(([opt, r]) => ({ opt, avg: r.sum / r.count }))
          .sort((a, b) => a.avg - b.avg);
        return {
          questionId: id,
          prompt: m.prompt,
          kind: 'ranking',
          value: sorted[0]?.opt ?? '—',
          detail: 'top priority',
        };
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * @param {object} analytics
 * @param {string} marketSegmentLabel
 */
export function buildPersonasFromAnalytics(analytics, marketSegmentLabel) {
  if (!analytics?.metrics?.byQuestion) return [];

  const byQ = analytics.metrics.byQuestion;
  const textEntry = Object.values(byQ).find((m) => m.samples?.length);
  const focusEntry = Object.values(byQ).find((m) => m.distribution && m.prompt?.includes('focus'));
  const trackEntry = Object.values(byQ).find((m) => m.distribution && m.prompt?.includes('career track'));
  const rankEntry = Object.values(byQ).find((m) => m.ranks);

  const topFocus = focusEntry?.distribution
    ? Object.entries(focusEntry.distribution).sort(([, a], [, b]) => b - a)[0]?.[0]
    : null;

  const topTrack = trackEntry?.distribution
    ? Object.entries(trackEntry.distribution).sort(([, a], [, b]) => b - a)[0]?.[0]
    : null;

  const topPriority = rankEntry?.ranks
    ? Object.entries(rankEntry.ranks)
        .map(([opt, r]) => ({ opt, avg: r.sum / r.count }))
        .sort((a, b) => a.avg - b.avg)[0]?.opt
    : null;

  const painPoint = textEntry?.samples?.[0] ?? 'Needs clarity on financial planning pathways.';

  return [
    {
      name: `${marketSegmentLabel} Primary`,
      segment: marketSegmentLabel,
      careerLean: topTrack ?? 'Undecided',
      topFocus: topFocus ?? 'Market research',
      topPriority: topPriority ?? 'Income protection',
      painPoints: painPoint,
      goals: topFocus ? `Advance ${topFocus.toLowerCase()} skills` : 'Build financial confidence',
    },
  ];
}

/**
 * @param {object} analytics
 */
export function buildOpportunityMap(analytics) {
  if (!analytics?.metrics?.byQuestion) return [];

  const opportunities = [];

  for (const m of Object.values(analytics.metrics.byQuestion)) {
    if (m.ranks) {
      const sorted = Object.entries(m.ranks)
        .map(([opt, r]) => ({ area: opt, score: r.sum / r.count }))
        .sort((a, b) => a.score - b.score);
      for (const item of sorted.slice(0, 3)) {
        opportunities.push({
          area: item.area,
          signal: 'High planning priority',
          strength: Math.max(1, Math.round(4 - item.score)),
        });
      }
    }
    if (m.distribution && m.prompt?.includes('focus')) {
      for (const [area, count] of Object.entries(m.distribution).sort(([, a], [, b]) => b - a).slice(0, 3)) {
        opportunities.push({
          area,
          signal: 'Squad interest',
          strength: count,
        });
      }
    }
  }

  return opportunities.slice(0, 6);
}
