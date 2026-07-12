# Frontend Quality FQ1

FQ1 closes the first three frontend quality passes for the canonical My Music Vibe interface.

## Pass 1 — blocking interaction defects

- Route changes clear transient notices before the next screen is rendered.
- Mobile notices live in document flow rather than over product navigation.
- Native `window.confirm` calls are replaced by an accessible application dialog.
- Privacy information uses a labelled and described `<dialog>`, Escape handling, and focus restoration.
- Visual-regression capture clears transient notices and open dialogs before taking screenshots.

## Pass 2 — layout and recognition

- The home hero uses viewport-aware 860px and 1100px breakpoints.
- Weekly banners and compact music links provide at least a 44px target.
- Compact navigation uses a short label and a recognisable icon while retaining a full accessible name.
- Weekly context cards use one, two, or three columns according to the real card count.
- Internal catalogue tags such as `editorial-curated` never reach user-facing weekly content.
- Optional analytics consent is a labelled non-blocking region.

## Pass 3 — automated quality gates

- Privacy and confirmation dialogs are tested with keyboard focus, Escape, cancel, and confirm flows.
- Optional analytics consent is tested with keyboard activation.
- Notice and navigation overlap is tested on the mobile viewport.
- Home, profile, weekly, today, and match routes are checked for horizontal overflow at 390, 768, 1024, and 1440 CSS pixels.
- Primary mobile controls are checked against a 44px hit-target contract.
- Desktop and mobile visual baselines are stored for all six canonical routes, including Weekly Vibe.
- FQ1 comparison mode fails when the screenshot pixel difference exceeds 2.5%.

## Release markers

```text
Weekly Vibe       m4w1
Frontend Quality  fq1
Canonical entry   /src/v2/main.mjs?frontend=fq1
Canonical style   /v2-app.css?frontend=fq1
```

The public release is complete only after GitHub Pages and the Cloudflare-backed custom domain provide the same M4W1 and FQ1 markers.
