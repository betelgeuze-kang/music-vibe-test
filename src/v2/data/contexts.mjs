export const VIBE_CONTEXTS = Object.freeze([
  Object.freeze({
    id: 'focus',
    icon: '◎',
    label: Object.freeze({ kr: '집중하고 싶어요', en: 'I need to focus' }),
    shortLabel: Object.freeze({ kr: '집중', en: 'Focus' }),
    description: Object.freeze({ kr: '생각을 흐리지 않으면서 몰입을 유지하는 음악', en: 'Music that supports flow without crowding your thoughts' }),
    target: Object.freeze({ energy: 42, warmth: 44, novelty: 54, organic: 44, complexity: 76, sociality: 16 }),
    keywords: Object.freeze(['focus', 'work', 'instrumental'])
  }),
  Object.freeze({
    id: 'lift',
    icon: '↗',
    label: Object.freeze({ kr: '기분을 끌어올리고 싶어요', en: 'Lift my mood' }),
    shortLabel: Object.freeze({ kr: '기분 전환', en: 'Lift' }),
    description: Object.freeze({ kr: '몸과 마음의 속도를 가볍게 올리는 음악', en: 'Music that raises the pace of your body and mood' }),
    target: Object.freeze({ energy: 84, warmth: 76, novelty: 48, organic: 46, complexity: 34, sociality: 78 }),
    keywords: Object.freeze(['lift', 'energy', 'dance'])
  }),
  Object.freeze({
    id: 'night',
    icon: '☾',
    label: Object.freeze({ kr: '혼자 밤을 걷고 싶어요', en: 'I want a night walk' }),
    shortLabel: Object.freeze({ kr: '밤 산책', en: 'Night walk' }),
    description: Object.freeze({ kr: '도시의 불빛과 생각의 여백을 함께 만드는 음악', en: 'Music that leaves room for city lights and wandering thoughts' }),
    target: Object.freeze({ energy: 34, warmth: 58, novelty: 66, organic: 42, complexity: 62, sociality: 18 }),
    keywords: Object.freeze(['night', 'dreamy', 'walk'])
  }),
  Object.freeze({
    id: 'reset',
    icon: '◌',
    label: Object.freeze({ kr: '조용히 회복하고 싶어요', en: 'Help me reset' }),
    shortLabel: Object.freeze({ kr: '회복', en: 'Reset' }),
    description: Object.freeze({ kr: '자극을 낮추고 호흡을 천천히 되찾는 음악', en: 'Music that lowers stimulation and restores a slower breath' }),
    target: Object.freeze({ energy: 22, warmth: 76, novelty: 36, organic: 78, complexity: 38, sociality: 12 }),
    keywords: Object.freeze(['reset', 'calm', 'acoustic'])
  }),
  Object.freeze({
    id: 'explore',
    icon: '✦',
    label: Object.freeze({ kr: '새로운 음악을 발견하고 싶어요', en: 'Show me something new' }),
    shortLabel: Object.freeze({ kr: '발견', en: 'Explore' }),
    description: Object.freeze({ kr: '익숙한 취향의 바깥을 안전하게 탐험하는 음악', en: 'Music that moves beyond your comfort zone without losing you' }),
    target: Object.freeze({ energy: 60, warmth: 42, novelty: 94, organic: 28, complexity: 80, sociality: 34 }),
    keywords: Object.freeze(['explore', 'experimental', 'discovery'])
  }),
  Object.freeze({
    id: 'together',
    icon: '∞',
    label: Object.freeze({ kr: '누군가와 함께 듣고 싶어요', en: 'I want to listen together' }),
    shortLabel: Object.freeze({ kr: '함께', en: 'Together' }),
    description: Object.freeze({ kr: '서로 다른 취향 사이에 공통 리듬을 만드는 음악', en: 'Music that creates a shared rhythm between different tastes' }),
    target: Object.freeze({ energy: 72, warmth: 78, novelty: 44, organic: 56, complexity: 36, sociality: 96 }),
    keywords: Object.freeze(['together', 'social', 'chorus'])
  })
]);

export const CONTEXT_BY_ID = Object.freeze(
  Object.fromEntries(VIBE_CONTEXTS.map((context) => [context.id, context]))
);
