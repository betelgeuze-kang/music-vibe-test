# 퍼널 및 추천 루프 정의

퍼널(funnel, 사용자가 목표 행동까지 이동하는 단계별 흐름)은 사용자 수 기준으로 계산합니다. 같은 사용자가 한 세션에서 이벤트를 여러 번 발생시켜도 단계별 고유 `visitor_id`를 기준으로 집계합니다.

## 핵심 제품 퍼널

```text
landing_view
  → start_test
  → test_complete
  → result_view
  → share_success
```

| 지표 | 계산식 | 진단 의미 |
|---|---|---|
| 테스트 시작률 | `start_test 사용자 / landing_view 사용자` | 랜딩 문구와 CTA 설득력 |
| 테스트 완료율 | `test_complete 사용자 / start_test 사용자` | 문항 수, 난이도, 진행 경험 |
| 결과 도달률 | `result_view 사용자 / start_test 사용자` | 계산·전환 오류와 결과 대기 이탈 |
| 결과 공유율 | `share_success 사용자 / result_view 사용자` | 결과 매력도와 공유 UX |
| 플레이리스트 이용률 | `playlist_click 사용자 / result_view 사용자` | 결과의 실용적 가치 |
| 이미지 저장률 | `image_save_success 사용자 / result_view 사용자` | 공유 카드 수요 |

## 문항 이탈 분석

`test_abandon`의 `last_question`과 `progress_percent`를 사용합니다.

권장 보고 구간:

- 0%: 시작 직후 이탈
- 1–25%: 오디오 문항 구간
- 26–67%: 중간 취향 문항 구간
- 68–99%: 완료 직전 구간

`visibility_hidden_30s`는 앱이 30초 이상 백그라운드에 있었을 때만 이탈로 인정합니다. 앱 전환이나 잠깐의 알림 확인을 이탈로 과대 계산하지 않기 위한 기준입니다.

## 추천 루프

```text
share_success
  → static_result_view(shared_entry=true)
  → ref_visit
  → ref_cta_click
  → start_test
  → ref_complete
```

| 지표 | 계산식 |
|---|---|
| 공유 방문 전환율 | 공유 유입 `ref_visit / share_success` |
| 정적 결과 CTA율 | `ref_cta_click / static_result_view(shared_entry=true)` |
| 추천 테스트 시작률 | 추천 세션의 `start_test / ref_visit` |
| 추천 완료율 | `ref_complete / ref_visit` |
| 동일 바이브율 | `ref_complete(referral_match=true) / ref_complete` |

공유 수와 방문 수는 서로 다른 기기에서 발생할 수 있어 완벽한 1:1 연결은 불가능합니다. 캠페인·결과 유형 단위의 집계 귀속을 기본으로 사용합니다.

## GA4 탐색 보고서 권장 설정

1. 자유 형식 탐색에서 행에 `event_name`, 열에 `test_mode` 또는 `experiment_variant`를 둡니다.
2. 값은 총 사용자 수와 이벤트 수를 함께 확인합니다.
3. 퍼널 탐색에는 위 핵심 제품 퍼널을 닫힌 퍼널로 먼저 만들고, 별도로 열린 퍼널도 비교합니다.
4. 세그먼트는 `language`, `traffic_source`, `ref_type`, `experiment_id`를 사용합니다.
5. 테스트 오류와 성능은 제품 퍼널과 별도 보고서로 관리합니다.
