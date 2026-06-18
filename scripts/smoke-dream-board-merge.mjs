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

import { preferLongerDreamBoardCaption } from '../src/lib/dreamBoardMerge.js';

if (preferLongerDreamBoardCaption('The ', 'The career I want is to lead my own agency team.') !== 'The career I want is to lead my own agency team.') {
  fail('preferLongerDreamBoardCaption should keep the longer caption');
}

const captionMerge = mergeDreamBoardAssetLists(
  [{ id: 'c1', category: 'career', caption: 'The career I want is to lead my own agency team.', imageUrl: '' }],
  [{ client_asset_id: 'c1', category: 'career', caption: 'The ', image_url: null, sort_order: 0 }],
);
if (!captionMerge[0].caption.includes('agency team')) {
  fail('mergeDreamBoardAssetLists should prefer longer local caption over truncated cloud row');
}

import { mergeDreamBoardBuilderData } from '../src/lib/dreamBoardMerge.js';

const preserved = mergeDreamBoardBuilderData(
  {
    assets: [
      { id: 'c1', category: 'career', caption: 'The', imageUrl: 'data:image/jpeg;base64,abc' },
    ],
  },
  {
    assets: [{ id: 'c1', category: 'career', caption: 'The career I want is to lead my own agency team.' }],
  },
);
if (!preserved.assets[0].imageUrl?.startsWith('data:')) {
  fail('mergeDreamBoardBuilderData should preserve local photos when remote is metadata-only');
}

import { dreamBoardStoragePublicUrl } from '../src/lib/dreamBoardStorageUtils.js';
const publicUrl = dreamBoardStoragePublicUrl('https://example.supabase.co', 'user-1', 'asset-1');
if (!publicUrl.includes('/storage/v1/object/public/dream-board/user-1/asset-1.jpg')) {
  fail('dreamBoardStoragePublicUrl should build public storage URLs');
}

import { attachDreamBoardStorageUrls } from '../src/lib/dreamBoardStorageUtils.js';
const withoutFile = attachDreamBoardStorageUrls(
  'https://example.supabase.co',
  'user-1',
  [{ id: 'asset-1', category: 'travel', caption: 'Go', imageUrl: '' }],
  new Set(),
);
if (withoutFile[0].imageUrl) {
  fail('attachDreamBoardStorageUrls should not invent URLs when Storage object is missing');
}
const withFile = attachDreamBoardStorageUrls(
  'https://example.supabase.co',
  'user-1',
  [{ id: 'asset-1', category: 'travel', caption: 'Go', imageUrl: '' }],
  new Set(['asset-1']),
);
if (!withFile[0].imageUrl?.includes('asset-1.jpg')) {
  fail('attachDreamBoardStorageUrls should attach URL when Storage object exists');
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

import { buildDreamBoardSyncMessage, dreamBoardSyncStats } from '../src/lib/dreamBoardSyncMessage.js';

const emptyStats = dreamBoardSyncStats([]);
if (emptyStats.cardCount !== 0 || buildDreamBoardSyncMessage(emptyStats) !== 'Add at least one dream card before syncing.') {
  fail('buildDreamBoardSyncMessage should prompt for cards when empty');
}

const successMsg = buildDreamBoardSyncMessage({
  cardCount: 3,
  captionCount: 3,
  localPhotoCount: 3,
  cloudPhotoCount: 3,
});
if (!successMsg.includes('mentor can now see')) {
  fail('buildDreamBoardSyncMessage should confirm full photo sync');
}

const partialMsg = buildDreamBoardSyncMessage({
  cardCount: 2,
  captionCount: 2,
  localPhotoCount: 2,
  cloudPhotoCount: 1,
});
if (!partialMsg.includes('Partial sync')) {
  fail('buildDreamBoardSyncMessage should report partial photo upload');
}

console.log('smoke:dream-board-merge OK');
