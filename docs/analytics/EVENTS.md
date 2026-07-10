# Music Vibe 분석 이벤트 사전

이 문서는 GA4로 전송되는 제품 이벤트와 파라미터의 기준입니다. 모든 이벤트는 사용자가 선택적 분석 쿠키에 동의한 뒤 전송됩니다. 동의 전 이벤트는 현재 페이지의 메모리 큐에만 보관되며, 거부하면 폐기됩니다.

## 공통 파라미터

| 파라미터 | 의미 |
|---|---|
| `visitor_id` | 브라우저에 저장되는 익명 방문자 식별자. 실험 변형을 안정적으로 고정하는 데 사용합니다. |
| `session_id` | 탭 세션 단위 익명 식별자입니다. |
| `visit_id` | 페이지 로드마다 새로 생성되는 방문 식별자입니다. |
| `page_type` | `app` 또는 `static_result`입니다. |
| `page_path` | 쿼리 문자열을 제외한 현재 경로입니다. |
| `language` | 현재 UI 언어입니다. |
| `test_mode` | `quick_12` 또는 `deep_40`입니다. |
| `result_type` | 결과 유형입니다. 결과 전에는 생략됩니다. |
| `ref_type` | 추천 링크의 친구 결과 유형입니다. |
| `traffic_source` | `share`, `static_result` 같은 내부 유입 출처입니다. |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` | 캠페인 귀속(attribution, 어떤 유입이 성과를 만들었는지 연결하는 과정)을 위한 값입니다. |
| `experiment_id`, `experiment_variant` | 현재 활성 또는 미리보기 실험과 변형입니다. |

이 식별자는 이름, 이메일, 전화번호 같은 직접 식별 정보를 포함하지 않습니다.

## 핵심 퍼널 이벤트

| 이벤트 | 발생 시점 | 핵심 파라미터 |
|---|---|---|
| `page_view_internal` | 앱 또는 정적 결과 페이지 로드 | `document_title` |
| `landing_view` | 앱 랜딩 렌더링 | `landing_variant`, `offered_test_mode`, `referral_present` |
| `start_test` | 테스트 시작 버튼 선택 | `test_mode`, `question_count` |
| `question_answer` | 각 문항 응답 | `question_number`, `question_count`, `question_kind`, `axis`, `selected_type` |
| `test_complete` | 전체 응답 완료 | `result_type`, `question_count`, `elapsed_ms` |
| `result_view` | 앱 결과가 실제로 표시됨 | `result_type`, `result_origin`, `elapsed_ms` |
| `test_abandon` | 완료 전 페이지 이탈·초기화 | `abandon_reason`, `last_question`, `progress_percent`, `elapsed_ms` |
| `result_abandon` | 응답 완료 후 결과 표시 전에 이탈 | `abandon_reason`, `elapsed_ms` |

`test_complete`와 `result_view`를 분리한 이유는 결과 계산 완료와 사용자에게 결과가 실제 노출된 시점이 다를 수 있기 때문입니다.

## 추천 루프 이벤트

| 이벤트 | 발생 시점 | 핵심 파라미터 |
|---|---|---|
| `static_result_view` | 검색 가능한 정적 결과 페이지 방문 | `result_type`, `shared_entry` |
| `ref_visit` | 공유 신호가 있는 결과 페이지 또는 추천 앱 랜딩 방문 | `ref_type`, `referral_stage`, `traffic_source` |
| `ref_cta_click` | 정적 결과에서 테스트 CTA 선택 | `ref_type`, `referral_stage` |
| `ref_complete` | 추천 유입 사용자가 테스트 완료 후 결과 확인 | `ref_type`, `result_type`, `referral_match`, `elapsed_ms` |

정적 결과 URL을 검색으로 방문한 경우에는 `static_result_view`만 기록합니다. `src=share`, `utm_medium=share|social|referral`, 또는 명시적인 `ref`가 있는 흐름만 추천 유입으로 귀속합니다.

## 콘텐츠·공유 이벤트

| 이벤트 | 발생 시점 | 핵심 파라미터 |
|---|---|---|
| `audio_choice_preview` | 오디오 A/B 문항 미리듣기 | `question_id`, `option`, `axis` |
| `audio_play` | 결과 대표 음악 재생 | `audio_context`, `result_type` |
| `playlist_click` | 추천 곡 링크 선택 | `track_title`, `track_artist` 또는 `track_detail`, `track_position`, `placement` |
| `share_click` | 공유 버튼 선택 | `share_method`, `placement`, `result_type` |
| `share_success` | 네이티브 공유 완료 또는 링크 복사 성공 | `share_method`, `placement` |
| `share_cancel` | 네이티브 공유창 취소 | `share_method`, `placement` |
| `share_intent_open` | Kakao/X 공유 인터페이스 열기 | `share_method`, `placement` |
| `share_error` | 공유 처리 실패 | `share_method`, `error_name` |
| `image_save` | 결과 이미지 생성·저장 요청 | `export_variant`, `placement` |
| `image_save_success` | 생성된 결과 이미지 다운로드 완료 | `export_variant` |
| `sample_result_click` | 랜딩의 결과 예시 선택 | `result_type`, `placement` |

외부 앱의 최종 게시 완료 여부는 브라우저가 확인할 수 없으므로 Kakao/X는 `share_success`가 아니라 `share_intent_open`으로 구분합니다.

## 실험·품질 이벤트

| 이벤트 | 발생 시점 | 핵심 파라미터 |
|---|---|---|
| `experiment_exposure` | 실험 변형이 실제 UI에 노출됨 | `experiment_id`, `experiment_variant`, `exposure_placement`, `assignment_source` |
| `test_error` | JavaScript·Promise·리소스 오류 | `error_type`, `error_message`, `source_file` |
| `performance_summary` | 페이지 로드 또는 종료 시 1회 | `dom_content_loaded_ms`, `load_complete_ms`, `lcp_ms`, `cls_milli`, `fid_ms` |

## 디버그

URL에 `?debug=analytics`를 추가하면 현재 동의 상태, 추천 귀속, 실험 변형, 큐 길이, 최근 이벤트가 화면 우측 패널에 표시됩니다.

예시:

```text
https://my-music-vibe.com/?lang=kr&debug=analytics
```
