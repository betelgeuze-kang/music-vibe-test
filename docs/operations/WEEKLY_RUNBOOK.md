# 주간 운영 런북

런북(runbook, 반복 운영 절차를 정리한 문서)은 매주 같은 순서로 제품 상태를 확인하기 위한 기준입니다.

## 월요일: 데이터 품질

1. `page_view_internal`과 `landing_view`가 비슷한 추세인지 확인합니다.
2. `start_test`보다 `test_complete`가 많은 비정상 구간이 없는지 확인합니다.
3. `experiment_exposure`에 활성 실험 외 ID가 운영 유입으로 들어오지 않는지 확인합니다.
4. `test_error`를 오류 유형과 소스 파일로 정렬합니다.
5. `performance_summary`의 LCP·CLS·FID 중앙값과 상위 75백분위수를 확인합니다.

## 화요일: 핵심 퍼널

- 랜딩 → 시작
- 시작 → 완료
- 완료 → 결과
- 결과 → 공유
- 결과 → 플레이리스트

언어, 모바일/데스크톱, 직접/검색/공유 유입으로 나누어 전주와 비교합니다.

## 수요일: 추천 루프

1. 결과 유형별 `share_success`를 확인합니다.
2. `static_result_view(shared_entry=true)`와 `ref_visit` 차이를 확인합니다.
3. `ref_cta_click`, 추천 `start_test`, `ref_complete` 전환을 계산합니다.
4. 추천 유입이 없는 정적 결과의 검색 방문은 별도 SEO 성과로 분리합니다.

## 목요일: 실험 점검

- 변형별 노출 비율이 설정한 가중치와 크게 어긋나지 않는지 확인합니다.
- 1차 지표와 함께 `test_error`, `test_abandon`, 성능 저하를 확인합니다.
- 조기 승자 판단을 피하고 최소 운영 기간을 지킵니다.

## 금요일: 배포와 기록

1. 이번 주 관찰 결과를 GitHub Issue에 기록합니다.
2. 다음 주에 검증할 가설을 한 개만 선택합니다.
3. PR에는 이벤트 변경, 실험 변경, 예상 지표 영향을 명시합니다.
4. `npm test`와 GitHub Actions CI 통과 후 병합합니다.
5. 배포 후 아래 URL로 실시간 계측을 점검합니다.

```text
/?lang=kr&debug=analytics
/ko/results/enfp/?src=share&utm_medium=share&debug=analytics
```

## 장애 기준

다음 중 하나가 발생하면 실험보다 복구를 우선합니다.

- 테스트 시작 버튼이 동작하지 않음
- 완료 후 결과가 표시되지 않음
- 공유 URL이 404로 연결됨
- 오류 이벤트가 평시의 2배 이상 증가
- 결과 도달률이 전주 대비 20% 이상 하락
- LCP 75백분위수가 4초를 초과
