import { escapeHtml } from './helpers.mjs?v3=nv1';

let dialogSequence = 0;

function nextId(prefix) {
  dialogSequence += 1;
  return `${prefix}-${dialogSequence}`;
}

function restoreFocus(opener) {
  if (!(opener instanceof HTMLElement) || !opener.isConnected) return;
  window.requestAnimationFrame(() => opener.focus({ preventScroll: true }));
}

export function closeOpenAppDialogs(returnValue = 'cancel') {
  document.querySelectorAll('dialog.app-dialog[open]').forEach((dialog) => {
    try { dialog.close(returnValue); } catch (_) { dialog.removeAttribute('open'); dialog.remove(); }
  });
}

export function showConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  opener = document.activeElement
} = {}) {
  closeOpenAppDialogs();
  const titleId = nextId('confirm-title');
  const descriptionId = nextId('confirm-description');

  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = `app-dialog app-dialog--confirm app-dialog--${tone}`;
    dialog.setAttribute('aria-labelledby', titleId);
    dialog.setAttribute('aria-describedby', descriptionId);
    dialog.innerHTML = `
      <form method="dialog" class="app-dialog__surface">
        <div class="app-dialog__copy">
          <span class="eyebrow">ONE MORE THOUGHT</span>
          <h2 id="${titleId}">${escapeHtml(title || '')}</h2>
          <p id="${descriptionId}">${escapeHtml(description || '')}</p>
        </div>
        <div class="app-dialog__actions">
          <button type="submit" value="cancel" class="button button--ghost" data-dialog-cancel>${escapeHtml(cancelLabel || 'Cancel')}</button>
          <button type="submit" value="confirm" class="button ${tone === 'danger' ? 'button--danger' : 'button--light'}" data-dialog-confirm>${escapeHtml(confirmLabel || 'Confirm')}</button>
        </div>
      </form>
    `;

    let settled = false;
    const settle = (accepted) => {
      if (settled) return;
      settled = true;
      dialog.remove();
      restoreFocus(opener);
      resolve(Boolean(accepted));
    };

    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      dialog.close('cancel');
    });
    dialog.addEventListener('close', () => settle(dialog.returnValue === 'confirm'), { once: true });
    document.body.appendChild(dialog);
    dialog.showModal();
    dialog.querySelector('[data-dialog-cancel]')?.focus();
  });
}

export function showPrivacyDialog(app, opener = document.activeElement) {
  closeOpenAppDialogs();
  app?.clearNotice?.();
  const korean = app?.language !== 'en';
  const titleId = nextId('privacy-title');
  const descriptionId = nextId('privacy-description');
  const policyBase = korean ? '' : '/en';
  const dialog = document.createElement('dialog');
  dialog.id = 'privacy-dialog';
  dialog.className = 'app-dialog privacy-dialog';
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.setAttribute('aria-describedby', descriptionId);
  dialog.innerHTML = `
    <form method="dialog" class="app-dialog__surface">
      <button type="submit" value="close" class="privacy-dialog__close" aria-label="${escapeHtml(app?.copy?.().close || (korean ? '닫기' : 'Close'))}">×</button>
      <div class="app-dialog__copy">
        <span class="eyebrow">WHAT STAYS / WHAT LEAVES</span>
        <h2 id="${titleId}">${korean ? '이곳에 남는 것과, 밖으로 나가는 것을 나누어 말씀드릴게요.' : 'Here is what stays here—and what may leave the browser.'}</h2>
        <p id="${descriptionId}">${korean
          ? '프로필과 지난 기록, 곡에 남긴 반응, Weekly Vibe는 이 브라우저 안에 있습니다. 친구 링크에는 이름과 연락처 대신 여섯 개의 취향 값과 익명 ID만 들어가며, # 뒤의 값은 일반적인 서버 요청에 실리지 않습니다.'
          : 'Profiles, earlier notes, track feedback, and Weekly Vibe remain in this browser. A friend link carries six taste values and an anonymous ID rather than a name or contact detail, and the fragment after # is not sent in ordinary server requests.'}</p>
        <p>${korean
          ? '익명 사용 흐름은 허락한 경우에만 전송됩니다. 분석을 허용해도 광고 저장과 맞춤형 광고는 켜지지 않습니다. 광고 제공 자체도 현재 꺼져 있습니다.'
          : 'Anonymous usage is sent only after permission. Allowing analytics does not enable advertising storage or personalized ads, and ad delivery itself is currently off.'}</p>
        <p>${escapeHtml(app?.copy?.().footerNote || '')}</p>
        <nav class="app-dialog__legal-links" aria-label="${korean ? '전체 운영 정책' : 'Full operation policies'}">
          <a href="${policyBase}/privacy/">${korean ? '개인정보·쿠키 전체 정책' : 'Full privacy policy'}</a>
          <a href="${policyBase}/audio-credits/">${korean ? '오디오를 만든 방식과 권리' : 'How the audio was made and licensed'}</a>
          <a href="${policyBase}/about/">${korean ? '서비스와 추천을 만드는 원칙' : 'How the service and recommendations are made'}</a>
        </nav>
      </div>
      <div class="app-dialog__actions">
        <button type="button" class="button button--ghost" data-consent-settings>${korean ? '개인정보 선택 바꾸기' : 'Change privacy choices'}</button>
        <button type="submit" value="close" class="button button--light" data-dialog-primary>${escapeHtml(app?.copy?.().close || (korean ? '닫기' : 'Close'))}</button>
      </div>
    </form>
  `;

  dialog.addEventListener('click', (event) => {
    const settings = event.target.closest('[data-consent-settings]');
    if (!settings) return;
    event.preventDefault();
    dialog.close('close');
    window.setTimeout(() => window.MusicVibeConsent?.openSettings?.(settings), 0);
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    restoreFocus(opener);
  }, { once: true });
  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.querySelector('[data-dialog-primary]')?.focus();
  return dialog;
}
