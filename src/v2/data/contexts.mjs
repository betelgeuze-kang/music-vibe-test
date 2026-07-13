export const VIBE_CONTEXTS = Object.freeze([
  Object.freeze({
    id: 'focus',
    icon: '◎',
    label: Object.freeze({ kr: '생각을 한곳에 모으고 싶어요', en: 'I need my thoughts in one place' }),
    shortLabel: Object.freeze({ kr: '집중하는 시간', en: 'A focused hour' }),
    description: Object.freeze({
      kr: '말을 많이 걸지 않으면서도 생각이 흩어지지 않게 곁을 지키는 음악',
      en: 'Music that keeps watch without talking over your thoughts'
    }),
    target: Object.freeze({ energy: 42, warmth: 44, novelty: 54, organic: 44, complexity: 76, sociality: 16 }),
    keywords: Object.freeze(['focus', 'work', 'instrumental'])
  }),
  Object.freeze({
    id: 'lift',
    icon: '↗',
    label: Object.freeze({ kr: '몸과 마음의 속도를 조금 올리고 싶어요', en: 'I need the day to move again' }),
    shortLabel: Object.freeze({ kr: '가벼워지는 순간', en: 'A lighter step' }),
    description: Object.freeze({
      kr: '굳어 있던 어깨와 표정을 한 박자 먼저 풀어주는 음악',
      en: 'Music that loosens the shoulders and the face one beat at a time'
    }),
    target: Object.freeze({ energy: 84, warmth: 76, novelty: 48, organic: 46, complexity: 34, sociality: 78 }),
    keywords: Object.freeze(['lift', 'energy', 'dance'])
  }),
  Object.freeze({
    id: 'night',
    icon: '☾',
    label: Object.freeze({ kr: '혼자 밤길을 오래 걷고 싶어요', en: 'I want a long walk after dark' }),
    shortLabel: Object.freeze({ kr: '밤길', en: 'Night walk' }),
    description: Object.freeze({
      kr: '가로등 사이의 어둠과 말이 줄어든 마음을 함께 데려가는 음악',
      en: 'Music that walks beside streetlight, darkness, and a mind with fewer words'
    }),
    target: Object.freeze({ energy: 34, warmth: 58, novelty: 66, organic: 42, complexity: 62, sociality: 18 }),
    keywords: Object.freeze(['night', 'dreamy', 'walk'])
  }),
  Object.freeze({
    id: 'reset',
    icon: '◌',
    label: Object.freeze({ kr: '오늘의 소음을 조금 내려놓고 싶어요', en: 'I need the noise of the day to settle' }),
    shortLabel: Object.freeze({ kr: '숨을 고르는 시간', en: 'A slower breath' }),
    description: Object.freeze({
      kr: '방 안의 소리를 낮추고 내 호흡이 돌아올 자리를 내어주는 음악',
      en: 'Music that lowers the room and leaves space for your breath to return'
    }),
    target: Object.freeze({ energy: 22, warmth: 76, novelty: 36, organic: 78, complexity: 38, sociality: 12 }),
    keywords: Object.freeze(['reset', 'calm', 'acoustic'])
  }),
  Object.freeze({
    id: 'explore',
    icon: '✦',
    label: Object.freeze({ kr: '내가 모르던 소리 쪽으로 조금 가보고 싶어요', en: 'I want to walk toward a sound I do not know yet' }),
    shortLabel: Object.freeze({ kr: '낯선 문', en: 'An unfamiliar door' }),
    description: Object.freeze({
      kr: '익숙한 방을 완전히 떠나지 않은 채 옆문 하나를 열어보는 음악',
      en: 'Music that opens one side door without asking you to abandon the familiar room'
    }),
    target: Object.freeze({ energy: 60, warmth: 42, novelty: 94, organic: 28, complexity: 80, sociality: 34 }),
    keywords: Object.freeze(['explore', 'experimental', 'discovery'])
  }),
  Object.freeze({
    id: 'together',
    icon: '∞',
    label: Object.freeze({ kr: '누군가와 같은 방에서 듣고 싶어요', en: 'I want to listen in the same room as someone else' }),
    shortLabel: Object.freeze({ kr: '같은 방', en: 'The same room' }),
    description: Object.freeze({
      kr: '말이 끊긴 뒤에도 둘 사이의 공기를 어색하지 않게 채우는 음악',
      en: 'Music that keeps the air between two people easy after the conversation pauses'
    }),
    target: Object.freeze({ energy: 72, warmth: 78, novelty: 44, organic: 56, complexity: 36, sociality: 96 }),
    keywords: Object.freeze(['together', 'social', 'chorus'])
  })
]);

export const CONTEXT_BY_ID = Object.freeze(
  Object.fromEntries(VIBE_CONTEXTS.map((context) => [context.id, context]))
);
