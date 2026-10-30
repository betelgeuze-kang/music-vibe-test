import { loadProfile, recordInteraction } from '../infrastructure/storage.mjs?weekly=m4w1';
import { installConsentAccessibility } from './consent-a11y.mjs?frontend=fq1';

const guideId = ['night','focus','lift','together'].includes(document.body.dataset.guideId) ? document.body.dataset.guideId : 'index';
const language = document.documentElement.lang === 'ko' ? 'kr' : 'en';
const profile = loadProfile();
const personalize = document.querySelector('[data-guide-personalize]');
if (profile && personalize && guideId !== 'index') {
  personalize.href = `/?lang=${language}#/now?context=${guideId}`;
  personalize.textContent = language === 'kr' ? '내 취향으로 다섯 곡 찾기 ↗' : 'Find five songs for my taste ↗';
}
installConsentAccessibility();
document.addEventListener('click',(event)=>{
  if (event.target.closest('[data-guide-consent]')) window.MusicVibeAnalytics?.openConsentPreferences?.();
  const link = event.target.closest('[data-track-link]');
  if (!link) return;
  const card = link.closest('[data-track-id]');
  const payload = { track_id:card?.dataset.trackId || '', platform:link.dataset.platform, placement:'listening_guide', context_id:guideId };
  window.trackEvent?.('playlist_click',payload);
  recordInteraction({ type:'track_click', trackId:payload.track_id, artist:card?.dataset.trackArtist || '', placement:payload.placement, contextId:guideId, profileId:profile?.id || '' });
});
