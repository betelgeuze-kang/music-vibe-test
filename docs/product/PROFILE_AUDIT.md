# V2 Profile-Space Audit

This report exhaustively evaluates all **1,024** possible answer combinations. The audit is a structural quality check, not evidence of clinical or psychometric validity.

## Result

**PASS**

| Gate | Status |
|---|---|
| allArchetypesReachable | PASS |
| maxArchetypeShare | PASS |
| minimumAxisSpan | PASS |
| maximumAbsoluteCorrelation | PASS |
| maximumSingleQuestionSensitivity | PASS |

## Archetype distribution

| Archetype | Combinations | Share |
|---|---:|---:|
| midnight-dreamer | 178 | 17.4% |
| neon-runner | 174 | 17.0% |
| quiet-cinematic | 160 | 15.6% |
| warm-vinyl | 158 | 15.4% |
| rhythm-connector | 140 | 13.7% |
| cosmic-architect | 80 | 7.8% |
| electric-explorer | 71 | 6.9% |
| golden-chorus | 63 | 6.2% |

The largest archetype share is **17.4%**. All 8/8 archetypes are reachable.

## Axis coverage

| Axis | Min | Max | Span | Mean |
|---|---:|---:|---:|---:|
| energy | 0 | 100 | 100 | 50.0 |
| warmth | 0 | 100 | 100 | 50.0 |
| novelty | 0 | 100 | 100 | 50.0 |
| organic | 0 | 100 | 100 | 50.0 |
| complexity | 0 | 100 | 100 | 50.0 |
| sociality | 0 | 100 | 100 | 50.0 |

Every axis is centered at 50 and spans at least 100 points.

## Strongest axis correlations

| Pair | Pearson r |
|---|---:|
| energy ↔ sociality | 0.544 |
| warmth ↔ organic | 0.504 |
| warmth ↔ complexity | -0.477 |
| warmth ↔ novelty | -0.359 |
| novelty ↔ organic | -0.212 |
| organic ↔ complexity | -0.210 |

The maximum absolute correlation is **0.544**. This remains below the CI guardrail of 0.65; it should still be monitored with real user data because answer behavior can produce different correlations from the complete combinatorial space.

## Single-question archetype sensitivity

| Question | Result changes after flipping one answer |
|---|---:|
| ideal-night | 71.9% |
| home-scene | 71.7% |
| pulse-response | 66.0% |
| attention-hook | 62.7% |
| texture-instinct | 54.5% |
| lyric-world | 49.6% |
| progression-reward | 46.5% |
| recovery-sound | 42.6% |
| playlist-habit | 40.2% |
| first-listen | 37.1% |

The most sensitive item changes the assigned archetype in **71.9%** of the full answer space. The profile page therefore displays confidence and the six-dimensional shape, rather than presenting the archetype label as a precise diagnosis.

## Interpretation boundaries

- This is a deterministic explanation model for music taste, not a professional psychological test.
- Passing this audit means all designed outputs are reachable, reasonably distributed, and not trivially redundant.
- Real-user validation must separately measure item choice rates, retest stability, perceived fit, and recommendation engagement.
