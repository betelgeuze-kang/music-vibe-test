// Original, geometric record sleeves. Shared by the result page and exported cards.
const themes = {
  'midnight-dreamer': { paper: '#e2e8da', ink: '#293e3c', accent: '#e9d79c', motif: 'waves' },
  'neon-runner': { paper: '#e2e6de', ink: '#344c4b', accent: '#e49e58', motif: 'motion' },
  'warm-vinyl': { paper: '#efe0bd', ink: '#895238', accent: '#f3ce83', motif: 'record' },
  'cosmic-architect': { paper: '#dce3df', ink: '#344b56', accent: '#b6c8a4', motif: 'grid' },
  'quiet-cinematic': { paper: '#e6e8d9', ink: '#526458', accent: '#e4d2a3', motif: 'landscape' },
  'rhythm-connector': { paper: '#f0dfb9', ink: '#92593b', accent: '#eac177', motif: 'loops' },
  'electric-explorer': { paper: '#e1e6c9', ink: '#3b5141', accent: '#c9d97e', motif: 'electric' },
  'golden-chorus': { paper: '#f0e0ba', ink: '#aa573c', accent: '#efc86e', motif: 'sun' }
};
Object.values(themes).forEach(Object.freeze);
export const RECORD_THEMES = Object.freeze(themes);
export function recordTheme(id) { return RECORD_THEMES[id] || RECORD_THEMES['quiet-cinematic']; }

export function renderRecordArt(id) {
  const { ink, accent, motif } = recordTheme(id);
  let marks = '';
  if (motif === 'waves') marks = Array.from({ length: 9 }, (_, n) => `<path d="M-40 ${260+n*24} Q100 ${100+n*24} 250 ${260+n*24} T550 ${260+n*24}"/>`).join('');
  if (motif === 'motion') marks = Array.from({ length: 10 }, (_, n) => `<path d="M${-150+n*56} 500 L${150+n*56} 0"/>`).join('');
  if (motif === 'record') marks = Array.from({ length: 9 }, (_, n) => `<circle cx="250" cy="250" r="${32+n*23}"/>`).join('');
  if (motif === 'grid') marks = Array.from({ length: 7 }, (_, n) => `<path d="M${70+n*60} 70 V430 M70 ${70+n*60} H430"/>`).join('');
  if (motif === 'landscape') marks = Array.from({ length: 8 }, (_, n) => `<path d="M-20 ${310+n*26} Q140 ${160+n*26} 290 ${310+n*26} T530 ${310+n*26}"/>`).join('');
  if (motif === 'loops') marks = Array.from({ length: 5 }, (_, n) => `<ellipse cx="${150+n*50}" cy="250" rx="80" ry="${100+n*20}"/>`).join('');
  if (motif === 'electric') marks = Array.from({ length: 7 }, (_, n) => `<path d="M${60+n*50} 55 l-45 150 80 -20 -65 250"/>`).join('');
  if (motif === 'sun') marks = Array.from({ length: 16 }, (_, n) => `<path d="M250 90 V160" transform="rotate(${n*22.5} 250 250)"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500" aria-hidden="true" focusable="false"><rect width="500" height="500" fill="${ink}"/><g fill="none" stroke="${accent}" stroke-width="3" opacity=".75">${marks}</g><circle cx="${motif === 'landscape' ? 350 : 250}" cy="${motif === 'landscape' ? 135 : 250}" r="${motif === 'sun' ? 65 : 38}" fill="${accent}"/><circle cx="250" cy="250" r="5" fill="${ink}"/></svg>`;
}
