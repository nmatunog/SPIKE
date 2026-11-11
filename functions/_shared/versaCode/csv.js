import { ASSUMED_CSV_COLUMNS, HEADER_ALIASES, LEVELS, PROGRAM_ROUTES, STATUSES } from './constants.js';
import { normalizeEmail, normalizeSubmittedCode } from './digest.js';

/** @param {string} header */
function normalizeHeader(header) {
  return String(header ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

/**
 * @param {string[]} headers
 * @param {Partial<Record<keyof typeof ASSUMED_CSV_COLUMNS, string>>} [columnMap]
 */
export function resolveColumnIndexes(headers, columnMap = {}) {
  const normalized = headers.map(normalizeHeader);
  /** @type {Record<string, number>} */
  const indexes = {};

  for (const field of Object.keys(ASSUMED_CSV_COLUMNS)) {
    const mapped = columnMap[field];
    if (mapped) {
      const want = normalizeHeader(mapped);
      const idx = normalized.indexOf(want);
      if (idx >= 0) indexes[field] = idx;
      continue;
    }
    const aliases = HEADER_ALIASES[field] || [ASSUMED_CSV_COLUMNS[field]];
    const idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx >= 0) indexes[field] = idx;
  }

  return indexes;
}

/** Minimal RFC4180-ish parser for synthetic/admin CSV (quoted commas/newlines). */
export function parseCsv(text) {
  const source = String(text ?? '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (ch === '\n' || (ch === '\r' && next === '\n') || ch === '\r') {
      row.push(field);
      field = '';
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
      row = [];
      if (ch === '\r' && next === '\n') i += 1;
      continue;
    }
    field += ch;
  }
  row.push(field);
  if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
  return rows;
}

/**
 * @param {string} csvText
 * @param {Partial<Record<keyof typeof ASSUMED_CSV_COLUMNS, string>>} [columnMap]
 */
export function parseVersaCsv(csvText, columnMap = {}) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return { ok: false, error: 'CSV must include a header row and at least one data row.', records: [] };
  }
  const headers = rows[0].map((h) => String(h).trim());
  const indexes = resolveColumnIndexes(headers, columnMap);
  if (indexes.code == null) {
    return { ok: false, error: 'CSV is missing a code column. Pass columnMap.code if the header differs.', records: [] };
  }
  if (indexes.versaLeadRef == null) {
    return {
      ok: false,
      error: 'CSV is missing versa_lead_ref. Pass columnMap.versaLeadRef if the header differs.',
      records: [],
    };
  }
  if (indexes.level == null) {
    return { ok: false, error: 'CSV is missing level. Pass columnMap.level if the header differs.', records: [] };
  }

  const records = [];
  const rejected = [];
  for (let i = 1; i < rows.length; i += 1) {
    const cells = rows[i];
    const line = i + 1;
    const cell = (field) => (indexes[field] == null ? '' : String(cells[indexes[field]] ?? '').trim());
    const code = normalizeSubmittedCode(cell('code'));
    const versaLeadRef = cell('versaLeadRef');
    const verifiedEmail = normalizeEmail(cell('verifiedEmail'));
    const verifiedUserId = cell('verifiedUserId') || null;
    const level = cell('level').toUpperCase();
    const offeringId = cell('offeringId') || (level === 'L2' ? 'financial-entrepreneurship' : 'financial-literacy');
    const statusRaw = (cell('status') || 'available').toLowerCase();
    const status = statusRaw === 'invalid' ? 'revoked' : statusRaw;
    const programRoute = (cell('programRoute') || (level === 'L2' ? 'ra-spike' : 'spike-interns')).toLowerCase();

    if (!code || !versaLeadRef) {
      rejected.push({ line, reason: 'missing_required_fields' });
      continue;
    }
    if (!LEVELS.includes(level)) {
      rejected.push({ line, reason: 'invalid_level' });
      continue;
    }
    if (!STATUSES.includes(status)) {
      rejected.push({ line, reason: 'invalid_status' });
      continue;
    }
    if (!PROGRAM_ROUTES.includes(programRoute)) {
      rejected.push({ line, reason: 'invalid_program_route' });
      continue;
    }
    if (!verifiedEmail && !verifiedUserId) {
      rejected.push({ line, reason: 'missing_verified_identity_link' });
      continue;
    }

    records.push({
      line,
      code,
      versaLeadRef,
      verifiedEmail: verifiedEmail || null,
      verifiedUserId,
      level,
      offeringId,
      status,
      batchId: cell('batchId') || null,
      externalCodeId: cell('externalCodeId') || null,
      issuedAt: cell('issuedAt') || null,
      expiresAt: cell('expiresAt') || null,
      paymentConfirmationRef: cell('paymentConfirmationRef') || null,
      programRoute,
    });
  }

  return { ok: true, records, rejected, headers };
}
