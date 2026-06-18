#!/usr/bin/env node
/**
 * Backfill dream_board_assets.image_url from public Storage paths when objects exist
 * but the DB column was left null (caption-only sync).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { dreamBoardStoragePublicUrl } from '../src/lib/dreamBoardStorageUtils.js';

const ROOT = join(import.meta.dirname, '..');

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1).replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* no .env */
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('repair:dream-board FAIL — set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key);

async function storageFileExists(userId, clientAssetId) {
  const folder = await sb.storage.from('dream-board').list(userId, { limit: 200 });
  if (folder.error) return false;
  const fileName = `${clientAssetId}.jpg`;
  return (folder.data ?? []).some((entry) => entry.name === fileName);
}

const { data: rows, error } = await sb
  .from('dream_board_assets')
  .select('id, user_id, client_asset_id, image_url')
  .is('image_url', null);

if (error) {
  console.error('repair:dream-board FAIL —', error.message);
  process.exit(1);
}

let repaired = 0;
for (const row of rows ?? []) {
  if (!row.client_asset_id) continue;
  const exists = await storageFileExists(row.user_id, row.client_asset_id);
  if (!exists) continue;
  const publicUrl = dreamBoardStoragePublicUrl(url, row.user_id, row.client_asset_id);
  const { error: updateError } = await sb
    .from('dream_board_assets')
    .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', row.id);
  if (updateError) {
    console.warn('repair:dream-board skip', row.id, updateError.message);
    continue;
  }
  repaired += 1;
  console.log('repaired', row.user_id.slice(0, 8), row.client_asset_id);
}

console.log(`repair:dream-board OK — ${repaired} row(s) updated`);
