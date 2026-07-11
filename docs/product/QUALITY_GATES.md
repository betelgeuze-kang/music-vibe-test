# V2 Quality Gates

This release converts product-quality goals into repeatable CI gates. Passing the suite does not claim scientific or clinical validity; it confirms deterministic behavior, reasonable designed coverage, recommendation diversity, browser operability, accessibility, and deployment consistency.

## Gate 0 — Deployment reliability

- One release ID (`qg1`) is present in `build-info.json`, HTML metadata, body data, CSS URLs, and the module import map.
- `scripts/verify-release.mjs` verifies all critical modules, styles, eight audio previews, and the legacy ENFP result in both the repository and generated Jekyll artifact.
- `Release Quality` polls the public origin after a `main` push and verifies the home marker, build info, quality installer, audio delivery, and legacy result continuity.
- Versioned URLs prevent a new HTML shell from loading stale CSS or modules from a previous release.

## Gate 1 — Core UX and visual identity

- Onboarding supports previous-question navigation, answer editing, A/B keyboard selection, numeric audio preview shortcuts, heard state, progress, and recoverable audio errors.
- The profile uses an accessible SVG Vibe Glyph and bipolar axes with both endpoints visible.
- A three-track signature listen appears immediately below the profile explanation.
- Match results separate **Resonance** (current similarity) from **Discovery** (productive contrast).
- Comparison tokens use the URL fragment and a checksum. The fragment is normally excluded from server, CDN, and referrer requests.
- The profile card is produced from SVG after fonts are ready and includes the Vibe Glyph; QR generation is lazy and optional.

## Gate 2 — Measurement validity

All 1,024 answer combinations are enumerated in `scripts/profile-audit.mjs`. CI requires:

- all eight archetypes are reachable,
- no archetype exceeds 30% of the designed answer space,
- every axis spans at least 80 points,
- no axis pair exceeds an absolute Pearson correlation of 0.65,
- flipping one item changes the archetype in no more than 75% of the full answer space.

See `PROFILE_AUDIT.md` and `profile-audit.json` for the generated report. These checks assess the designed model space; real-user choice rates, retest stability, perceived fit, and recommendation engagement remain separate research questions.

## Gate 3 — Recommendation quality

- The local catalog contains 160 tracks, at least 35% from Asian regions, more than a dozen regions, six decades, and broad genre coverage.
- Exact platform links are used when verified; all other destinations fall back to an artist-and-title search.
- Five-track Vibe Now lists use a fixed exploration budget: three core fits, one adjacent fit, and one exploration slot.
- Maximal Marginal Relevance (MMR, 관련성을 유지하면서 중복을 줄이는 재정렬 방식) penalizes repeated artists, regions, decades, genres, tags, and near-identical profile vectors.
- Explanations identify aligned dimensions and, for adjacent or exploration slots, the main contrast from the user’s center.

## Gate 4 — Browser and accessibility quality

Playwright validates:

- keyboard onboarding, previous-question editing, and profile persistence,
- Vibe Now strategy composition,
- fragment-based friend invitation and completed matching,
- legacy invite compatibility,
- analytics rejection,
- audio failure recovery,
- blocked localStorage,
- desktop accessibility with axe,
- 360px bottom-navigation layout,
- desktop and mobile visual snapshots.

The first browser run captures baseline PNGs as an artifact. Once the baseline files and `.ready` marker are committed, subsequent runs compare screenshots with a 2.5% maximum pixel-difference ratio.
