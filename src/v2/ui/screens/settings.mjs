import { productDataSummary } from '../../infrastructure/data-portability.mjs?data=data1';
import { escapeHtml, track } from '../helpers.mjs?v3=nv1';

function countLine(label, value, language) {
  return `<li><span>${escapeHtml(label)}</span><strong>${Number(value || 0).toLocaleString(language === 'kr' ? 'ko-KR' : 'en-US')}</strong></li>`;
}

export function renderSettings(app) {
  const korean = app.language === 'kr';
  const summary = productDataSummary();
  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <div class="data-page">
      <section class="data-hero">
        <span class="eyebrow">${korean ? '내가 남긴 것들' : 'WHAT I HAVE LEFT HERE'}</span>
        <h1>${korean ? '기록은 내가 꺼내볼 수 있어야 하고, 원하면 지울 수 있어야 합니다.' : 'A note should be yours to take with you—and yours to erase.'}</h1>
        <p>${korean
          ? '프로필과 주간 기록, 곡에 남긴 반응은 이 브라우저 안에 있습니다. 한 파일로 챙겨가거나, 필요한 부분만 비울 수 있습니다.'
          : 'Profiles, weekly notes, and track feedback live in this browser. Take them with you in one file, or clear only the part you no longer want.'}</p>
      </section>

      <section class="data-summary" aria-labelledby="data-summary-title">
        <div><span class="eyebrow">${korean ? '지금 이 브라우저에' : 'IN THIS BROWSER'}</span><h2 id="data-summary-title">${korean ? '남아 있는 기록' : 'Notes currently kept'}</h2></div>
        <ul>
          ${countLine(korean ? '현재 프로필' : 'Current profile', summary.hasProfile ? 1 : 0, app.language)}
          ${countLine(korean ? '프로필 타임라인' : 'Profile timeline', summary.timelineCount, app.language)}
          ${countLine(korean ? '최근 선곡' : 'Recent selections', summary.recommendationCount, app.language)}
          ${countLine(korean ? '곡 반응' : 'Track feedback', summary.feedbackCount, app.language)}
          ${countLine(korean ? '청취 행동' : 'Listening actions', summary.interactionCount, app.language)}
          ${countLine(korean ? '주간 기록' : 'Weekly notes', summary.weeklyCount, app.language)}
        </ul>
      </section>

      <section class="data-section" aria-labelledby="data-export-title">
        <div class="data-section__copy">
          <span class="eyebrow">${korean ? '내보내기' : 'EXPORT'}</span>
          <h2 id="data-export-title">${korean ? '한 파일로 챙겨가기' : 'Take the notebook with you'}</h2>
          <p>${korean ? '읽을 수 있는 JSON 파일로 저장합니다. 분석용 익명 ID는 파일에 넣지 않습니다.' : 'Save a readable JSON file. The anonymous analytics identifier is deliberately left out.'}</p>
        </div>
        <button type="button" class="button button--light" data-action="export-user-data">${korean ? '내 데이터 내려받기' : 'Download my data'}</button>
      </section>

      <section class="data-section" aria-labelledby="data-import-title">
        <div class="data-section__copy">
          <span class="eyebrow">${korean ? '가져오기' : 'IMPORT'}</span>
          <h2 id="data-import-title">${korean ? '다른 브라우저에서 이어 쓰기' : 'Continue in another browser'}</h2>
          <p>${korean ? 'My Music Vibe에서 내보낸 파일만 읽습니다. 가져오면 이 브라우저의 제품 기록을 파일 내용으로 바꿉니다.' : 'Only files exported by My Music Vibe are accepted. Importing replaces the product notes in this browser.'}</p>
        </div>
        <label class="data-file-button">
          <span>${korean ? '데이터 파일 고르기' : 'Choose a data file'}</span>
          <input type="file" accept="application/json,.json" data-user-data-file>
        </label>
      </section>

      <section class="data-section data-section--preferences" aria-labelledby="data-preferences-title">
        <div class="data-section__copy">
          <span class="eyebrow">${korean ? '외부로 나가는 정보' : 'WHAT MAY LEAVE THE BROWSER'}</span>
          <h2 id="data-preferences-title">${korean ? '개인정보 선택 다시 보기' : 'Review privacy choices'}</h2>
          <p>${korean ? '익명 분석 동의를 바꾸거나 분석용 익명 ID를 지울 수 있습니다. 광고 관련 선택은 광고가 꺼진 동안 비활성입니다.' : 'Change anonymous analytics consent or delete the analytics identifier. Advertising choices remain disabled while ads are off.'}</p>
        </div>
        <button type="button" class="button button--ghost" data-consent-settings>${korean ? '개인정보 설정 열기' : 'Open privacy choices'}</button>
      </section>

      <section class="data-clear" aria-labelledby="data-clear-title">
        <header><span class="eyebrow">${korean ? '필요한 만큼만 비우기' : 'CLEAR ONLY WHAT YOU MEAN TO'}</span><h2 id="data-clear-title">${korean ? '기록을 나누어 지울 수 있습니다.' : 'The notebook can be cleared in parts.'}</h2><p>${korean ? '버튼을 누르기 전 한 번 더 묻습니다. 지운 기록은 이 서비스에서 되살릴 수 없습니다.' : 'We ask once more before anything is removed. Deleted notes cannot be restored by this service.'}</p></header>
        <div class="data-clear__grid">
          <button type="button" data-action="clear-data-category" data-category="profile"><strong>${korean ? '현재 프로필' : 'Current profile'}</strong><span>${korean ? '지금 선택된 취향 기록만 지웁니다.' : 'Remove only the active taste note.'}</span></button>
          <button type="button" data-action="clear-data-category" data-category="timeline"><strong>${korean ? '프로필 타임라인' : 'Profile timeline'}</strong><span>${korean ? '지난 날짜의 기록만 비웁니다.' : 'Remove notes from earlier dates.'}</span></button>
          <button type="button" data-action="clear-data-category" data-category="feedback"><strong>${korean ? '곡 반응' : 'Track feedback'}</strong><span>${korean ? '더 듣고 싶어요·덜 듣고 싶어요 표시를 지웁니다.' : 'Remove more-like-this and less-like-this marks.'}</span></button>
          <button type="button" data-action="clear-data-category" data-category="weekly"><strong>${korean ? '주간 기록' : 'Weekly notes'}</strong><span>${korean ? '저장된 Weekly Vibe만 비웁니다.' : 'Remove saved Weekly Vibe recaps.'}</span></button>
          <button type="button" data-action="clear-data-category" data-category="activity"><strong>${korean ? '청취 행동과 방문 날짜' : 'Listening actions and visit dates'}</strong><span>${korean ? '주간 기록을 만드는 바탕을 지웁니다.' : 'Remove the activity used to build weekly notes.'}</span></button>
          <button type="button" class="is-danger" data-action="clear-all-user-data"><strong>${korean ? '이 브라우저의 모든 기록' : 'Everything in this browser'}</strong><span>${korean ? '제품 기록과 분석용 익명 ID를 함께 지웁니다.' : 'Remove product notes and the anonymous analytics identity.'}</span></button>
        </div>
      </section>
    </div>
  `;
  app.renderNotice();
  track('data_settings_view', { product_version: 'v3-data1', has_profile: summary.hasProfile, timeline_count: summary.timelineCount, feedback_count: summary.feedbackCount, weekly_count: summary.weeklyCount });
}
