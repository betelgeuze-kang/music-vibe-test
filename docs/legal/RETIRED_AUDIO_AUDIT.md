# Retired audio audit — CR1

CR1 removed every previously self-hosted MP3 from the active repository tree and product playback path. Current listening-test audio is generated from `src/v2/audio/original-clips.mjs` without third-party recordings or samples.

This file preserves the provenance review for historical repository revisions. It is not the current product credit list.

## Previously identified Kevin MacLeod / Incompetech tracks

The following historical files contained ID3 metadata identifying Kevin MacLeod and matched entries in Incompetech's official track list. Incompetech's current free music license is CC BY 4.0 and requires visible attribution.

| Retired file | Identified title | ISRC | Official source |
|---|---|---|---|
| `Funkorama.mp3` | Funkorama | USUAN1100474 | `https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1100474` |
| `Dream_Catcher.mp3` | Dream Catcher | USUAN1800019 | `https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1800019` |
| `Lobby_Time.mp3` | Lobby Time | USUAN1600054 | `https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1600054` |
| `Cipher.mp3` | Cipher | USUAN1100844 | `https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1100844` |
| `Dreamy_Flashback.mp3` | Dreamy Flashback | USUAN1100532 | `https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1100532` |
| `Movement_Proposition.mp3` | Movement Proposition | USUAN1100778 | `https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1100778` |
| `Pixel_Peeker_Polka_faster.mp3` | Pixel Peeker Polka - faster | USUAN1100833 | `https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1100833` |

Historical attribution format:

```text
[Title] Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0
https://creativecommons.org/licenses/by/4.0/
```

## Unverified historical file

`Tech_Talk.mp3` was a zero-byte or otherwise unreadable asset in the active branch audit. It had no usable audio content or verifiable rights metadata and was removed rather than replaced with an assumed third-party source.

## CR1 decision

Even though seven historical tracks could be matched to an attribution-based commercial-use license, CR1 replaces them to simplify ongoing advertising-supported operation:

- no third-party recordings in the active test;
- no dependence on external credit text for core playback;
- deterministic source-controlled generation;
- runtime allowlist and CI verification;
- public current rights manifest at `/assets/audio/rights-manifest.json`.

The public current credit page is `/audio-credits/`.
