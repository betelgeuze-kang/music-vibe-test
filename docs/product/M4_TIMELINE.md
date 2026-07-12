# M4 Profile Timeline

M4-2 turns repeated profile tests into immutable listening notes. The timeline is a record of the sounds a listener stayed with on different days; it is not presented as a clinical measurement of a fixed personality.

## Snapshot identity

A profile ID is intentionally stable for an identical six-axis score shape. Timeline identity therefore uses both values:

```text
profile ID + createdAt
```

Two tests with the same result on different dates remain two separate snapshots.

## Storage

The active profile remains in:

```text
music-vibe-v2-profile
```

Up to twelve immutable snapshots remain in:

```text
music-vibe-v2-history
```

Snapshots are sorted newest first. Saving a new profile adds a snapshot but does not mutate older snapshots.

## Display rules

Profile scores remain exact internally. Timeline changes use softened display rules:

- differences below five points are treated as stable;
- visible differences are rounded to ten-point steps;
- only the two largest visible shifts lead the comparison;
- the complete six-axis values remain available in each profile detail view;
- wording describes the current set of choices rather than claiming a permanent personality change.

These rules reduce false precision from a ten-question profile and prevent small score noise from being framed as meaningful change.

## Reference selection

The active snapshot compares with the nearest older snapshot. When an older snapshot is restored and no earlier note exists, it compares with the nearest newer snapshot. Identical inputs always select the same reference and produce the same summary.

## Restore behavior

Restoring a snapshot:

- changes only the active profile;
- preserves newer and older snapshots;
- does not alter the friend profile;
- clears generated recommendation and match results so they are recalculated from the restored profile;
- does not erase recommendation feedback;
- records `profile_restore` in consent-aware analytics and the local interaction ledger.

Restoration does not create a duplicate snapshot.

## Deletion behavior

`과거 기록 지우기 / Clear earlier notes` removes historical snapshots while preserving the active profile and recommendation feedback.

`저장된 취향과 기록 삭제 / Delete saved taste and notes` removes both the active profile and profile history. It does not silently claim to erase optional analytics already sent under consent.

## Privacy boundary

Timeline data stays in browser localStorage. It contains anonymous profile IDs, six numeric scores, answers, source, and timestamps. It does not contain a name, email address, friend name, or external streaming history.

## Follow-up

M4-3 will use the existing interaction ledger and visit state to generate a deterministic seven-day Weekly Vibe. Timeline snapshots remain a separate source: Weekly Vibe summarizes recent activity, while the profile timeline preserves explicit retest results.
