const AXIS_IDS = Object.freeze(['energy', 'warmth', 'novelty', 'organic', 'complexity', 'sociality']);

const RAW_EDITORIAL_TRACKS = `space-song|28,78,62,46,58,20|74|28|32|night,reset|spotify|느린 드럼과 번지는 신스가 방 안의 공기를 넓혀요. 혼자 생각을 정리하는 밤에 감정을 밀어붙이지 않고 곁에 머뭅니다.|Slow drums and blooming synths make the room feel wider. It stays beside a reflective night without forcing the emotion.
apocalypse|24,72,48,58,44,18|82|22|26|night,reset|spotify|속삭이듯 가까운 보컬과 긴 잔향이 한 장면을 오래 붙잡아요. 자극을 줄이고 감정의 여운을 따라가고 싶을 때 잘 맞습니다.|A close, whispered vocal and long reverb hold one scene in place. It suits moments when you want less stimulation and more emotional afterglow.
about-you|34,76,55,48,60,28|86|34|38|night,together|spotify|겹겹이 쌓인 기타와 멀리서 들리는 보컬이 기억처럼 번져요. 익숙함과 몽환적인 공간감이 함께 필요한 늦은 시간에 어울립니다.|Layered guitars and distant vocals spread like a memory. It fits late hours that need both familiarity and a hazy sense of space.
wait-m83|30,68,72,34,74,16|38|18|28|night,focus|spotify|천천히 커지는 신스와 넓은 다이내믹이 작은 감정을 영화적인 장면으로 바꿔요. 긴 호흡으로 몰입하고 싶은 밤에 적합합니다.|Slow-building synths and wide dynamics turn a small feeling into a cinematic scene. It works for nights that call for long-form immersion.
505|52,64,46,66,62,30|88|42|54|night,lift|spotify|절제된 초반이 후반의 폭발을 더 크게 만들어요. 조용히 시작해 감정을 한 번에 끌어올리고 싶은 순간에 잘 맞습니다.|The restrained opening makes the final surge hit harder. It suits moments that begin quietly and need one decisive emotional lift.
slow-dancing-dark|38,58,54,40,52,18|90|36|42|night,reset|spotify|무게감 있는 저역과 상처 난 듯한 보컬이 감정을 직접 드러내요. 혼자 감정을 피하지 않고 끝까지 들어보고 싶은 밤에 어울립니다.|Heavy low end and a wounded vocal make the feeling explicit. It fits a night when you want to sit with emotion instead of avoiding it.
instagram-dean|42,60,66,38,64,24|92|46|48|night,reset|spotify|비어 있는 공간과 건조한 리듬 사이로 보컬의 피로가 선명하게 들려요. 사람 많은 하루 뒤 혼자 속도를 낮추는 데 잘 맞습니다.|The fatigue in the vocal sits clearly between dry rhythm and open space. It is a good comedown after a crowded day.
through-the-night|18,92,34,88,42,14|94|14|20|night,reset|spotify|가까운 목소리와 작은 기타 소리가 편지처럼 들려요. 잠들기 전 마음을 진정시키고 따뜻한 여운을 남기기에 좋습니다.|A close voice and small acoustic guitar feel like a letter. It is ideal for calming down before sleep and leaving a warm afterglow.
blinding-lights|92,56,58,20,44,78|90|88|90|lift,together|spotify|직선적인 신스 베이스와 끊임없이 달리는 드럼이 즉시 속도를 올려요. 이동이나 운동처럼 몸의 리듬을 먼저 깨우고 싶을 때 강합니다.|A straight synth bass and relentless drums raise the speed immediately. It is strongest when movement or training needs the body awake first.
starboy|80,38,62,18,54,68|88|76|76|lift,night|spotify|차가운 신스와 단단한 킥이 여유 있는 자신감을 만들어요. 밤의 이동처럼 과하게 밝지 않은 추진력이 필요할 때 어울립니다.|Cool synths and a firm kick create controlled confidence. It fits night movement that needs momentum without turning overly bright.
murder-in-my-mind|96,22,78,8,48,54|28|82|96|lift,explore|spotify|왜곡된 저역과 빠른 카우벨 리듬이 짧고 강하게 몰아쳐요. 익숙한 팝보다 거칠고 즉각적인 자극이 필요한 순간을 위한 선택입니다.|Distorted low end and a fast cowbell pattern hit hard and short. It is for moments that need something rougher and more immediate than familiar pop.
close-eyes|90,26,76,10,50,48|26|78|90|lift,explore|spotify|어두운 샘플과 압축된 비트가 긴장감을 놓지 않아요. 집중력을 공격적으로 끌어올리거나 새로운 전자 질감을 찾을 때 잘 맞습니다.|A dark sample and compressed beat keep the tension locked. It works when focus needs an aggressive push or you want a sharper electronic texture.
humble|84,34,48,24,56,72|94|82|78|lift,together|spotify|비어 있는 피아노 리프와 굵은 랩이 공간을 빠르게 장악해요. 짧은 시간에 자신감과 타격감을 끌어올리고 싶을 때 적합합니다.|A sparse piano riff and heavy rap take over the room quickly. It fits moments that need confidence and impact in very little time.
sicko-mode|88,30,72,16,88,70|92|72|82|lift,explore|spotify|여러 번의 비트 전환이 한 곡 안에서 계속 새 장면을 열어요. 높은 에너지와 복잡한 전개를 동시에 원하는 청취에 어울립니다.|Multiple beat switches keep opening new scenes inside one track. It suits listening that wants both high energy and structural complexity.
gods-menu|94,40,70,18,76,82|94|86|92|lift,together|spotify|금속성 타격음과 구호처럼 쌓이는 보컬이 무대를 크게 만들어요. 함께 반응할 수 있는 강한 추진력이 필요할 때 잘 맞습니다.|Metallic hits and chant-like vocals make the stage feel large. It works when shared listening needs forceful, collective momentum.
next-level|82,42,82,14,84,78|92|78|76|lift,explore|spotify|서로 다른 섹션이 과감하게 연결되며 곡의 규칙을 계속 바꿔요. 익숙한 후렴과 낯선 전개를 함께 즐기고 싶을 때 적합합니다.|Bold section changes keep rewriting the track’s own rules. It fits listeners who want a familiar hook alongside an unfamiliar structure.
bloom-paper-kites|28,88,32,92,38,24|86|24|30|reset,night|spotify|손끝이 느껴지는 기타와 가까운 화음이 작은 방의 온도를 높여요. 조용한 저녁에 사람의 목소리와 실제 악기를 오래 듣고 싶을 때 좋습니다.|Fingered guitar and close harmonies warm up a small room. It suits quiet evenings that call for human voices and tactile instruments.
holocene|32,82,50,86,68,18|80|20|30|reset,night|spotify|섬세한 기타와 겹쳐지는 보컬이 넓은 풍경을 천천히 펼쳐요. 복잡한 생각을 조용히 정리하면서도 감정의 깊이를 놓치지 않습니다.|Delicate guitar and layered vocals slowly open a wide landscape. It helps organize complex thoughts without losing emotional depth.
photograph|38,86,26,84,40,38|92|38|40|reset,together|spotify|단순한 기타 진행과 선명한 보컬이 기억을 직접 건드려요. 익숙한 멜로디로 사람과 시간을 연결하고 싶을 때 잘 맞습니다.|A simple guitar progression and clear vocal reach memory directly. It works when a familiar melody needs to connect people and time.
sparks|24,78,40,82,48,16|78|18|24|night,reset|spotify|낮은 볼륨의 기타와 숨을 아끼는 보컬이 말하지 않은 감정을 남겨요. 조용히 집중하거나 하루 끝의 소음을 줄이는 데 어울립니다.|Low-volume guitar and a restrained vocal leave room for unspoken feeling. It suits quiet focus or reducing the noise at the end of a day.
seasons-wave|44,80,52,70,56,34|84|42|46|reset,night|spotify|부드러운 기타 톤과 느슨한 그루브가 계절이 바뀌는 듯한 여유를 만들어요. 마음을 가볍게 풀면서도 감정선을 유지하고 싶을 때 좋습니다.|Soft guitar tone and a loose groove create the ease of a changing season. It helps release tension without flattening the emotional line.
love-lee|62,86,30,76,34,72|92|78|68|lift,together|spotify|통통 튀는 리듬과 밝은 화음이 바로 미소를 끌어내요. 함께 듣는 자리에서 부담 없이 분위기를 따뜻하게 바꾸는 곡입니다.|Bouncy rhythm and bright harmony bring out a smile quickly. It warms a shared room without demanding too much attention.
only-leehi|30,94,28,72,42,22|96|24|30|reset,night|spotify|여백이 큰 편곡 위에서 보컬의 온도가 그대로 전달돼요. 위로가 필요하지만 과한 고조는 피하고 싶은 순간에 잘 맞습니다.|The vocal carries its warmth over a spacious arrangement. It fits moments that need comfort without a large dramatic build.
best-part|34,92,36,78,44,48|96|46|38|reset,together|spotify|부드러운 기타와 두 목소리의 호흡이 가까운 대화를 만들어요. 조용한 공간에서 함께 듣거나 감정을 천천히 나누기에 좋습니다.|Soft guitar and the breathing space between two voices create an intimate conversation. It suits quiet shared listening and slow emotional connection.
giorgio-moroder|66,34,94,12,96,38|44|72|70|focus,explore|spotify|말과 신스, 라이브 드럼이 시대를 오가며 하나의 긴 구조를 세워요. 소리의 제작 과정과 전개 자체를 따라가고 싶을 때 가장 보람이 큽니다.|Voice, synths, and live drums move across eras to build one long structure. It rewards listeners who want to follow production and progression itself.
emerald-rush|74,28,96,10,94,24|8|70|78|focus,explore|spotify|작은 패턴이 겹치고 변형되며 거대한 흐름으로 확장돼요. 반복 속 미세한 변화를 추적하는 집중 청취에 잘 맞습니다.|Small patterns layer and mutate into a large current. It is ideal for focused listening that tracks subtle change inside repetition.
everything-right-place|44,30,88,16,90,16|82|34|42|focus,explore|spotify|잘린 보컬과 비틀린 키보드가 익숙한 록의 중심을 옮겨놓아요. 차분한 에너지 안에서 낯선 구조를 탐색하고 싶을 때 적합합니다.|Cut-up vocals and warped keys move the center of familiar rock. It suits exploration of unfamiliar structure at a controlled energy level.
strobe|58,36,84,8,92,30|4|64|60|focus,night|spotify|긴 도입이 작은 신스 동기를 천천히 키워 절정의 의미를 만듭니다. 서두르지 않고 한 곡의 전체 아치를 따라갈 때 가장 빛나요.|A long introduction slowly grows a small synth motif until the climax matters. It shines when you follow the whole arc without rushing.
avril-14th|12,70,74,92,64,8|0|8|16|focus,reset|spotify|짧은 피아노 음들이 빈 공간을 또렷하게 남겨요. 생각을 방해하지 않으면서도 낯선 정서를 조용히 열어주는 곡입니다.|Short piano notes leave the empty space clearly audible. It opens an unfamiliar mood without interrupting thought.
dayvan-cowboy|48,42,90,22,86,14|6|36|46|focus,explore|spotify|먼지 낀 듯한 샘플과 넓어지는 후반부가 오래된 미래의 풍경을 만들어요. 질감과 구조가 함께 변하는 음악을 탐색하기 좋습니다.|Dusty samples and an expanding second half create a landscape from an old future. It is strong for exploring texture and structure together.
an-ending-ascent|10,64,82,18,72,6|0|4|12|focus,reset|spotify|느리게 떠오르는 패드가 시간의 경계를 흐리게 해요. 자극 없이 깊은 집중이나 긴 호흡의 회복이 필요할 때 잘 맞습니다.|Slow-rising pads blur the edge of time. It works for deep focus or long-form recovery without stimulation.
aruarian-dance|38,68,78,64,70,24|4|52|48|focus,night|spotify|재즈 기타와 느슨한 비트가 정교함과 편안함을 동시에 줘요. 공부나 야간 작업에서 리듬은 필요하지만 보컬은 방해될 때 좋습니다.|Jazz guitar and a loose beat balance precision with ease. It suits study or night work when rhythm helps but vocals would distract.
nature-of-daylight|16,72,42,86,88,10|0|4|18|focus,reset|spotify|반복되는 스트링이 조금씩 무게를 더하며 감정을 말없이 끌어올려요. 생각을 정리하거나 한 장면에 오래 머물고 싶을 때 적합합니다.|Repeating strings add weight little by little and raise emotion without words. It fits reflection and staying with one scene for a long time.
time-hans-zimmer|38,66,44,70,92,18|0|10|34|focus,lift|spotify|단순한 동기가 층층이 쌓여 거대한 절정으로 향해요. 긴 작업을 마무리하거나 감정의 방향을 크게 전환할 때 힘을 줍니다.|A simple motif layers toward a large climax. It adds force when finishing a long task or making a major emotional turn.
experience-einaudi|46,74,38,88,82,14|0|14|48|focus,lift|spotify|피아노의 반복 위로 스트링이 속도를 더해 서사를 만들어요. 조용한 집중에서 조금 더 앞으로 나아갈 추진력이 필요할 때 좋습니다.|Strings add speed over repeated piano to create narrative motion. It works when quiet focus needs a little more forward drive.
flight-from-city|12,68,58,80,76,8|0|4|14|reset,focus|spotify|작은 피아노와 숨처럼 이어지는 현이 공간을 비워줘요. 마음의 속도를 낮추고 생각 사이에 틈을 만들고 싶을 때 적합합니다.|Small piano and breath-like strings clear space around the listener. It fits slowing the mind and making room between thoughts.
river-flows|24,84,28,94,58,12|0|12|28|reset,night|spotify|선명한 피아노 멜로디가 복잡하지 않은 감정선을 오래 이어가요. 익숙한 온기로 하루를 정리하거나 조용히 쉬기에 좋습니다.|A clear piano melody carries a simple emotional line for a long time. It suits ending the day with familiar warmth and quiet rest.
one-summers-day|30,86,46,92,72,20|0|18|34|reset,focus|spotify|피아노와 오케스트라가 작은 호기심에서 따뜻한 장면으로 확장돼요. 집중을 해치지 않으면서 상상력을 열고 싶을 때 잘 맞습니다.|Piano and orchestra expand from small curiosity into a warm scene. It opens imagination without breaking concentration.
arrival-birds|40,80,52,84,86,18|0|14|42|focus,lift|spotify|조용한 현이 점차 밝아지며 한 장면의 문을 크게 열어요. 차분함을 유지하면서도 희망적인 상승이 필요할 때 적합합니다.|Quiet strings gradually brighten and open a scene wide. It fits moments that need a hopeful rise while keeping calm intact.
uptown-funk|92,78,34,66,48,98|94|98|92|lift,together|spotify|브라스와 펑크 기타, 구호 같은 보컬이 모두를 같은 박자로 끌어들여요. 함께 듣는 자리의 에너지를 가장 빠르게 올리는 선택입니다.|Brass, funk guitar, and chant-like vocals pull everyone into the same pulse. It is one of the fastest ways to lift a shared room.
september|84,92,24,82,44,98|92|96|86|lift,together|spotify|밝은 브라스와 끊임없이 움직이는 리듬이 세대와 취향의 경계를 낮춰요. 누구나 반응할 수 있는 따뜻한 공동 에너지가 강점입니다.|Bright brass and constant motion lower the barrier between generations and tastes. Its strength is warm, collective energy.
levitating|86,72,42,34,42,92|94|94|88|lift,together|spotify|가벼운 베이스와 반짝이는 후렴이 춤추기 쉬운 탄력을 만들어요. 익숙한 팝 감각으로 분위기를 밝히고 싶을 때 잘 맞습니다.|A light bass line and sparkling chorus create easy bounce. It works when familiar pop needs to brighten the mood.
cuff-it|82,84,38,54,50,94|94|96|82|lift,together|spotify|디스코 리듬과 여유 있는 보컬이 몸을 움직이게 하면서도 성숙한 온도를 유지해요. 밤의 모임을 부드럽게 끌어올리기 좋습니다.|Disco rhythm and a relaxed vocal invite movement while keeping a mature warmth. It is ideal for lifting a night gathering smoothly.
back-on-74|70,88,54,76,62,86|86|84|70|together,lift|spotify|라이브 밴드의 질감과 반복되는 후렴이 자연스럽게 사람을 묶어요. 춤과 대화를 모두 방해하지 않는 공동 선곡에 강합니다.|Live-band texture and a repeating chorus connect people naturally. It is strong shared listening that leaves room for both dancing and conversation.
get-lucky|78,82,38,82,52,96|86|94|76|together,lift|spotify|깨끗한 기타 커팅과 안정적인 디스코 그루브가 긴 시간 편하게 이어져요. 여러 취향이 섞인 자리의 안전한 중심이 됩니다.|Clean guitar chops and a steady disco groove stay comfortable for a long time. It becomes a reliable center for a room with mixed tastes.
hype-boy|76,78,56,36,46,88|92|90|78|together,lift|spotify|가벼운 드럼과 매끄러운 멜로디가 부담 없이 반복 청취를 부릅니다. 밝은 에너지와 세련된 리듬을 함께 원하는 모임에 어울립니다.|Light drums and a smooth melody invite replay without pressure. It suits a gathering that wants bright energy with polished rhythm.
360-charli|78,44,94,8,72,76|92|88|82|explore,lift|spotify|날카로운 신스와 짧은 문장이 디지털 공간의 속도를 그대로 가져와요. 최신 전자 팝의 질감과 태도를 빠르게 경험하기 좋습니다.|Sharp synths and clipped phrases carry the speed of a digital space. It is a quick way to experience the texture and attitude of current electronic pop.
money-machine|86,26,98,6,64,58|78|82|88|explore,lift|spotify|과장된 보컬 처리와 깨지는 듯한 비트가 팝의 경계를 장난스럽게 밀어내요. 불편함까지 포함한 새로운 자극을 원할 때 적합합니다.|Exaggerated vocal processing and a breaking beat push pop boundaries playfully. It fits listeners who want new stimulation, including some productive discomfort.
new-magic-wand|92,22,88,18,82,62|92|74|90|explore,lift|spotify|왜곡된 베이스와 거친 보컬이 곡 전체를 한 방향으로 몰아붙여요. 감정을 정리하기보다 폭발적인 형태로 꺼내고 싶을 때 강합니다.|Distorted bass and a rough vocal drive the whole track in one direction. It is strongest when emotion needs release rather than careful organization.
xs-rina|82,46,90,20,78,74|94|86|84|explore,lift|spotify|광택 있는 팝 후렴과 금속성 기타가 소비적인 화려함을 일부러 충돌시켜요. 익숙한 멜로디 안의 낯선 설계를 찾기 좋습니다.|A glossy pop chorus collides with metallic guitars on purpose. It is ideal for finding unfamiliar design inside a familiar melody.
supernova-aespa|88,42,96,8,84,84|94|90|90|explore,together|spotify|무거운 전자 베이스와 반복되는 구호가 낯선데도 즉시 기억에 남아요. 새로운 질감과 집단적인 반응을 동시에 원하는 순간에 맞습니다.|Heavy electronic bass and repeated chants feel unfamiliar yet instantly memorable. It suits moments that want new texture and a collective response.
kick-back|94,34,90,32,86,76|96|86|96|explore,lift|spotify|급격한 전환과 거친 밴드 사운드가 한 곡 안에서 계속 긴장을 바꿔요. 빠른 에너지와 예측 불가능한 구조를 함께 즐기기에 좋습니다.|Abrupt turns and rough band sound keep changing the tension. It is built for listeners who want speed and unpredictability together.
raingurl|72,48,92,10,60,70|66|92|76|explore,together|spotify|건조한 하우스 비트와 반복되는 목소리가 미니멀한 클럽 공간을 만들어요. 과한 고조 없이 새로운 리듬 감각을 공유하기 좋습니다.|A dry house beat and repeated voice create a minimal club space. It is good for sharing a new rhythmic feel without an oversized climax.
shake-it-off|88,86,22,44,34,98|96|96|90|lift,together|spotify|손뼉과 브라스, 바로 따라 부를 수 있는 후렴이 분위기를 즉시 바꿔요. 복잡한 설명 없이 모두가 함께 반응해야 할 때 강합니다.|Claps, brass, and an instantly singable chorus change the mood at once. It is strong when everyone needs to react together without explanation.
good-as-hell|82,94,26,58,32,96|98|92|84|lift,together|spotify|선명한 보컬과 긍정적인 후렴이 자신감을 직접 끌어올려요. 혼자 기분을 회복하거나 친구와 서로 응원할 때 잘 맞습니다.|A clear vocal and positive chorus lift confidence directly. It works for a solo reset or for friends encouraging each other.
i-aint-worried|76,82,24,52,30,92|90|88|78|lift,together|spotify|휘파람과 가벼운 드럼이 긴장을 빠르게 풀어줘요. 너무 힘주지 않고 밝은 공동 분위기를 만들고 싶을 때 적합합니다.|Whistling and light drums release tension quickly. It suits a bright shared mood without trying too hard.
firework|84,92,24,54,44,96|98|84|82|lift,together|spotify|조용한 시작에서 큰 후렴으로 올라가는 구조가 감정을 함께 터뜨리게 해요. 응원과 축하가 필요한 순간의 명확한 중심곡입니다.|The rise from a quiet opening to a large chorus releases emotion together. It is a clear centerpiece for encouragement and celebration.
happy|80,92,18,66,28,98|92|96|82|lift,together|spotify|손뼉과 소울 보컬이 단순한 리듬을 끝까지 밝게 밀어줘요. 다양한 연령과 취향이 섞인 자리에서도 쉽게 함께 움직일 수 있습니다.|Claps and a soul vocal keep a simple rhythm bright all the way through. It invites easy movement across ages and tastes.
love-wins-all|38,96,32,78,64,50|98|28|34|reset,together|spotify|섬세한 보컬과 점점 커지는 편곡이 사랑의 감정을 넓은 장면으로 만들어요. 조용한 공감에서 큰 여운까지 함께 듣고 싶을 때 좋습니다.|A delicate vocal and expanding arrangement turn affection into a wide scene. It fits shared listening that moves from quiet empathy to a large afterglow.
spring-day|54,94,34,72,58,78|96|54|56|reset,together|spotify|따뜻한 멜로디와 그리움을 담은 보컬이 개인의 기억을 공동의 후렴으로 바꿔요. 위로와 함께 부를 수 있는 감정이 동시에 필요할 때 어울립니다.|A warm melody and longing vocal turn private memory into a shared chorus. It suits moments that need comfort and something people can sing together.`;

function searchLinks(title, artist) {
  const query = encodeURIComponent(`${title} ${artist}`);
  return Object.freeze({
    spotify: `https://open.spotify.com/search/${query}`,
    youtube: `https://www.youtube.com/results?search_query=${query}`,
    apple: `https://music.apple.com/us/search?term=${query}`
  });
}

function parseEditorialTrack(line) {
  const [id, scoreText, vocality, danceability, pace, sceneText, primaryPlatform, kr, en] = line.split('|');
  const scores = scoreText.split(',').map(Number);
  const profile = Object.freeze(Object.fromEntries(AXIS_IDS.map((axis, index) => [axis, scores[index]])));
  return Object.freeze({
    id,
    profile,
    vocality: Number(vocality),
    danceability: Number(danceability),
    pace: Number(pace),
    scenes: Object.freeze(sceneText.split(',').filter(Boolean)),
    primaryPlatform,
    editorialNote: Object.freeze({ kr, en })
  });
}

export const EDITORIAL_TRACKS = Object.freeze(Object.fromEntries(
  RAW_EDITORIAL_TRACKS.trim().split('\n').map(parseEditorialTrack).map((track) => [track.id, track])
));

export const CURATED_TRACK_IDS = Object.freeze(Object.keys(EDITORIAL_TRACKS));
export const CURATED_TRACK_COUNT = CURATED_TRACK_IDS.length;

export function enrichTrack(track) {
  const editorial = EDITORIAL_TRACKS[track?.id];
  if (!editorial) return track;
  return Object.freeze({
    ...track,
    profile: editorial.profile,
    vocality: editorial.vocality,
    danceability: editorial.danceability,
    pace: editorial.pace,
    contexts: Object.freeze([...new Set([...(track.contexts || []), ...editorial.scenes])]),
    tags: Object.freeze([...new Set([...(track.tags || []), ...editorial.scenes, 'editorial-curated'])]),
    editorialNote: editorial.editorialNote,
    primaryPlatform: editorial.primaryPlatform,
    listenLinks: searchLinks(track.title, track.artist),
    editorial: true
  });
}

export function enrichTracks(tracks) {
  return Object.freeze(tracks.map(enrichTrack));
}
