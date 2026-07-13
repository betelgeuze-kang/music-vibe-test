import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDITORIAL_CATALOG } from '../src/v2/domain/recommendation.mjs';
import { LINK_PLATFORMS, exactLinkCoverage, linkAuditForTrack } from '../src/v2/data/link-audit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const online = process.argv.includes('--online');
const strict = process.argv.includes('--strict');
const outputFlag = process.argv.indexOf('--output');
const output = outputFlag >= 0 ? path.resolve(process.argv[outputFlag + 1]) : path.join(root, 'artifacts/catalog-link-audit.json');

const HOSTS = Object.freeze({
  spotify: new Set(['open.spotify.com']),
  youtube: new Set(['www.youtube.com', 'youtube.com', 'youtu.be', 'music.youtube.com']),
  apple: new Set(['music.apple.com'])
});

function validateUrl(record) {
  try {
    const url = new URL(record.url);
    if (url.protocol !== 'https:') return 'non_https';
    if (!HOSTS[record.platform]?.has(url.hostname)) return `unexpected_host:${url.hostname}`;
    if (record.mode === 'exact') {
      if (record.platform === 'spotify' && !/^\/track\/[A-Za-z0-9]+/.test(url.pathname)) return 'spotify_not_track';
      if (record.platform === 'youtube' && url.pathname === '/results') return 'youtube_search_marked_exact';
      if (record.platform === 'apple' && url.pathname === '/us/search') return 'apple_search_marked_exact';
    }
    return '';
  } catch (_) {
    return 'invalid_url';
  }
}

async function onlineStatus(record) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(record.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'MyMusicVibe-CatalogAudit/1.0 (+https://my-music-vibe.com/about/)' }
    });
    return { status: response.status, finalUrl: response.url, ok: response.ok || [401, 403, 429].includes(response.status) };
  } catch (error) {
    return { status: 0, finalUrl: '', ok: false, error: String(error?.name || error?.message || error) };
  } finally {
    clearTimeout(timer);
  }
}

const rows = [];
for (const track of EDITORIAL_CATALOG) {
  const audit = linkAuditForTrack(track);
  for (const platform of LINK_PLATFORMS) {
    const record = audit[platform];
    const validationError = validateUrl(record);
    const network = online ? await onlineStatus(record) : null;
    rows.push({
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      platform,
      mode: record.mode,
      url: record.url,
      reviewedAt: record.reviewedAt,
      validationError,
      network
    });
  }
}

const coverage = exactLinkCoverage(EDITORIAL_CATALOG);
const invalid = rows.filter((row) => row.validationError);
const dead = rows.filter((row) => row.network && [404, 410].includes(row.network.status));
const unreachable = rows.filter((row) => row.network && !row.network.ok && ![404, 410].includes(row.network.status));
const report = {
  schema: 1,
  release: 'cat1',
  generatedAt: new Date().toISOString(),
  online,
  trackCount: EDITORIAL_CATALOG.length,
  linkCount: rows.length,
  coverage,
  summary: { invalid: invalid.length, dead: dead.length, unreachable: unreachable.length },
  rows
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output, trackCount: report.trackCount, linkCount: report.linkCount, coverage, summary: report.summary }, null, 2));
if (invalid.length || dead.length || (strict && unreachable.length)) process.exitCode = 1;
