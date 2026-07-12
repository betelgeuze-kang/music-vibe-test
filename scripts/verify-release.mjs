import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(__dirname, '..');
const rootFlag = process.argv.indexOf('--root');
const root = rootFlag >= 0 ? path.resolve(process.argv[rootFlag + 1]) : repositoryRoot;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const index = read('index.html');
const buildInfo = JSON.parse(read('build-info.json'));
const release = buildInfo.release;
const brandRelease = buildInfo.brandRelease;
const stabilityRelease = buildInfo.stabilityRelease;
const contentRelease = buildInfo.contentRelease;
const uiRelease = buildInfo.uiRelease;
const engagementRelease = buildInfo.engagementRelease;
const timelineRelease = buildInfo.timelineRelease;
const weeklyRelease = buildInfo.weeklyRelease;
const frontendQualityRelease = buildInfo.frontendQualityRelease;

for (const [label, value] of Object.entries({ release, brandRelease, stabilityRelease, contentRelease, uiRelease, engagementRelease, timelineRelease, weeklyRelease, frontendQualityRelease })) {
  if (!value || !/^[a-z0-9-]+$/i.test(value)) throw new Error(`build-info.json must define a stable ${label} ID`);
}

for (const [attribute, value] of [
  ['data-release-id', release],
  ['data-brand-release', brandRelease],
  ['data-stability-release', stabilityRelease],
  ['data-content-release', contentRelease],
  ['data-ui-release', uiRelease],
  ['data-engagement-release', engagementRelease],
  ['data-timeline-release', timelineRelease],
  ['data-weekly-release', weeklyRelease],
  ['data-frontend-quality-release', frontendQualityRelease]
]) {
  if (!index.includes(`${attribute}="${value}"`)) throw new Error(`${attribute} does not match build-info.json`);
}
for (const [meta, value] of [
  ['music-vibe-release', release],
  ['music-vibe-brand-release', brandRelease],
  ['music-vibe-stability-release', stabilityRelease],
  ['music-vibe-content-release', contentRelease],
  ['music-vibe-ui-release', uiRelease],
  ['music-vibe-engagement-release', engagementRelease],
  ['music-vibe-timeline-release', timelineRelease],
  ['music-vibe-weekly-release', weeklyRelease],
  ['music-vibe-frontend-quality-release', frontendQualityRelease]
]) {
  if (!index.includes(`name="${meta}" content="${value}"`)) throw new Error(`${meta} meta does not match build-info.json`);
}
if (!index.includes(`Canonical UI ${uiRelease.toUpperCase()}`)) throw new Error('canonical UI release marker is missing');
if (!index.includes(`M4 Feedback ${engagementRelease.toUpperCase()}`)) throw new Error('M4 feedback release marker is missing');
if (!index.includes(`Profile Timeline ${timelineRelease.toUpperCase()}`)) throw new Error('profile timeline release marker is missing');
if (!index.includes(`Weekly Vibe ${weeklyRelease.toUpperCase()}`)) throw new Error('Weekly Vibe release marker is missing');
if (!index.includes(`Frontend Quality ${frontendQualityRelease.toUpperCase()}`)) throw new Error('frontend quality release marker is missing');
if ((index.match(/rel="stylesheet"/g) || []).length !== 1) throw new Error('HTML must load exactly one canonical stylesheet');
if (!index.includes(`v2-app.css?frontend=${frontendQualityRelease}`)) throw new Error('canonical stylesheet is not frontend-quality-versioned');
if (!index.includes(`src/v2/main.mjs?frontend=${frontendQualityRelease}`)) throw new Error('canonical application entry is not frontend-quality-versioned');
if (index.includes('src/v2/brand/install.mjs') || index.includes('src/v2/brand/interaction.mjs')) throw new Error('runtime override modules must not load');
if (index.includes('brand-pending')) throw new Error('canonical UI must not use a post-boot design mask');

const sourceStyles = ['v2-core.css', 'v2-features.css', 'v2-responsive.css', 'v2-quality.css', 'v2-editorial.css', 'v2-stabilization.css', 'v2-stabilization-a11y.css', 'v2-m4.css', 'v2-m4-timeline.css', 'v2-m4-weekly.css', 'v2-frontend-quality.css'];
const canonicalModules = [
  'src/v2/main.mjs',
  'src/v2/ui/app.mjs',
  'src/v2/ui/actions.mjs',
  'src/v2/ui/dialogs.mjs',
  'src/v2/ui/consent-a11y.mjs',
  'src/v2/ui/timeline-actions.mjs',
  'src/v2/ui/weekly-actions.mjs',
  'src/v2/ui/helpers.mjs',
  'src/v2/ui/components/shell.mjs',
  'src/v2/ui/screens/home.mjs',
  'src/v2/ui/screens/discover.mjs',
  'src/v2/ui/screens/empty.mjs',
  'src/v2/ui/screens/profile.mjs',
  'src/v2/ui/screens/weekly.mjs',
  'src/v2/ui/screens/now.mjs',
  'src/v2/ui/screens/match.mjs',
  'src/v2/quality/visuals.mjs',
  'src/v2/brand/copy.mjs',
  'src/v2/data/questions.mjs',
  'src/v2/data/tracks.mjs',
  'src/v2/data/editorial-tracks.mjs',
  'src/v2/data/home-showcase.mjs',
  'src/v2/domain/profile.mjs',
  'src/v2/domain/presentation.mjs',
  'src/v2/domain/feedback.mjs',
  'src/v2/domain/timeline.mjs',
  'src/v2/domain/tag-visibility.mjs',
  'src/v2/domain/weekly.mjs',
  'src/v2/domain/recommendation.mjs',
  'src/v2/domain/match.mjs',
  'src/v2/infrastructure/storage.mjs',
  'src/v2/infrastructure/share.mjs'
];
const expectedAudio = [
  'assets/audio/Funkorama.mp3', 'assets/audio/Dream_Catcher.mp3', 'assets/audio/Lobby_Time.mp3',
  'assets/audio/Cipher.mp3', 'assets/audio/Tech_Talk.mp3', 'assets/audio/Dreamy_Flashback.mp3',
  'assets/audio/Movement_Proposition.mp3', 'assets/audio/Pixel_Peeker_Polka_faster.mp3'
];

for (const file of ['v2-app.css', ...sourceStyles, ...canonicalModules, ...expectedAudio]) {
  if (!exists(file)) throw new Error(`release asset is missing: ${file}`);
}

const cssEntry = read('v2-app.css');
for (const layer of ['core', 'features', 'responsive', 'quality', 'editorial', 'stability', 'accessibility', 'engagement', 'timeline', 'weekly', 'frontend-quality']) {
  if (!cssEntry.includes(`layer(${layer})`)) throw new Error(`canonical CSS is missing the ${layer} layer`);
}
for (const source of sourceStyles) {
  if (!cssEntry.includes(source)) throw new Error(`canonical CSS entry does not include ${source}`);
}
if (!cssEntry.includes(`v2-m4-timeline.css?timeline=${timelineRelease}`)) throw new Error('timeline CSS is not version-locked');
if (!cssEntry.includes(`v2-m4-weekly.css?frontend=${frontendQualityRelease}`)) throw new Error('Weekly Vibe CSS is not frontend-quality-versioned');
if (!cssEntry.includes(`v2-frontend-quality.css?frontend=${frontendQualityRelease}`)) throw new Error('frontend quality CSS is not version-locked');

const mainSource = read('src/v2/main.mjs');
const appSource = read('src/v2/ui/app.mjs');
const actionSource = read('src/v2/ui/actions.mjs');
const dialogSource = read('src/v2/ui/dialogs.mjs');
const consentSource = read('src/v2/ui/consent-a11y.mjs');
const timelineActionSource = read('src/v2/ui/timeline-actions.mjs');
const weeklyActionSource = read('src/v2/ui/weekly-actions.mjs');
const weeklySource = read('src/v2/ui/screens/weekly.mjs');
const weeklyDomainSource = read('src/v2/domain/weekly.mjs');
const tagVisibilitySource = read('src/v2/domain/tag-visibility.mjs');
const profileSource = read('src/v2/ui/screens/profile.mjs');
const homeSource = read('src/v2/ui/screens/home.mjs');
const storageSource = read('src/v2/infrastructure/storage.mjs');
const shareSource = read('src/v2/infrastructure/share.mjs');
if (mainSource.includes('installQualityGates') || mainSource.includes('quality/install.mjs')) throw new Error('quality runtime mutation must be removed');
if (!mainSource.includes(`./ui/app.mjs?frontend=${frontendQualityRelease}`)) throw new Error('canonical app import is not frontend-quality-versioned');
if (!mainSource.includes(`./ui/consent-a11y.mjs?frontend=${frontendQualityRelease}`)) throw new Error('consent accessibility module is not frontend-quality-versioned');
if (!mainSource.includes(`build-info.json?frontend=${frontendQualityRelease}`)) throw new Error('build-info fetch is not frontend-quality-versioned');
if (!appSource.includes(`import('./screens/profile.mjs?timeline=${timelineRelease}')`)) throw new Error('profile route is not timeline-versioned');
if (!appSource.includes(`import('./screens/weekly.mjs?frontend=${frontendQualityRelease}')`)) throw new Error('weekly route is not frontend-quality-versioned');
for (const route of ['now', 'match']) {
  if (!appSource.includes(`import('./screens/${route}.mjs?engagement=${engagementRelease}')`)) throw new Error(`lazy ${route} route is not engagement-versioned`);
}
for (const source of [mainSource, appSource, actionSource, timelineActionSource, homeSource]) {
  if (/from ['"].*domain\/recommendation\.mjs/.test(source) || /from ['"].*domain\/match\.mjs/.test(source) || /from ['"].*data\/tracks\.mjs/.test(source)) {
    throw new Error('home boot graph statically imports the full catalog');
  }
}
if (!actionSource.includes(`await import('../domain/recommendation.mjs?engagement=${engagementRelease}')`)) throw new Error('context recommendations are not engagement-versioned');
if (!actionSource.includes("action === 'track-feedback'") || !actionSource.includes("action === 'refresh-recommendations'")) throw new Error('M4 feedback actions are incomplete');
if (!appSource.includes('handleTimelineClick')) throw new Error('timeline actions are not routed through the canonical click listener');
if (!appSource.includes('handleWeeklyClick')) throw new Error('weekly actions are not routed through the canonical click listener');
if (!appSource.includes('clearNotice()') || !appSource.includes('closeOpenAppDialogs()')) throw new Error('route transitions do not clear notices and dialogs');
if (!timelineActionSource.includes('showConfirmDialog') || timelineActionSource.includes('window.confirm')) throw new Error('timeline actions must use the accessible application dialog');
if (!dialogSource.includes('aria-labelledby') || !dialogSource.includes('data-dialog-cancel') || !dialogSource.includes('data-dialog-confirm')) throw new Error('accessible application dialog contract is incomplete');
if (!consentSource.includes("banner.setAttribute('role', 'region')") || !consentSource.includes('analytics-consent-description')) throw new Error('consent accessibility contract is incomplete');
if (!weeklyActionSource.includes('share-weekly-card') || !weeklyActionSource.includes('weekly-listen')) throw new Error('Weekly Vibe actions are incomplete');
if (!profileSource.includes('profile-timeline') || !profileSource.includes('compareProfileSnapshots')) throw new Error('profile timeline UI is incomplete');
if (!weeklySource.includes('weekly_vibe_view') || !weeklySource.includes('weekly-empty') || !weeklySource.includes('weekly-hero')) throw new Error('Weekly Vibe UI is incomplete');
if (!weeklySource.includes('visibleWeeklyTags') || !weeklySource.includes('is-count-${Math.min(3, cards.length)}')) throw new Error('Weekly Vibe tag filtering or adaptive context grid is incomplete');
if (!tagVisibilitySource.includes('editorial-curated') || !tagVisibilitySource.includes('isPublicMusicTag')) throw new Error('internal catalog tag filtering is incomplete');
if (!weeklyDomainSource.includes('WEEKLY_MIN_INTERACTIONS = 3') || !weeklyDomainSource.includes('buildWeeklyVibe')) throw new Error('Weekly Vibe domain contract is incomplete');
if (!storageSource.includes('music-vibe-v2-weekly-v1') || !storageSource.includes('markReturnVisitTracked')) throw new Error('Weekly Vibe persistence or return dedupe is incomplete');
if (!shareSource.includes('createWeeklyVibeCardSvg') || !shareSource.includes('1200') || !shareSource.includes('1500')) throw new Error('Weekly Vibe share card is incomplete');
if (buildInfo.entry !== `/src/v2/main.mjs?frontend=${frontendQualityRelease}`) throw new Error('canonical entry release contract is inconsistent');
if (buildInfo.styleEntry !== `/v2-app.css?frontend=${frontendQualityRelease}`) throw new Error('canonical style release contract is inconsistent');
if (buildInfo.runtimeOverrides !== false) throw new Error('runtime override contract must be false');
if (!Array.isArray(buildInfo.lazyRoutes) || buildInfo.lazyRoutes.length !== 4) throw new Error('lazy route contract is incomplete');
if (!Array.isArray(buildInfo.engagementData) || buildInfo.engagementData.length !== 3) throw new Error('M4 engagement data contract is incomplete');
if (!Array.isArray(buildInfo.timelineData) || buildInfo.timelineData.length !== 4) throw new Error('M4 timeline data contract is incomplete');
if (!Array.isArray(buildInfo.weeklyData) || buildInfo.weeklyData.length !== 6) throw new Error('M4 Weekly Vibe data contract is incomplete');
if (!Array.isArray(buildInfo.frontendQualityData) || buildInfo.frontendQualityData.length !== 4) throw new Error('frontend quality data contract is incomplete');

const editorialTrackSource = read('src/v2/data/editorial-tracks.mjs');
const editorialTable = editorialTrackSource.match(/const RAW_EDITORIAL_TRACKS = `([\s\S]*?)`;/)?.[1] || '';
const editorialRows = editorialTable.trim().split('\n').filter(Boolean);
if (editorialRows.length !== 60) throw new Error(`editorial track catalog must contain exactly 60 rows; found ${editorialRows.length}`);
if (!read('src/v2/data/home-showcase.mjs').includes('HOME_SHOWCASE')) throw new Error('fixed editorial home showcase is missing');
if (!exists('ko/results/enfp/index.html') && !exists('ko/results/enfp/index.md')) throw new Error('legacy ENFP result continuity is missing');

console.log(`Core ${release} + brand ${brandRelease} + stability ${stabilityRelease} + content ${contentRelease} + UI ${uiRelease} + engagement ${engagementRelease} + timeline ${timelineRelease} + weekly ${weeklyRelease} + frontend quality ${frontendQualityRelease} verified at ${root}`);
