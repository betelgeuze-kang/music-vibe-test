
const createQ = (id, text, type) => ({
    id,
    text,
    options: [
        { text: "매우 아니다", type: type.opposite, score: 2 },
        { text: "아니다", type: type.opposite, score: 1 },
        { text: "보통이다", type: type.main, score: 0 },
        { text: "그렇다", type: type.main, score: 1 },
        { text: "매우 그렇다", type: type.main, score: 2 }
    ]
});

// **[수정: 성격 유형 테스트 질문 - 40문항 5지선다 위주]**
const QUESTIONS = [
    // --- E vs I (에너지) ---
    createQ(1, "나는 새로운 사람들과 어울리는 것을 좋아하며 모임을 주도하는 편이다.", { main: 'E', opposite: 'I' }),
    createQ(2, "나는 생각이 생기면 혼자 곱씹기보다 말로 내뱉으며 정리하는 것이 편하다.", { main: 'E', opposite: 'I' }),
    createQ(3, "나는 주말에 집에만 있으면 무기력해지고 밖으로 나가야 에너지가 생긴다.", { main: 'E', opposite: 'I' }),
    createQ(4, "나는 처음 보는 사람에게도 먼저 말을 거는 데 큰 어려움이 없다.", { main: 'E', opposite: 'I' }),
    createQ(5, "나는 다수의 사람들과 함께 활동할 때 훨씬 더 활기를 느낀다.", { main: 'E', opposite: 'I' }),
    createQ(6, "나는 내 관심사를 주변 사람들에게 적극적으로 공유하고 알리고 싶어 한다.", { main: 'E', opposite: 'I' }),
    createQ(7, "나는 전화를 걸기보다 받거나, 걸기 전에 미리 리허설을 하지 않는 편이다.", { main: 'E', opposite: 'I' }),
    createQ(8, "나는 주변에서 '활발하다' 혹은 '에너지가 넘친다'는 소리를 자주 듣는다.", { main: 'E', opposite: 'I' }),
    createQ(9, "나는 관심의 중심에 서는 것이 크게 부담스럽지 않고 즐길 때가 있다.", { main: 'E', opposite: 'I' }),
    createQ(10, "나는 혼자 조용히 생각하는 것보다 친구들과 수다를 떠는 것이 더 좋다.", { main: 'E', opposite: 'I' }),

    // --- S vs N (인식) ---
    createQ(11, "나는 상상이나 아이디어보다 실제로 일어난 사실과 경험을 더 신뢰한다.", { main: 'S', opposite: 'N' }),
    createQ(12, "나는 일을 할 때 구체적인 매뉴얼이나 단계별 지침이 있는 것을 선호한다.", { main: 'S', opposite: 'N' }),
    createQ(13, "나는 추상적인 비유나 이론보다 눈에 보이는 데이터와 수치를 중요하게 생각한다.", { main: 'S', opposite: 'N' }),
    createQ(14, "나는 새로운 시도를 하기보다 검증된 기존의 방식을 따르는 것이 더 효율적이라 믿는다.", { main: 'S', opposite: 'N' }),
    createQ(15, "나는 영화나 드라마를 볼 때 숨겨진 의미를 찾기보다 있는 그대로의 스토리를 즐긴다.", { main: 'S', opposite: 'N' }),
    createQ(16, "나는 현실적인 문제 해결이 미래에 대한 막연한 비전보다 훨씬 더 시급하다고 느낀다.", { main: 'S', opposite: 'N' }),
    createQ(17, "나는 물건을 살 때 성능, 가격 등 객관적인 스펙을 꼼꼼하게 따지는 편이다.", { main: 'S', opposite: 'N' }),
    createQ(18, "나는 주변의 변화(머리 스타일, 옷차림 등)를 아주 세밀하게 잘 포착한다.", { main: 'S', opposite: 'N' }),
    createQ(19, "나는 복잡한 이론적 설명보다 직접 몸으로 부딪쳐 배우는 것을 선호한다.", { main: 'S', opposite: 'N' }),
    createQ(20, "나는 꿈이나 공상을 하기보다 현재 내가 하고 있는 일에 집중하는 편이다.", { main: 'S', opposite: 'N' }),

    // --- T vs F (판단) ---
    createQ(21, "나는 어떤 결정을 내릴 때 감정보다 논리적인 타당성을 우선시한다.", { main: 'T', opposite: 'F' }),
    createQ(22, "나는 친구가 고민을 털어놓을 때 위로보다 실질적인 해결책을 먼저 생각한다.", { main: 'T', opposite: 'F' }),
    createQ(23, "나는 옳고 그름을 판단할 때 예외를 두기보다 원칙을 지키는 것이 더 중요하다고 믿는다.", { main: 'T', opposite: 'F' }),
    createQ(24, "나는 업무나 프로젝트에서 인간관계보다 성과와 효율성을 더 중요하게 생각한다.", { main: 'T', opposite: 'F' }),
    createQ(25, "나는 비판적인 피드백을 들었을 때 감정적으로 상처받기보다 나를 개선할 기회로 삼는다.", { main: 'T', opposite: 'F' }),
    createQ(26, "나는 논리적으로 모순되는 주장을 보면 참지 못하고 지적하고 싶은 욕구가 생긴다.", { main: 'T', opposite: 'F' }),
    createQ(27, "나는 공평하다는 것은 모든 사람에게 똑같은 규칙을 적용하는 것이라고 생각한다.", { main: 'T', opposite: 'F' }),
    createQ(28, "나는 상황을 객관적으로 분석하기 위해 감정을 배제하고 제3자의 입장에서 보려 노력한다.", { main: 'T', opposite: 'F' }),
    createQ(29, "나는 '착한 사람'이라는 평가보다 '능력 있는 사람'이라는 평가가 더 기분 좋다.", { main: 'T', opposite: 'F' }),
    createQ(30, "나는 토론이나 협상에서 상대방의 감정을 배려하기보다 내 주장의 논리를 관철시키는 편이다.", { main: 'T', opposite: 'F' }),

    // --- J vs P (생활) ---
    createQ(31, "나는 여행을 갈 때 분 단위 혹은 시간 단위로 세부 일정을 짜야 안심이 된다.", { main: 'J', opposite: 'P' }),
    createQ(32, "나는 일을 시작하기 전에 항상 To-Do 리스트를 작성하고 우선순위를 정한다.", { main: 'J', opposite: 'P' }),
    createQ(33, "나는 약속 시간이 어긋나거나 계획이 갑자기 바뀌면 큰 스트레스를 받는다.", { main: 'J', opposite: 'P' }),
    createQ(34, "나는 사용한 물건은 제자리에 두어야 하며, 주변이 정리되어 있어야 집중이 잘 된다.", { main: 'J', opposite: 'P' }),
    createQ(35, "나는 마감 기한이 임박해서 일을 하기보다 미리미리 끝내두는 편을 선호한다.", { main: 'J', opposite: 'P' }),
    createQ(36, "나는 어떤 일을 결정하기 전에 모든 가능성을 분석하고 확신이 설 때까지 고민한다.", { main: 'J', opposite: 'P' }),
    createQ(37, "나는 일상의 루틴을 지키는 것이 삶의 안정감을 준다고 느낀다.", { main: 'J', opposite: 'P' }),
    createQ(38, "나는 한꺼번에 여러 일을 벌이기보다 하나를 완벽하게 끝내고 다음으로 넘어간다.", { main: 'J', opposite: 'P' }),
    createQ(39, "나는 준비되지 않은 즉흥적인 모임이나 제안은 거절하고 싶을 때가 많다.", { main: 'J', opposite: 'P' }),
    createQ(40, "나는 결과만큼 과정의 효율적인 시스템 구축이 중요하다고 생각한다.", { main: 'J', opposite: 'P' })
];
