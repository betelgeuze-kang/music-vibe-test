import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDITORIAL_CATALOG } from '../src/v2/domain/recommendation.mjs';
import { LINK_AUDIT_RELEASE, LINK_PLATFORMS, exactLinkCoverage, linkAuditForTrack } from '../src/v2/data/link-audit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

assert.equal(LINK_AUDIT_RELEASE, 'cat1');
assert.equal(EDITORIAL_CATALOG.filter((track) => track.editorial).length, 60);
const coverage = exactLinkCoverage(EDITORIAL_CATALOG);
assert.equal(coverage.total, EDITORIAL_CATALOG.length * 3);
assert(coverage.exact > 0, 'catalog must retain reviewed direct links');

for (const track of EDITORIAL_CATALOG) {
  const audit = linkAuditForTrack(track);
  for (const platform of LINK_PLATFORMS) {
    const record = audit[platform];
    assert.equal(record.platform, platform);
    assert(['exact', 'search'].includes(record.mode));
    const url = new URL(record.url);
    assert.equal(url.protocol, 'https:');
    assert.match(record.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
}

for (const file of [
  'scripts/audit-links.mjs',
  '.github/workflows/catalog-audit.yml',
  'tools/free_music_pipeline.py',
  'data/free-music/licenses.json',
  'data/free-music/review-queue.schema.json',
  'data/free-music/review-queue.json'
]) assert(exists(file), `CAT1 file is missing: ${file}`);

const licenses = JSON.parse(read('data/free-music/licenses.json'));
assert.equal(licenses.release, 'cat1');
assert(licenses.allow.some((item) => item.id === 'cc0-1.0' && item.commercialUseAllowed));
assert(licenses.allow.some((item) => item.id === 'cc-by-4.0' && item.attributionRequired));
assert(licenses.denyByDefault.some((value) => value.includes('CC BY-NC')));

const queue = JSON.parse(read('data/free-music/review-queue.json'));
assert.equal(queue.schema, 1);
assert.equal(queue.release, 'cat1');
assert(Array.isArray(queue.items));
const pipeline = read('tools/free_music_pipeline.py');
for (const phrase of ['reviewStatus', 'pending', 'approved', 'published', '--reviewer', 'only an approved candidate may become published']) assert(pipeline.includes(phrase));
assert(!pipeline.includes('requests.post'), 'the review pipeline must not auto-publish over a network');

console.log(`CAT1 link transparency and human-gated free-music intake passed; exact coverage ${coverage.exact}/${coverage.total}.`);
