export const AXES = Object.freeze([
  Object.freeze({
    id: 'energy',
    label: Object.freeze({ kr: '움직임의 크기', en: 'Motion' }),
    low: Object.freeze({ kr: '잔잔한 쪽', en: 'Still' }),
    high: Object.freeze({ kr: '몰아치는 쪽', en: 'Driving' }),
    description: Object.freeze({
      kr: '고요히 흐르는 소리와 몸을 앞으로 미는 소리 사이에서 귀가 어느 쪽으로 기우는지 봅니다.',
      en: 'Where your ear leans between sound that moves quietly and sound that pushes the body forward.'
    })
  }),
  Object.freeze({
    id: 'warmth',
    label: Object.freeze({ kr: '소리의 온도', en: 'Temperature' }),
    low: Object.freeze({ kr: '서늘한 쪽', en: 'Cool' }),
    high: Object.freeze({ kr: '따뜻한 쪽', en: 'Warm' }),
    description: Object.freeze({
      kr: '유리처럼 맑고 찬 표면과, 목소리와 화음이 가까이 다가오는 온기 사이의 자리입니다.',
      en: 'The place between a cool, glass-clear surface and the warmth of a voice or chord coming close.'
    })
  }),
  Object.freeze({
    id: 'novelty',
    label: Object.freeze({ kr: '낯섦의 거리', en: 'Distance from the familiar' }),
    low: Object.freeze({ kr: '익숙한 쪽', en: 'Familiar' }),
    high: Object.freeze({ kr: '낯선 쪽', en: 'Unfamiliar' }),
    description: Object.freeze({
      kr: '이미 아는 길을 편안히 걷는 음악과, 한 번도 열어보지 않은 문으로 이끄는 음악 사이의 거리입니다.',
      en: 'The distance between a road you already know and a door the music has not opened before.'
    })
  }),
  Object.freeze({
    id: 'organic',
    label: Object.freeze({ kr: '손끝과 회로', en: 'Hand and circuit' }),
    low: Object.freeze({ kr: '전자적인 쪽', en: 'Electronic' }),
    high: Object.freeze({ kr: '손으로 연주한 쪽', en: 'Played by hand' }),
    description: Object.freeze({
      kr: '가공된 신스와 기계의 정밀함, 나무와 줄과 숨결이 남은 악기 사이에서 좋아하는 질감을 찾습니다.',
      en: 'The texture you prefer between processed synth precision and instruments that still carry wood, strings, and breath.'
    })
  }),
  Object.freeze({
    id: 'complexity',
    label: Object.freeze({ kr: '전개의 층', en: 'Layers' }),
    low: Object.freeze({ kr: '곧장 닿는 쪽', en: 'Direct' }),
    high: Object.freeze({ kr: '여러 겹인 쪽', en: 'Layered' }),
    description: Object.freeze({
      kr: '첫 소절에 마음을 여는 곡과, 오래 들을수록 숨은 방이 하나씩 보이는 곡 사이의 차이입니다.',
      en: 'The difference between a song that opens at once and one that reveals another room each time you stay.'
    })
  }),
  Object.freeze({
    id: 'sociality',
    label: Object.freeze({ kr: '누구와 듣는가', en: 'Company' }),
    low: Object.freeze({ kr: '혼자 듣는 쪽', en: 'Private' }),
    high: Object.freeze({ kr: '함께 듣는 쪽', en: 'Shared' }),
    description: Object.freeze({
      kr: '혼자만의 방을 지켜주는 음악과, 사람들의 표정과 박자를 한데 묶는 음악 사이의 자리입니다.',
      en: 'The place between music that protects a private room and music that gathers faces into one pulse.'
    })
  })
]);

export const AXIS_IDS = Object.freeze(AXES.map((axis) => axis.id));

export function getAxis(axisId) {
  return AXES.find((axis) => axis.id === axisId) || null;
}
