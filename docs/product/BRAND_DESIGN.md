# My Music Vibe — Brand Design BD1

## Brand position

My Music Vibe is a **digital listening journal**: a place to listen, choose, and notice the sounds a person returns to. It is not presented as an AI analyzer, a clinical personality test, or a streaming platform replacement.

## Voice

### Write like this

- Begin with an action the listener can picture: listen, choose, walk, focus, share.
- Make one promise per sentence.
- Use Korean as the primary interface language; English works as a small editorial label.
- Use poetic language for archetype names and result moments, not for every button.
- Explain recommendations in ordinary listening language before mentioning dimensions or scores.

### Avoid

- `MUSIC IDENTITY, NOT ANOTHER MBTI`
- Repeating `Vibe Profile`, `Vibe Now`, `Vibe Match`, and `Bridge Playlist` inside Korean sentences
- Claims such as “analyze your soul frequency” or “scientifically accurate taste”
- Abstract product nouns when a direct verb is available
- Three clauses in one marketing sentence

### Core Korean lines

```text
내가 좋아하는 소리엔 이유가 있어요.
짧은 음악을 듣고 더 끌리는 쪽을 골라보세요.
취향은 한 단어보다 모양에 가까워요.
서로 다른 취향 사이에도 같이 들을 곡은 있어요.
```

## Visual direction

### Keywords

- Editorial — 음악 잡지와 라이너 노트 같은 편집 구조
- Tactile — 종이, 레코드 슬리브, 얇은 잉크 선처럼 느껴지는 표면
- Personal — 분석 대시보드보다 개인적인 청취 기록

### Palette

| Token | Value | Use |
|---|---|---|
| Ink Black | `#0a0a09` | Background and primary ink |
| Warm Paper | `#f1ede4` | Main text and listening booth |
| Soft Paper | `#d8d1c5` | Secondary paper surface |
| Divider | `#302e29` | Rules and structural borders |
| Signal Red | `#ff5a45` | One primary interaction accent |

Archetype colors appear mainly after the profile is complete. The home remains nearly monochrome so the result feels like a visual reward.

## Layout rules

- Large sections use thin top or bottom rules rather than rounded containers.
- Section radius: 18px maximum; cards: 12px; buttons: 8–10px.
- Track recommendations are lists, not nested cards.
- Metadata uses a mono stack; headlines and body use Korean system sans stacks.
- Purple glow, glassmorphism, floating metric pills, orbit graphics, and equal 01/02/03 feature cards are prohibited on the main home.

## Home information architecture

```text
Interactive listening hero
→ real profile sample
→ moment-based track sample
→ two-person listening sample
→ local-storage and privacy note
```

The first audio pair on the home is the actual first profile answer. Selecting it starts the profile at question two; it is not a decorative demo.

## Screen grammar

### Onboarding

Two choices resemble record sleeves. Audio transport, progress, heard state, and text fallback remain visible. Motion is restrained to selection feedback.

### Profile

The profile resembles an album cover plus liner notes. The Vibe Glyph is the personal visual signature. Six dimensions remain available as detail, not as the first impression.

### Today’s listening

Tracks are numbered rows with artist, reason, and destination links. Strategy labels explain core, adjacent, and exploration slots without looking like analytics badges.

### Listen together

Two profile sleeves face each other. Resonance and Discovery are distinct. The resulting five tracks show fit for each listener.

## Accessibility and failure behavior

- Editorial styling may not remove keyboard navigation, accessible meters, SVG descriptions, reduced-motion behavior, or visible focus states.
- The brand layer stacks after the quality core and can be removed independently.
- A 3.5-second fallback removes the loading mask if the brand module fails, leaving the tested quality interface usable.
- Visual changes are covered by desktop and 360px Playwright captures.
