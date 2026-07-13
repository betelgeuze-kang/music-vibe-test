export const LINK_AUDIT_RELEASE = 'cat1';
export const LINK_REVIEWED_AT = '2026-07-13';
export const LINK_PLATFORMS = Object.freeze(['spotify', 'youtube', 'apple']);

function searchUrl(track, platform) {
  const query = encodeURIComponent(`${track.title} ${track.artist}`);
  if (platform === 'youtube') return `https://www.youtube.com/results?search_query=${query}`;
  if (platform === 'apple') return `https://music.apple.com/us/search?term=${query}`;
  return `https://open.spotify.com/search/${query}`;
}

export function linkRecord(track, platform) {
  const exact = String(track?.platforms?.[platform] || '').trim();
  const mode = exact ? 'exact' : 'search';
  return Object.freeze({
    platform,
    mode,
    url: exact || searchUrl(track, platform),
    reviewedAt: LINK_REVIEWED_AT,
    reviewMethod: exact ? 'curated-direct-url' : 'title-artist-search-fallback',
    officialTargetRequired: exact ? true : null
  });
}

export function linkAuditForTrack(track) {
  return Object.freeze(Object.fromEntries(LINK_PLATFORMS.map((platform) => [platform, linkRecord(track, platform)])));
}

export function exactLinkCoverage(tracks = []) {
  const total = tracks.length * LINK_PLATFORMS.length;
  const exact = tracks.reduce((sum, track) => sum + LINK_PLATFORMS.filter((platform) => Boolean(track?.platforms?.[platform])).length, 0);
  return Object.freeze({ total, exact, search: total - exact, ratio: total ? exact / total : 0, reviewedAt: LINK_REVIEWED_AT });
}
