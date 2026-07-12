import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { visibleWeeklyTags } from '../src/v2/domain/tag-visibility.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const app = read('src/v2/ui/app.mjs');
const dialogs = read('src/v2/ui/dialogs.mjs');
const timelineActions = read('src/v2/ui/timeline-actions.mjs');
const consent = read('src/v2/ui/consent-a11y.mjs');
const shell = read('src/v2/ui/components/shell.mjs');
const weeklyScreen = read('src/v2/ui/screens/weekly.mjs');
const weeklyCss = read('v2-m4-weekly.css');
const humanCss = read('v2-human-editorial.css');
const visualSpec = read('tests/e2e/visual.spec.mjs');
const browserSpec = read('tests/e2e/frontend-quality.spec.mjs');

assert(app.includes('this.clearNotice();\n    closeOpenAppDialogs();\n    this.route = parseRoute()'), 'route changes must clear transient notice and dialogs before rendering');
assert(app.includes('clearNotice()'), 'app must expose deterministic notice clearing');
assert(dialogs.includes('aria-labelledby'));
assert(dialogs.includes('aria-describedby'));
assert(dialogs.includes('data-dialog-cancel'));
assert(dialogs.includes('data-dialog-confirm'));
assert(!timelineActions.includes('window.confirm'), 'active timeline actions must not use native confirm dialogs');
assert(timelineActions.includes('showConfirmDialog'));
assert(consent.includes("banner.setAttribute('role', 'region')"));
assert(consent.includes('analytics-consent-description'));
assert(shell.includes('site-nav__short'));
assert(shell.includes('site-nav__icon'));
assert(weeklyScreen.includes('is-count-${Math.min(3, cards.length)}'));
assert(weeklyScreen.includes('visibleWeeklyTags'));

const visible = visibleWeeklyTags([
  { tag: 'editorial-curated' },
  { tag: 'night' },
  { tag: 'catalog-core' },
  { tag: 'dreamy' }
], 5);
assert.deepEqual(visible.map((item) => item.tag), ['night', 'dreamy']);

for (const token of [
  '.app-dialog',
  '.privacy-dialog__close',
  '.button--danger',
  '.app-notice:empty',
  '.site-nav__short',
  '.weekly-context-grid.is-count-1',
  'min-height: 44px',
  '@media (min-width: 861px) and (max-width: 1100px)',
  '@media (max-width: 860px)'
]) {
  assert(weeklyCss.includes(token), `weekly frontend CSS is missing ${token}`);
}

for (const token of [
  'body[data-route="home"] .site-header',
  'position: static',
  '.human-hero__whisper',
  '.human-match__bridge',
  '.human-match__meter',
  '@media (max-width: 1179px)',
  '@media (max-width: 920px)',
  '@media (max-width: 680px)'
]) {
  assert(humanCss.includes(token), `HE1 frontend CSS is missing ${token}`);
}

assert(visualSpec.includes('window.__musicVibeV2?.clearNotice?.()'));
assert(visualSpec.includes("page.locator('dialog[open]')"));
for (const phrase of [
  'privacy dialog has an accessible name',
  'destructive actions use the application confirm dialog',
  'optional analytics consent is a non-blocking labelled region',
  'route changes clear transient notices',
  'responsive matrix has no horizontal overflow',
  'mobile primary controls meet the 44px hit-target contract',
  'HE1 home header never covers section titles and shared-listening copy stays readable'
]) {
  assert(browserSpec.includes(phrase), `browser quality gate is missing: ${phrase}`);
}

console.log('Frontend quality sweep and HE1 contracts passed.');
