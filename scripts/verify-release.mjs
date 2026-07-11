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

for (const [label, value] of Object.entries({ release, brandRelease, stabilityRelease, contentRelease })) {
  if (!value || !/^[a-z0-9-]+$/i.test(value)) {
    throw new Error(`build-info.json must define a stable ${label} ID`);
  }
}

if (!index.includes(`content="${release}"`)) throw new Error('index core release meta does not match build-info.json');
if (!index.includes(`data-release-id="${release}"`)) throw new Error('body core release ID does not match build-info.json');
if (!index.includes(`content="${brandRelease}"`)) throw new Error('index brand release meta does not match build-info.json');
if (!index.includes(`data-brand-release="${brandRelease}"`)) throw new Error('body brand release ID does not match build-info.json');
if (!index.includes(`content="${stabilityRelease}"`)) throw new Error('index stability release meta does not match build-info.json');
if (!index.includes(`data-stability-release="${stabilityRelease}"`)) throw new Error('body stability release ID does not match build-info.json');
if (!index.includes(`content="${contentRelease}"`)) throw new Error('index content release meta does not match build-info.json');
if (!index.includes(`data-content-release="${contentRelease}"`)) throw new Error('body content release ID does not match build-info.json');
if (!index.includes(`V2 Quality Gates ${release.toUpperCase()}`)) throw new Error('quality release marker is missing');
if (!index.includes(`Brand Design ${brandRelease.toUpperCase()}`)) throw new Error('brand release marker is missing');
if (!index.includes(`Stability ${stabilityRelease.toUpperCase()}`)) throw new Error('stability release marker is missing');
if (!index.includes(`Editorial Content ${contentRelease.toUpperCase()}`)) throw new Error('editorial content release marker is missing');

const expectedStyles = ['v2-core.css', 'v2-features.css', 'v2-responsive.css', 'v2-quality.css'];
const brandStyles = ['v2-editorial.css'];
const stabilityStyles = ['v2-stabilization.css', 'v2-stabilization-a11y.css'];
const expectedModules = [
  'src/v2/main.mjs', 'src/v2/quality/install.mjs', 'src/v2/quality/visuals.mjs',
  'src/v2/ui/app.mjs', 'src/v2/ui/actions.mjs', 'src/v2/ui/screens.mjs', 'src/v2/ui/helpers.mjs',
  'src/v2/data/questions.mjs', 'src/v2/data/tracks.mjs',
  'src/v2/domain/profile.mjs', 'src/v2/domain/recommendation.mjs', 'src/v2/domain/match.mjs',
  'src/v2/infrastructure/share.mjs'
];
const brandModules = [
  'src/v2/brand/install.mjs',
  'src/v2/brand/copy.mjs',
  'src/v2/brand/interaction.mjs'
];
const editorialModules = [
  'src/v2/data/editorial-tracks.mjs',
  'src/v2/data/home-showcase.mjs',
  'src/v2/domain/presentation.mjs'
];
const expectedAudio = [
  'assets/audio/Funkorama.mp3', 'assets/audio/Dream_Catcher.mp3', 'assets/audio/Lobby_Time.mp3',
  'assets/audio/Cipher.mp3', 'assets/audio/Tech_Talk.mp3', 'assets/audio/Dreamy_Flashback.mp3',
  'assets/audio/Movement_Proposition.mp3', 'assets/audio/Pixel_Peeker_Polka_faster.mp3'
];

for (const file of [...expectedStyles, ...brandStyles, ...stabilityStyles, ...expectedModules, ...brandModules, ...editorialModules, ...expectedAudio]) {
  if (!exists(file)) throw new Error(`release asset is missing: ${file}`);
}
for (const file of expectedStyles) {
  if (!index.includes(`${file}?v=${release}`)) throw new Error(`core stylesheet is not version-locked: ${file}`);
}
for (const file of brandStyles) {
  if (!index.includes(`${file}?brand=${brandRelease}`)) throw new Error(`brand stylesheet is not version-locked: ${file}`);
}
for (const file of stabilityStyles) {
  if (!index.includes(`${file}?stability=${stabilityRelease}`)) throw new Error(`stability stylesheet is not version-locked: ${file}`);
}
for (const file of expectedModules) {
  if (!index.includes(`/${file}?v=${release}`) && file !== 'src/v2/main.mjs') {
    throw new Error(`module is missing from the core release import map: ${file}`);
  }
}
if (!index.includes(`src/v2/main.mjs?v=${release}`)) throw new Error('main module is not version-locked');
for (const file of ['install.mjs', 'interaction.mjs']) {
  if (!index.includes(`src/v2/brand/${file}?brand=${brandRelease}`)) {
    throw new Error(`brand runtime module is not version-locked: ${file}`);
  }
}
if (!read('src/v2/brand/install.mjs').includes(`copy.mjs?brand=${brandRelease}`)) throw new Error('brand copy module is not version-locked');
if (!read('src/v2/main.mjs').includes(`build-info.json?v=${release}`)) throw new Error('runtime build-info fetch is not version-locked');
if (buildInfo.brandInteraction !== `/src/v2/brand/interaction.mjs?brand=${brandRelease}`) throw new Error('brand interaction release contract is inconsistent');
const expectedStabilityStyles = stabilityStyles.map((file) => `/${file}?stability=${stabilityRelease}`);
if (JSON.stringify(buildInfo.stabilityStyles) !== JSON.stringify(expectedStabilityStyles)) {
  throw new Error('stability stylesheet release contract is inconsistent');
}
if (JSON.stringify(buildInfo.editorialData) !== JSON.stringify(editorialModules.map((file) => `/${file}`))) {
  throw new Error('editorial data release contract is inconsistent');
}
if (!read('v2-stabilization.css').includes(`Stabilization ${stabilityRelease.toUpperCase()}`)) throw new Error('stability stylesheet marker is missing');
if (!read('v2-stabilization-a11y.css').includes(`Stabilization ${stabilityRelease.toUpperCase()}`)) throw new Error('stability accessibility marker is missing');
const editorialTrackSource = read('src/v2/data/editorial-tracks.mjs');
const editorialTable = editorialTrackSource.match(/const RAW_EDITORIAL_TRACKS = `([\s\S]*?)`;/)?.[1] || '';
const editorialRows = editorialTable.trim().split('\n').filter(Boolean);
if (editorialRows.length !== 60) throw new Error(`editorial track catalog must contain exactly 60 rows; found ${editorialRows.length}`);
if (!read('src/v2/data/home-showcase.mjs').includes('HOME_SHOWCASE')) throw new Error('fixed editorial home showcase is missing');
if (!exists('ko/results/enfp/index.html') && !exists('ko/results/enfp/index.md')) throw new Error('legacy ENFP result continuity is missing');

console.log(`Core ${release} + brand ${brandRelease} + stability ${stabilityRelease} + content ${contentRelease} verified at ${root}`);
