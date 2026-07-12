import { VibeApp } from './ui/app.mjs?frontend=fq1';
import { installConsentAccessibility } from './ui/consent-a11y.mjs?frontend=fq1';

async function retireLegacyRuntime() {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch (error) { console.warn('Service worker cleanup failed:', error); }
  }
  if ('caches' in window) {
    try {
      const keys = await window.caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('music-vibe-')).map((key) => window.caches.delete(key)));
    } catch (error) { console.warn('Legacy cache cleanup failed:', error); }
  }
}

async function loadBuildInfo() {
  try {
    const response = await fetch('/build-info.json?frontend=fq1', { cache: 'no-store' });
    if (!response.ok) return;
    const info = await response.json();
    document.documentElement.dataset.buildId = info.frontendQualityRelease || info.weeklyRelease || info.timelineRelease || info.engagementRelease || info.uiRelease || info.releaseId || 'fq1';
    window.__musicVibeBuild = Object.freeze(info);
  } catch (_) {
    document.documentElement.dataset.buildId = 'fq1';
  }
}

function boot() {
  const root = document.getElementById('app');
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  if (!root || !header || !footer) throw new Error('Application shell is incomplete.');
  retireLegacyRuntime();
  loadBuildInfo();
  installConsentAccessibility();
  const app = new VibeApp({ root, header, footer });
  window.__musicVibeV2 = app;
  app.start();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
