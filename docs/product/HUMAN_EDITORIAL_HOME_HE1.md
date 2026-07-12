# HE1 Human Editorial Home

HE1 turns the main home from a metrics-first product demonstration into a listening-led editorial page. It keeps the existing recommendation, profile, Weekly Vibe, privacy, and accessibility contracts while changing the emotional order in which they are presented.

## Product promise

```text
설명하기 어려운 노래도,
마음은 먼저 알아봐요.
```

The home begins with the listener’s immediate reaction rather than a claim about analysis accuracy. Copy uses ordinary listening scenes—rain, a walk, a chorus shared with someone—before introducing dimensions, scores, or recommendation strategy.

## Layout principles

- The home header is not sticky. Editorial section titles must never pass underneath navigation while scrolling.
- Large Korean sentences use `word-break: keep-all` and balanced wrapping.
- The hero remains two columns only when the listening booth has enough usable width.
- At 920px and below the hero becomes one column without a fixed minimum height.
- The profile example uses a 12-column editorial spread on wide screens, two columns on medium screens, and one column on mobile.
- Track rows always allow the copy column to shrink and move destination links below the copy on mobile.

## Shared-listening story

The previous home placed two profile cards around a fixed 220px score column. Long Korean score labels wrapped vertically and made the section resemble an analytics dashboard.

HE1 replaces it with:

```text
where I stay
→ a sentence about what remains between two listeners
→ two quiet horizontal measures
→ where my friend stays
```

The supporting measures are intentionally secondary:

- **함께 편안한 정도** — how easily the two listening shapes meet.
- **새 곡을 건넬 여지** — how much room there is to introduce something new.

They use small numbers and horizontal meters rather than large categorical words.

## Voice rules

### Prefer

- 귀에 남다
- 마음이 가다
- 다시 돌아가는 장면
- 오늘의 마음
- 함께 머물 수 있는 순서

### Avoid on the home

- diagnostic certainty
- large compatibility percentages as the focal point
- repeated uppercase English section labels in Korean
- abstract product language before a concrete listening scene
- identical three-card or bento-grid repetition

## Release contract

```text
Human Editorial release  he1
Application entry        /src/v2/main.mjs?home=he1
CSS entry                /v2-app.css?home=he1
Copy module              /src/v2/brand/copy.mjs?home=he1
Home screen              /src/v2/ui/screens/home.mjs?home=he1
Home CSS                 /v2-human-editorial.css?home=he1
```

## Quality gates

- desktop home header computes to `position: static`
- no horizontal overflow at 390, 768, 1024, or 1440px
- no `sample-match__scores` or fixed 220px score column in the active home
- two listening profiles and the bridge sentence remain readable at every breakpoint
- Korean headings preserve words rather than splitting syllable blocks
- home passes axe including color contrast
- desktop and mobile home visual baselines are re-approved for HE1
