# My Music Vibe

My Music Vibe translates short audio choices into a six-axis music identity, recommends five explainable tracks for the current moment, and creates a Bridge Playlist between two friends.

## V2 product areas

- **My Vibe:** ten music-first choices → six dimensions → one memorable archetype.
- **Vibe Now:** profile + current context → five artist-diverse recommendations.
- **Vibe Match:** two anonymous profile tokens → compatibility explanation + Bridge Playlist.

The foundation release is a static native ES-module application. It does not require an account, backend, Spotify login, or private streaming API.

## Development

```bash
npm ci
npm run ci
```

The active application entry point is `src/v2/main.mjs`. Legacy P0–P2 runtime files remain in the repository for rollback and static-result continuity but are no longer loaded by `index.html`.

## Documentation

- [V2 product and refactoring roadmap](docs/product/V2_ROADMAP.md)
- [V2 architecture and data contracts](docs/product/V2_ARCHITECTURE.md)
- [Analytics event dictionary](docs/analytics/EVENTS.md)
- [Weekly operating runbook](docs/operations/WEEKLY_RUNBOOK.md)

## Privacy

The active profile is stored in browser localStorage. Friend comparison links contain only six numeric taste dimensions, an archetype identifier, and an anonymous profile ID. Optional analytics are sent only after consent.
