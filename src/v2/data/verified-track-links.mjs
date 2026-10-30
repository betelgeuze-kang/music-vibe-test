// Artist / label / commissioned publisher links reviewed with YouTube oEmbed.
// Availability is checked on the recorded date; playback can vary by region.
const links = {
  "space-song": {
    "platforms": {
      "youtube": "https://www.youtube.com/watch?v=GAFwrXOsL68"
    },
    "publisher": "BeachHouseVideoZone",
    "title": "Space Song - Beach House (OFFICIAL AUDIO)",
    "checkedAt": "2026-10-30",
    "source": "https://www.youtube.com/watch?v=GAFwrXOsL68"
  },
  "about-you": {
    "platforms": {
      "youtube": "https://www.youtube.com/watch?v=tGv7CUutzqU"
    },
    "publisher": "The1975VEVO",
    "title": "The 1975 - About You (Official)",
    "checkedAt": "2026-10-30",
    "source": "https://www.youtube.com/watch?v=tGv7CUutzqU"
  },
  "apocalypse": {
    "platforms": {
      "youtube": "https://www.youtube.com/watch?v=sElE_BfQ67s"
    },
    "publisher": "Cigarettes After Sex",
    "title": "Apocalypse - Cigarettes After Sex",
    "checkedAt": "2026-10-30",
    "source": "https://www.youtube.com/watch?v=sElE_BfQ67s"
  },
  "instagram-dean": {
    "platforms": {
      "youtube": "https://www.youtube.com/watch?v=wKyMIrBClYw"
    },
    "publisher": "DEANTRBL",
    "title": "DEAN - instagram",
    "checkedAt": "2026-10-30",
    "source": "https://www.youtube.com/watch?v=wKyMIrBClYw"
  },
  "wait-m83": {
    "platforms": {
      "youtube": "https://www.youtube.com/watch?v=lAwYodrBr2Q"
    },
    "publisher": "Creators",
    "title": "M83 - \"Wait\" (Official Video)",
    "checkedAt": "2026-10-30",
    "source": "https://www.youtube.com/watch?v=lAwYodrBr2Q"
  },
  "through-the-night": {
    "platforms": {
      "youtube": "https://www.youtube.com/watch?v=BzYnNdJhZQw"
    },
    "publisher": "1theK (원더케이)",
    "title": "[MV] IU(아이유) _ Through the Night(밤편지)",
    "checkedAt": "2026-10-30",
    "source": "https://www.youtube.com/watch?v=BzYnNdJhZQw"
  },
  "river-flows": {
    "platforms": {
      "youtube": "https://www.youtube.com/watch?v=7maJOI3QMu0"
    },
    "publisher": "YirumaVEVO",
    "title": "Yiruma, (이루마) - River Flows in You",
    "checkedAt": "2026-10-30",
    "source": "https://www.youtube.com/watch?v=7maJOI3QMu0"
  },
  "experience-einaudi": {
    "platforms": {
      "youtube": "https://www.youtube.com/watch?v=hN_q-_nGv4U"
    },
    "publisher": "LudovicoEinaudiVEVO",
    "title": "Ludovico Einaudi - Experience (Live At Fabric, London / 2013)",
    "checkedAt": "2026-10-30",
    "source": "https://www.youtube.com/watch?v=hN_q-_nGv4U",
    "version": {
      "kr": "2013년 런던 라이브",
      "en": "London live, 2013"
    }
  },
  "love-lee": {
    "platforms": {
      "youtube": "https://www.youtube.com/watch?v=EIz09kLzN9k"
    },
    "publisher": "AKMU",
    "title": "AKMU - ‘Love Lee’ M/V",
    "checkedAt": "2026-10-30",
    "source": "https://www.youtube.com/watch?v=EIz09kLzN9k"
  },
  "back-on-74": {
    "platforms": {
      "youtube": "https://www.youtube.com/watch?v=q3lX2p_Uy9I"
    },
    "publisher": "Jungle4eva",
    "title": "Jungle - Back On 74 (Official Video)",
    "checkedAt": "2026-10-30",
    "source": "https://www.youtube.com/watch?v=q3lX2p_Uy9I"
  },
  "get-lucky": {
    "platforms": {
      "youtube": "https://www.youtube.com/watch?v=5NV6Rdv1a3I"
    },
    "publisher": "DaftPunkVEVO",
    "title": "Daft Punk - Get Lucky (Official Audio) ft. Pharrell Williams, Nile Rodgers",
    "checkedAt": "2026-10-30",
    "source": "https://www.youtube.com/watch?v=5NV6Rdv1a3I"
  },
  "best-part": {
    "platforms": {
      "youtube": "https://www.youtube.com/watch?v=vBy7FaapGRo"
    },
    "publisher": "HERMusicVEVO",
    "title": "Daniel Caesar - Best Part (Audio) ft. H.E.R.",
    "checkedAt": "2026-10-30",
    "source": "https://www.youtube.com/watch?v=vBy7FaapGRo"
  },
  "spring-day": {
    "platforms": {
      "youtube": "https://www.youtube.com/watch?v=xEeFrLSkMm8"
    },
    "publisher": "HYBE LABELS",
    "title": "BTS (방탄소년단) '봄날 (Spring Day)' Official MV",
    "checkedAt": "2026-10-30",
    "source": "https://www.youtube.com/watch?v=xEeFrLSkMm8"
  }
};
for (const entry of Object.values(links)) { Object.freeze(entry.platforms); if (entry.version) Object.freeze(entry.version); Object.freeze(entry); }
export const VERIFIED_TRACK_LINKS = Object.freeze(links);

export function trackLinks({ id, title, artist }) {
  const query = encodeURIComponent(`${title} ${artist}`);
  return Object.freeze({
    spotify: `https://open.spotify.com/search/${query}`,
    youtube: `https://www.youtube.com/results?search_query=${query}`,
    apple: `https://music.apple.com/us/search?term=${query}`,
    ...(VERIFIED_TRACK_LINKS[id]?.platforms || {})
  });
}
