# Result page and sharing — RS1

The result now leads with the taste name, a short interpretation, three songs and sharing. The same paper/forest palette and original record art connects it to the HE2 home. Six-dimensional explanations and the listening timeline use native expandable sections. Restoring or clearing history retains the expanded section.

## Share cards

Eight original geometric record sleeves are shared by the result hero and card renderer. Cards include the authored archetype name, interpretation, three keywords, the site address and a local QR for the fragment-based comparison link. There is no visible anonymous profile ID. The composer supports 1080×1350 feed and 1080×1920 story exports with additional space at the story's bottom edge.

Opening the composer prepares the PNG before enabling sharing. Preview and saved/shared files use the same PNG blob. Supported browsers invoke native file sharing directly in the click; cancellation does not save a file. Other browsers save the selected PNG. An explicit copy-link action remains available. Format changes disable export until the current image is ready; closing the composer revokes preview URLs and restores keyboard focus.

QR encoding uses a pinned, locally vendored MIT library; there is no QR service, remote encoder import or font request. Names/emails are absent. Taste values and the anonymous profile ID remain in the deliberately shared fragment/QR, with existing analytics isolation preserved. AdSense remains off.

## Validation

- Existing unit, consent, profile, timeline, recommendation and friend-match contracts.
- Both viewports: result hierarchy, native details keyboard use and expanded-state accessibility, feed/story PNG dimensions, independent QR decoding back to the same taste values, modal focus restoration, native-share invocation during user activation, cancellation, download fallback and comparison-link copying.
- Eight archetypes × two languages × two card formats: text bounds, text collisions, QR clear area and complete wrapped copy.
- Only the two profile screenshots are refreshed for RS1. The other ten screens compare against existing baselines. The promoted commit then runs all visual comparisons.

Native OS/app share sheets are represented by browser API stubs in automated tests; actual publication to a social account is outside this work. Screenshots and exported examples from localhost are design/test fixtures, not production traffic or deployment evidence.
