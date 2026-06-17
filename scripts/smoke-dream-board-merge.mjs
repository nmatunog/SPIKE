#!/usr/bin/env node
import { normalizeDreamBoardCards } from '../src/lib/dreamBoardConfig.js';
import { mergeDreamBoardAssetLists } from '../src/lib/dreamBoardMerge.js';

function fail(message) {
  console.error(`smoke:dream-board-merge FAIL — ${message}`);
  process.exit(1);
}

const local = [
  { id: 'a1', category: 'lifestyle', caption: 'One', imageUrl: '' },
  { id: 'a2', category: 'travel', caption: 'Two', imageUrl: '' },
  { id: 'a3', category: 'health', caption: 'Three', imageUrl: '' },
  { id: 'a4', category: 'career', caption: 'Four', imageUrl: '' },
  { id: 'a5', category: 'financial', caption: 'Five', imageUrl: '' },
];

const cloud = [
  { client_asset_id: 'a1', category: 'lifestyle', caption: 'One', image_url: 'https://x/1.jpg', sort_order: 0 },
  { client_asset_id: 'a2', category: 'travel', caption: 'Two', image_url: 'https://x/2.jpg', sort_order: 1 },
  { client_asset_id: 'a3', category: 'health', caption: 'Three', image_url: 'https://x/3.jpg', sort_order: 2 },
  { client_asset_id: 'a4', category: 'career', caption: 'Four', image_url: 'https://x/4.jpg', sort_order: 3 },
  { client_asset_id: 'a5', category: 'financial', caption: 'Five', image_url: 'https://x/5.jpg', sort_order: 4 },
  { client_asset_id: 'a6', category: 'family', caption: 'Sixth card', image_url: 'https://x/6.jpg', sort_order: 5 },
];

const merged = mergeDreamBoardAssetLists(local, cloud);
if (merged.length !== 6) {
  fail(`expected 6 merged cards, got ${merged.length}`);
}
if (!merged.some((card) => card.id === 'a6' && card.caption === 'Sixth card')) {
  fail('cloud-only sixth card missing from merge');
}

const deduped = normalizeDreamBoardCards([
  { id: 'x1', category: 'career', caption: 'First' },
  { id: 'x1', category: 'career', caption: 'Duplicate' },
  { id: 'x2', category: 'travel', caption: 'Second' },
]);
if (deduped.length !== 2 || deduped[0].caption !== 'First') {
  fail('normalizeDreamBoardCards should dedupe by id');
}

import { enrichDreamBoardFromMetadata } from '../src/lib/dreamBoardMerge.js';

const enriched = enrichDreamBoardFromMetadata(
  [{ id: 'c1', category: 'career', caption: 'The', imageUrl: '' }],
  [{ id: 'c1', category: 'career', caption: 'The career I want is to lead my own agency team.' }],
);
if (enriched[0].caption.length <= 3) {
  fail('enrichDreamBoardFromMetadata should prefer longer metadata caption');
}

import { dataUrlToImageBlob, buildDreamBoardStoragePath } from '../src/lib/dreamBoardStorageUtils.js';

const tinyPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const { blob, contentType } = dataUrlToImageBlob(tinyPng);
if (!(blob instanceof Blob) || contentType !== 'image/png') {
  fail('dataUrlToImageBlob should decode inline dream board images');
}
if (!buildDreamBoardStoragePath('user-1', 'asset-abc').includes('user-1/asset-abc')) {
  fail('buildDreamBoardStoragePath should namespace by user and asset id');
}

console.log('smoke:dream-board-merge OK');
