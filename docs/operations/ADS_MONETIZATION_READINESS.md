# Advertising monetization readiness — CR1

CR1 prepares the product for a future advertising-supported release without enabling advertising now. It is an engineering and operations checklist, not legal advice or approval from an ad network.

## Current state

```text
ADS_ENABLED = false
AD_PROVIDER = "google-adsense"
AD_PUBLISHER_ID = "pub-1386368370627622"
root ads.txt = present with the provider-issued seller record
third-party ad scripts = absent
ad slots = absent
advertising cookies = absent
personalized advertising consent = not active because ad delivery is off
```

The source contract lives in `src/v2/ads/policy.mjs`. The public seller record is:

```text
google.com, pub-1386368370627622, DIRECT, f08c47fec0942fa0
```

A seller record does not enable ad delivery. It only declares which account is authorized to sell inventory for the domain. CR1 keeps all provider scripts and placements disabled.

## Before any ad script is added

1. Confirm the AdSense account associated with `pub-1386368370627622` is active and controlled by the site operator.
2. Review the current Google Publisher Policies, Better Ads Standards, and applicable local law.
3. Update `/privacy/` with the exact provider, processing purposes, cookie/device identifiers, retention, opt-out links, consent modes, and effective date.
4. Determine whether a certified consent management platform is required for the countries served.
5. Decide whether non-personalized or limited ads will be served before valid consent.
6. Confirm the root `/ads.txt` record still exactly matches the provider-issued value.
7. Add provider test-mode integration on a non-production branch before production activation.
8. Run the CR1 browser, accessibility, placement, invalid-traffic, and public-origin gates.

## Allowed candidate placements

The allowlist is deliberately short:

```text
home-after-profile-story
profile-after-signature
weekly-after-summary
now-after-tracklist
```

An allowed name does not automatically make a placement safe. It must also be a standalone content section with a visible `광고` or `Advertisement` label and sufficient separation from actions.

## Prohibited placements

Do not place ads:

- inside the 10-question onboarding flow;
- inside or next to the listening booth and audio preview controls;
- next to navigation, language, back, next, or selection controls;
- inside track cards, platform links, or feedback controls;
- inside dialogs, consent regions, share cards, invite forms, errors, or empty states;
- as floating overlays, interstitials, pop-ups, or auto-refreshing inventory;
- in a style that resembles a recommended song, streaming link, or product CTA.

The current policy requires at least 32px separation from actions and 180 words of meaningful content before a first ad candidate.

## Invalid traffic safeguards

- Never click live ads during development, QA, screenshots, or demos.
- Do not run automated browser interactions against production ad inventory.
- Use the provider's test mode or blank placeholders during layout validation.
- Do not ask users to click ads to support the service.
- Do not draw arrows, badges, recommendation language, or animation toward ad units.
- Keep ads visually distinguishable from editorial track recommendations.
- Record unexpected click-through or traffic spikes and pause delivery while investigating.

## Content and rights safeguards

Advertising should not be enabled if any active test audio lacks a source-controlled rights record. CR1 therefore requires:

- all active audio IDs in `assets/audio/rights-manifest.json`;
- no third-party MP3 in the active repository tree;
- no lyrics or album-cover copies;
- commercial songs represented only by factual metadata, original editorial explanation, and external platform links;
- a public `/audio-credits/` page.

## ads.txt maintenance

The real seller record is already published at `/ads.txt`. Do not replace it with an example or add additional sellers unless the provider account explicitly authorizes them.

For every ad-enabled release:

1. confirm `https://my-music-vibe.com/ads.txt` returns exactly the configured record;
2. confirm `src/v2/ads/policy.mjs` uses the same provider and publisher ID;
3. confirm the provider dashboard recognizes the domain;
4. remove stale or unauthorized seller records immediately;
5. keep `docs/operations/ads.txt.example` as documentation only—it must never overwrite the live root file.

## Release review

Every ad-enabled release should record:

```text
provider
publisher ID
seller-record validation
CMP/vendor
consent modes
personalized / non-personalized delivery rules
allowed placements used
screenshots at 390 / 768 / 1024 / 1440px
privacy effective date
policy review date
invalid-traffic review owner
```

The ad network's review and applicable law remain separate requirements; passing CR1 does not guarantee approval or eliminate legal risk.
