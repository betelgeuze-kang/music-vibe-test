# Music Vibe 실험 운영

실험 배정은 결정론적 배정(deterministic assignment, 같은 방문자는 같은 변형을 계속 받는 방식)을 사용합니다. `visitor_id + experiment_id` 해시로 버킷을 정하고, 결과를 로컬 저장소에 보관합니다.

## 안전 규칙

- 운영 상태 `active`는 정확히 하나만 허용합니다.
- 다음 실험은 앞 실험의 의사결정이 끝난 뒤 활성화합니다.
- 배포 전 `npm test`가 활성 실험 수를 검사합니다.
- QA는 `?exp=<id>&variant=<variant>` 미리보기 URL로 수행합니다.
- 미리보기 배정은 운영 버킷을 덮어쓰지 않습니다.

## 실험 목록

| ID | 변형 | 상태 | 1차 지표 |
|---|---|---|---|
| `landing_copy_v1` | `concrete`, `abstract` | active | 테스트 시작률 |
| `test_length_v1` | `quick_12`, `deep_40` | ready | 테스트 완료율 |
| `result_delay_v1` | `instant`, `legacy_2500` | ready | 결과 도달률 |
| `share_placement_v1` | `top`, `bottom` | ready | 공유 성공률 |
| `export_card_v1` | `classic_a`, `poster_b` | ready | 이미지 저장률 |
| `playlist_visibility_v1` | `visible`, `hidden` | ready | 플레이리스트 클릭률 및 공유율 |

## 미리보기 예시

```text
/?exp=test_length_v1&variant=deep_40&debug=analytics
/?exp=result_delay_v1&variant=legacy_2500&debug=analytics
/?exp=share_placement_v1&variant=bottom&debug=analytics
/?exp=export_card_v1&variant=poster_b&debug=analytics
/?exp=playlist_visibility_v1&variant=hidden&debug=analytics
```

## 의사결정 기준

- 최소 7일 동안 실행하고 요일 편향을 줄입니다.
- 각 변형에서 최소 300명의 `landing_view`를 기본 목표로 사용합니다. 트래픽이 적다면 기간을 늘리고 표본을 임의로 중단하지 않습니다.
- 1차 지표가 악화되지 않으면서 오류율, 이탈률, 성능 지표에 유의미한 손상이 없는지 확인합니다.
- 실험 결과에는 기간, 변형별 사용자 수, 1차·보조 지표, 결정, 후속 작업을 기록합니다.

## 새 실험 활성화 절차

1. 현재 `active` 실험 결과를 문서화합니다.
2. 기존 실험 상태를 `completed`로 변경합니다.
3. 다음 실험 하나만 `active`로 변경합니다.
4. 양쪽 변형을 미리보기 URL로 확인합니다.
5. `npm test`와 CI를 통과시킵니다.
6. 배포 후 `experiment_exposure`가 두 변형으로 들어오는지 확인합니다.
