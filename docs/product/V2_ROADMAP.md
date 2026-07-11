# My Music Vibe V2 — Product & Refactoring Roadmap

## 1. Product decision

My Music Vibe is no longer defined as a one-time music MBTI quiz. The product becomes a lightweight music identity service with three connected jobs:

1. **My Vibe** — translate short audio choices into a persistent six-axis music profile.
2. **Vibe Now** — combine that profile with the user’s current situation and recommend five explainable tracks.
3. **Vibe Match** — compare two profiles, explain common ground and useful differences, and generate a Bridge Playlist.

The legacy 12/40-question personality result remains in the repository as a rollback and SEO archive, but it is no longer the application entry point.

## 2. Product principles

- **Music first:** ask about sound, listening context, and musical structure rather than general personality.
- **Explainable:** every profile, recommendation, and match result must explain why it was generated.
- **Streaming-service independent:** the core works without Spotify authentication or private listening-history APIs.
- **No forced account:** the first useful session is completed without sign-up.
- **Local by default:** the profile is stored in the browser; share links contain only numeric taste dimensions and an anonymous profile ID.
- **A result is a starting point:** every profile page leads to listening or connection, not a dead end.
- **One measurable loop:** profile creation → track click or friend comparison → return visit.

## 3. North Star and guardrails

### North Star Metric

**Valuable Vibe Sessions** — sessions in which a user completes or opens a profile and then either:

- clicks a recommended track, or
- completes a Vibe Match.

### Initial validation targets

These are product hypotheses, not industry benchmarks.

| Funnel | Initial target |
|---|---:|
| Landing → profile start | 25%+ |
| Profile start → complete | 65%+ |
| Profile result → track click | 25%+ |
| Profile result → share attempt | 8%+ |
| Shared visit → friend profile complete | 30%+ |
| 7-day return | 10%+ |

### Guardrails

- JavaScript error rate must not increase from the P2 baseline.
- Optional analytics remains consent-gated.
- No profile link contains name, email, or third-party account data.
- Main interaction remains usable on a 360px-wide screen.
- Core profile and recommendation tests remain deterministic.

## 4. Delivery roadmap

### Milestone 0 — Reframe and migration contract

**Status: delivered in the V2 foundation refactor**

- Confirm product definition and non-goals.
- Define six taste dimensions: Energy, Warmth, Novelty, Texture, Complexity, Sociality.
- Define local profile schema version 2.
- Define anonymous share-token format.
- Document which legacy layers are retained and which are retired.
- Preserve consent-aware P2 analytics and static legacy result pages.

**Exit gate:** a new engineer can understand the product, data contracts, and rollback path without reading the legacy runtime.

### Milestone 1 — My Vibe foundation

**Status: delivered in the V2 foundation refactor**

- Replace the old landing with a three-job product home.
- Add ten music-first questions, including four audio A/B choices.
- Calculate deterministic scores across six dimensions.
- Map the scores to one of eight memorable music archetypes.
- Store the profile locally and keep a short local history.
- Render a reusable profile page and downloadable profile card.
- Preserve old `?ref=TYPE` links by mapping legacy types to V2 archetypes.

**Exit gate:** a first-time user can create and revisit a profile without an account.

### Milestone 2 — Vibe Now

**Status: delivered in the V2 foundation refactor**

- Offer six listening contexts: Focus, Lift, Night Walk, Reset, Explore, Together.
- Combine profile similarity and context fit in a deterministic recommendation engine.
- Return five artist-diverse tracks.
- Explain each recommendation using aligned taste dimensions.
- Link to Spotify, YouTube, and Apple Music searches without account authorization.
- Store recent Vibe Now sessions locally.

**Exit gate:** at least one useful recommendation flow works even if every streaming API is unavailable.

### Milestone 3 — Vibe Match

**Status: delivered in the V2 foundation refactor**

- Encode a minimal, versioned profile token in an invite link.
- Accept links and raw tokens.
- Compare profiles using commonality and moderate complementarity.
- Explain shared dimensions and meaningful differences.
- Generate a five-track Bridge Playlist that is fair to both profiles.
- Attribute shared visits and completed comparisons in analytics.

**Exit gate:** one user can send a link and a second user can complete the loop without signing in.

### Milestone 4 — Retention and Weekly Vibe

**Next**

- Add a local profile timeline and controlled profile updates.
- Create Weekly Vibe from selected contexts, track clicks, likes, and skips.
- Add lightweight “more like this / less like this” feedback.
- Generate a weekly share card.
- Add return prompts without push notifications initially.
- Decide whether browser-local history is sufficient before introducing accounts.

**Exit gate:** 7-day return rate and repeated track interaction can be measured reliably.

### Milestone 5 — Optional identity and integrations

**Future, gated by retention evidence**

- Optional sign-in and cross-device profile sync.
- Explicit data export and deletion.
- Optional Spotify/Apple Music linking only where stable and policy-compliant.
- User-controlled import of liked artists or playlists.
- Group match for 3–6 people.

**Exit gate:** account creation improves retention enough to justify privacy and operational cost.

### Milestone 6 — Monetization

**Future, gated by repeated value**

- Premium profile history and visual themes.
- Advanced weekly/monthly Vibe reports.
- Unlimited group comparisons.
- Clearly labeled sponsored artist challenges.
- Artist/label aggregate campaign reports with no personally identifiable data.

**Exit gate:** monetization does not reduce profile completion, track clicks, or trust metrics.

## 5. Technical migration sequence

### Kept as shared infrastructure

- `p2-analytics.js`: consent-aware event queue, attribution, diagnostics.
- Static `/ko/results/*` and `/en/results/*` pages: legacy search archive and inbound-link continuity.
- Existing audio and image assets.
- GitHub Pages/Jekyll deployment and deployment diagnostics.

### No longer loaded by the V2 application entry point

- `logic.js`
- `p0-fixes.js`
- `p1-experience.js`
- `p2-operations.js`
- `questions.js`
- `quick-questions.js`
- `results.js`
- `playlists.js`

These files remain temporarily for rollback and old static pages. They can be moved under `legacy/` after one stable release cycle.

### New V2 layers

```text
src/v2/
  data/             immutable questions, dimensions, archetypes, contexts, tracks
  domain/           profile scoring, recommendation, comparison
  infrastructure/   storage, share/export
  ui/               routes and rendering
  main.mjs           application bootstrap
```

Native ES modules are used so domain code can be tested directly without adding a framework or bundler.

## 6. Rollout and rollback

1. Merge V2 behind a single entry-point change in `index.html`.
2. Run P0/P1/P2 compatibility checks plus V2 domain tests.
3. Deploy and verify the home page, one profile creation, one Vibe Now flow, and one shared match flow.
4. Monitor JavaScript errors, profile completion, track clicks, and referral completion.
5. If a blocking regression appears, restore the previous index script list; legacy files remain available.
6. After one stable release cycle, archive unused legacy runtime files and update static SEO pages to the V2 profile language.

## 7. Definition of done for the foundation refactor

- A clean V2 module boundary exists.
- The new home communicates all three product jobs.
- Profile scoring is deterministic and covered by tests.
- Recommendations and matches work without remote APIs.
- Sharing contains no PII and can be decoded safely.
- Existing analytics consent and Pages deployment remain intact.
- CI validates legacy continuity and V2 behavior.
