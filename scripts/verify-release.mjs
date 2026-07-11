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

for (const [label, value] of Object.entries({ release, brandRelease, stabilityRelease, contentRelease, uiRelease })) {
  if (!value || !/^[a-z0-9-]+$/i.test(value)) throw new Error(`build-info.json must define a stable ${label} ID`);
}

for (const [attribute, value] of [
  ['data-release-id', release],
  ['data-brand-release', brandRelease],
  ['data-stability-release', stabilityRelease],
  ['data-content-release', contentRelease],
  ['data-ui-release', uiRelease]
]) {
  if (!index.includes(`${attribute}="${value}"`)) throw new Error(`${attribute} does not match build-info.json`);
}
for (const [meta, value] of [
  ['music-vibe-release', release],
  ['music-vibe-brand-release', brandRelease],
  ['music-vibe-stability-release', stabilityRelease],
  ['music-vibe-content-release', contentRelease],
  ['music-vibe-ui-release', uiRelease]
]) {
  if (!index.includes(`name="${meta}" content="${value}"`)) throw new Error(`${meta} meta does not match build-info.json`);
}
if (!index.includes(`Canonical UI ${uiRelease.toUpperCase()}`)) throw new Error('canonical UI release marker is missing');
if ((index.match(/rel="stylesheet"/g) || []).length !== 1) throw new Error('HTML must load exactly one canonical stylesheet');
if (!index.includes(`v2-app.css?ui=${uiRelease}`)) throw new Error('canonical stylesheet is not version-locked');
if (!index.includes(`src/v2/main.mjs?ui=${uiRelease}`)) throw new Error('canonical application entry is not version-locked');
if (index.includes('src/v2/brand/install.mjs') || index.includes('src/v2/brand/interaction.mjs')) throw new Error('runtime override modules must not load');
if (index.includes('brand-pending')) throw new Error('canonical UI must not use a post-boot design mask');

const sourceStyles = ['v2-core.css', 'v2-features.css', 'v2-responsive.css', 'v2-quality.css', 'v2-editorial.css', 'v2-stabilization.css', 'v2-stabilization-a11y.css'];
const canonicalModules = [
  'src/v2/main.mjs',
  'src/v2/ui/app.mjs',
  'src/v2/ui/actions.mjs',
  'src/v2/ui/helpers.mjs',
  'src/v2/ui/components/shell.mjs',
  'src/v2/ui/screens/home.mjs',
  'src/v2/ui/screens/discover.mjs',
  'src/v2/ui/screens/empty.mjs',
  'src/v2/ui/screens/profile.mjs',
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
for (const layer of ['core', 'features', 'responsive', 'quality', 'editorial', 'stability', 'accessibility']) {
  if (!cssEntry.includes(`layer(${layer})`)) throw new Error(`canonical CSS is missing the ${layer} layer`);
}
for (const source of sourceStyles) {
  if (!cssEntry.includes(source)) throw new Error(`canonical CSS entry does not include ${source}`);
}

const mainSource = read('src/v2/main.mjs');
const appSource = read('src/v2/ui/app.mjs');
const actionSource = read('src/v2/ui/actions.mjs');
const homeSource = read('src/v2/ui/screens/home.mjs');
if (mainSource.includes('installQualityGates') || mainSource.includes('quality/install.mjs')) throw new Error('quality runtime mutation must be removed');
if (!appSource.includes("import('./screens/profile.mjs?ui=f1')") || !appSource.includes("import('./screens/now.mjs?ui=f1')") || !appSource.includes("import('./screens/match.mjs?ui=f1')")) throw new Error('lazy route modules are incomplete');
for (const source of [mainSource, appSource, actionSource, homeSource]) {
  if (/from ['"].*domain\/recommendation\.mjs/.test(source) || /from ['"].*domain\/match\.mjs/.test(source) || /from ['"].*data\/tracks\.mjs/.test(source)) {
    throw new Error('home boot graph statically imports the full catalog');
  }
}
if (!actionSource.includes("await import('../domain/recommendation.mjs?content=e1')")) throw new Error('context recommendations are not lazy-loaded');
if (buildInfo.entry !== `/src/v2/main.mjs?ui=${uiRelease}`) throw new Error('canonical entry release contract is inconsistent');
if (buildInfo.styleEntry !== `/v2-app.css?ui=${uiRelease}`) throw new Error('canonical style release contract is inconsistent');
if (buildInfo.runtimeOverrides !== false) throw new Error('runtime override contract must be false');
if (!Array.isArray(buildInfo.lazyRoutes) || buildInfo.lazyRoutes.length !== 3) throw new Error('lazy route contract is incomplete');

const editorialTrackSource = read('src/v2/data/editorial-tracks.mjs');
const editorialTable = editorialTrackSource.match(/const RAW_EDITORIAL_TRACKS = `([\s\S]*?)`;/)?.[1] || '';
const editorialRows = editorialTable.trim().split('\n').filter(Boolean);
if (editorialRows.length !== 60) throw new Error(`editorial track catalog must contain exactly 60 rows; found ${editorialRows.length}`);
if (!read('src/v2/data/home-showcase.mjs').includes('HOME_SHOWCASE')) throw new Error('fixed editorial home showcase is missing');
if (!exists('ko/results/enfp/index.html') && !exists('ko/results/enfp/index.md')) throw new Error('legacy ENFP result continuity is missing');

console.log(`Core ${release} + brand ${brandRelease} + stability ${stabilityRelease} + content ${contentRelease} + UI ${uiRelease} verified at ${root}`);
