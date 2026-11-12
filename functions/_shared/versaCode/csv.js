import { HEADER_ALIASES, STATUSES, VERSA_CSV_COLUMNS, VERSA_EXPORT_HEADER } from './constants.js';
import { normalizeSubmittedCode } from './digest.js';
import { normalizePlanSlug, resolvePlanSlug } from './planSlug.js';

/** @param {string} header */
function normalizeHeader(header) {
  return String(header ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function isVersaHeaderRow(cells) {
  const normalized = (cells || []).map((cell) => normalizeHeader(cell));
  return normalized[0] === 'code' && normalized[1] === 'plan' && normalized[2] === 'planslug';
}

/**
 * @param {string[]} headers
 * @param {Partial<Record<keyof typeof VERSA_CSV_COLUMNS, string>>} [columnMap]
 */
export function resolveColumnIndexes(headers, columnMap = {}) {
  const normalized = headers.map(normalizeHeader);
  /** @type {Record<string, number>} */
  const indexes = {};

  for (const field of Object.keys(VERSA_CSV_COLUMNS)) {
    const mapped = columnMap[field];
    if (mapped) {
      const want = normalizeHeader(mapped);
      const idx = normalized.indexOf(want);
      if (idx >= 0) indexes[field] = idx;
      continue;
    }
    const aliases = HEADER_ALIASES[field] || [normalizeHeader(VERSA_CSV_COLUMNS[field])];
    const idx = normalized.findIndex((h) => aliases.includes(h) || h === normalizeHeader(VERSA_CSV_COLUMNS[field]));
    if (idx >= 0) indexes[field] = idx;
  }

  return indexes;
}

/** Minimal RFC4180-ish parser for Versa CSV (quoted commas/newlines). Strips a UTF-8 BOM. */
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
 * Map Versa Inventory/Status onto portable inventory status.
 * Export default is Inventory=Unsold, Status=INACTIVE → available.
 */
export function mapVersaExportStatus(inventory, status) {
  const st = String(status ?? '').trim().toLowerCase();
  const inv = String(inventory ?? '').trim().toLowerCase();
  if (st === 'redeemed' || st === 'sold' || st === 'used') return 'redeemed';
  if (st === 'revoked' || st === 'invalid') return 'revoked';
  if (st === 'expired') return 'expired';
  if (STATUSES.includes(st)) return st;
  if (!st || st === 'inactive' || inv === 'unsold' || inv === '') return 'available';
  return 'available';
}

/**
 * Locked Versa export parser. Captures Code (hashed later), Plan, PlanSlug.
 * Other columns are optional raw metadata. Empty Owner/SiteName/PurchasedAt/
 * DurationDays/UnitPriceTokens are accepted. Concatenated free+pro files
 * (repeated header rows) are accepted.
 *
 * @param {string} csvText
 * @param {Partial<Record<keyof typeof VERSA_CSV_COLUMNS, string>>} [columnMap]
 */
export function parseVersaCsv(csvText, columnMap = {}) {
  const rows = parseCsv(csvText);
  if (!rows.length) {
    return { ok: false, error: 'CSV must include a header row and at least one data row.', records: [] };
  }

  let headerIndex = rows.findIndex((row) => isVersaHeaderRow(row));
  if (headerIndex < 0) headerIndex = 0;
  const headers = rows[headerIndex].map((h) => String(h).trim());
  const indexes = resolveColumnIndexes(headers, columnMap);
  if (indexes.code == null || indexes.plan == null || indexes.planSlug == null) {
    return {
      ok: false,
      error: `CSV must use the Versa export header: ${VERSA_EXPORT_HEADER}`,
      records: [],
    };
  }

  const records = [];
  const rejected = [];
  for (let i = 0; i < rows.length; i += 1) {
    if (i === headerIndex || isVersaHeaderRow(rows[i])) continue;
    const cells = rows[i];
    const line = i + 1;
    const cell = (field) => (indexes[field] == null ? '' : String(cells[indexes[field]] ?? '').trim());
    const code = normalizeSubmittedCode(cell('code'));
    const plan = cell('plan');
    const planSlug = normalizePlanSlug(cell('planSlug'));
    const owner = cell('owner') || null;
    const siteName = cell('siteName') || null;
    const inventory = cell('inventory');
    const versaStatus = cell('status');
    const purchasedAt = cell('purchasedAt') || null;
    const durationDays = cell('durationDays') || null;
    const unitPriceTokens = cell('unitPriceTokens') || null;
    const createdAt = cell('createdAt') || null;

    if (!code || !plan || !planSlug) {
      rejected.push({ line, reason: 'missing_required_fields' });
      continue;
    }

    const mapping = resolvePlanSlug(planSlug);
    if (!mapping) {
      rejected.push({ line, reason: 'unknown_plan_slug', planSlug });
      continue;
    }

    const status = mapVersaExportStatus(inventory, versaStatus);

    records.push({
      line,
      code,
      plan,
      planSlug: mapping.slug,
      versaLeadRef: `plan:${mapping.slug}`,
      verifiedEmail: null,
      verifiedUserId: null,
      level: mapping.level,
      offeringId: mapping.offerings[0].id,
      programRoute: mapping.programRoute,
      status,
      owner,
      siteName,
      inventory: inventory || null,
      versaStatus: versaStatus || null,
      purchasedAt,
      durationDays,
      unitPriceTokens,
      createdAt,
      issuedAt: createdAt,
      expiresAt: status === 'expired' ? createdAt : null,
      batchId: null,
      externalCodeId: null,
      paymentConfirmationRef: null,
    });
  }

  if (!records.length && !rejected.length) {
    return { ok: false, error: 'CSV must include a header row and at least one data row.', records: [], rejected };
  }

  return { ok: true, records, rejected, headers };
}
