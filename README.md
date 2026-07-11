# My Music Vibe

My Music Vibe is a digital listening journal. Ten music-first choices become a six-direction taste note, five explainable tracks for the current moment, and a shared list for two friends.

## Product areas

- **내 취향 / My taste:** listen and choose ten times, then see a personal Vibe Glyph and six bipolar dimensions.
- **오늘의 선곡 / For today:** combine the saved taste note with focus, recovery, a night walk, discovery, or shared listening.
- **같이 듣기 / Listen together:** compare two anonymous profile fragments and build five tracks with room for both listeners.

The application is a static native ES-module site. It does not require an account, backend, Spotify login, or private streaming API.

## Design layers

```text
V2 core                 profile, recommendation, match domain
QG1 quality layer       accessibility, audio state, audits, browser tests
BD1 brand layer         editorial listening-journal copy and visual design
```

The brand layer is intentionally separate from the quality core, so the editorial design can be removed without changing the tested profile or recommendation model.

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

The product core starts from `src/v2/main.mjs`; the editorial layer is installed by `src/v2/brand/install.mjs`. Legacy P0–P2 runtime files remain for rollback and static-result continuity but are not loaded by the main home.

## Documentation

- [V2 product and refactoring roadmap](docs/product/V2_ROADMAP.md)
- [V2 architecture and data contracts](docs/product/V2_ARCHITECTURE.md)
- [Quality gates](docs/product/QUALITY_GATES.md)
- [Editorial brand design](docs/product/BRAND_DESIGN.md)
- [Profile-space audit](docs/product/PROFILE_AUDIT.md)
- [Analytics event dictionary](docs/analytics/EVENTS.md)
- [Weekly operating runbook](docs/operations/WEEKLY_RUNBOOK.md)

## Privacy

The active taste note is stored in browser localStorage. Friend comparison data lives in the URL fragment and contains only six numeric taste dimensions, an archetype identifier, and an anonymous profile ID. Optional analytics are sent only after consent.
