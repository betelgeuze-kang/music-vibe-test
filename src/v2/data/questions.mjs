const q = (question) => Object.freeze({
  ...question,
  prompt: Object.freeze(question.prompt),
  helper: Object.freeze(question.helper),
  options: Object.freeze(question.options.map((option) => Object.freeze({
    ...option,
    label: Object.freeze(option.label),
    description: Object.freeze(option.description),
    vector: Object.freeze(option.vector)
  })))
});

export const PROFILE_QUESTIONS = Object.freeze([
  q({
    id: 'pulse-response', kind: 'audio',
    prompt: { kr: '생각보다 먼저 몸이 알아듣는 소리는 어느 쪽인가요?', en: 'Which sound does your body understand before your mind does?' },
    helper: { kr: '두 소리 모두 이 테스트를 위해 직접 만들었습니다. 박자와 여백 중, 끝난 뒤에도 몸 안에 남는 쪽을 골라주세요.', en: 'Both clips were made for this test. Between pulse and space, choose the one that remains in the body after it ends.' },
    options: [
      { id: 'groove', label: { kr: '발끝을 깨우는 박자', en: 'A pulse that wakes the feet' }, description: { kr: '베이스와 타격음이 먼저 앞으로 나가는 소리', en: 'Bass and percussion stepping forward before anything else' }, audioClipId: 'groove-pulse-cr1', vector: { energy: 2, sociality: 1 } },
      { id: 'dream-space', label: { kr: '방을 넓히는 여백', en: 'Space that makes the room wider' }, description: { kr: '느린 화음이 생각 둘 자리를 남기는 소리', en: 'Slow harmony leaving room for thought' }, audioClipId: 'dream-space-cr1', vector: { energy: -2, sociality: -1 } }
    ]
  }),
  q({
    id: 'texture-instinct', kind: 'audio',
    prompt: { kr: '소리의 표면을 손으로 만질 수 있다면, 어느 쪽에 가까울까요?', en: 'If you could touch the surface of the sound, which one would you keep?' },
    helper: { kr: '한쪽에는 줄과 나무의 흔적을, 다른 쪽에는 회로가 바꾸는 표면을 담았습니다. 더 오래 만져보고 싶은 쪽을 고르세요.', en: 'One carries a trace of strings and wood; the other keeps changing like a circuit. Choose the surface you would touch longer.' },
    options: [
      { id: 'organic-room', label: { kr: '손끝이 남은 울림', en: 'Resonance with fingerprints on it' }, description: { kr: '줄과 배음이 작은 방 안에서 둥글게 퍼지는 소리', en: 'Strings and overtones rounding out a small room' }, audioClipId: 'organic-room-cr1', vector: { organic: 2, warmth: 1 } },
      { id: 'synthetic-layers', label: { kr: '계속 모양을 바꾸는 전자 표면', en: 'An electronic surface that keeps changing shape' }, description: { kr: '신스의 결이 차갑게 겹치며 앞으로 미끄러지는 소리', en: 'Cool synth grain sliding forward in layers' }, audioClipId: 'synthetic-layers-cr1', vector: { organic: -2, warmth: -1 } }
    ]
  }),
  q({
    id: 'attention-hook', kind: 'audio',
    prompt: { kr: '귀가 한곳에 붙잡히는 순간은 어느 쪽에 더 가깝나요?', en: 'Which kind of moment keeps your ear from wandering?' },
    helper: { kr: '정확히 맞물리는 박자와, 다 지나간 뒤에도 남는 화음입니다. 집중이 자연스럽게 이어지는 쪽을 골라주세요.', en: 'One is a grid of exact rhythm; the other is harmony that remains after it passes. Choose where concentration comes without effort.' },
    options: [
      { id: 'precision', label: { kr: '빈틈없이 맞물리는 구조', en: 'A structure with every piece locked in' }, description: { kr: '짧은 펄스와 타격음이 질서 있게 움직이는 소리', en: 'Short pulses and percussion moving in strict order' }, audioClipId: 'precision-grid-cr1', vector: { complexity: 2, warmth: -2 } },
      { id: 'emotional-afterglow', label: { kr: '다 지나간 뒤에도 남는 화음', en: 'Harmony that remains after it passes' }, description: { kr: '따뜻한 화음과 작은 선율이 감정을 늦게 깨우는 소리', en: 'Warm chords and a small melody waking feeling slowly' }, audioClipId: 'emotional-afterglow-cr1', vector: { complexity: -2, warmth: 2 } }
    ]
  }),
  q({
    id: 'progression-reward', kind: 'audio',
    prompt: { kr: '노래가 길을 낼 때, 어느 방식이 더 믿음직한가요?', en: 'When a song makes a road, which kind do you trust more?' },
    helper: { kr: '한쪽은 결말을 향해 돌을 차곡차곡 놓고, 다른 쪽은 걷는 동안 길의 모양을 바꿉니다.', en: 'One lays stones steadily toward an ending; the other changes the road while you are walking.' },
    options: [
      { id: 'resolved-arc', label: { kr: '끝을 향해 차분히 쌓이는 길', en: 'A road that gathers toward its ending' }, description: { kr: '처음의 약속을 잊지 않고 조금씩 힘을 더하는 흐름', en: 'A progression that keeps its first promise and slowly gains weight' }, audioClipId: 'resolved-arc-cr1', vector: { complexity: -1, novelty: -2 } },
      { id: 'playful-turns', label: { kr: '걷는 동안 모양이 바뀌는 길', en: 'A road that changes shape underfoot' }, description: { kr: '박자와 길이가 어긋나며 예상 밖의 문을 여는 흐름', en: 'Uneven steps opening doors you did not expect' }, audioClipId: 'playful-turns-cr1', vector: { complexity: 1, novelty: 2 } }
    ]
  }),
  q({
    id: 'ideal-night', kind: 'choice',
    prompt: { kr: '아무 약속도 없는 밤, 어느 장면으로 가고 싶나요?', en: 'On a night with no obligations, which scene would you enter?' },
    helper: { kr: '멋져 보이는 쪽보다 실제로 자주 그리워하는 장면을 고르세요.', en: 'Choose the scene you genuinely miss, not the one that merely looks better.' },
    options: [
      { id: 'festival', label: { kr: '사람들의 어깨가 같은 박자로 움직이는 곳', en: 'A place where many shoulders move to one beat' }, description: { kr: '큰 소리와 표정과 환호를 곁에 두고 싶은 밤', en: 'A night that wants loud sound, faces, and a cheer nearby' }, vector: { sociality: 2, energy: 1 } },
      { id: 'night-walk', label: { kr: '이어폰 하나로 길을 길게 만드는 산책', en: 'A walk made longer by one pair of headphones' }, description: { kr: '도시의 소음을 줄이고 내 걸음만 듣고 싶은 밤', en: 'A night that quiets the city until only your steps remain' }, vector: { sociality: -2, energy: -1 } }
    ]
  }),
  q({
    id: 'lyric-world', kind: 'choice',
    prompt: { kr: '노랫말이 문을 열 때, 어느 쪽으로 들어가고 싶나요?', en: 'When lyrics open a door, which kind of room do you enter?' },
    helper: { kr: '뜻을 빨리 아는 문장과 오래 생각하게 하는 문장 중, 다시 듣고 싶은 쪽을 골라주세요.', en: 'Choose what you would replay: a line that speaks plainly or one that keeps its meaning half-lit.' },
    options: [
      { id: 'direct-story', label: { kr: '장면과 마음을 숨기지 않는 이야기', en: 'A story that does not hide its scene or feeling' }, description: { kr: '누가 어디에 있었는지 또렷하게 보이는 노랫말', en: 'Lyrics in which you can see who was there and where they stood' }, vector: { novelty: -2, warmth: 1 } },
      { id: 'open-metaphor', label: { kr: '다 듣고 나서도 문이 반쯤 열린 이야기', en: 'A story that leaves the door half open' }, description: { kr: '들을 때마다 다른 빛이 드는 은유와 빈칸', en: 'Metaphor and empty space taking a different light each time' }, vector: { novelty: 2, warmth: -1 } }
    ]
  }),
  q({
    id: 'first-listen', kind: 'choice',
    prompt: { kr: '처음 듣는 노래에서 가장 먼저 귀를 세우는 곳은 어디인가요?', en: 'Where does your ear stand up first in a new song?' },
    helper: { kr: '좋아하기로 마음먹기 전, 무심코 먼저 확인하는 것을 고르세요.', en: 'Before you decide whether to like it, choose what you notice without trying.' },
    options: [
      { id: 'production', label: { kr: '비트가 놓인 자리와 소리의 설계', en: 'Where the beat sits and how the sound is built' }, description: { kr: '드럼의 간격, 편곡의 층, 낯선 질감을 먼저 듣는 편', en: 'You hear drum spacing, arrangement layers, and unfamiliar texture first' }, vector: { complexity: 2, organic: -1 } },
      { id: 'voice', label: { kr: '목소리가 흔들리는 순간과 멜로디', en: 'The place where a voice trembles and a melody turns' }, description: { kr: '어떤 마음으로 부르는지부터 알아차리는 편', en: 'You first notice the feeling carried in the singing' }, vector: { complexity: -2, organic: 1 } }
    ]
  }),
  q({
    id: 'playlist-habit', kind: 'choice',
    prompt: { kr: '노래를 한 줄로 세울 때, 어느 방식이 더 나다운가요?', en: 'When you line songs up, which habit feels more like yours?' },
    helper: { kr: '혼자 순서를 오래 고르는 편인지, 다른 사람의 선택이 끼어드는 것을 즐기는 편인지 떠올려보세요.', en: 'Think about whether you shape the order alone or enjoy another person changing it.' },
    options: [
      { id: 'curated-order', label: { kr: '장면마다 순서를 오래 고르는 편', en: 'I take time arranging an order for each scene' }, description: { kr: '첫 곡과 마지막 곡의 자리를 혼자 정해두는 플레이리스트', en: 'A playlist whose first and last songs you place yourself' }, vector: { novelty: -1, complexity: 1, sociality: -1 } },
      { id: 'open-shuffle', label: { kr: '친구의 노래와 우연을 함께 섞는 편', en: 'I let a friend’s songs and chance into the sequence' }, description: { kr: '예상하지 못한 다음 곡이 분위기를 바꾸는 플레이리스트', en: 'A playlist willing to let the next unexpected song change the room' }, vector: { novelty: 1, complexity: -1, sociality: 1 } }
    ]
  }),
  q({
    id: 'recovery-sound', kind: 'choice',
    prompt: { kr: '지친 날 저녁, 어느 소리가 몸을 집으로 데려오나요?', en: 'At the end of a tiring day, which sound brings you home?' },
    helper: { kr: '기분을 세게 바꾸는 쪽과 소음을 천천히 낮추는 쪽 중, 실제로 회복되는 쪽을 고르세요.', en: 'Choose what truly restores you: a strong change of pace or a slow lowering of noise.' },
    options: [
      { id: 'energy-reset', label: { kr: '큰 박자로 피로를 밀어내기', en: 'Push the fatigue back with a large beat' }, description: { kr: '움직임을 더해 몸의 표정을 바꾸는 음악', en: 'Music that changes the body by giving it more motion' }, vector: { energy: 2 } },
      { id: 'quiet-reset', label: { kr: '작은 소리로 하루의 볼륨 낮추기', en: 'Lower the day with a quieter sound' }, description: { kr: '자극을 덜어내고 호흡이 돌아오기를 기다리는 음악', en: 'Music that removes stimulation and waits for the breath to return' }, vector: { energy: -2 } }
    ]
  }),
  q({
    id: 'home-scene', kind: 'choice',
    prompt: { kr: '마지막으로, 내 음악이 살았으면 하는 방을 골라주세요.', en: 'Last, choose the room where you would let your music live.' },
    helper: { kr: '설명보다 먼저 문을 열고 싶은 장면이면 됩니다.', en: 'Choose the scene whose door you would open before explaining why.' },
    options: [
      { id: 'sunlit-room', label: { kr: '햇빛과 나무 냄새가 남은 작은 방', en: 'A small room with sunlight and the smell of wood' }, description: { kr: '가까운 목소리와 실제 악기가 벽에 부드럽게 닿는 곳', en: 'A place where close voices and played instruments meet the walls gently' }, vector: { organic: 2, warmth: 1, novelty: -1 } },
      { id: 'neon-city', label: { kr: '신스와 간판 불빛이 흐르는 늦은 도시', en: 'A late city flowing with synths and signs' }, description: { kr: '낯선 음색과 빠르게 바뀌는 풍경이 다음 골목을 여는 곳', en: 'A place where unfamiliar timbre and changing light open the next street' }, vector: { organic: -2, warmth: -1, novelty: 1 } }
    ]
  })
]);
