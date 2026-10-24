# GA4 보고 설정 체크리스트

코드는 기존 측정 ID `G-XJ8Z43C6LQ`를 사용합니다. 이용자가 분석에 동의한 경우에만 Google 태그(gtag.js)를 로드하고, `config`에서 최초 방문의 표준 `page_view`를 전송합니다. 자체 이벤트 `page_view_internal`과 `route_view`도 유지합니다. 자동 광고 저장·맞춤설정 동의는 항상 거부 상태입니다.

## 사이트 연결 상태 확인 (2026-10-25)

1. [Google Analytics](https://analytics.google.com/)에 사이트 관리 계정으로 로그인합니다.
2. **관리 → 데이터 스트림 → 웹**에서 `https://my-music-vibe.com`에 연결된 데이터 스트림을 선택합니다. 여기서 **측정 ID가 `G-XJ8Z43C6LQ`인지 확인**합니다. 측정 ID가 다르거나 스트림이 삭제되어 있다면 GA4 쪽 ID를 확인한 뒤 저장소 상수를 바꿔야 합니다. 코드에 값이 남아 있다는 사실만으로 연결이 보장되지는 않습니다.
3. 사이트를 시크릿 창에서 열고 '분석 허용'을 선택합니다. 이미 '필수만 사용'을 선택했다면 하단 **분석 설정**을 누르고 변경할 수 있습니다.
4. **보고서 → 실시간**에서 `page_view`, `page_view_internal`, `landing_view` 등의 이벤트를 확인합니다. 실제 코드가 사이트에 배포되어야 이 테스트가 유효합니다. 보고서 처리는 최대 24~48시간 걸릴 수 있으므로 우선 실시간 보고서를 확인합니다.
5. 자세한 디버깅은 [Google Tag Assistant](https://tagassistant.google.com/)로 디버그 모드를 켠 뒤 **관리 → 데이터 표시 → DebugView**에서 확인합니다. 사이트의 `?debug=analytics`는 로컬 계측 진단 패널일 뿐 GA4 DebugView 모드를 자동으로 켜지는 않습니다.

**SPA 주의:** 메인 앱의 해시 라우트 이동은 `route_view` 커스텀 이벤트로 계측됩니다. GA4에서 '향상된 측정 → 페이지 조회수 → 브라우저 기록 이벤트에 따른 페이지 변경'을 켜면 추가 `page_view`가 자동 생성될 수 있고 URL fragment가 포함될 수 있습니다. 공유 토큰의 외부 전송 위험을 줄이려면 이 자동 기록 옵션은 끄고, 향후 별도로 안전한 내부 라우트 page_view를 구현해 검증해야 합니다. 최초 문서 로드의 표준 `page_view`는 `gtag('config')`에서 허용합니다.

**개인정보:** 동의 전에는 Google 태그를 로드하지 않고 영구 방문자 ID를 생성하지 않습니다. '필수만 사용'을 선택하거나 분석 동의를 철회하면 맞춤 이벤트 전송을 중단합니다. 수집되는 `page_location`에는 URL query와 `#` fragment를 포함하지 않습니다. AdSense 광고 스크립트는 여전히 비활성화 상태입니다.

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
