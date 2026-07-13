import { ADS_ENABLED, AD_PROVIDER, AD_PUBLISHER_ID, ALLOWED_AD_PLACEMENTS, canRenderAd } from './policy.mjs?commercial=cr1';

export const MONETIZATION_RELEASE = 'mon1';
export const AD_EXPERIMENT_ID = 'weekly_summary_ad_v1';
export const AD_HOLDOUT_RATIO = 0.9;
export const AD_CLIENT_ID = AD_PUBLISHER_ID ? `ca-${AD_PUBLISHER_ID}` : '';
// A real AdSense ad-unit slot ID has not been issued for this experiment yet.
// Leaving this empty is a hard network and rendering gate.
export const AD_SLOT_ID = '';

function hash(input) {
  let value = 2166136261;
  for (const character of String(input || '')) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function identityKey(fallback = '') {
  const analytics = window.MusicVibeAnalytics?.getSnapshot?.();
  return analytics?.visitorId || analytics?.sessionId || fallback || 'anonymous-session';
}

export function monetizationVariant(identity = '') {
  const bucket = hash(`${AD_EXPERIMENT_ID}:${identityKey(identity)}`) / 0xffffffff;
  return bucket < AD_HOLDOUT_RATIO ? 'holdout' : 'treatment';
}

export function monetizationDecision({ route = '', placement = '', context = '', profileId = '' } = {}) {
  const preferences = window.MusicVibeConsent?.getPreferences?.() || {};
  const variant = monetizationVariant(profileId);
  const configured = Boolean(AD_CLIENT_ID && AD_SLOT_ID);
  const permitted = canRenderAd({
    route,
    placement,
    context,
    consent: Boolean(preferences.adMeasurement)
  });
  const eligible = Boolean(ADS_ENABLED && configured && permitted && variant === 'treatment');
  let reason = 'eligible';
  if (!ADS_ENABLED) reason = 'delivery_disabled';
  else if (!configured) reason = 'slot_unconfigured';
  else if (!preferences.adMeasurement) reason = 'ad_measurement_not_granted';
  else if (!ALLOWED_AD_PLACEMENTS.includes(placement)) reason = 'placement_not_allowed';
  else if (!permitted) reason = 'policy_blocked';
  else if (variant === 'holdout') reason = 'holdout';
  return Object.freeze({
    release: MONETIZATION_RELEASE,
    experimentId: AD_EXPERIMENT_ID,
    variant,
    eligible,
    reason,
    provider: AD_PROVIDER,
    clientId: AD_CLIENT_ID,
    slotId: AD_SLOT_ID,
    placement,
    route
  });
}

export function renderMonetizationSlot(options = {}) {
  const decision = monetizationDecision(options);
  if (!decision.eligible) return '';
  const language = options.language === 'en' ? 'en' : 'kr';
  return `
    <section class="ad-slot monetization-slot" data-monetization-slot data-experiment-id="${decision.experimentId}" data-experiment-variant="${decision.variant}" data-placement="${decision.placement}" aria-label="${language === 'kr' ? '광고' : 'Advertisement'}">
      <span class="ad-slot__label">${language === 'kr' ? '광고' : 'Advertisement'}</span>
      <ins class="adsbygoogle" style="display:block" data-ad-client="${decision.clientId}" data-ad-slot="${decision.slotId}" data-ad-format="auto" data-full-width-responsive="true"></ins>
    </section>
  `;
}

function loadProviderScript() {
  if (document.getElementById('music-vibe-adsense')) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = 'music-vibe-adsense';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(AD_CLIENT_ID)}`;
    script.addEventListener('load', () => resolve(true), { once: true });
    script.addEventListener('error', () => resolve(false), { once: true });
    document.head.appendChild(script);
  });
}

export async function activateMonetizationSlot(options = {}) {
  const decision = monetizationDecision(options);
  window.__musicVibeMonetization = decision;
  window.trackEvent?.('monetization_exposure', {
    product_version: 'v3-mon1',
    experiment_id: decision.experimentId,
    experiment_variant: decision.variant,
    placement: decision.placement,
    ad_eligible: decision.eligible,
    decision_reason: decision.reason
  }, { allowDuplicate: true });
  if (!decision.eligible) return decision;
  const slot = document.querySelector(`[data-monetization-slot][data-placement="${CSS.escape(decision.placement)}"]`);
  if (!slot) return Object.freeze({ ...decision, eligible: false, reason: 'slot_not_in_dom' });
  const loaded = await loadProviderScript();
  if (!loaded) return Object.freeze({ ...decision, eligible: false, reason: 'provider_load_failed' });
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    return decision;
  } catch (_) {
    return Object.freeze({ ...decision, eligible: false, reason: 'provider_render_failed' });
  }
}

export function monetizationSnapshot(options = {}) {
  return monetizationDecision(options);
}
