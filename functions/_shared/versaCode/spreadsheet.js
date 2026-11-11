import { parseVersaCsv } from './csv.js';

function isXlsxBuffer(value) {
  if (!value) return false;
  if (Buffer.isBuffer(value)) {
    return value.length >= 4 && value[0] === 0x50 && value[1] === 0x4b;
  }
  if (value instanceof Uint8Array) {
    return value.length >= 4 && value[0] === 0x50 && value[1] === 0x4b;
  }
  return false;
}

/**
 * Convert .xlsx bytes to CSV text using SheetJS. CSV strings pass through.
 * Column mapping stays in parseVersaCsv — this is bytes → headered text only.
 * @param {string | Buffer | Uint8Array} input
 */
export async function spreadsheetToCsvText(input) {
  if (typeof input === 'string') return input;
  if (!isXlsxBuffer(input)) {
    if (Buffer.isBuffer(input) || input instanceof Uint8Array) {
      return Buffer.from(input).toString('utf8');
    }
    return String(input ?? '');
  }
  const XLSX = await import('xlsx');
  const wb = XLSX.read(input, { type: 'buffer', cellDates: true });
  const name = wb.SheetNames[0];
  if (!name) return '';
  return XLSX.utils.sheet_to_csv(wb.Sheets[name]);
}

/**
 * Parse Versa inventory from CSV text or .xlsx bytes.
 * `columnMap` is the adaptable header layer (schema still pending from Versa).
 */
export async function parseVersaSpreadsheet(input, columnMap = {}) {
  const csvText = await spreadsheetToCsvText(input);
  return parseVersaCsv(csvText, columnMap);
}
