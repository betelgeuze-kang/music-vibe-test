function enhanceConsentBanner(banner) {
  if (!(banner instanceof HTMLElement) || banner.dataset.a11yEnhanced === 'true') return;
  banner.dataset.a11yEnhanced = 'true';
  banner.setAttribute('role', 'region');
  banner.removeAttribute('aria-modal');

  const heading = banner.querySelector('strong');
  const description = banner.querySelector('p');
  if (heading) {
    heading.id ||= 'analytics-consent-title';
    banner.setAttribute('aria-labelledby', heading.id);
  }
  if (description) {
    description.id ||= 'analytics-consent-description';
    banner.setAttribute('aria-describedby', description.id);
  }

  banner.querySelectorAll('button').forEach((button) => {
    button.style.minHeight = '44px';
    button.style.minWidth = '44px';
  });
}

export function installConsentAccessibility() {
  const current = document.getElementById('standalone-cookie-banner');
  if (current) enhanceConsentBanner(current);

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.id === 'standalone-cookie-banner') enhanceConsentBanner(node);
        node.querySelectorAll?.('#standalone-cookie-banner').forEach(enhanceConsentBanner);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return () => observer.disconnect();
}
