# My Music Vibe

My Music Vibe is a digital listening journal. Ten music-first choices become a six-direction taste note, five explainable tracks for the current moment, a shared list for two friends, and a local Weekly Vibe recap.

## Product areas

- **내 취향 / My taste:** listen and choose ten times, then see a personal Vibe Glyph and six bipolar dimensions.
- **오늘의 선곡 / For today:** combine the saved taste note with focus, recovery, a night walk, discovery, or shared listening.
- **이번 주 / Weekly Vibe:** summarize recent local interactions without reading external streaming history.
- **같이 듣기 / Listen together:** compare two anonymous profile fragments and build five tracks with room for both listeners.

The application is a static native ES-module site. It does not require an account, backend, Spotify login, private streaming API, or server-side profile storage.

## Active release layers

```text
QG1   core quality and measurement
E1    manually edited recommendation content
F1    canonical modular frontend
M4    feedback, timeline, Weekly Vibe, return loop
FQ1   dialogs, responsive matrix, hit targets, visual regression
HE1   human editorial home
CR1   original test audio, rights manifest, public policies, ads-off safety
```

The canonical runtime starts from `src/v2/main.mjs?commercial=cr1`. It does not load the historical brand installer, capture-phase interaction bridge, or quality mutation layer.

## Audio and commercial readiness

The active listening-test audio is not downloaded commercial music. Eight 12-second clips are generated in the browser from mathematical oscillators, envelopes, and seeded noise in `src/v2/audio/original-clips.mjs`. No third-party samples or recordings are used.

- Public audio rights page: `/audio-credits/`
- Machine-readable rights manifest: `/assets/audio/rights-manifest.json`
- Privacy and future advertising policy: `/privacy/`
- Service and recommendation principles: `/about/`

Advertising is disabled by default in `src/v2/ads/policy.mjs`. There is no live ad script, publisher ID, or root `ads.txt`. See [Advertising monetization readiness](docs/operations/ADS_MONETIZATION_READINESS.md) before enabling any provider.

## Development

```bash
npm ci
npm run ci
```

Browser gates run separately:

```bash
npm install --no-save --no-package-lock @playwright/test@1.55.0 @axe-core/playwright@4.10.2
npx playwright install chromium
npx playwright test
```

## Documentation

- [V2 product and refactoring roadmap](docs/product/V2_ROADMAP.md)
- [V2 architecture and data contracts](docs/product/V2_ARCHITECTURE.md)
- [Quality gates](docs/product/QUALITY_GATES.md)
- [Editorial brand design](docs/product/BRAND_DESIGN.md)
- [Human editorial home](docs/product/HUMAN_EDITORIAL_HOME_HE1.md)
- [Profile-space audit](docs/product/PROFILE_AUDIT.md)
- [Retired audio audit](docs/legal/RETIRED_AUDIO_AUDIT.md)
- [Advertising monetization readiness](docs/operations/ADS_MONETIZATION_READINESS.md)
- [Analytics event dictionary](docs/analytics/EVENTS.md)
- [Weekly operating runbook](docs/operations/WEEKLY_RUNBOOK.md)

## Privacy

The active taste note is stored in browser localStorage. Friend comparison data lives in the URL fragment and contains only six numeric taste dimensions, an archetype identifier, and an anonymous profile ID. Optional analytics are sent only after consent. Advertising cookies are not used while CR1 advertising remains disabled.
