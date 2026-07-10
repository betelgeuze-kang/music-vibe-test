# GA4 보고 설정 체크리스트

코드는 측정 ID `G-XJ8Z43C6LQ`로 이벤트를 전송합니다. 자동 `page_view`는 비활성화하고 `page_view_internal`을 명시적으로 사용합니다.

## 사용자 정의 측정기준 권장 목록

GA4 관리 화면의 사용자 정의 정의에서 다음 이벤트 범위 측정기준을 등록하면 탐색 보고서에서 바로 사용할 수 있습니다.

- `test_mode`
- `result_type`
- `language`
- `ref_type`
- `traffic_source`
- `utm_campaign`
- `experiment_id`
- `experiment_variant`
- `placement`
- `share_method`
- `abandon_reason`
- `question_number`

사용자 정의 측정항목 권장 목록:

- `elapsed_ms`
- `progress_percent`
- `lcp_ms`
- `cls_milli`
- `fid_ms`

## 전환으로 표시할 이벤트

- `test_complete`
- `share_success`
- `ref_complete`
- 필요 시 `playlist_click`

## 개인정보 원칙

- 이름, 이메일, 전화번호, 자유 입력문을 이벤트 파라미터로 보내지 않습니다.
- 전체 URL 대신 쿼리 문자열을 제외한 `page_path`와 허용된 UTM 필드만 전송합니다.
- 분석 스크립트는 선택적 쿠키 동의 이후에만 로드합니다.
- 거부한 경우 페이지 내 이벤트도 전송하지 않고 폐기합니다.
