function searchUrls(title, artist) {
  const query = encodeURIComponent(`${title} ${artist}`);
  return Object.freeze({
    spotify: `https://open.spotify.com/search/${query}`,
    youtube: `https://www.youtube.com/results?search_query=${query}`,
    apple: `https://music.apple.com/us/search?term=${query}`
  });
}

function candidate({ id, title, artist, region, year, reason }) {
  return Object.freeze({
    track: Object.freeze({ id, title, artist, region, year }),
    reason: Object.freeze(reason),
    urls: searchUrls(title, artist),
    strategy: 'editorial-showcase',
    strategyLabel: Object.freeze({ kr: '편집 추천', en: 'Editorial pick' })
  });
}

export const HOME_SHOWCASE = Object.freeze({
  profileArchetypeId: 'midnight-dreamer',
  friendArchetypeId: 'rhythm-connector',
  signature: Object.freeze([
    candidate({
      id: 'space-song', title: 'Space Song', artist: 'Beach House', region: 'US', year: 2015,
      reason: { kr: '느린 드럼과 번지는 신스가 밤의 공간을 넓혀요.', en: 'Slow drums and blooming synths widen the space of the night.' }
    }),
    candidate({
      id: 'about-you', title: 'About You', artist: 'The 1975', region: 'UK', year: 2022,
      reason: { kr: '겹겹이 쌓인 기타와 먼 보컬이 기억처럼 번져요.', en: 'Layered guitars and distant vocals spread like a memory.' }
    }),
    candidate({
      id: 'through-the-night', title: 'Through the Night', artist: 'IU', region: 'KR', year: 2017,
      reason: { kr: '가까운 목소리와 작은 기타가 편지 같은 온기를 남겨요.', en: 'A close voice and small guitar leave the warmth of a letter.' }
    })
  ]),
  night: Object.freeze([
    candidate({
      id: 'apocalypse', title: 'Apocalypse', artist: 'Cigarettes After Sex', region: 'US', year: 2017,
      reason: { kr: '속삭이는 보컬과 긴 잔향이 걸음의 속도를 낮춰요.', en: 'Whispered vocals and long reverb slow the pace of a walk.' }
    }),
    candidate({
      id: 'instagram-dean', title: 'instagram', artist: 'DEAN', region: 'KR', year: 2017,
      reason: { kr: '건조한 리듬과 빈 공간이 사람 많은 하루의 열을 식혀요.', en: 'Dry rhythm and open space cool down a crowded day.' }
    }),
    candidate({
      id: 'wait-m83', title: 'Wait', artist: 'M83', region: 'FR', year: 2011,
      reason: { kr: '천천히 커지는 신스가 작은 감정을 긴 장면으로 바꿔요.', en: 'Slow-building synths turn a small feeling into a long scene.' }
    })
  ]),
  match: Object.freeze({
    resonance: 72,
    discovery: 87,
    resonanceLabel: Object.freeze({ kr: '높은 편', en: 'High' }),
    discoveryLabel: Object.freeze({ kr: '매우 높은 편', en: 'Very high' }),
    bridgeTracks: Object.freeze([
      candidate({
        id: 'back-on-74', title: 'Back on 74', artist: 'Jungle', region: 'UK', year: 2023,
        reason: { kr: '라이브 밴드의 온기와 반복되는 후렴이 춤과 대화 사이를 잇습니다.', en: 'Live-band warmth and a repeating chorus bridge dancing and conversation.' }
      }),
      candidate({
        id: 'best-part', title: 'Best Part', artist: 'Daniel Caesar feat. H.E.R.', region: 'CA', year: 2017,
        reason: { kr: '부드러운 기타와 두 목소리의 호흡이 서로 다른 취향을 가까이 놓아요.', en: 'Soft guitar and two closely balanced voices bring different tastes together.' }
      }),
      candidate({
        id: 'spring-day', title: 'Spring Day', artist: 'BTS', region: 'KR', year: 2017,
        reason: { kr: '그리운 멜로디가 개인의 기억을 함께 부를 수 있는 후렴으로 바꿔요.', en: 'A longing melody turns private memory into a chorus people can share.' }
      })
    ])
  })
});

export function localizedShowcaseReason(candidate, language = 'kr') {
  return candidate.reason?.[language] || candidate.reason?.en || candidate.reason?.kr || '';
}
