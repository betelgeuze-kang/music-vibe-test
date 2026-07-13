export const COMMERCIAL_READINESS_RELEASE = 'cr1';

// The seller record is already public, but advertising remains intentionally
// disabled until the provider script, privacy disclosure, consent mode, and
// placement review are explicitly activated in a later release.
export const ADS_ENABLED = false;
export const AD_PROVIDER = 'google-adsense';
export const AD_PUBLISHER_ID = 'pub-1386368370627622';
export const ADS_TXT_RECORD = 'google.com, pub-1386368370627622, DIRECT, f08c47fec0942fa0';

export const ALLOWED_AD_PLACEMENTS = Object.freeze([
  'home-after-profile-story',
  'profile-after-signature',
  'weekly-after-summary',
  'now-after-tracklist'
]);

export const BLOCKED_AD_ROUTES = Object.freeze([
  'discover',
  'match'
]);

export const BLOCKED_AD_CONTEXTS = Object.freeze([
  'site-header',
  'site-navigation',
  'listening-booth',
  'audio-choice',
  'quiz-option',
  'progress-control',
  'track-feedback',
  'streaming-link-group',
  'share-control',
  'dialog',
  'consent-region',
  'empty-state',
  'error-state'
]);

export const AD_SAFETY_CONTRACT = Object.freeze({
  enabledByDefault: false,
  publisherRecordConfigured: true,
  requiresPrivacyPolicyUpdateBeforeActivation: true,
  requiresConsentManagementWhereApplicable: true,
  requiresAdvertisementLabel: true,
  minimumActionSeparationPx: 32,
  minimumContentBeforeFirstAdWords: 180,
  autoRefreshAllowed: false,
  floatingAdsAllowed: false,
  interstitialAdsAllowed: false,
  adsInsideQuizAllowed: false,
  adsAdjacentToNavigationAllowed: false,
  adsAdjacentToAudioControlsAllowed: false,
  adsAdjacentToFeedbackControlsAllowed: false
});

export function canRenderAd({ route, placement, context = '', consent = false } = {}) {
  if (!ADS_ENABLED || !AD_PROVIDER || !AD_PUBLISHER_ID) return false;
  if (!consent) return false;
  if (BLOCKED_AD_ROUTES.includes(String(route || ''))) return false;
  if (!ALLOWED_AD_PLACEMENTS.includes(String(placement || ''))) return false;
  if (BLOCKED_AD_CONTEXTS.includes(String(context || ''))) return false;
  return true;
}

export function commercialAdPolicySnapshot() {
  return Object.freeze({
    release: COMMERCIAL_READINESS_RELEASE,
    enabled: ADS_ENABLED,
    provider: AD_PROVIDER,
    publisherId: AD_PUBLISHER_ID,
    publisherConfigured: Boolean(AD_PUBLISHER_ID),
    adsTxtRecord: ADS_TXT_RECORD,
    allowedPlacements: [...ALLOWED_AD_PLACEMENTS],
    blockedRoutes: [...BLOCKED_AD_ROUTES],
    blockedContexts: [...BLOCKED_AD_CONTEXTS],
    contract: AD_SAFETY_CONTRACT
  });
}
