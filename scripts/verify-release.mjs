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

if (!release || !/^[a-z0-9-]+$/i.test(release)) throw new Error('build-info.json must define a stable core release ID');
if (!brandRelease || !/^[a-z0-9-]+$/i.test(brandRelease)) throw new Error('build-info.json must define a stable brand release ID');
if (!index.includes(`content="${release}"`)) throw new Error('index core release meta does not match build-info.json');
if (!index.includes(`data-release-id="${release}"`)) throw new Error('body core release ID does not match build-info.json');
if (!index.includes(`content="${brandRelease}"`)) throw new Error('index brand release meta does not match build-info.json');
if (!index.includes(`data-brand-release="${brandRelease}"`)) throw new Error('body brand release ID does not match build-info.json');
if (!index.includes(`V2 Quality Gates ${release.toUpperCase()}`)) throw new Error('quality release marker is missing');
if (!index.includes(`Brand Design ${brandRelease.toUpperCase()}`)) throw new Error('brand release marker is missing');

const expectedStyles = ['v2-core.css', 'v2-features.css', 'v2-responsive.css', 'v2-quality.css'];
const brandStyles = ['v2-editorial.css'];
const expectedModules = [
  'src/v2/main.mjs', 'src/v2/quality/install.mjs', 'src/v2/quality/visuals.mjs',
  'src/v2/ui/app.mjs', 'src/v2/ui/actions.mjs', 'src/v2/ui/screens.mjs', 'src/v2/ui/helpers.mjs',
  'src/v2/data/questions.mjs', 'src/v2/data/tracks.mjs',
  'src/v2/domain/profile.mjs', 'src/v2/domain/recommendation.mjs', 'src/v2/domain/match.mjs',
  'src/v2/infrastructure/share.mjs'
];
const brandModules = ['src/v2/brand/install.mjs', 'src/v2/brand/copy.mjs'];
const expectedAudio = [
  'assets/audio/Funkorama.mp3', 'assets/audio/Dream_Catcher.mp3', 'assets/audio/Lobby_Time.mp3',
  'assets/audio/Cipher.mp3', 'assets/audio/Tech_Talk.mp3', 'assets/audio/Dreamy_Flashback.mp3',
  'assets/audio/Movement_Proposition.mp3', 'assets/audio/Pixel_Peeker_Polka_faster.mp3'
];

for (const file of [...expectedStyles, ...brandStyles, ...expectedModules, ...brandModules, ...expectedAudio]) {
  if (!exists(file)) throw new Error(`release asset is missing: ${file}`);
}
for (const file of expectedStyles) {
  if (!index.includes(`${file}?v=${release}`)) throw new Error(`core stylesheet is not version-locked: ${file}`);
}
for (const file of brandStyles) {
  if (!index.includes(`${file}?brand=${brandRelease}`)) throw new Error(`brand stylesheet is not version-locked: ${file}`);
}
for (const file of expectedModules) {
  if (!index.includes(`/${file}?v=${release}`) && file !== 'src/v2/main.mjs') {
    throw new Error(`module is missing from the core release import map: ${file}`);
  }
}
if (!index.includes(`src/v2/main.mjs?v=${release}`)) throw new Error('main module is not version-locked');
if (!index.includes(`src/v2/brand/install.mjs?brand=${brandRelease}`)) throw new Error('brand entry module is not version-locked');
if (!read('src/v2/brand/install.mjs').includes(`copy.mjs?brand=${brandRelease}`)) throw new Error('brand copy module is not version-locked');
if (!read('src/v2/main.mjs').includes(`build-info.json?v=${release}`)) throw new Error('runtime build-info fetch is not version-locked');
if (!exists('ko/results/enfp/index.html') && !exists('ko/results/enfp/index.md')) throw new Error('legacy ENFP result continuity is missing');

console.log(`Core ${release} + brand ${brandRelease} verified at ${root}`);
