import { VibeApp } from './ui/app.mjs';

async function retireLegacyRuntime() {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch (error) {
      console.warn('Service worker cleanup failed:', error);
    }
  }

  if ('caches' in window) {
    try {
      const keys = await window.caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('music-vibe-'))
          .map((key) => window.caches.delete(key))
      );
    } catch (error) {
      console.warn('Legacy cache cleanup failed:', error);
    }
  }
}

function boot() {
  const root = document.getElementById('app');
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  if (!root || !header || !footer) {
    throw new Error('V2 application shell is incomplete.');
  }

  retireLegacyRuntime();
  const app = new VibeApp({ root, header, footer });
  window.__musicVibeV2 = app;
  app.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
