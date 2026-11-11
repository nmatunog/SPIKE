import { parseVersaCsv } from './csv.js';
import { digestCode, requireHmacSecret } from './digest.js';
import { isVersaCsvCodeGateEnabled } from './flag.js';
import { insertInventoryRow } from './inventory.js';
import { createVersaLogger } from './log.js';
import { spreadsheetToCsvText } from './spreadsheet.js';

/**
 * Staff-only CSV intake. Stores digests, never plaintext codes.
 * @param {{
 *   env: Record<string, string>,
 *   admin: import('@supabase/supabase-js').SupabaseClient,
 *   csvText?: string,
 *   xlsxBuffer?: Buffer | Uint8Array,
 *   spreadsheet?: string | Buffer | Uint8Array,
 *   columnMap?: Record<string, string>,
 *   importedBy?: string | null,
 *   logger?: ReturnType<typeof createVersaLogger>,
 * }} input
 */
export async function importVersaCsv(input) {
  const logger = input.logger || createVersaLogger();
  if (!isVersaCsvCodeGateEnabled(input.env)) {
    return { ok: false, error: 'Versa CSV code gate is disabled.', imported: 0, rejected: [] };
  }

  let secret;
  try {
    secret = requireHmacSecret(input.env);
  } catch {
    return { ok: false, error: 'VERSA_CODE_HMAC_SECRET is not configured.', imported: 0, rejected: [] };
  }

  const csvText = input.csvText
    || (input.xlsxBuffer || input.spreadsheet
      ? await spreadsheetToCsvText(input.xlsxBuffer || input.spreadsheet)
      : '');
  const parsed = parseVersaCsv(csvText, input.columnMap || {});
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, imported: 0, rejected: parsed.rejected || [] };
  }

  const rejected = [...(parsed.rejected || [])];
  let imported = 0;
  const acknowledgments = [];

  for (const record of parsed.records) {
    const digest = await digestCode(secret, record.code);
    const result = await insertInventoryRow(input.admin, {
      code_digest: digest,
      versa_lead_ref: record.versaLeadRef,
      verified_email: record.verifiedEmail,
      verified_user_id: record.verifiedUserId,
      level: record.level,
      offering_id: record.offeringId,
      status: record.status,
      batch_id: record.batchId,
      external_code_id: record.externalCodeId,
      issued_at: record.issuedAt,
      expires_at: record.expiresAt,
      payment_confirmation_ref: record.paymentConfirmationRef,
      program_route: record.programRoute,
      imported_by: input.importedBy ?? null,
    });
    if (result.duplicate) {
      rejected.push({ line: record.line, reason: 'duplicate_digest_or_external_id' });
      continue;
    }
    imported += 1;
    acknowledgments.push({
      line: record.line,
      inventoryId: result.data?.id ?? null,
      versaLeadRef: record.versaLeadRef,
      level: record.level,
      offeringId: record.offeringId,
      status: record.status,
    });
  }

  logger.info({ event: 'versa_csv_imported', imported, rejected: rejected.length });
  return { ok: true, imported, rejected, acknowledgments };
}
