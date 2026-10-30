import { closeOpenAppDialogs } from './dialogs.mjs?commercial=cr1&listening=ln1';
import { getProfileArchetype, localize } from '../domain/profile.mjs?v=qg1';
import { buildInviteUrl, copyText, prepareProfileCard, savePreparedProfileCard, sharePreparedProfileCard } from '../infrastructure/share.mjs?result=rs1';
import { escapeHtml, track } from './helpers.mjs?weekly=m4w1&listening=ln1';

export function showProfileCardDialog(app, opener = document.activeElement) {
  if (!app.profile) return;
  closeOpenAppDialogs();
  app.clearNotice();
  const profile = app.profile;
  const language = app.language;
  const korean = language !== 'en';
  const name = localize(getProfileArchetype(profile).name, language);
  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog profile-card-dialog';
  dialog.setAttribute('aria-labelledby', 'profile-card-title');
  dialog.setAttribute('aria-describedby', 'profile-card-description');
  dialog.innerHTML = `
    <div class="card-composer">
      <header class="card-composer__heading"><div><span class="notes-kicker">YOUR TASTE, ON THE RECORD.</span><h2 id="profile-card-title">${korean ? '내 취향을 한 장으로.' : 'Your taste, on the record.'}</h2></div><button type="button" class="card-composer__close" data-card-close aria-label="${korean ? '닫기' : 'Close'}">×</button></header>
      <div class="card-composer__layout">
        <figure class="card-composer__preview" data-card-preview><img data-card-image hidden alt="${escapeHtml(name)} · ${korean ? '공유할 음악 취향 카드' : 'Your music taste share card'}"><span data-card-placeholder>${korean ? '카드를 만들고 있어요…' : 'Preparing your card…'}</span></figure>
        <div class="card-composer__controls">
          <p id="profile-card-description">${korean ? '마음에 드는 비율을 골라 저장하거나 공유하세요. QR을 스캔하면 친구와 취향을 비교할 수 있어요.' : 'Choose a shape to save or share. Scan the QR code to compare tastes with a friend.'}</p>
          <fieldset class="card-format"><legend>${korean ? '카드 비율' : 'Card shape'}</legend><div>
            <label><input type="radio" name="profile-card-format" value="feed" checked><span><b>${korean ? '피드' : 'Feed'}</b><small>4:5 · 1080 × 1350</small></span></label>
            <label><input type="radio" name="profile-card-format" value="story"><span><b>${korean ? '스토리' : 'Story'}</b><small>9:16 · 1080 × 1920</small></span></label>
          </div></fieldset>
          <p class="card-composer__privacy">${korean ? '공유 이미지와 QR에는 내 취향이 담깁니다. 이름이나 이메일은 포함하지 않아요.' : 'The image and QR include your taste. They contain no name or email.'}</p>
          <div class="card-composer__actions"><button type="button" class="notes-button notes-button--primary" data-card-share disabled>${korean ? '이미지 공유하기' : 'Share image'} ↗</button><button type="button" class="notes-button" data-card-save disabled>${korean ? '이미지 저장' : 'Save image'} ↓</button><button type="button" class="notes-text-button" data-card-copy>${korean ? '친구 초대 링크 복사' : 'Copy friend invite link'} ↗</button></div>
          <p class="card-composer__status" role="status" aria-live="polite" data-card-status></p>
        </div>
      </div>
    </div>`;
  let closed = false;
  let ticket = 0;
  let busy = false;
  let selectedCard = null;
  let previewUrl = '';
  const cache = new Map();
  const image = dialog.querySelector('[data-card-image]');
  const placeholder = dialog.querySelector('[data-card-placeholder]');
  const status = dialog.querySelector('[data-card-status]');
  const shareButton = dialog.querySelector('[data-card-share]');
  const saveButton = dialog.querySelector('[data-card-save]');
  const setEnabled = (enabled) => { shareButton.disabled = !enabled; saveButton.disabled = !enabled; };
  const prepare = async (format) => {
    const currentTicket = ++ticket;
    selectedCard = null;
    setEnabled(false);
    image.hidden = true;
    placeholder.hidden = false;
    placeholder.textContent = korean ? '카드를 만들고 있어요…' : 'Preparing your card…';
    status.textContent = '';
    dialog.querySelector('[data-card-preview]').dataset.format = format;
    try {
      if (!cache.has(format)) cache.set(format, prepareProfileCard(profile, language, format));
      const card = await cache.get(format);
      if (closed || currentTicket !== ticket) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(card.blob);
      image.src = previewUrl;
      await image.decode();
      if (closed || currentTicket !== ticket) return;
      selectedCard = card;
      placeholder.hidden = true;
      image.hidden = false;
      setEnabled(!busy);
      track('profile_card_preview', { card_format: card.format, card_version: 'rs1', placement: 'profile' });
    } catch (_) {
      cache.delete(format);
      if (closed || currentTicket !== ticket) return;
      placeholder.textContent = korean ? '이미지를 만들지 못했어요.' : 'Could not prepare the image.';
      status.textContent = korean ? '다른 비율을 선택해 다시 시도하거나 초대 링크를 복사해 주세요.' : 'Try another shape or copy the invite link.';
    }
  };
  dialog.querySelector('[data-card-close]').addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[name="profile-card-format"]').forEach((input) => input.addEventListener('change', () => { if (input.checked) prepare(input.value); }));
  shareButton.addEventListener('click', async () => {
    if (!selectedCard || busy) return;
    const card = selectedCard;
    track('share_click', { share_type: 'profile_card', card_format: card.format, card_version: 'rs1', placement: 'profile' });
    busy = true;
    setEnabled(false);
    try {
      // No asynchronous work precedes the native share invocation.
      const result = await sharePreparedProfileCard(card, profile, language);
      if (closed) return;
      status.textContent = result.status === 'cancelled' ? (korean ? '공유를 취소했어요.' : 'Sharing cancelled.') : result.method === 'native' ? (korean ? '공유 창에 이미지를 전달했어요.' : 'Image sent to the share dialog.') : (korean ? '이미지를 저장했어요. 원하는 앱에서 올려 주세요.' : 'Image saved. Open it in your preferred app.');
      track(result.status === 'cancelled' ? 'share_cancel' : 'share_success', { share_type: 'profile_card', share_method: result.method, card_format: card.format, card_version: 'rs1', placement: 'profile' });
    } catch (_) {
      if (!closed) status.textContent = korean ? '공유하지 못했어요. 이미지 저장이나 초대 링크를 이용해 주세요.' : 'Could not share. Try saving the image or copying the link.';
    } finally { busy = false; if (!closed) setEnabled(Boolean(selectedCard)); }
  });
  saveButton.addEventListener('click', () => {
    if (!selectedCard || busy) return;
    track('image_save', { card_format: selectedCard.format, card_version: 'rs1', placement: 'profile' });
    savePreparedProfileCard(selectedCard);
    status.textContent = korean ? '이미지를 저장했어요.' : 'Image saved.';
    track('image_save_success', { card_format: selectedCard.format, card_version: 'rs1', placement: 'profile' });
  });
  dialog.querySelector('[data-card-copy]').addEventListener('click', async () => {
    try {
      await copyText(buildInviteUrl(profile, language));
      if (!closed) status.textContent = korean ? '친구 초대 링크를 복사했어요.' : 'Friend invite link copied.';
      track('share_success', { share_type: 'vibe_match_invite', share_method: 'copy', placement: 'profile_card' });
    } catch (_) { if (!closed) status.textContent = korean ? '링크를 복사하지 못했어요. 다시 시도해 주세요.' : 'Could not copy the link. Please try again.'; }
  });
  dialog.addEventListener('close', () => {
    closed = true;
    ticket++;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    cache.clear();
    dialog.remove();
    if (opener instanceof HTMLElement && opener.isConnected) requestAnimationFrame(() => opener.focus({ preventScroll: true }));
  }, { once: true });
  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.querySelector('[data-card-close]').focus();
  prepare('feed');
  return dialog;
}
