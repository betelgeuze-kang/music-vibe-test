function enhanceConsentBanner(banner) {
  if (!(banner instanceof HTMLElement) || banner.dataset.a11yEnhanced === 'true') return;
  banner.dataset.a11yEnhanced = 'true';
  banner.setAttribute('role', 'region');
  banner.removeAttribute('aria-modal');

  const heading = banner.querySelector('#analytics-consent-title, strong');
  const description = banner.querySelector('#analytics-consent-description, p');
  if (heading) {
    heading.id ||= 'analytics-consent-title';
    banner.setAttribute('aria-labelledby', heading.id);
  }
  if (description) {
    description.id ||= 'analytics-consent-description';
    banner.setAttribute('aria-describedby', description.id);
  }
  banner.querySelectorAll('button, a').forEach((control) => {
    control.style.minHeight = '44px';
    control.style.minWidth = '44px';
  });
}

function enhancePreferencesDialog(dialog) {
  if (!(dialog instanceof HTMLDialogElement) || dialog.dataset.a11yEnhanced === 'true') return;
  dialog.dataset.a11yEnhanced = 'true';
  dialog.querySelectorAll('button, input').forEach((control) => {
    control.style.minHeight = control.matches('input[type="checkbox"]') ? '22px' : '44px';
  });
}

export function installConsentAccessibility() {
  document.querySelectorAll('#standalone-cookie-banner').forEach(enhanceConsentBanner);
  document.querySelectorAll('#privacy-preferences-dialog').forEach(enhancePreferencesDialog);

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.id === 'standalone-cookie-banner') enhanceConsentBanner(node);
        if (node.id === 'privacy-preferences-dialog') enhancePreferencesDialog(node);
        node.querySelectorAll?.('#standalone-cookie-banner').forEach(enhanceConsentBanner);
        node.querySelectorAll?.('#privacy-preferences-dialog').forEach(enhancePreferencesDialog);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return () => observer.disconnect();
}
