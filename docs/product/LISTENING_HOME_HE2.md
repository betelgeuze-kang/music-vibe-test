# Listening editorial home — HE2

The home now explains the outcome before asking for a listening choice. A warm paper background, forest ink, original record artwork, clear sample labels and practical questions help first-time visitors understand the product.

## Scope

- Korean and English hero, three-step orientation and original SVG illustration.
- Existing original test audio and text fallback in a dedicated first-listen section. Mobile choices stack for readable descriptions and controls.
- A labelled sample taste note with six axes and three external song search links.
- Four editorial listening moments: night, focus, lift and together. Changing a moment replaces three tracks and their explanations in place, retains focus and leaves the route unchanged.
- A labelled friend-comparison example and three bridge tracks.
- FAQs about music knowledge, external playback and changing taste; accurate local-storage and analytics-choice copy.

`DESIGN.md` is the design source. The home CSS is scoped to the home route or home-only components. The existing discover, profile, weekly, now and match product screens keep their layout. Header/footer release codes remain unchanged outside home.

## Privacy and content boundaries

The home uses local SVG artwork and existing catalog metadata, with no image, font or music API dependency. Recommended tracks open search results on music services. Only the existing original test sounds play in the app. Editorial samples are not personalized results or psychological diagnoses.

GA4 remains opt-in through the isolated analytics frame, and shared fragments stay protected. The scene event contains a fixed context ID and placement only. AdSense delivery remains off. Cloudflare RUM configuration is outside this design change.

## Validation

Run `npm run ci`, then the Playwright suite with its pinned packages. The browser suite covers the original audio, full profile flow, recommendations, sharing, consent/revocation, accessibility and responsive layouts. `listening-home.spec.mjs` adds keyboard-operated moment changes, actual track search targets, analytics rejection, bilingual sample/playback explanations and working entry into question 2.

HE2 intentionally changes the two home visual baselines. The existing Browser Quality capture process refreshes screenshots on the PR; the promoted commit must subsequently run in comparison mode. Local captures are design evidence, not proof of a production deployment.
