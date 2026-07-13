import assert from 'node:assert/strict';

const store = new Map();
global.window = {
  localStorage: {
    getItem: (key) => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key)
  },
  MusicVibeConsent: {
    getPreferences: () => ({ analytics: true, adMeasurement: false, personalizedAds: false })
  }
};
global.document = { body: { dataset: { v3Release: 'nv1' } } };

const {
  DATA_EXPORT_SCHEMA,
  DATA_EXPORT_MAX_BYTES,
  DATA_STORAGE_KEYS,
  clearProductData,
  exportUserData,
  importUserData,
  parseImportText,
  productDataSummary
} = await import('../src/v2/infrastructure/data-portability.mjs?test=data1');

const profile = {
  version: 2,
  id: 'MV2-TEST',
  archetypeId: 'midnight-dreamer',
  source: 'test',
  createdAt: '2026-07-13T00:00:00.000Z',
  scores: { energy: 30, warmth: 70, novelty: 60, organic: 50, complexity: 60, sociality: 20 }
};
store.set(DATA_STORAGE_KEYS.profile, JSON.stringify(profile));
store.set(DATA_STORAGE_KEYS.profileHistory, JSON.stringify([profile]));
store.set(DATA_STORAGE_KEYS.feedback, JSON.stringify({ version: 1, tracks: { 'space-song': { value: 'more' } } }));
store.set(DATA_STORAGE_KEYS.interactions, JSON.stringify({ version: 1, items: [{ id: 'one', type: 'track_click' }] }));
store.set('music-vibe-visitor-v1', 'must-not-export');
store.set('music-vibe-consent-v2', '{"analytics":true}');

const exported = exportUserData();
assert.equal(exported.schema, DATA_EXPORT_SCHEMA);
assert.equal(exported.product, 'my-music-vibe');
assert.equal(exported.data.profile.id, profile.id);
assert.equal(exported.preferences.analytics, true);
const serialized = JSON.stringify(exported);
assert(!serialized.includes('must-not-export'), 'analytics visitor identity must never be exported');
assert(!serialized.includes('music-vibe-consent-v2'), 'privacy-choice storage keys must never be exported');

const parsed = parseImportText(serialized);
assert.equal(parsed.data.profile.id, profile.id);
assert.throws(() => parseImportText(''), /empty or too large/);
assert.throws(() => parseImportText('x'.repeat(DATA_EXPORT_MAX_BYTES + 1)), /empty or too large/);
assert.throws(() => parseImportText('{"product":"other","schema":1}'), /not a supported/);

clearProductData('all');
assert.equal(productDataSummary().hasProfile, false);
const imported = importUserData(parsed);
assert.equal(imported.ok, true);
assert.equal(productDataSummary().hasProfile, true);
assert.equal(productDataSummary().feedbackCount, 1);
assert.equal(store.get('music-vibe-visitor-v1'), 'must-not-export', 'import must not replace analytics identity');

const cleared = clearProductData('feedback');
assert.equal(cleared.ok, true);
assert.equal(productDataSummary().feedbackCount, 0);
assert.equal(clearProductData('unknown').ok, false);

console.log('DATA1 export, import, category deletion, and privacy-boundary checks passed.');
