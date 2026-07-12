import { recordInteraction } from '../infrastructure/storage.mjs?weekly=m4w1';
import { track } from './helpers.mjs?weekly=m4w1';

const PRODUCT_VERSION = 'v2-m4w1';

function openWeekly(app, target) {
  const anchor = String(target?.dataset.weeklyAnchor || '');
  app.weeklyAnchorAt = anchor || null;
  app.navigate('weekly');
}

function listenFromWeekly(app, target) {
  const contextId = String(target?.dataset.contextId || 'explore');
  app.pendingWeeklyContextId = contextId;
  app.weeklyAnchorAt = null;
  recordInteraction({
    type: 'weekly_continue',
    value: contextId,
    contextId,
    placement: 'weekly_vibe',
    profileId: app.profile?.id || ''
  });
  track('weekly_vibe_continue', {
    product_version: PRODUCT_VERSION,
    profile_id: app.profile?.id || '',
    context_id: contextId,
    week_key: app.latestWeeklyVibe?.weekKey || ''
  });
  app.navigate('now');
}

async function shareWeeklyCard(app) {
  const vibe = app.latestWeeklyVibe;
  if (!vibe || !app.profile) return;
  const [{ TRACK_BY_ID }, { shareWeeklyVibeCard }] = await Promise.all([
    import('../domain/recommendation.mjs?weekly=m4w1'),
    import('../infrastructure/share.mjs?weekly=m4w1')
  ]);

  try {
    const result = await shareWeeklyVibeCard(vibe, app.profile, TRACK_BY_ID, app.language);
    if (result.status === 'cancelled') return;
    recordInteraction({
      type: 'weekly_share',
      value: result.method,
      placement: 'weekly_vibe',
      profileId: app.profile.id
    });
    track('weekly_vibe_share', {
      product_version: PRODUCT_VERSION,
      profile_id: app.profile.id,
      week_key: vibe.weekKey,
      share_method: result.method,
      interaction_count: vibe.interactionCount
    });
    app.setNotice(
      app.language === 'kr'
        ? result.method === 'native' ? '이번 주 카드를 공유했어요.' : '이번 주 카드를 이미지로 저장했어요.'
        : result.method === 'native' ? 'Weekly card shared.' : 'Weekly card saved as an image.',
      'success'
    );
  } catch (error) {
    track('share_error', { product_version: PRODUCT_VERSION, error_name: error?.name || 'Error', placement: 'weekly_vibe' });
    app.setNotice(app.language === 'kr' ? '주간 카드를 준비하지 못했어요.' : 'Could not prepare the weekly card.', 'error');
  }
}

export function handleWeeklyClick(app, event) {
  const target = event.target?.closest?.('[data-action]');
  const action = target?.dataset?.action;
  if (!['open-weekly', 'weekly-listen', 'share-weekly-card'].includes(action)) return false;
  event.preventDefault();
  if (action === 'open-weekly') openWeekly(app, target);
  else if (action === 'weekly-listen') listenFromWeekly(app, target);
  else void shareWeeklyCard(app);
  return true;
}
