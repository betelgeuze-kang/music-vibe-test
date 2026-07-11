# Cloudflare release settings for My Music Vibe

The repository and GitHub Pages origin can be up to date while `my-music-vibe.com` still serves an old HTML document or blocks automated checks. Cloudflare sits in front of GitHub Pages, so HTML caching and security challenges must be configured separately from static-asset caching.

## Required GitHub Actions secrets

Add the following repository secrets under **Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_ZONE_ID`: the zone ID for `my-music-vibe.com`.
- `CLOUDFLARE_API_TOKEN`: a scoped token with **Zone / Cache Purge / Purge** permission for this zone only.

The `Stabilization Release` workflow uses these secrets to purge the zone after the GitHub Pages build request. The workflow remains safe without them, but public validation can continue to see stale content.

## Recommended Cloudflare cache rules

### Bypass cache for release-sensitive documents

Create a rule that bypasses cache for:

```text
/
/index.html
/build-info.json
/deploy-probe-sr1.txt
/robots.txt
/sitemap.xml
/ko/results/*
/en/results/*
```

HTML should be revalidated at the origin. Do not use a `Cache Everything` rule for these paths.

### Cache versioned static assets

Long cache is appropriate for versioned resources such as:

```text
/*.css?stability=sr1
/*.css?brand=bd1
/src/v2/*.mjs?v=qg1
/assets/audio/*
/assets/brand/*
```

Version changes in the query string are part of the release contract.

## WAF and bot settings

Public `GET` and `HEAD` requests to release probes should not receive a JavaScript challenge or a 403 response. Add a narrow skip/allow rule for:

```text
/
/build-info.json
/v2-stabilization.css
/v2-stabilization-a11y.css
/deploy-probe-sr1.txt
/ko/results/*
```

Skip only the blocking bot/WAF products required for these read-only paths. Do not broadly disable firewall protection for the entire zone.

## Manual release procedure

1. Confirm `main` contains the intended release commit.
2. Run **Deploy GitHub Pages** or request the legacy Pages build.
3. Purge Cloudflare cache for the zone, or purge the release-sensitive URLs above.
4. Verify the following markers:

```text
/                         → Stability SR1
/build-info.json          → "stabilityRelease": "sr1"
/v2-stabilization.css     → BD1 Stabilization SR1
/deploy-probe-sr1.txt     → MY_MUSIC_VIBE_STABILITY_SR1
/ko/results/enfp/         → data-page-type="static_result"
```

5. Confirm ordinary browser navigation still works without a challenge.

## Interpreting workflow results

- **Origin PASS / Public PASS:** deployment is complete.
- **Origin PASS / Public FAIL:** GitHub Pages is correct; fix Cloudflare cache or WAF/Bot behavior.
- **Origin FAIL / Public FAIL:** inspect Pages source/build configuration before changing Cloudflare.
- **Origin FAIL / Public PASS:** public content may be cached; origin routing diagnostics need review.
