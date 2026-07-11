export const AXES = Object.freeze([
  Object.freeze({
    id: 'energy',
    label: Object.freeze({ kr: '에너지', en: 'Energy' }),
    low: Object.freeze({ kr: '차분함', en: 'Calm' }),
    high: Object.freeze({ kr: '강렬함', en: 'Charged' }),
    description: Object.freeze({
      kr: '잔잔한 흐름과 강한 추진력 사이에서 어느 쪽에 더 반응하는지 보여줘요.',
      en: 'Shows whether you respond more to calm flow or high-intensity drive.'
    })
  }),
  Object.freeze({
    id: 'warmth',
    label: Object.freeze({ kr: '온도', en: 'Warmth' }),
    low: Object.freeze({ kr: '서늘함', en: 'Cool' }),
    high: Object.freeze({ kr: '따뜻함', en: 'Warm' }),
    description: Object.freeze({
      kr: '차갑고 선명한 질감과 포근하고 감정적인 질감의 균형이에요.',
      en: 'Balances crisp, cool textures with warm, emotionally inviting sound.'
    })
  }),
  Object.freeze({
    id: 'novelty',
    label: Object.freeze({ kr: '새로움', en: 'Novelty' }),
    low: Object.freeze({ kr: '익숙함', en: 'Familiar' }),
    high: Object.freeze({ kr: '탐험적', en: 'Exploratory' }),
    description: Object.freeze({
      kr: '익숙한 공식을 편안하게 느끼는지, 낯선 소리를 찾는지 나타내요.',
      en: 'Shows whether familiar formulas or unfamiliar discoveries feel more rewarding.'
    })
  }),
  Object.freeze({
    id: 'organic',
    label: Object.freeze({ kr: '질감', en: 'Texture' }),
    low: Object.freeze({ kr: '전자적', en: 'Electronic' }),
    high: Object.freeze({ kr: '유기적', en: 'Organic' }),
    description: Object.freeze({
      kr: '신스와 가공된 소리, 실제 악기와 자연스러운 울림 사이의 취향이에요.',
      en: 'Maps your preference between processed electronic sound and organic instrumentation.'
    })
  }),
  Object.freeze({
    id: 'complexity',
    label: Object.freeze({ kr: '구조', en: 'Complexity' }),
    low: Object.freeze({ kr: '직관적', en: 'Direct' }),
    high: Object.freeze({ kr: '다층적', en: 'Layered' }),
    description: Object.freeze({
      kr: '바로 꽂히는 단순한 전개와 오래 탐색할 수 있는 복합적인 전개의 차이에요.',
      en: 'Balances immediate, direct structure with layered arrangements that reward exploration.'
    })
  }),
  Object.freeze({
    id: 'sociality',
    label: Object.freeze({ kr: '감상 방식', en: 'Sociality' }),
    low: Object.freeze({ kr: '개인적', en: 'Private' }),
    high: Object.freeze({ kr: '함께', en: 'Collective' }),
    description: Object.freeze({
      kr: '혼자 깊이 듣는 음악과 사람들과 에너지를 나누는 음악의 균형이에요.',
      en: 'Shows whether music works best as a private world or shared social energy.'
    })
  })
]);

export const AXIS_IDS = Object.freeze(AXES.map((axis) => axis.id));

export function getAxis(axisId) {
  return AXES.find((axis) => axis.id === axisId) || null;
}
