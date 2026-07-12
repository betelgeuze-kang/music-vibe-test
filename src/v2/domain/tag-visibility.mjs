const INTERNAL_TAGS = new Set([
  'editorial-curated',
  'catalog-core',
  'direct-link',
  'verified',
  'manual-profile',
  'fallback-profile'
]);

export function isPublicMusicTag(value) {
  const tag = String(value || '').trim().toLowerCase();
  if (!tag) return false;
  if (INTERNAL_TAGS.has(tag)) return false;
  if (tag.startsWith('editorial-')) return false;
  if (tag.startsWith('catalog-')) return false;
  if (tag.startsWith('internal-')) return false;
  return true;
}

export function visibleWeeklyTags(items = [], limit = 5) {
  return Object.freeze(items
    .filter((item) => isPublicMusicTag(item?.tag))
    .slice(0, Math.max(0, Number(limit) || 0)));
}
