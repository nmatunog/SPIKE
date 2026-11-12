import { VERSA_EXPORT_HEADER } from '../constants.js';

/** Synthetic Versa export row. Never use live codes. */
export function versaExportRow({
  code,
  plan = '',
  planSlug = '',
  owner = '',
  siteName = '',
  inventory = 'Unsold',
  status = 'INACTIVE',
  purchasedAt = '',
  durationDays = '',
  unitPriceTokens = '',
  createdAt = '2026-01-01T00:00:00.000Z',
} = {}) {
  return [
    code,
    plan,
    planSlug,
    owner,
    siteName,
    inventory,
    status,
    purchasedAt,
    durationDays,
    unitPriceTokens,
    createdAt,
  ].join(',');
}

export function versaExportCsv(rows, { bom = false } = {}) {
  const body = (Array.isArray(rows) ? rows : [])
    .map((row) => (typeof row === 'string' ? row : versaExportRow(row)))
    .join('\n');
  return `${bom ? '\uFEFF' : ''}${VERSA_EXPORT_HEADER}\n${body}\n`;
}

export const SYNTHETIC_CODES = Object.freeze({
  free: 'FREE-SYN00001',
  free2: 'FREE-SYN00002',
  once: 'FREE-SYNONCE1',
  reused: 'FREE-SYNREUSE',
  revoked: 'FREE-SYNREVOK',
  expired: 'FREE-SYNEXP01',
  unknown: 'FREE-SYN99999',
  pro: 'PRO-SYN00001',
  pro2: 'PRO-SYN00002',
  unknownSlug: 'VIP-SYN00001',
});
