import assert from 'node:assert/strict';

global.window = {
  MusicVibeConsent: { getPreferences: () => ({ analytics: false, adMeasurement: false, personalizedAds: false }) },
  MusicVibeAnalytics: { getSnapshot: () => ({ visitorId: '', sessionId: '' }) },
  trackEvent: () => {}
};
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  createElement: () => ({ addEventListener() {}, set id(value) {}, set async(value) {}, set crossOrigin(value) {}, set src(value) {} }),
  head: { appendChild() {} }
};

const {
  MONETIZATION_RELEASE,
  AD_EXPERIMENT_ID,
  AD_HOLDOUT_RATIO,
  AD_SLOT_ID,
  monetizationDecision,
  monetizationVariant,
  renderMonetizationSlot
} = await import('../src/v2/ads/experiment.mjs?test=mon1');

assert.equal(MONETIZATION_RELEASE, 'mon1');
assert.equal(AD_EXPERIMENT_ID, 'weekly_summary_ad_v1');
assert.equal(AD_HOLDOUT_RATIO, 0.9);
assert.equal(AD_SLOT_ID, '');
assert.equal(monetizationVariant('same-listener'), monetizationVariant('same-listener'));

const variants = Array.from({ length: 1000 }, (_, index) => monetizationVariant(`listener-${index}`));
const holdoutRatio = variants.filter((value) => value === 'holdout').length / variants.length;
assert(holdoutRatio > 0.86 && holdoutRatio < 0.94, `holdout allocation drifted: ${holdoutRatio}`);

const decision = monetizationDecision({ route: 'weekly', placement: 'weekly-after-summary', context: 'weekly-summary', profileId: 'MV2-X' });
assert.equal(decision.eligible, false);
assert.equal(decision.reason, 'delivery_disabled');
assert.equal(renderMonetizationSlot({ route: 'weekly', placement: 'weekly-after-summary', context: 'weekly-summary', profileId: 'MV2-X' }), '');

console.log('MON1 deterministic 90/10 holdout and hard ads-off gates passed.');
