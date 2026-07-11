# My Music Vibe V2 Architecture

## Runtime shape

The application is a static, browser-native ES module application. GitHub Pages serves the files directly; no build-time framework runtime or backend is required for the foundation release.

```text
index.html
  ├─ p2-analytics.js       consent-aware analytics infrastructure
  ├─ v2-core.css           shell, navigation, hero
  ├─ v2-features.css       profile, recommendation, match views
  ├─ v2-responsive.css     mobile and reduced-motion rules
  └─ src/v2/main.mjs
       └─ ui/app.mjs
            ├─ ui/screens.mjs
            ├─ ui/actions.mjs
            ├─ data/*
            ├─ domain/*
            └─ infrastructure/*
```

## Domain contracts

### VibeProfile v2

```js
{
  version: 2,
  id: "MV2-XXXXXXX",
  archetypeId: "midnight-dreamer",
  scores: {
    energy: 0..100,
    warmth: 0..100,
    novelty: 0..100,
    organic: 0..100,
    complexity: 0..100,
    sociality: 0..100
  },
  answers: [{ questionId, optionId }],
  source: "v2_onboarding",
  createdAt: ISODateString
}
```

### Share token

Only the following fields are encoded:

```js
{
  v: 2,
  a: archetypeId,
  s: [energy, warmth, novelty, organic, complexity, sociality],
  i: anonymousProfileId
}
```

The token is JSON encoded as Base64URL. It contains no name, email, listening history, or external account identifier.

## Scoring

Each question option contributes a signed vector on one or more dimensions. For every dimension, the sum is normalized by the maximum possible magnitude across the questionnaire:

```text
score = 50 + (chosen vector sum / possible magnitude) × 50
```

The result is clamped to `0..100`. Archetype assignment uses weighted Euclidean distance to eight predefined centroids. The same answers always produce the same profile.

## Recommendation

Track ranking combines:

```text
58% profile similarity
34% context fit
 8% contextual tag fit
```

Artists are de-duplicated in the final five tracks. Streaming destinations are search links generated at runtime, keeping the product independent from private platform APIs.

## Match

Compatibility uses average six-axis distance plus a small bonus for moderate, useful contrast and a penalty for extreme divergence. Bridge tracks are ranked using:

- similarity to the midpoint of both profiles,
- fairness between the two individual fit scores,
- fit for shared listening,
- minimum fit to either listener.

## Persistence

The browser stores:

- current profile,
- up to 12 profile snapshots,
- up to 12 Vibe Now sessions,
- language preference.

All storage access is guarded so the application still works when localStorage is unavailable.

## Analytics

The V2 UI emits the established funnel events through `window.trackEvent`, including:

- `landing_view`
- `start_test`
- `question_answer`
- `test_complete`
- `result_view`
- `vibe_now_generate`
- `playlist_click`
- `match_invite_created`
- `match_view`
- `ref_visit`
- `ref_complete`
- `share_click`, `share_success`, `share_cancel`, `share_error`
- `image_save`, `image_save_success`

`p2-analytics.js` remains responsible for consent, attribution, queuing, and transport.

## Security and privacy boundaries

- User-generated values are escaped before HTML insertion.
- Share tokens are length-limited, version-checked, dimension-count-checked, and score-clamped.
- No arbitrary URLs from a share token are rendered.
- Recommendation destinations are generated from the internal track catalog.
- No PII is requested in the foundation release.
