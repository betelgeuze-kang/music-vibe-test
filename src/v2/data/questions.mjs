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
    prompt: { kr: '지금 몸이 먼저 반응하는 사운드는?', en: 'Which sound makes your body react first?' },
    helper: { kr: '두 곡은 에너지와 감상 방식의 차이에 초점을 맞췄어요. 짧게 비교한 뒤 더 자연스럽게 끌리는 쪽을 골라보세요.', en: 'This pair focuses on energy and listening style. Preview both, then choose the one that pulls you in naturally.' },
    options: [
      { id: 'groove', label: { kr: '펑키한 그루브', en: 'Funky groove' }, description: { kr: '공간의 에너지를 올리는 탄력 있는 리듬', en: 'A springy rhythm that lifts the room' }, audioSrc: 'assets/audio/Funkorama.mp3', vector: { energy: 2, sociality: 1 } },
      { id: 'dream-space', label: { kr: '몽환적인 여백', en: 'Dreamy space' }, description: { kr: '혼자 깊게 잠기게 하는 느린 흐름', en: 'A slow flow that invites private immersion' }, audioSrc: 'assets/audio/Dream_Catcher.mp3', vector: { energy: -2, sociality: -1 } }
    ]
  }),
  q({
    id: 'texture-instinct', kind: 'audio',
    prompt: { kr: '소리의 질감은 어느 쪽이 더 매력적인가요?', en: 'Which sound texture feels more compelling?' },
    helper: { kr: '템포보다 실제 악기와 전자 질감의 촉감 차이에 집중해보세요.', en: 'Focus on the tactile contrast between organic instruments and electronic texture.' },
    options: [
      { id: 'organic-room', label: { kr: '선명한 실제 악기', en: 'Clear organic instruments' }, description: { kr: '손으로 연주한 듯 자연스럽고 따뜻한 울림', en: 'Natural, warm sound with a played-by-hand feel' }, audioSrc: 'assets/audio/Lobby_Time.mp3', vector: { organic: 2, warmth: 1 } },
      { id: 'synthetic-layers', label: { kr: '낯선 전자 레이어', en: 'Unfamiliar electronic layers' }, description: { kr: '가공된 음색과 차갑게 변하는 표면', en: 'Processed timbre and a cooler evolving surface' }, audioSrc: 'assets/audio/Cipher.mp3', vector: { organic: -2, warmth: -1 } }
    ]
  }),
  q({
    id: 'attention-hook', kind: 'audio',
    prompt: { kr: '어떤 음악에 더 오래 집중하게 되나요?', en: 'Which kind of music holds your attention longer?' },
    helper: { kr: '정교한 구조와 감정적 온도 중 어느 쪽이 집중을 붙잡는지 살펴보세요.', en: 'Notice whether structural precision or emotional warmth holds your attention.' },
    options: [
      { id: 'precision', label: { kr: '정교한 구조와 추진력', en: 'Precise structure and drive' }, description: { kr: '박자와 구성의 완성도를 따라가게 되는 음악', en: 'Music that rewards following rhythm and construction' }, audioSrc: 'assets/audio/Tech_Talk.mp3', vector: { complexity: 2, warmth: -2 } },
      { id: 'emotional-afterglow', label: { kr: '감정적인 멜로디와 잔향', en: 'Emotional melody and reverb' }, description: { kr: '선율과 분위기가 마음에 먼저 닿는 음악', en: 'Music that reaches feeling before analysis' }, audioSrc: 'assets/audio/Dreamy_Flashback.mp3', vector: { complexity: -2, warmth: 2 } }
    ]
  }),
  q({
    id: 'progression-reward', kind: 'audio',
    prompt: { kr: '전개 방식은 어느 쪽이 더 만족스러운가요?', en: 'Which kind of progression feels more satisfying?' },
    helper: { kr: '익숙하고 명확한 흐름과 예상 밖의 다층적 변화 중 더 즐거운 쪽을 고르세요.', en: 'Choose between a familiar resolved arc and unfamiliar layered turns.' },
    options: [
      { id: 'resolved-arc', label: { kr: '차곡차곡 쌓이는 전개', en: 'A structured build' }, description: { kr: '방향이 분명하고 결말로 수렴하는 흐름', en: 'A clear direction that resolves into an ending' }, audioSrc: 'assets/audio/Movement_Proposition.mp3', vector: { complexity: -1, novelty: -2 } },
      { id: 'playful-turns', label: { kr: '예상 밖으로 튀는 전개', en: 'Unpredictable turns' }, description: { kr: '즉흥적인 변화와 장난스러운 반전', en: 'Spontaneous changes and playful surprises' }, audioSrc: 'assets/audio/Pixel_Peeker_Polka_faster.mp3', vector: { complexity: 1, novelty: 2 } }
    ]
  }),
  q({
    id: 'ideal-night', kind: 'choice',
    prompt: { kr: '완벽한 음악 감상 밤을 고른다면?', en: 'Choose your ideal music night.' },
    helper: { kr: '평소 실제로 더 자주 원하는 장면에 가까운 쪽을 선택하세요.', en: 'Pick the scene you genuinely want more often.' },
    options: [
      { id: 'festival', label: { kr: '친구들과 공연이나 페스티벌', en: 'A concert or festival with friends' }, description: { kr: '같이 뛰고 반응하며 에너지를 나눈다', en: 'Move, react, and share energy together' }, vector: { sociality: 2, energy: 1 } },
      { id: 'night-walk', label: { kr: '혼자 이어폰을 끼고 야간 산책', en: 'A solo night walk with headphones' }, description: { kr: '방해 없이 내 감정과 소리에 집중한다', en: 'Focus on sound and feeling without interruption' }, vector: { sociality: -2, energy: -1 } }
    ]
  }),
  q({
    id: 'lyric-world', kind: 'choice',
    prompt: { kr: '가사에서 더 끌리는 방식은?', en: 'What kind of lyrics pull you in more?' },
    helper: { kr: '더 이해하기 쉬운 쪽이 아니라 반복해서 듣고 싶은 쪽을 고르세요.', en: 'Choose what you would replay, not what feels easier to understand.' },
    options: [
      { id: 'direct-story', label: { kr: '구체적이고 솔직한 이야기', en: 'Concrete, honest storytelling' }, description: { kr: '장면과 감정이 분명하게 그려지는 가사', en: 'Lyrics with a clear scene and emotional direction' }, vector: { novelty: -2, warmth: 1 } },
      { id: 'open-metaphor', label: { kr: '은유와 해석이 열려 있는 이야기', en: 'Metaphorical, open-ended storytelling' }, description: { kr: '들을 때마다 새로운 의미를 찾는 가사', en: 'Lyrics that reveal different meanings over time' }, vector: { novelty: 2, warmth: -1 } }
    ]
  }),
  q({
    id: 'first-listen', kind: 'choice',
    prompt: { kr: '처음 듣는 곡에서 가장 먼저 확인하는 것은?', en: 'What do you notice first in a new track?' },
    helper: { kr: '좋고 나쁨을 판단하는 첫 기준에 가까운 쪽을 골라보세요.', en: 'Choose the instinct that shapes your first judgment.' },
    options: [
      { id: 'production', label: { kr: '비트·편곡·사운드 디자인', en: 'Beat, arrangement, and sound design' }, description: { kr: '어떻게 만들어졌는지 구조를 분석하게 된다', en: 'You start analyzing how the track was built' }, vector: { complexity: 2, organic: -1 } },
      { id: 'voice', label: { kr: '보컬의 감정·멜로디·가사', en: 'Vocal emotion, melody, and lyrics' }, description: { kr: '어떤 감정을 주는지 먼저 느낀다', en: 'You first feel what the song is communicating' }, vector: { complexity: -2, organic: 1 } }
    ]
  }),
  q({
    id: 'playlist-habit', kind: 'choice',
    prompt: { kr: '플레이리스트를 만드는 방식은?', en: 'How do you build playlists?' },
    helper: { kr: '혼자 설계하는 흐름과 다른 사람의 선택이 섞이는 흐름 중 더 가까운 쪽을 골라보세요.', en: 'Choose between a sequence you design alone and one shaped by other people.' },
    options: [
      { id: 'curated-order', label: { kr: '상황별로 정리해 내 흐름대로 듣기', en: 'Organize by situation and follow my own sequence' }, description: { kr: '목적별 목록을 혼자 설계하고 순서대로 듣는다', en: 'Design purpose-built playlists alone and follow the sequence' }, vector: { novelty: -1, complexity: 1, sociality: -1 } },
      { id: 'open-shuffle', label: { kr: '친구와 곡을 모아 셔플하기', en: 'Build a shared playlist and hit shuffle' }, description: { kr: '다른 사람의 선택과 우연한 연결을 즐긴다', en: 'Enjoy other people’s choices and accidental connections' }, vector: { novelty: 1, complexity: -1, sociality: 1 } }
    ]
  }),
  q({
    id: 'recovery-sound', kind: 'choice',
    prompt: { kr: '지친 날 나를 회복시키는 사운드는?', en: 'Which sound restores you after a tiring day?' },
    helper: { kr: '기분 전환과 진정 중 실제로 더 회복되는 쪽을 골라보세요.', en: 'Choose what genuinely helps you recover: activation or decompression.' },
    options: [
      { id: 'energy-reset', label: { kr: '크고 빠른 비트로 기분 전환', en: 'Loud, fast beats for a reset' }, description: { kr: '에너지를 더해 피로를 밀어낸다', en: 'Add energy and push fatigue away' }, vector: { energy: 2 } },
      { id: 'quiet-reset', label: { kr: '조용하고 넓은 사운드로 진정', en: 'Quiet, spacious sound to decompress' }, description: { kr: '자극을 줄이고 천천히 회복한다', en: 'Reduce stimulation and recover slowly' }, vector: { energy: -2 } }
    ]
  }),
  q({
    id: 'home-scene', kind: 'choice',
    prompt: { kr: '내 취향이 가장 잘 어울리는 장면은?', en: 'Which scene best represents your taste?' },
    helper: { kr: '마지막 선택입니다. 더 본능적으로 들어가고 싶은 장면을 고르세요.', en: 'Final choice: enter the scene that feels instinctively more like you.' },
    options: [
      { id: 'sunlit-room', label: { kr: '햇빛과 나무 악기가 있는 작은 방', en: 'A small sunlit room with wooden instruments' }, description: { kr: '가까운 목소리와 자연스러운 울림', en: 'Close voices and natural resonance' }, vector: { organic: 2, warmth: 1, novelty: -1 } },
      { id: 'neon-city', label: { kr: '네온과 신스가 흐르는 미래 도시', en: 'A future city flowing with neon and synths' }, description: { kr: '새로운 음색과 빠르게 변하는 풍경', en: 'New timbres and a fast-changing landscape' }, vector: { organic: -2, warmth: -1, novelty: 1 } }
    ]
  })
]);
