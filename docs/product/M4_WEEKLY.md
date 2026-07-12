# M4 Weekly Vibe and seven-day return loop

## Product boundary

Weekly Vibe summarizes the most recent seven UTC calendar days of **local product interactions**. It does not import Spotify, Apple Music, YouTube, account, name, email, or external listening history.

Qualifying actions are:

```text
context_select
track_click
feedback_more
feedback_less
```

At least three qualifying actions are required. `feedback_clear`, route views, profile restores, recommendation refreshes, shares, and same-day reloads do not increase readiness.

## Deterministic aggregation

For the same profile, interaction list, catalog metadata, and anchor date, `buildWeeklyVibe()` must return the same result.

The weekly score starts from the saved six-axis profile and blends in a bounded behavior vector. The behavior vector is derived from:

- selected listening contexts,
- opened tracks,
- tracks marked “more like this”.

The blend grows with activity but is capped at 38%. Weekly Vibe never overwrites the saved profile.

## Ranking

### Contexts

```text
context_select  +3
track_click     +1
feedback_more   +2
feedback_less   +1
```

### Tracks

```text
track_click     +2
feedback_more   +4
feedback_less   -3
```

### Tags

Positive track actions contribute one point per tag; `feedback_more` contributes two. `feedback_less` subtracts one. Only positive final tag scores are shown.

Ties are resolved by score, then interaction count, then stable string ID. This makes the output independent of object insertion order.

## Weekly identity

The weekly archetype is the closest archetype to the bounded weekly score. The editorial alias is primarily selected from the dominant listening context:

```text
focus      고요한 집중 / Quiet focus
lift       가벼운 상승 / A gentle lift
night      밤의 잔향 / Night afterglow
reset      느린 회복 / Slow recovery
explore    새로운 전류 / A new current
together   함께 부르는 주간 / A week in chorus
balanced   균형의 기록 / A balanced note
```

The weekly name is a recap label, not a new personality diagnosis.

## Change display

Internal six-axis scores remain exact integers. The weekly UI:

- hides changes smaller than three points,
- rounds visible changes to five-point steps,
- displays at most the two largest movements,
- describes them as recent listening directions rather than permanent changes.

## Local persistence

Weekly snapshots use:

```text
music-vibe-v2-weekly-v1
```

The key for replacement is:

```text
profile ID + weekKey
```

Saving the same profile and week replaces the previous snapshot. Up to twelve snapshots are retained.

## Visit and return rules

Visit state uses:

```text
music-vibe-v2-visits-v1
```

The stored schema is version 2 and records distinct UTC visit days. A seven-day return is eligible only when:

- a profile exists,
- this is a new calendar-day visit,
- the previous distinct visit was at least seven days earlier,
- the generated event key has not already been recorded.

Reloading on the same day cannot produce another `return_visit_7d` event.

## Events

```text
weekly_vibe_view
weekly_vibe_share
weekly_vibe_continue
return_visit_7d
```

No personal identifiers or external streaming history are included.

## Share card

The Weekly Vibe card is a 1200×1500 PNG generated from SVG. It contains:

- date range,
- weekly alias,
- weekly Vibe Glyph,
- dominant listening context,
- up to three tracks,
- up to five tags,
- interaction count.

Native file sharing is used where supported. The fallback downloads the PNG locally.

## Empty state

When fewer than three qualifying actions exist, the weekly route shows:

- current progress,
- the minimum requirement,
- three concrete actions that can create data,
- a link to Music for Today,
- an optional link to a previously saved weekly snapshot.

No synthetic recap is invented for insufficient data.
