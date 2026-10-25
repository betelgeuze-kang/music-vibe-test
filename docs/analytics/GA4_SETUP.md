# GA4 운영 설정 및 검증 (2026-10-25)

속성 **517285196 · 음악 성격 유형 테스트**, 웹 스트림 **13179703598 · Music Vibe Web**, 측정 ID **G-XJ8Z43C6LQ**를 사용합니다. GA4와 Windsor metadata에서 일치 확인했습니다.

## 동의와 URL 보호

- 초기 Consent Mode는 analytics_storage, ad_storage, ad_user_data, ad_personalization 모두 denied입니다.
- 분석 허용 시에만 별도 `/analytics-frame.html` 문서에서 Google 태그를 로드합니다. analytics_storage만 granted, 광고 영역과 Google signals는 계속 비활성입니다.
- 이 문서는 고정된 URL을 가지며 no-referrer 정책을 씁니다. Google의 자동 History API 관찰은 앱 창에 설치되지 않습니다. 같은 출처 문서이므로 모든 제3자 코드에 대한 보안 sandbox라고 주장하지 않습니다.
- 첫 페이지 조회는 config의 send_page_view:true로 1회 발생합니다. 앱 이동은 기존 route_view 이벤트로 유지하며 이 이벤트를 표준 page_view로 중복 전송하지 않습니다.
- 모든 명시 이벤트의 page_location 및 page_referrer를 전송 직전에 origin+pathname으로 강제합니다. query/fragment, profile_id, 비교 토큰, 자유 입력 오류·소스 URL은 제외합니다.
- 앱이 생성한 공유 UTM만 허용하고 GA 표준 campaign 필드에 전달합니다. 임의 UTM 문자열·검색어는 제외합니다.
- 동의 전 이벤트를 소급 전송하지 않습니다. 방문·세션 식별자와 attribution 저장은 동의 이후만 허용합니다. 기능용 프로필 저장은 별개입니다.
- 철회 시 ga-disable를 동기 설정한 다음 실행 문서를 제거하고, 대기열·분석 식별자·기존 _ga 계열 쿠키를 삭제합니다. 다른 열린 탭에도 철회가 전달됩니다. 이미 전송된 데이터는 자동 삭제되지 않습니다.
- AdSense는 계속 OFF입니다.

## 운영 계정에서 직접 적용한 설정

GA4 관리 → 데이터 수집 및 수정 → 데이터 스트림 → Music Vibe Web → 향상된 측정 톱니 → 페이지 조회 고급 설정에서 **브라우저 방문 기록 이벤트를 토대로 한 페이지 변경사항 OFF**를 저장하고 다시 열어 확인했습니다. 스크롤·이탈 클릭·사이트 검색·양식·동영상·파일 다운로드 자동 측정도 OFF로 저장했습니다. 페이지 로드는 유지합니다. 별도 문서 격리와 함께 자동 URL 수집을 줄이는 방어입니다.

Google 공식 문서상 send_page_view:false만으로 향상된 측정 History API 조회를 막을 수 없습니다: https://developers.google.com/analytics/devguides/collection/ga4/views

## 배포 후 검증

1. 새 브라우저에서 실제 도메인을 열고 '필수만 사용': GA 태그/collect 요청과 분석 식별자 없음.
2. 하단 '분석 설정' → '분석 허용': gtag/js 응답과 G-XJ8Z43C6LQ의 page_view 확인.
3. 공유 링크를 열어 친구 프로필 해독·화면 동작 유지, GA 요청 URL과 POST body 전체에서 테스트 토큰/민감 query 부재 확인.
4. History API pushState/replaceState, hash 이동, 뒤로/앞으로 후에도 전송 주소가 깨끗한지 확인.
5. 철회 순간부터 후속 이벤트/페이지 이동/종료에서 GA 전송이 없는지 확인. 재허용 때 새 실행 문서와 첫 page_view 1회 확인.
6. GA4 보고서 → 실시간 개요에서 page_view와 자체 이벤트 확인. 브라우저 HTTP 204는 전송 응답 증거이며 GA 보고서 수신과 구별합니다.
7. Windsor.ai 날짜·이벤트 종류로 재조회. TRIAL에서는 force_refresh가 거절될 수 있고, 캐시 0행은 최신 수신 실패를 뜻하지 않습니다.

`tests/e2e/ga4-consent.spec.mjs`의 태그 대역은 동의/전송 계약 회귀 검사용이며 실제 GA4 수신 증거가 아닙니다. 실제 도메인 네트워크 및 계정 UI 검증을 별도로 수행합니다.

## Cloudflare RUM

현재 RUM 자동 삽입은 GA4 선택과 별개로 활성(EU 제외)입니다. 연결 API로 auto_install:false 변경을 시도했으나 account-settings.write 권한 부족으로 거절되었습니다. GA4 거부·철회가 RUM을 끈다고 표시하지 않습니다. 관리자가 Cloudflare 계정 → Web Analytics → my-music-vibe.com → Manage site → Automatic setup → Disable로 변경할 수 있습니다. 변경 후 HTML의 static.cloudflareinsights.com/beacon 및 /cdn-cgi/rum 요청 유무를 확인해야 합니다.

RUM, CDN 접속 기록, GA4 이벤트는 서로 다른 측정이며 합산 방문자/실사용자 수로 해석하지 않습니다.
