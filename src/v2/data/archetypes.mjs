export const ARCHETYPES = Object.freeze([
  Object.freeze({
    id: 'midnight-dreamer',
    name: Object.freeze({ kr: '밤의 잔향', en: 'Midnight Dreamer' }),
    tagline: Object.freeze({
      kr: '느린 감정과 넓은 공간감이 오래 남는 취향',
      en: 'A taste drawn to slow emotion and spacious afterglow'
    }),
    description: Object.freeze({
      kr: '강한 자극보다 여백, 잔향, 천천히 커지는 감정에 오래 머뭅니다. 몽환적인 보컬과 넓은 사운드가 혼자 있는 밤을 채울 때 가장 편안해요.',
      en: 'You stay with space, reverb, and feelings that unfold slowly rather than immediate impact. Dreamy vocals and wide soundscapes feel most at home in solitary nights.'
    }),
    keywords: Object.freeze({ kr: ['잔향', '몽환적', '밤'], en: ['afterglow', 'dreamy', 'night'] }),
    centroid: Object.freeze({ energy: 28, warmth: 70, novelty: 68, organic: 48, complexity: 64, sociality: 24 }),
    gradient: Object.freeze(['#22134a', '#6d3dd1', '#f1a8ff']),
    symbol: '☾'
  }),
  Object.freeze({
    id: 'neon-runner',
    name: Object.freeze({ kr: '네온 주행', en: 'Neon Runner' }),
    tagline: Object.freeze({
      kr: '단단한 비트가 몸의 속도를 먼저 깨우는 취향',
      en: 'A taste powered by crisp beats and forward motion'
    }),
    description: Object.freeze({
      kr: '음악이 에너지 스위치처럼 켜지는 순간을 좋아합니다. 선명한 킥과 빠른 전개가 이동, 운동, 몰입의 페이스를 앞으로 끌어줄 때 반응이 가장 빨라요.',
      en: 'Music works like an energy switch. Firm kicks and fast progression pull movement, training, and concentration into a stronger pace.'
    }),
    keywords: Object.freeze({ kr: ['속도', '타격감', '도시'], en: ['speed', 'impact', 'urban'] }),
    centroid: Object.freeze({ energy: 88, warmth: 44, novelty: 66, organic: 18, complexity: 48, sociality: 68 }),
    gradient: Object.freeze(['#071b2f', '#006bff', '#50f4ff']),
    symbol: '↗'
  }),
  Object.freeze({
    id: 'warm-vinyl',
    name: Object.freeze({ kr: '따뜻한 레코드', en: 'Warm Vinyl' }),
    tagline: Object.freeze({
      kr: '목소리와 실제 악기의 온기를 가까이 듣는 취향',
      en: 'A taste that keeps voices and organic instruments close'
    }),
    description: Object.freeze({
      kr: '익숙한 멜로디, 손으로 연주한 악기의 결, 진솔한 목소리에서 안정감을 느낍니다. 음악이 사람과 기억을 조용히 이어줄 때 가장 깊게 머물러요.',
      en: 'Familiar melodies, tactile instruments, and sincere voices feel grounding. Music matters most when it quietly connects people with memory.'
    }),
    keywords: Object.freeze({ kr: ['온기', '실제 악기', '기억'], en: ['warmth', 'organic', 'memory'] }),
    centroid: Object.freeze({ energy: 40, warmth: 90, novelty: 34, organic: 90, complexity: 42, sociality: 46 }),
    gradient: Object.freeze(['#3a160d', '#a04a25', '#f5bd73']),
    symbol: '◉'
  }),
  Object.freeze({
    id: 'cosmic-architect',
    name: Object.freeze({ kr: '소리 설계자', en: 'Cosmic Architect' }),
    tagline: Object.freeze({
      kr: '반복 속 변화와 긴 구조를 따라가는 취향',
      en: 'A taste that follows subtle change and long-form structure'
    }),
    description: Object.freeze({
      kr: '낯선 음색, 반복 속의 미세한 변화, 긴 호흡의 전개를 퍼즐처럼 따라갑니다. 한 번에 이해되는 곡보다 들을수록 구조가 드러나는 음악에서 발견의 즐거움이 커져요.',
      en: 'You follow unfamiliar timbres, small changes inside repetition, and long-form progression like a puzzle. Discovery grows when a track reveals its structure over time.'
    }),
    keywords: Object.freeze({ kr: ['구조', '실험', '몰입'], en: ['structure', 'experimental', 'immersive'] }),
    centroid: Object.freeze({ energy: 58, warmth: 34, novelty: 92, organic: 18, complexity: 94, sociality: 30 }),
    gradient: Object.freeze(['#07182f', '#2932a7', '#9d6bff']),
    symbol: '✦'
  }),
  Object.freeze({
    id: 'quiet-cinematic',
    name: Object.freeze({ kr: '조용한 장면', en: 'Quiet Cinematic' }),
    tagline: Object.freeze({
      kr: '작은 변화가 긴 장면으로 이어지는 취향',
      en: 'A taste that turns subtle movement into a long scene'
    }),
    description: Object.freeze({
      kr: '크게 드러나지 않는 감정의 움직임과 섬세한 서사에 집중합니다. 피아노, 스트링, 앰비언트가 생각을 방해하지 않으면서 장면을 만들 때 오래 듣게 돼요.',
      en: 'You notice understated emotional movement and delicate narrative. Piano, strings, and ambient textures hold attention when they create a scene without interrupting thought.'
    }),
    keywords: Object.freeze({ kr: ['고요', '장면', '집중'], en: ['quiet', 'cinematic', 'focused'] }),
    centroid: Object.freeze({ energy: 24, warmth: 58, novelty: 44, organic: 74, complexity: 78, sociality: 16 }),
    gradient: Object.freeze(['#111827', '#334155', '#cbd5e1']),
    symbol: '▱'
  }),
  Object.freeze({
    id: 'rhythm-connector',
    name: Object.freeze({ kr: '함께 타는 리듬', en: 'Rhythm Connector' }),
    tagline: Object.freeze({
      kr: '사람과 공간을 같은 박자로 묶는 취향',
      en: 'A taste that brings people and rooms into one pulse'
    }),
    description: Object.freeze({
      kr: '좋은 음악은 함께 반응할 때 더 커진다고 느낍니다. 춤추기 쉬운 그루브와 바로 따라 부를 수 있는 후렴이 사람들을 같은 박자로 묶을 때 가장 즐거워요.',
      en: 'Music feels larger when people react together. Danceable grooves and immediate hooks are most rewarding when they bring a room into the same pulse.'
    }),
    keywords: Object.freeze({ kr: ['그루브', '함께', '밝은 에너지'], en: ['groove', 'shared', 'uplifting'] }),
    centroid: Object.freeze({ energy: 78, warmth: 74, novelty: 42, organic: 54, complexity: 34, sociality: 94 }),
    gradient: Object.freeze(['#3d102d', '#d12f83', '#ffca68']),
    symbol: '∞'
  }),
  Object.freeze({
    id: 'electric-explorer',
    name: Object.freeze({ kr: '전류를 따라', en: 'Electric Explorer' }),
    tagline: Object.freeze({
      kr: '낯선 전자 질감과 장르의 경계를 즐기는 취향',
      en: 'A taste drawn to electric texture and blurred genre borders'
    }),
    description: Object.freeze({
      kr: '장르가 충돌하고 익숙한 공식을 비트는 순간에 호기심이 살아납니다. 강한 전자 질감과 예상 밖의 전환을 통해 새로운 아티스트를 발견하는 과정 자체를 즐겨요.',
      en: 'Curiosity comes alive when genres collide and familiar formulas bend. Electronic texture, sharp turns, and unfamiliar artists make discovery part of the pleasure.'
    }),
    keywords: Object.freeze({ kr: ['전자 질감', '새로움', '전환'], en: ['electronic', 'novel', 'dynamic'] }),
    centroid: Object.freeze({ energy: 72, warmth: 42, novelty: 96, organic: 14, complexity: 70, sociality: 62 }),
    gradient: Object.freeze(['#142008', '#56a309', '#e2ff68']),
    symbol: '⚡'
  }),
  Object.freeze({
    id: 'golden-chorus',
    name: Object.freeze({ kr: '함께 부르는 후렴', en: 'Golden Chorus' }),
    tagline: Object.freeze({
      kr: '따뜻한 멜로디가 사람 사이로 번지는 취향',
      en: 'A taste where warm melody spreads between people'
    }),
    description: Object.freeze({
      kr: '감정이 선명한 목소리와 함께 부를 수 있는 멜로디에 오래 머뭅니다. 한 사람을 위로하거나 방의 분위기를 환하게 바꾸는 후렴에서 음악의 힘을 가장 크게 느껴요.',
      en: 'You stay with clear voices and melodies people can share. Music feels most powerful when a chorus comforts one person or brightens an entire room.'
    }),
    keywords: Object.freeze({ kr: ['멜로디', '공감', '후렴'], en: ['melodic', 'empathetic', 'chorus'] }),
    centroid: Object.freeze({ energy: 64, warmth: 94, novelty: 30, organic: 70, complexity: 38, sociality: 86 }),
    gradient: Object.freeze(['#3a2406', '#d08a0a', '#ffe39b']),
    symbol: '☀'
  })
]);

export const ARCHETYPE_BY_ID = Object.freeze(
  Object.fromEntries(ARCHETYPES.map((archetype) => [archetype.id, archetype]))
);

export const LEGACY_TYPE_TO_ARCHETYPE = Object.freeze({
  ISTJ: 'quiet-cinematic',
  ISFJ: 'warm-vinyl',
  INFJ: 'midnight-dreamer',
  INTJ: 'cosmic-architect',
  ISTP: 'neon-runner',
  ISFP: 'warm-vinyl',
  INFP: 'midnight-dreamer',
  INTP: 'cosmic-architect',
  ESTP: 'neon-runner',
  ESFP: 'rhythm-connector',
  ENFP: 'electric-explorer',
  ENTP: 'electric-explorer',
  ESTJ: 'neon-runner',
  ESFJ: 'golden-chorus',
  ENFJ: 'rhythm-connector',
  ENTJ: 'cosmic-architect'
});
