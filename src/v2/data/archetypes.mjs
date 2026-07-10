export const ARCHETYPES = Object.freeze([
  Object.freeze({
    id: 'midnight-dreamer',
    name: Object.freeze({ kr: '미드나잇 드리머', en: 'Midnight Dreamer' }),
    tagline: Object.freeze({
      kr: '감정과 공간이 천천히 번지는 밤의 청취자',
      en: 'A night listener drawn to slow emotion and spacious sound'
    }),
    description: Object.freeze({
      kr: '강한 자극보다 여백과 잔향을 따라가며, 음악 안에서 자신의 감정을 오래 관찰하는 타입이에요. 몽환적인 보컬, 느린 고조, 넓은 공간감에 깊이 반응합니다.',
      en: 'You follow space and resonance more than immediate impact. Dreamy vocals, gradual builds, and wide soundscapes give your emotions room to unfold.'
    }),
    keywords: Object.freeze({ kr: ['몽환적', '감정적', '야간 감상'], en: ['dreamy', 'emotional', 'night listening'] }),
    centroid: Object.freeze({ energy: 28, warmth: 70, novelty: 68, organic: 48, complexity: 64, sociality: 24 }),
    gradient: Object.freeze(['#22134a', '#6d3dd1', '#f1a8ff']),
    symbol: '☾'
  }),
  Object.freeze({
    id: 'neon-runner',
    name: Object.freeze({ kr: '네온 러너', en: 'Neon Runner' }),
    tagline: Object.freeze({
      kr: '속도와 타격감으로 앞으로 나아가는 도시형 리스너',
      en: 'An urban listener powered by speed, impact, and forward motion'
    }),
    description: Object.freeze({
      kr: '음악을 에너지 스위치처럼 사용하며, 단단한 비트와 선명한 전개에 즉각 반응합니다. 운동, 이동, 몰입이 필요한 순간에 리듬으로 페이스를 끌어올려요.',
      en: 'Music works like an energy switch for you. Strong beats and crisp progression help you move, train, and lock into momentum.'
    }),
    keywords: Object.freeze({ kr: ['고에너지', '도시적', '추진력'], en: ['high energy', 'urban', 'driven'] }),
    centroid: Object.freeze({ energy: 88, warmth: 44, novelty: 66, organic: 18, complexity: 48, sociality: 68 }),
    gradient: Object.freeze(['#071b2f', '#006bff', '#50f4ff']),
    symbol: '↗'
  }),
  Object.freeze({
    id: 'warm-vinyl',
    name: Object.freeze({ kr: '웜 바이닐', en: 'Warm Vinyl' }),
    tagline: Object.freeze({
      kr: '목소리와 악기의 온기를 오래 간직하는 아날로그 감성',
      en: 'An analog soul that holds onto the warmth of voices and instruments'
    }),
    description: Object.freeze({
      kr: '익숙한 멜로디, 실제 악기의 결, 진솔한 목소리에 안정감을 느껴요. 음악을 기억과 사람을 이어 주는 따뜻한 매개로 받아들이는 타입입니다.',
      en: 'Familiar melodies, tactile instruments, and sincere voices feel grounding. Music is a warm bridge between memory, people, and everyday life.'
    }),
    keywords: Object.freeze({ kr: ['따뜻함', '유기적', '추억'], en: ['warm', 'organic', 'nostalgic'] }),
    centroid: Object.freeze({ energy: 40, warmth: 90, novelty: 34, organic: 90, complexity: 42, sociality: 46 }),
    gradient: Object.freeze(['#3a160d', '#a04a25', '#f5bd73']),
    symbol: '◉'
  }),
  Object.freeze({
    id: 'cosmic-architect',
    name: Object.freeze({ kr: '코스믹 아키텍트', en: 'Cosmic Architect' }),
    tagline: Object.freeze({
      kr: '복잡한 구조와 새로운 소리를 설계하듯 듣는 탐구자',
      en: 'A sonic explorer who listens to structure like a designed universe'
    }),
    description: Object.freeze({
      kr: '반복 속의 미세한 변화, 낯선 음색, 긴 호흡의 구조를 퍼즐처럼 탐색합니다. 단순한 분위기보다 설계와 발견의 즐거움이 중요한 타입이에요.',
      en: 'You explore subtle changes, unfamiliar timbres, and long-form structure like a puzzle. Discovery and design matter more than easy familiarity.'
    }),
    keywords: Object.freeze({ kr: ['실험적', '복합적', '몰입'], en: ['experimental', 'layered', 'immersive'] }),
    centroid: Object.freeze({ energy: 58, warmth: 34, novelty: 92, organic: 18, complexity: 94, sociality: 30 }),
    gradient: Object.freeze(['#07182f', '#2932a7', '#9d6bff']),
    symbol: '✦'
  }),
  Object.freeze({
    id: 'quiet-cinematic',
    name: Object.freeze({ kr: '콰이어트 시네마틱', en: 'Quiet Cinematic' }),
    tagline: Object.freeze({
      kr: '작은 장면을 긴 서사로 바꾸는 고요한 관찰자',
      en: 'A quiet observer who turns small moments into long stories'
    }),
    description: Object.freeze({
      kr: '크게 드러나지 않는 감정의 변화와 섬세한 서사에 집중해요. 피아노, 스트링, 앰비언트처럼 생각을 방해하지 않으면서 장면을 만드는 음악과 잘 맞습니다.',
      en: 'You notice subtle emotional movement and understated narrative. Piano, strings, and ambient textures create scenes without interrupting your thoughts.'
    }),
    keywords: Object.freeze({ kr: ['고요함', '서사적', '집중'], en: ['quiet', 'cinematic', 'focused'] }),
    centroid: Object.freeze({ energy: 24, warmth: 58, novelty: 44, organic: 74, complexity: 78, sociality: 16 }),
    gradient: Object.freeze(['#111827', '#334155', '#cbd5e1']),
    symbol: '▱'
  }),
  Object.freeze({
    id: 'rhythm-connector',
    name: Object.freeze({ kr: '리듬 커넥터', en: 'Rhythm Connector' }),
    tagline: Object.freeze({
      kr: '사람과 공간을 하나의 박자로 묶는 에너지 메이커',
      en: 'An energy maker who connects people and rooms through rhythm'
    }),
    description: Object.freeze({
      kr: '좋은 음악은 함께 반응할 때 더 커진다고 느껴요. 춤추기 쉬운 그루브, 바로 따라 부를 수 있는 후렴, 사람을 모으는 리듬에 자연스럽게 끌립니다.',
      en: 'Music grows when people react together. You gravitate toward danceable groove, singable hooks, and rhythms that bring a room into sync.'
    }),
    keywords: Object.freeze({ kr: ['그루브', '사회적', '밝음'], en: ['groovy', 'social', 'uplifting'] }),
    centroid: Object.freeze({ energy: 78, warmth: 74, novelty: 42, organic: 54, complexity: 34, sociality: 94 }),
    gradient: Object.freeze(['#3d102d', '#d12f83', '#ffca68']),
    symbol: '∞'
  }),
  Object.freeze({
    id: 'electric-explorer',
    name: Object.freeze({ kr: '일렉트릭 익스플로러', en: 'Electric Explorer' }),
    tagline: Object.freeze({
      kr: '새로운 자극과 장르의 경계를 즐기는 컬러풀한 탐험가',
      en: 'A colorful explorer drawn to new stimuli and blurred genre borders'
    }),
    description: Object.freeze({
      kr: '장르를 섞고 공식을 비트는 음악에서 호기심이 살아나요. 강한 전자 질감과 예상 밖의 전환을 즐기며, 새로운 아티스트를 발견하는 과정 자체를 좋아합니다.',
      en: 'Your curiosity lights up when genres collide and formulas bend. Electronic textures, sharp turns, and unfamiliar artists make discovery part of the fun.'
    }),
    keywords: Object.freeze({ kr: ['새로움', '전자적', '다이내믹'], en: ['novel', 'electronic', 'dynamic'] }),
    centroid: Object.freeze({ energy: 72, warmth: 42, novelty: 96, organic: 14, complexity: 70, sociality: 62 }),
    gradient: Object.freeze(['#142008', '#56a309', '#e2ff68']),
    symbol: '⚡'
  }),
  Object.freeze({
    id: 'golden-chorus',
    name: Object.freeze({ kr: '골든 코러스', en: 'Golden Chorus' }),
    tagline: Object.freeze({
      kr: '따뜻한 멜로디로 분위기와 사람을 밝히는 공감형 리스너',
      en: 'An empathetic listener who brightens people and rooms with warm melody'
    }),
    description: Object.freeze({
      kr: '감정이 명확하게 전달되는 보컬과 함께 부를 수 있는 멜로디를 좋아해요. 음악으로 누군가를 응원하고 좋은 분위기를 만드는 데 강한 타입입니다.',
      en: 'You love voices that communicate clearly and melodies people can share. Music is a way to encourage others and make a room feel brighter.'
    }),
    keywords: Object.freeze({ kr: ['멜로디', '공감', '함께'], en: ['melodic', 'empathetic', 'shared'] }),
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
