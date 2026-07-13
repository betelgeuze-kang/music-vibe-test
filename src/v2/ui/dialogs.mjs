import { escapeHtml } from './helpers.mjs?weekly=m4w1';

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
          <span class="eyebrow">CONFIRM</span>
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
  const dialog = document.createElement('dialog');
  dialog.id = 'privacy-dialog';
  dialog.className = 'app-dialog privacy-dialog';
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.setAttribute('aria-describedby', descriptionId);
  dialog.innerHTML = `
    <form method="dialog" class="app-dialog__surface">
      <button type="submit" value="close" class="privacy-dialog__close" aria-label="${escapeHtml(app?.copy?.().close || (korean ? '닫기' : 'Close'))}">×</button>
      <div class="app-dialog__copy">
        <span class="eyebrow">PRIVACY · CR1</span>
        <h2 id="${titleId}">${korean ? '취향 기록과 광고는 어떻게 다뤄지나요?' : 'How are taste notes and advertising handled?'}</h2>
        <p id="${descriptionId}">${korean
          ? '취향 기록, 최근 선곡, 곡 반응, 주간 기록은 이 브라우저에 저장됩니다. 친구 비교 값은 URL의 # 뒤에 들어가 서버나 CDN 요청에 포함되지 않으며, 이름이나 이메일 없이 여섯 개 취향 값과 익명 ID만 담습니다. 선택적 분석은 동의한 경우에만 전송됩니다.'
          : 'Taste notes, recent selections, track feedback, and weekly recaps stay in this browser. Comparison data lives after # in the URL, so it is not sent in server or CDN requests. It contains six taste values and an anonymous ID, not a name or email. Optional analytics are sent only after consent.'}</p>
        <p>${korean
          ? '현재 광고 스크립트와 광고 쿠키는 비활성 상태입니다. 향후 광고를 도입할 때는 사업자·쿠키·선택권을 전체 정책에 먼저 고지하고, 질문·오디오·내비게이션·버튼 주변에는 광고를 배치하지 않습니다.'
          : 'Advertising scripts and advertising cookies are currently disabled. Before ads are introduced, the provider, cookies, and user choices will be disclosed in the full policy, and ads will not be placed next to questions, audio, navigation, or action controls.'}</p>
        <p>${escapeHtml(app?.copy?.().footerNote || '')}</p>
        <nav class="app-dialog__legal-links" aria-label="${korean ? '전체 운영 정책' : 'Full operation policies'}">
          <a href="/privacy/">${korean ? '개인정보·쿠키 전체 정책' : 'Full privacy policy'}</a>
          <a href="/audio-credits/">${korean ? '오디오 출처와 권리' : 'Audio sources and rights'}</a>
          <a href="/about/">${korean ? '서비스·추천 원칙' : 'Service and recommendation principles'}</a>
        </nav>
      </div>
      <div class="app-dialog__actions">
        <button type="submit" value="close" class="button button--light" data-dialog-primary>${escapeHtml(app?.copy?.().close || (korean ? '닫기' : 'Close'))}</button>
      </div>
    </form>
  `;

  dialog.addEventListener('close', () => {
    dialog.remove();
    restoreFocus(opener);
  }, { once: true });
  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.querySelector('[data-dialog-primary]')?.focus();
  return dialog;
}
