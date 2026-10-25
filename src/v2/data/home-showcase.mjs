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

// Fixed editorial previews. These are examples, not a visitor's personalized result.
export const HOME_SCENES = Object.freeze([
  Object.freeze({ id: 'night', number: '01', symbol: '☾', label: { kr: '밤 산책', en: 'Night walk' }, title: { kr: '조금 더 걷고 싶은 밤', en: 'Take the long way home' }, description: { kr: '하루의 소음은 낮추고, 여운은 조금 길게. 느린 리듬과 넓은 공간감을 가진 세 곡이에요.', en: 'Turn down the day and let the afterglow stay. Three tracks with slow rhythms and room to breathe.' }, tracks: HOME_SHOWCASE.night }),
  Object.freeze({ id: 'focus', number: '02', symbol: '◌', label: { kr: '집중하는 시간', en: 'Time to focus' }, title: { kr: '한 가지에 머무는 오후', en: 'An afternoon for one thing' }, description: { kr: '피아노의 반복과 천천히 쌓이는 소리. 작업하는 동안 곁에 두기 좋은 편집 선곡입니다.', en: 'Repeating piano patterns and slowly building textures: a selection to keep beside your work.' }, tracks: Object.freeze([
    candidate({ id: 'river-flows', title: 'River Flows in You', artist: 'Yiruma', region: 'KR', year: 2001, reason: { kr: '반복되는 피아노 선율이 생각이 돌아올 작은 기준점을 만들어요.', en: 'A recurring piano melody gives your thoughts a quiet point to return to.' } }),
    candidate({ id: 'experience-einaudi', title: 'Experience', artist: 'Ludovico Einaudi', region: 'IT', year: 2013, reason: { kr: '차곡차곡 쌓이는 피아노와 현악을 긴 호흡으로 따라가 보세요.', en: 'Follow the piano and strings as their layers gradually unfold.' } }),
    HOME_SHOWCASE.night[2]
  ]) }),
  Object.freeze({ id: 'lift', number: '03', symbol: '✳', label: { kr: '기분 전환', en: 'A little lift' }, title: { kr: '발걸음에 리듬을 더할 때', en: 'Put a rhythm in your step' }, description: { kr: '밝은 후렴과 탄력 있는 그루브. 익숙한 길도 조금 다르게 느껴지는 세 곡을 골랐어요.', en: 'Bright choruses and an easy groove. Three songs to make a familiar route feel a little different.' }, tracks: Object.freeze([
    candidate({ id: 'love-lee', title: 'Love Lee', artist: 'AKMU', region: 'KR', year: 2023, reason: { kr: '가볍게 튀는 리듬과 밝은 화음으로 시작해 보세요.', en: 'Start with a bouncing rhythm and bright, playful harmonies.' } }),
    HOME_SHOWCASE.match.bridgeTracks[0],
    candidate({ id: 'get-lucky', title: 'Get Lucky', artist: 'Daft Punk feat. Pharrell Williams', region: 'FR', year: 2013, reason: { kr: '반복되는 기타 리프와 베이스가 발걸음을 자연스럽게 이끌어요.', en: 'A repeating guitar riff and bass line carry your next step.' } })
  ]) }),
  Object.freeze({ id: 'together', number: '04', symbol: '∞', label: { kr: '함께 있는 순간', en: 'Time together' }, title: { kr: '대화 사이에 놓아둘 음악', en: 'Something between conversations' }, description: { kr: '너무 앞서가지도, 멀리 물러나지도 않게. 같은 공간에서 나누기 좋은 온도와 리듬을 담았어요.', en: 'Not too far forward, not too far away. Warmth and rhythm to share in the same room.' }, tracks: HOME_SHOWCASE.match.bridgeTracks })
]);
