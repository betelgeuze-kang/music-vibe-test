export { guidePath } from './listening-paths.mjs?listening=ln1';
import { HOME_SCENES } from './home-showcase.mjs?home=he2&listening=ln1';

// Original listening essays. Facts about releases remain in the shared catalog;
// these notes describe an editorial listening perspective, not measured effects.
const essays = {
  night: {
    slug: 'night-walk', art: 'midnight-dreamer',
    title: { kr: '밤 산책 음악: 여운을 따라 걷는 세 곡', en: 'Night-walk music: three songs for the long way home' },
    intro: {
      kr: ['밤의 음악이 꼭 어두울 필요는 없어요. 여기서는 큰 후렴보다 소리 사이의 간격에 귀를 기울였습니다. 가까운 목소리에서 시작해 리듬의 여백을 지나, 마지막에는 조금 더 넓은 풍경으로 나아가는 순서예요.', '세 곡을 다 듣지 않아도 괜찮습니다. 오늘의 걸음과 맞는 한 곡만 골라도 충분해요. 길을 걸을 때는 주변 소리가 들릴 정도로 볼륨을 낮추고, 음악 때문에 주변을 놓치지 않도록 해주세요.'],
      en: ['Night music does not have to be dark. This selection listens to the spaces between sounds rather than the biggest chorus. Start with a close voice, move through the gaps in a rhythm, then let the final track open into a wider landscape.', 'You do not need to finish all three. One song that fits your pace is enough. If you take them outside, keep the volume low enough to hear your surroundings and keep your attention on the path.']
    },
    flow: { kr: 'Apocalypse의 느린 호흡에서 DEAN의 조금 더 또렷한 비트로 옮겨가 보세요. 마지막 Wait는 앞의 두 곡보다 크게 펼쳐집니다. 잔향의 크기와 소리 사이의 거리가 어떻게 달라지는지 따라가면, 비슷한 밤의 선곡도 서로 다른 표정을 갖는다는 걸 느낄 수 있어요.', en: 'Move from the slow breathing of Apocalypse to DEAN’s more defined beat. Wait opens more widely than either of them. Follow the changing size of the reverb and the distance between sounds: three songs for the same night can still have very different expressions.' },
    points: {
      'apocalypse': { kr: '드럼을 따라가기보다, 보컬 한 문장이 끝난 뒤 기타가 남기는 잔향을 들어보세요. 같은 느린 박자 안에서도 앞에 있는 목소리와 뒤로 물러난 기타의 거리가 다르게 느껴져요.', en: 'Listen past the drum pulse to the guitar left behind after a vocal phrase. The voice stays close while the guitar recedes; that distance gives the slow rhythm its sense of space.' },
      'instagram-dean': { kr: '보컬이 쉬는 틈에 비트가 얼마나 비어 있는지 들어보세요. 앞 곡의 긴 울림과 달리, 짧고 건조한 소리가 여백의 윤곽을 또렷하게 만들어요.', en: 'Notice how much space remains in the beat when the voice pauses. Compared with the previous track’s long resonance, the shorter, drier sounds draw a clearer outline around the gaps.' },
      'wait-m83': { kr: '처음부터 절정을 기다리기보다 같은 소리가 한 겹씩 늘어나는 순간을 찾아보세요. 조용한 도입과 후반의 큰 울림을 같은 볼륨으로 무리해 듣지 않아도 괜찮아요.', en: 'Instead of waiting for the peak, notice each new layer arriving around a repeated sound. The quiet opening and large ending need not be heard at one fixed volume; adjust it for comfort.' }
    }
  },
  focus: {
    slug: 'focused-afternoon', art: 'quiet-cinematic',
    title: { kr: '집중하는 오후의 음악: 반복에서 흐름으로', en: 'Music for a focused afternoon: from repetition to flow' },
    intro: {
      kr: ['작업 옆에 둘 음악을 고를 때는 좋아하는 곡과 주의를 덜 빼앗는 곡이 다를 수 있어요. 이 선곡은 작은 피아노 패턴에서 출발해 점차 층이 많아지는 음악으로 이어집니다. 곡이 바뀔 때 내 집중도 함께 바뀌는지 살펴보세요.', '집중력을 높여준다는 보장은 없어요. 가사가 신경 쓰이거나 소리의 변화가 일을 방해하면 첫 곡에 더 오래 머물거나 음악을 잠시 꺼도 좋습니다. 마지막 곡은 배경보다는 작업의 한 구간을 마무리하는 감상에 가깝습니다.'],
      en: ['A favorite song and a song that stays quietly beside your work are not always the same. This sequence begins with a small piano pattern and gradually adds more layers. Notice whether your attention changes as the music changes.', 'There is no promise of improved concentration. If lyrics or changing textures distract you, stay with the first track or switch the music off. The last selection is closer to a listening break at the end of a work session than a neutral background.']
    },
    flow: { kr: '피아노의 반복을 작은 기준점으로 삼고, Experience에서 음이 겹치는 밀도를 따라가 보세요. 이 링크는 2013년 런던 라이브입니다. 세 번째 Wait는 보컬과 큰 다이내믹이 있어 앞의 두 곡보다 주의를 끌 수 있어요. 한 작업을 끝낸 뒤 장면을 전환하는 곡으로 두었습니다.', en: 'Use the recurring piano as a small point of reference, then follow the accumulating density in Experience. The linked performance is the 2013 London live version. Wait brings vocals and a larger dynamic range, so it may ask for more attention. It is placed last as a transition after one piece of work is finished.' },
    points: {
      'river-flows': { kr: '왼손의 반복과 오른손의 선율을 번갈아 들어보세요. 같은 패턴으로 돌아오는 순간과 멜로디가 조금 멀리 나가는 순간을 구분하는 것만으로도 곡의 흐름이 보여요.', en: 'Alternate your attention between the repeating left hand and the melody above it. Notice when the pattern returns and when the melody travels a little farther from that anchor.' },
      'experience-einaudi': { kr: '반복되는 피아노 위에 현악과 리듬이 언제 더해지는지 찾아보세요. 라이브에서는 음이 끝난 뒤 공간에 남는 울림도 연주의 일부처럼 들을 수 있어요.', en: 'Follow the strings and rhythm as they join the recurring piano. In this live performance, the resonance remaining after a note can feel like another layer of the arrangement.' },
      'wait-m83': { kr: '작업을 멈춘 짧은 휴식에, 도입의 작은 소리가 후반의 넓은 소리로 바뀌는 과정을 들어보세요. 보컬이 집중을 끊는다면 이 곡은 작업 뒤로 미뤄도 좋습니다.', en: 'During a short break, follow the small sounds of the opening into the wider ending. If the vocals interrupt your concentration, save this one for after the work instead.' }
    }
  },
  lift: {
    slug: 'a-little-lift', art: 'golden-chorus',
    title: { kr: '기분 전환 음악: 발걸음에 더하는 작은 리듬', en: 'A little lift: three songs with a spring in their step' },
    intro: {
      kr: ['기분을 바꾸려고 꼭 가장 빠르고 큰 음악을 고를 필요는 없어요. 가볍게 튀는 화음, 짧은 리듬의 반복, 곧 따라갈 수 있는 후렴처럼 작은 움직임을 만드는 요소부터 골랐습니다.', '첫 곡은 말과 멜로디의 장난스러운 호흡, 두 번째는 함께 움직이는 그루브, 마지막은 오래 이어지는 기타와 베이스에 집중합니다. 지금 필요한 만큼만 리듬을 빌려보세요.'],
      en: ['A change of mood does not always call for the fastest or loudest song. These picks start with smaller movements: a bright chord, a short rhythmic loop, a chorus that is easy to follow.', 'The first song plays with the exchange between words and melody. The second puts the groove in a shared space. The last lets guitar and bass carry a longer, easy motion. Borrow only as much momentum as you need today.']
    },
    flow: { kr: 'Love Lee의 짧고 밝은 프레이즈에서 Back on 74의 매끈한 합창으로 넘어가 보세요. Get Lucky에서는 후렴만 기다리지 말고 곡 전체를 끌고 가는 기타 리프를 들어보세요. 선율에서 리듬으로 주의를 조금씩 옮기는 순서입니다.', en: 'Move from Love Lee’s short, bright phrases into the smooth group vocals of Back on 74. In Get Lucky, listen beyond the chorus to the guitar figure carrying the whole track. The sequence gradually shifts attention from melody toward rhythm.' },
    points: {
      'love-lee': { kr: '목소리가 서로 주고받는 짧은 구절과 그 아래에서 튀는 리듬을 들어보세요. 가벼운 편곡 안에서도 보컬이 앞뒤로 움직이는 재미가 있어요.', en: 'Listen to the short phrases passed between the voices and the bouncing rhythm underneath. Even in a light arrangement, the vocals keep shifting the center of attention.' },
      'back-on-74': { kr: '같은 리듬이 반복돼도 보컬의 겹과 베이스의 움직임이 어떻게 표정을 바꾸는지 들어보세요. 영상에서는 군무와 음악의 반복이 만나는 방식도 볼 수 있어요.', en: 'Notice how the vocal layers and bass change the feel of a repeating groove. In the official video, the choreography offers another way to follow that repetition.' },
      'get-lucky': { kr: '기타와 베이스 중 한쪽을 먼저 따라간 뒤 다른 쪽으로 옮겨보세요. 두 악기가 비슷한 자리를 반복하면서도 같은 리듬을 연주하지 않는 점이 곡을 오래 움직이게 합니다.', en: 'Follow either the guitar or the bass, then switch to the other. They keep returning to familiar positions without playing exactly the same rhythm; that small difference sustains the motion.' }
    }
  },
  together: {
    slug: 'between-conversations', art: 'warm-vinyl',
    title: { kr: '함께 듣기 좋은 음악: 대화 사이에 놓는 세 곡', en: 'Music between conversations: three songs to share' },
    intro: {
      kr: ['같은 공간에 있는 사람들의 취향이 꼭 같을 필요는 없어요. 이 선곡은 누군가의 대표 취향을 정하기보다, 리듬과 목소리처럼 함께 따라갈 수 있는 작은 공통점을 찾는 데서 시작했습니다.', '흥을 나누는 곡, 가까운 두 목소리를 듣는 곡, 익숙한 후렴에 잠시 머무는 곡을 차례로 놓았습니다. 대화가 시작되면 볼륨을 줄여도 좋고, 한 곡이 마음에 들면 그 곡을 고른 이유를 서로 물어봐도 좋아요.'],
      en: ['People sharing a room do not need to share exactly the same taste. Rather than choosing one person’s signature style, this selection starts with small common anchors: a groove, a voice, a melody both can follow.', 'Move from a shared pulse to two close voices, then to a familiar chorus. Turn it down when conversation begins, or ask each other what stood out in a song. The music can leave room for the people around it.']
    },
    flow: { kr: 'Back on 74로 같은 박자를 찾은 뒤 Best Part에서 소리의 간격을 넓혀보세요. 마지막 Spring Day는 개인의 기억을 떠올릴 수 있는 선율로 마무리합니다. 모두에게 맞는 정답이라는 뜻은 아니에요. 서로 편하게 느낀 곡이 어디서 갈리는지 이야기의 출발점으로 써보세요.', en: 'Find a shared pulse in Back on 74, then leave more space with Best Part. Spring Day closes on a melody that may bring personal memories to the room. These are not universal answers; use the points where your preferences differ as a place to start a conversation.' },
    points: {
      'back-on-74': { kr: '한 사람이 베이스를, 다른 사람이 보컬을 따라 들어보세요. 같은 곡에서 먼저 귀에 들어오는 소리가 서로 다를 수 있다는 걸 비교하기 좋아요.', en: 'Let one person follow the bass and another follow the vocals. Compare what each of you notices first: the same song can offer different starting points.' },
      'best-part': { kr: '두 목소리가 번갈아 나오는 구간과 함께 겹치는 구간을 비교해보세요. 기타가 많은 음을 채우지 않아 목소리 사이의 호흡이 더 잘 들려요.', en: 'Compare the passages where the voices alternate with the moments when they overlap. The sparse guitar leaves room to hear the breathing space between them.' },
      'spring-day': { kr: '벌스에서 후렴으로 갈 때 목소리와 반주의 폭이 어떻게 달라지는지 들어보세요. 서로 떠올린 장면이 다르더라도 같은 선율을 나누는 경험이 될 수 있어요.', en: 'Notice how the width of the voices and accompaniment changes from verse to chorus. The same melody can be shared even when it brings different scenes to mind.' }
    }
  }
};

export const LISTENING_GUIDES = Object.freeze(HOME_SCENES.map((scene) => Object.freeze({ ...scene, ...essays[scene.id], publishedAt: '2026-10-30' })));
