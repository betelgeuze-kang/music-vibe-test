# M4 Recommendation Feedback

M4-1 turns the five-track recommendation list into a local listening loop without changing the six-axis profile or requiring an account.

## User interaction

Feedback is available in **오늘의 선곡 / For today** and **같이 듣기 / Listen together**.

```text
더 듣고 싶어요 / More like this
덜 듣고 싶어요 / Less in this direction
```

Selecting the active response again clears it. Selecting the opposite response replaces the previous response. The current list does not reorder immediately; after at least two changes, the listener can explicitly request a refreshed five-track list.

## Bounded personalization

Feedback adjusts candidate ranking inside the existing recommendation strategy. It never changes the stored profile scores and never removes the `3 core + 1 adjacent + 1 exploration` structure.

| Signal | Adjustment |
|---|---:|
| Same track | ±8 |
| Same artist | ±3 |
| Shared tags | up to ±2 |
| Same listening context | ±2 |
| Final feedback adjustment | clamped to −8…+8 |

This limit prevents a small number of reactions from replacing the listener’s original profile. Identical profile, context, catalog, and feedback inputs must produce identical recommendations.

## Local data

The following records stay in browser localStorage:

```text
music-vibe-v2-feedback-v1
music-vibe-v2-interactions-v1
music-vibe-v2-visits-v1
```

The interaction ledger stores at most 400 recent entries. It can contain a track ID, artist, context, placement, strategy, anonymous profile ID, event type, and timestamp. It does not contain a name, email address, friend name, or external streaming history.

Recorded local interaction types:

```text
context_select
track_click
feedback_more
feedback_less
feedback_clear
recommendation_refresh
```

Storage remains optional. When localStorage is blocked, feedback can still affect the current page session but is not retained after reload.

## Analytics

Consent-aware analytics can emit:

```text
route_view
track_feedback
recommendation_refresh
```

`track_feedback` includes only the track ID, new and previous response, placement, context, strategy, anonymous profile ID, and whether local storage succeeded.

## Bridge Playlist boundary

Feedback on a shared playlist belongs only to the current browser. It may reorder bridge candidates within the midpoint and fairness model, but it never changes the friend’s shared profile values or claims to represent the friend’s reaction.

## Follow-up M4 stages

M4-2 will expose profile history and restoration. M4-3 will aggregate the local interaction ledger into a deterministic seven-day Weekly Vibe and return-loop experience.
