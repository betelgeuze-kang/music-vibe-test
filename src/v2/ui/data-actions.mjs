import { clearProductData, exportUserData, importUserData, parseImportText } from '../infrastructure/data-portability.mjs?data=data1';
import { showConfirmDialog } from './dialogs.mjs?commercial=cr1';
import { track } from './helpers.mjs?v3=nv1';

function downloadJson(payload) {
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `my-music-vibe-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function categoryCopy(category, language) {
  const korean = language === 'kr';
  const copy = {
    profile: korean ? ['현재 프로필을 지울까요?', '지난 기록과 곡 반응은 남고, 지금 선택된 프로필만 사라집니다.'] : ['Delete the current profile?', 'Earlier notes and track feedback will remain; only the active profile is removed.'],
    timeline: korean ? ['지난 프로필 기록을 지울까요?', '현재 프로필은 남고 날짜별 타임라인만 사라집니다.'] : ['Delete earlier profile notes?', 'The current profile remains; only the dated timeline is removed.'],
    feedback: korean ? ['곡에 남긴 반응을 지울까요?', '더 듣고 싶어요·덜 듣고 싶어요 표시가 모두 사라집니다.'] : ['Delete track feedback?', 'All more-like-this and less-like-this marks will be removed.'],
    weekly: korean ? ['저장된 주간 기록을 지울까요?', 'Weekly Vibe 카드와 지난 주간 요약이 사라집니다.'] : ['Delete saved weekly notes?', 'Weekly Vibe cards and earlier recaps will be removed.'],
    activity: korean ? ['청취 행동과 방문 날짜를 지울까요?', '다음 Weekly Vibe는 새로 쌓이는 행동부터 시작합니다.'] : ['Delete listening actions and visit dates?', 'The next Weekly Vibe will begin with activity collected afterward.']
  };
  return copy[category] || (korean ? ['이 기록을 지울까요?', '지운 기록은 되돌릴 수 없습니다.'] : ['Delete this note?', 'Deleted notes cannot be restored.']);
}

export async function handleDataClick(app, event) {
  const target = event.target.closest('[data-action]');
  if (!target) return false;
  const action = target.dataset.action;

  if (action === 'export-user-data') {
    event.preventDefault();
    downloadJson(exportUserData());
    app.setNotice(app.language === 'kr' ? '데이터 파일을 만들었습니다.' : 'Your data file is ready.', 'success');
    track('data_export', { product_version: 'v3-data1' });
    return true;
  }

  if (action === 'clear-data-category') {
    event.preventDefault();
    const category = String(target.dataset.category || '');
    const [title, description] = categoryCopy(category, app.language);
    const accepted = await showConfirmDialog({
      title,
      description,
      cancelLabel: app.language === 'kr' ? '남겨두기' : 'Keep it',
      confirmLabel: app.language === 'kr' ? '지우기' : 'Delete',
      tone: 'danger',
      opener: target
    });
    if (!accepted) return true;
    const result = clearProductData(category);
    track('data_category_clear', { product_version: 'v3-data1', category, removed_count: result.removed.length });
    window.location.reload();
    return true;
  }

  if (action === 'clear-all-user-data') {
    event.preventDefault();
    const korean = app.language === 'kr';
    const accepted = await showConfirmDialog({
      title: korean ? '이 브라우저에 남긴 모든 기록을 지울까요?' : 'Delete everything kept in this browser?',
      description: korean ? '프로필, 타임라인, 곡 반응, 주간 기록과 분석용 익명 ID가 사라집니다. 이 작업은 되돌릴 수 없습니다.' : 'Profiles, timeline, feedback, weekly notes, and the anonymous analytics identity will be removed. This cannot be undone.',
      cancelLabel: korean ? '그대로 두기' : 'Keep everything',
      confirmLabel: korean ? '모두 지우기' : 'Delete everything',
      tone: 'danger',
      opener: target
    });
    if (!accepted) return true;
    clearProductData('all');
    window.MusicVibeConsent?.setPreferences?.({ analytics: false, adMeasurement: false, personalizedAds: false });
    window.MusicVibeConsent?.resetAnalyticsIdentity?.();
    track('data_all_clear', { product_version: 'v3-data1' });
    window.location.href = `${window.location.pathname}?lang=${app.language}#/home`;
    window.location.reload();
    return true;
  }

  return false;
}

export async function handleDataChange(app, event) {
  const input = event.target.closest('[data-user-data-file]');
  if (!input?.files?.[0]) return false;
  const file = input.files[0];
  try {
    const bundle = parseImportText(await file.text());
    const accepted = await showConfirmDialog({
      title: app.language === 'kr' ? '이 파일의 기록으로 바꿀까요?' : 'Replace this browser’s notes with the file?',
      description: app.language === 'kr' ? '현재 제품 기록은 파일에 담긴 프로필·반응·주간 기록으로 바뀝니다. 개인정보 동의와 분석용 ID는 가져오지 않습니다.' : 'Current product notes will be replaced by the profiles, feedback, and weekly notes in the file. Privacy choices and analytics identity are not imported.',
      cancelLabel: app.language === 'kr' ? '취소' : 'Cancel',
      confirmLabel: app.language === 'kr' ? '가져오기' : 'Import',
      tone: 'neutral',
      opener: input
    });
    if (!accepted) { input.value = ''; return true; }
    const result = importUserData(bundle);
    if (!result.ok) throw new Error('The browser could not save every part of the file.');
    track('data_import', { product_version: 'v3-data1', timeline_count: result.imported.profileHistory.length, weekly_count: result.imported.weeklyVibes?.items?.length || 0 });
    window.location.reload();
  } catch (error) {
    input.value = '';
    app.setNotice(app.language === 'kr' ? '이 파일은 읽을 수 없습니다. My Music Vibe에서 내보낸 JSON 파일인지 확인해주세요.' : 'This file cannot be read. Choose a JSON file exported by My Music Vibe.', 'error');
  }
  return true;
}
