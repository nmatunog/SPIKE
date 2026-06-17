#!/usr/bin/env node
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

console.log('smoke:dream-board-merge OK');
