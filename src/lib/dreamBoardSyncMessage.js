/**
 * User-facing copy after a manual or automatic dream board cloud sync.
 * @param {{ localPhotoCount: number, cloudPhotoCount: number, captionCount: number, cardCount: number }} stats
 */
export function buildDreamBoardSyncMessage(stats) {
  const { localPhotoCount, cloudPhotoCount, captionCount, cardCount } = stats;

  if (cardCount === 0) {
    return 'Add at least one dream card before syncing.';
  }

  if (localPhotoCount === 0) {
    return captionCount > 0
      ? `Synced ${captionCount} caption${captionCount === 1 ? '' : 's'}, but this device has no photos saved. Tap Refine (if locked), re-add photos to each card, then sync again.`
      : 'Add captions and photos to your dream cards, then sync again.';
  }

  if (cloudPhotoCount >= localPhotoCount) {
    return `Synced ${cloudPhotoCount} photo${cloudPhotoCount === 1 ? '' : 's'} and ${captionCount} caption${captionCount === 1 ? '' : 's'}. Your mentor can now see your dream board collage.`;
  }

  if (cloudPhotoCount > 0) {
    return `Partial sync: ${cloudPhotoCount} of ${localPhotoCount} photos uploaded. Stay on this screen and tap Sync to cloud again.`;
  }

  return `Captions saved, but photos did not upload. Check your connection and tap Sync to cloud again.`;
}

/**
 * @param {Array<{ caption?: string, imageUrl?: string }>} assets
 */
export function dreamBoardSyncStats(assets) {
  const list = Array.isArray(assets) ? assets : [];
  return {
    cardCount: list.length,
    captionCount: list.filter((asset) => String(asset?.caption ?? '').trim()).length,
    localPhotoCount: list.filter((asset) => asset?.imageUrl).length,
    cloudPhotoCount: 0,
  };
}
