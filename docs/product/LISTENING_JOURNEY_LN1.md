# Test, listening and editorial pages — LN1

The next three improvements continue HE2/RS1 in PR #32. This is a review branch; source checks, browser checks and Pages artifact builds do not imply production deployment or customer results. AdSense stays off.

## 3. Test screen and resuming

The test uses the shared paper/forest design. Outlined controls preview original audio; filled A/B controls commit a choice. Audio is never required. The next question receives keyboard focus, while a preview rerender restores its control. Application shortcuts ignore inputs and open dialogs.

A versioned browser-local draft stores only recognized question/option IDs, the current position and timestamps. It expires seven days after its latest save, rejects incompatible banks, invalid choices, duplicates and impossible positions, and does not retain playback or analytics identifiers. Drafts support refreshing, leaving, editing an earlier answer, continuing, restarting and explicit deletion. Completing the profile removes the draft. A blocked store leaves the current session usable and displays a limitation. The privacy dialog and policy disclose the draft and its removal. This is local continuity, not cross-device sync or a measured active-completion timer.

## 4. Listening experience

Thirteen reviewed YouTube destinations join the nine existing direct links, giving 22 catalog tracks at least one direct platform destination. The shared registry supplies the app, home samples and static essays. New destinations were checked through YouTube oEmbed for title/publisher and successful metadata response on 2026-10-30. The first Space Song candidate was an unofficial upload and was replaced with the artist's official audio; an incorrect Jungle ID was replaced with the official video. A successful metadata response does not establish worldwide playback availability, a streaming license, a commercial partnership or actual listening.

Each service action distinguishes **Open track** from **Search**, includes a specific accessible name and opens without a referrer. Spotify and Apple retain explicit search fallbacks. Experience links to the 2013 London live performance, labelled on its essay. No commercial audio or embedded player is added.

Song cards separate the listening description from the connection to the saved taste. A contrast compares the track with the user's recorded profile, rather than claiming a comparison with other candidates. The deterministic recommendation ranking, feedback and 3/1/1 selection remain intact. A newly completed profile leads home into Music for Today; a ready, saved or return-eligible weekly note can become the main action. Weekly copy distinguishes actions within this site from external playback.

## 5. Independent situation pages

Four original bilingual essays expand the fixed home selections:

| Moment | Korean | English |
| --- | --- | --- |
| Night walk | `/listening/night-walk/` | `/en/listening/night-walk/` |
| Focused afternoon | `/listening/focused-afternoon/` | `/en/listening/focused-afternoon/` |
| A little lift | `/listening/a-little-lift/` | `/en/listening/a-little-lift/` |
| Between conversations | `/listening/between-conversations/` | `/en/listening/between-conversations/` |

`/listening/` and `/en/listening/` are indexes. Each essay contains an original introduction, three selections, specific listening points, a sequence note and related pages. They identify fixed editorial selections rather than personalized or clinically measured effects. The content, links and navigation remain available without JavaScript. The optional script personalizes the next action for an existing profile and uses the existing consent-aware analytics. A song-link click can enter the local weekly ledger; it is not a confirmed listen.

Canonical URLs, reciprocal Korean/English alternate links, Article metadata and sitemap entries ship in the HTML. `scripts/build-listening-guides.mjs` derives all ten pages and sitemap entries from the shared authored data. Run it after editing, then use `--check` to ensure parity. CI runs the parity check; the Pages artifact verifier checks every generated content page and required asset.

## Review and validation

- `npm run ci`: existing consent, deterministic domain, feedback, timeline, weekly, card and release contracts; new draft and content checks.
- `tests/e2e/listening-journey.spec.mjs`: both viewports; refresh/edit/complete/delete/restart/blocked-storage behavior, song-link labels, weekly home action, all eight essays without page scripts, accessibility and overflow, profile-to-context navigation and denied analytics.
- Existing full browser suite retains audio failure, consent/withdrawal/fragment, sharing, feedback, friend comparison and responsive tests.
- Visual refresh is intentional on all six application routes: home content links, test design, shared song descriptions/actions on profile/weekly/match, and Music for Today design. Two static templates (index and essay) add four viewport baselines. Capture only after function/accessibility checks; promote hosted captures and rerun comparison mode on the promoted source.
- `DESIGN.md` lint and token diff; saved desktop/mobile screenshots and test logs accompany the review.

Actual social-app publication, live-domain deployment, search-engine indexing, real visitor behavior, and region-specific music playback are not established by these tests.

## Destination review sources

The registry includes metadata and review dates. Artist/label/commissioned publisher destinations:

- [Beach House — Space Song](https://www.youtube.com/watch?v=GAFwrXOsL68)
- [The 1975 — About You](https://www.youtube.com/watch?v=tGv7CUutzqU)
- [Cigarettes After Sex — Apocalypse](https://www.youtube.com/watch?v=sElE_BfQ67s)
- [DEAN — instagram](https://www.youtube.com/watch?v=wKyMIrBClYw)
- [M83 — Wait](https://www.youtube.com/watch?v=lAwYodrBr2Q), linked by the [artist's video page](https://ilovem83.com/videos/wait/)
- [IU — Through the Night](https://www.youtube.com/watch?v=BzYnNdJhZQw)
- [Yiruma — River Flows in You](https://www.youtube.com/watch?v=7maJOI3QMu0)
- [Ludovico Einaudi — Experience, London live 2013](https://www.youtube.com/watch?v=hN_q-_nGv4U)
- [AKMU — Love Lee](https://www.youtube.com/watch?v=EIz09kLzN9k)
- [Jungle — Back On 74](https://www.youtube.com/watch?v=q3lX2p_Uy9I)
- [Daft Punk — Get Lucky](https://www.youtube.com/watch?v=5NV6Rdv1a3I)
- [Daniel Caesar / H.E.R. — Best Part](https://www.youtube.com/watch?v=vBy7FaapGRo)
- [BTS — Spring Day](https://www.youtube.com/watch?v=xEeFrLSkMm8)
