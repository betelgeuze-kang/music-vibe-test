# Advertising monetization readiness — CR1

CR1 prepares the product for a future advertising-supported release without enabling advertising now. It is an engineering and operations checklist, not legal advice or approval from an ad network.

## Current state

```text
ADS_ENABLED = false
AD_PROVIDER = ""
AD_PUBLISHER_ID = ""
root ads.txt = absent by design
third-party ad scripts = absent
personalized advertising consent = not implemented because ads are off
```

The source contract lives in `src/v2/ads/policy.mjs`.

## Before any ad script is added

1. Obtain a real publisher account and publisher ID.
2. Review the current Google Publisher Policies and the selected provider's terms.
3. Update `/privacy/` with the provider name, purposes, cookie/device identifiers, retention, opt-out links, and effective date.
4. Determine whether a consent management platform is required for the countries served. Use a certified CMP where the ad provider requires one.
5. Decide whether only non-personalized ads will be served before consent.
6. Create the real root `/ads.txt` only after the provider supplies the exact authorized seller record.
7. Run the CR1 browser, accessibility, placement, and public-origin gates.

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

- Never click live ads during development or QA.
- Do not use automated browser tests against production ad inventory.
- Use provider test mode or blank placeholders during layout validation.
- Do not ask users to click ads to support the service.
- Do not draw arrows, badges, or recommendation language toward ad units.
- Keep ads visually distinguishable from editorial track recommendations.

## Content and rights safeguards

Advertising should not be enabled if any active test audio lacks a source-controlled rights record. CR1 therefore requires:

- all active audio IDs in `assets/audio/rights-manifest.json`;
- no third-party MP3 in the active repository tree;
- no lyrics or album-cover copies;
- commercial songs represented only by factual metadata, original editorial explanation, and external platform links;
- a public `/audio-credits/` page.

## ads.txt procedure

Do not publish a placeholder seller record at the root. After a real publisher ID is issued:

1. copy `docs/operations/ads.txt.example` to `/ads.txt`;
2. replace every placeholder with the exact provider-issued values;
3. confirm the file is available at `https://my-music-vibe.com/ads.txt`;
4. add a CI assertion for the exact publisher ID;
5. remove the CR1 assertion that root `ads.txt` is absent.

## Release review

Every ad-enabled release should record:

```text
provider
publisher ID suffix or non-secret identifier
CMP/vendor
consent modes
allowed placements used
screenshots at 390 / 768 / 1024 / 1440px
privacy effective date
ads.txt validation
policy review date
```

The ad network's review and applicable law remain separate requirements; passing CR1 does not guarantee approval or eliminate legal risk.
