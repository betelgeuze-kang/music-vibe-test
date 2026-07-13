export const ARCHETYPES = Object.freeze([
  Object.freeze({
    id: 'midnight-dreamer',
    name: Object.freeze({ kr: '밤의 잔향', en: 'Night Afterglow' }),
    tagline: Object.freeze({
      kr: '소리가 사라진 뒤의 여백까지 듣는 사람',
      en: 'A listener who hears the room after the sound is gone'
    }),
    description: Object.freeze({
      kr: '당신의 귀는 큰 장면보다 오래 남는 작은 흔적을 따라갑니다. 낮은 목소리, 멀리 번지는 신스, 마지막 음 뒤에 남은 공기. 혼자 있는 밤이 조용해질수록 이런 소리는 더 또렷해집니다.',
      en: 'Your ear follows the smaller trace rather than the grand gesture: a low voice, a synth receding into the distance, the air left after the last note. These sounds grow clearer as a solitary night grows quiet.'
    }),
    keywords: Object.freeze({ kr: ['잔향', '밤공기', '느린 마음'], en: ['afterglow', 'night air', 'slow feeling'] }),
    centroid: Object.freeze({ energy: 28, warmth: 70, novelty: 68, organic: 48, complexity: 64, sociality: 24 }),
    gradient: Object.freeze(['#22134a', '#6d3dd1', '#f1a8ff']),
    symbol: '☾'
  }),
  Object.freeze({
    id: 'neon-runner',
    name: Object.freeze({ kr: '네온 주행', en: 'Neon Drive' }),
    tagline: Object.freeze({
      kr: '박자가 먼저 몸을 일으키는 사람',
      en: 'A listener whose body rises before the thought arrives'
    }),
    description: Object.freeze({
      kr: '선명한 킥이 들어오면 망설이던 몸이 먼저 움직입니다. 밤거리의 불빛, 달리는 차창, 운동화 밑창의 일정한 충격. 음악은 이 취향에게 배경이 아니라 속도를 정하는 손입니다.',
      en: 'A clean kick arrives and the body moves before hesitation can catch up. Streetlights at night, a window in motion, the steady strike beneath a shoe: music is not background here, but the hand that sets the pace.'
    }),
    keywords: Object.freeze({ kr: ['속도', '타격감', '도시의 밤'], en: ['speed', 'impact', 'city night'] }),
    centroid: Object.freeze({ energy: 88, warmth: 44, novelty: 66, organic: 18, complexity: 48, sociality: 68 }),
    gradient: Object.freeze(['#071b2f', '#006bff', '#50f4ff']),
    symbol: '↗'
  }),
  Object.freeze({
    id: 'warm-vinyl',
    name: Object.freeze({ kr: '따뜻한 레코드', en: 'Warm Record' }),
    tagline: Object.freeze({
      kr: '손끝과 숨결이 들리는 음악 곁에 머무는 사람',
      en: 'A listener who stays where fingers and breath remain audible'
    }),
    description: Object.freeze({
      kr: '줄을 누르는 손, 마이크 가까이에서 새는 숨, 오래된 건반의 둥근 소리. 완벽하게 닦인 표면보다 사람이 지나간 흔적을 믿습니다. 좋은 노래는 기억을 크게 흔들지 않고도 오래된 방의 문을 엽니다.',
      en: 'A hand pressing strings, breath escaping close to the microphone, the rounded note of an old keyboard. You trust the trace of a person more than a perfectly polished surface. A good song can open an old room without shaking the memory too hard.'
    }),
    keywords: Object.freeze({ kr: ['손끝', '목소리', '오래된 방'], en: ['fingertips', 'voice', 'old room'] }),
    centroid: Object.freeze({ energy: 40, warmth: 90, novelty: 34, organic: 90, complexity: 42, sociality: 46 }),
    gradient: Object.freeze(['#3a160d', '#a04a25', '#f5bd73']),
    symbol: '◉'
  }),
  Object.freeze({
    id: 'cosmic-architect',
    name: Object.freeze({ kr: '소리 설계자', en: 'Sound Architect' }),
    tagline: Object.freeze({
      kr: '반복 속에서 조금씩 달라지는 길을 끝까지 따라가는 사람',
      en: 'A listener who follows the small changes inside repetition'
    }),
    description: Object.freeze({
      kr: '처음에는 같은 듯 보이던 패턴이 몇 분 뒤 전혀 다른 건물이 되어 있는 음악을 좋아합니다. 낯선 음색과 긴 전개를 서두르지 않고 살피며, 한 번에 이해되지 않는 곡 앞에서 오히려 더 오래 앉아 있습니다.',
      en: 'You like music in which a pattern that seemed unchanged has become another building a few minutes later. Unfamiliar timbres and long forms are examined without haste; a track that does not yield at once is often the one you sit with longest.'
    }),
    keywords: Object.freeze({ kr: ['구조', '미세한 변화', '긴 호흡'], en: ['structure', 'subtle change', 'long form'] }),
    centroid: Object.freeze({ energy: 58, warmth: 34, novelty: 92, organic: 18, complexity: 94, sociality: 30 }),
    gradient: Object.freeze(['#07182f', '#2932a7', '#9d6bff']),
    symbol: '✦'
  }),
  Object.freeze({
    id: 'quiet-cinematic',
    name: Object.freeze({ kr: '조용한 장면', en: 'Quiet Scene' }),
    tagline: Object.freeze({
      kr: '작은 움직임으로 긴 장면을 보는 사람',
      en: 'A listener who sees a long scene in a small movement'
    }),
    description: Object.freeze({
      kr: '크게 울지 않는 피아노 한 음, 멀리서 늦게 들어오는 현, 거의 움직이지 않는 듯한 앰비언트. 당신은 음악이 말을 줄일수록 그 안의 장면을 더 오래 봅니다. 생각을 몰아내지 않고 옆자리를 내어주는 곡이 잘 맞습니다.',
      en: 'A piano note that does not cry out, strings entering late from a distance, ambient sound that barely seems to move. The fewer words the music uses, the longer you see the scene inside it. You prefer tracks that make room beside your thoughts instead of driving them away.'
    }),
    keywords: Object.freeze({ kr: ['고요', '긴 장면', '생각의 자리'], en: ['quiet', 'long scene', 'room for thought'] }),
    centroid: Object.freeze({ energy: 24, warmth: 58, novelty: 44, organic: 74, complexity: 78, sociality: 16 }),
    gradient: Object.freeze(['#111827', '#334155', '#cbd5e1']),
    symbol: '▱'
  }),
  Object.freeze({
    id: 'rhythm-connector',
    name: Object.freeze({ kr: '함께 타는 리듬', en: 'Shared Pulse' }),
    tagline: Object.freeze({
      kr: '한 방의 사람들을 같은 박자로 묶는 사람',
      en: 'A listener who brings a room into one pulse'
    }),
    description: Object.freeze({
      kr: '혼자 들을 때보다 누군가의 어깨가 함께 움직일 때 노래가 완성된다고 느낍니다. 바로 알아들을 수 있는 후렴과 몸이 먼저 기억하는 그루브. 낯선 사람들이 잠깐 같은 편이 되는 순간을 좋아합니다.',
      en: 'A song feels complete when another shoulder begins to move beside yours. A chorus understood at once, a groove the body remembers before the mind: you like the brief moment when strangers become part of the same side.'
    }),
    keywords: Object.freeze({ kr: ['한 박자', '후렴', '사람들'], en: ['one pulse', 'chorus', 'people'] }),
    centroid: Object.freeze({ energy: 78, warmth: 74, novelty: 42, organic: 54, complexity: 34, sociality: 94 }),
    gradient: Object.freeze(['#3d102d', '#d12f83', '#ffca68']),
    symbol: '∞'
  }),
  Object.freeze({
    id: 'electric-explorer',
    name: Object.freeze({ kr: '전류를 따라', en: 'Following the Current' }),
    tagline: Object.freeze({
      kr: '익숙한 규칙이 비틀리는 순간 눈을 뜨는 사람',
      en: 'A listener who wakes when the familiar rule begins to bend'
    }),
    description: Object.freeze({
      kr: '장르의 경계가 흐려지고 예상한 마디가 다른 문으로 열릴 때 호기심이 살아납니다. 매끈한 정답보다 조금 거친 전자 질감, 뜻밖의 전환, 처음 보는 이름을 기꺼이 택합니다.',
      en: 'Curiosity sharpens when genre borders blur and an expected bar opens into another door. You will take a rough electronic texture, an unforeseen turn, or an unfamiliar name over a polished answer.'
    }),
    keywords: Object.freeze({ kr: ['전류', '낯선 문', '장르의 틈'], en: ['current', 'unexpected door', 'genre gap'] }),
    centroid: Object.freeze({ energy: 72, warmth: 42, novelty: 96, organic: 14, complexity: 70, sociality: 62 }),
    gradient: Object.freeze(['#142008', '#56a309', '#e2ff68']),
    symbol: '⚡'
  }),
  Object.freeze({
    id: 'golden-chorus',
    name: Object.freeze({ kr: '함께 부르는 후렴', en: 'The Chorus We Share' }),
    tagline: Object.freeze({
      kr: '좋은 멜로디가 사람 사이를 밝힌다고 믿는 사람',
      en: 'A listener who believes a good melody can light the space between people'
    }),
    description: Object.freeze({
      kr: '한 사람의 목소리가 방 전체의 표정을 바꾸는 순간을 좋아합니다. 너무 어렵지 않은 멜로디, 뒤늦게 따라 부르게 되는 후렴, 말보다 먼저 건너가는 위로. 이 취향에게 음악은 사람 사이에 놓는 따뜻한 의자입니다.',
      en: 'You like the moment when one voice changes the expression of an entire room. A melody that asks little, a chorus joined a little late, comfort crossing before words: music is a warm chair placed between people.'
    }),
    keywords: Object.freeze({ kr: ['멜로디', '위로', '따뜻한 의자'], en: ['melody', 'comfort', 'warm chair'] }),
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
