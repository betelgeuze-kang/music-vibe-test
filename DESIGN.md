---
version: alpha
name: My Music Vibe — Listening Notes
description: Warm editorial home for finding personal music and sharing it with a friend.
colors:
  primary: "#243D33"
  secondary: "#60685F"
  accent: "#AD422A"
  neutral: "#F5F1E8"
  surface: "#FFFDF8"
  sage: "#E2E9DA"
  line: "#D9D9CB"
typography:
  h1:
    fontFamily: "Iowan Old Style, Palatino Linotype, AppleMyungjo, NanumMyeongjo, Batang, Georgia, serif"
    fontSize: 64px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.065em
  h2:
    fontFamily: "Iowan Old Style, Palatino Linotype, AppleMyungjo, NanumMyeongjo, Batang, Georgia, serif"
    fontSize: 44px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: -0.045em
  body:
    fontFamily: "Pretendard, SUIT, Apple SD Gothic Neo, Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "Pretendard, SUIT, system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 650
    lineHeight: 1.5
    letterSpacing: 0.11em
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 80px
rounded:
  sm: 4px
  md: 6px
components:
  primary-action:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: 14px
  listening-section:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 40px
  home-canvas:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
  section-rule:
    backgroundColor: "{colors.line}"
  focus-ring:
    backgroundColor: "{colors.accent}"
  note-card:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 24px
---

## Overview

An independent music journal: warm paper, forest-green ink, record sleeves and carefully written listening notes. The first screen explains the useful outcome and offers one clear starting action. HE2 applies this direction to the home route; existing result and test routes retain their established design.

## Colors

Map these tokens to --home-paper, --home-surface, --home-ink, --home-muted, --home-line, --home-accent and --home-sage in v2-human-editorial.css. Rust is a small accent for numbering and focus indicators. Green carries primary actions. Dark sections use light text; muted text must meet normal-text contrast requirements.

## Typography

Use the system serif stack for short expressive headlines and the existing sans-serif stack for controls and explanation. Korean keeps words together. Desktop headlines are 64px maximum; mobile headlines scale between 34px and 48px. Avoid fixed heights on text. English is authored as complete copy, not a mechanical expansion of Korean lines.

## Layout

Hero and original record illustration → three-step orientation → first listening choice → clearly labelled sample result → interactive editorial moments → friend comparison example → practical questions → data controls. The desktop container remains 1240px. At 920px compress multi-column storytelling; at 680px stack it. Essential controls have at least 44px hit areas. The home header is not sticky.

## Elevation & Depth

Use thin rules and tonal section changes. Only the sample sleeve has a modest offset paper shadow. Avoid floating panels, glass effects and decorative motion. The original SVG is local, lightweight and requires no third-party image requests.

## Shapes

Small radii on paper surfaces and rectangular primary actions. Rounded moment selectors express selection. Sound waves and the record illustration are decorative, not unlabelled controls.

## Components

Reuse the existing audio controls, track-link instrumentation, consent controls and route actions. Moment buttons change editorial selections without navigating, replacing focus or replaying landing events. FAQs use native details/summary. Hero and footer hide internal release codes only on the redesigned home.

## Do's and Don'ts

- Do label sample profiles, comparison values and editorial selections as examples.
- Do distinguish original test sounds from commercial songs opened through external search links.
- Do preserve privacy controls, share-token protection and ads-off behavior.
- Do keep a usable text choice when sound cannot play.
- Do not claim recommendations or taste scores are clinical personality measurements.
- Do not claim a measurable completion time or customer count without evidence.
- Do not put personal profile tokens in preview images or external requests.
