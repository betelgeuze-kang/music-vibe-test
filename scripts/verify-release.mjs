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
if (!release || !/^[a-z0-9-]+$/i.test(release)) throw new Error('build-info.json must define a stable release ID');
if (!index.includes(`content="${release}"`)) throw new Error('index release meta does not match build-info.json');
if (!index.includes(`data-release-id="${release}"`)) throw new Error('body release ID does not match build-info.json');
if (!index.includes(`V2 Quality Gates ${release.toUpperCase()}`)) throw new Error('quality release marker is missing');

const expectedStyles = ['v2-core.css', 'v2-features.css', 'v2-responsive.css', 'v2-quality.css'];
const expectedModules = [
  'src/v2/main.mjs', 'src/v2/quality/install.mjs', 'src/v2/quality/visuals.mjs',
  'src/v2/ui/app.mjs', 'src/v2/ui/actions.mjs', 'src/v2/ui/screens.mjs', 'src/v2/ui/helpers.mjs',
  'src/v2/data/questions.mjs', 'src/v2/data/tracks.mjs',
  'src/v2/domain/profile.mjs', 'src/v2/domain/recommendation.mjs', 'src/v2/domain/match.mjs',
  'src/v2/infrastructure/share.mjs'
];
const expectedAudio = [
  'assets/audio/Funkorama.mp3', 'assets/audio/Dream_Catcher.mp3', 'assets/audio/Lobby_Time.mp3',
  'assets/audio/Cipher.mp3', 'assets/audio/Tech_Talk.mp3', 'assets/audio/Dreamy_Flashback.mp3',
  'assets/audio/Movement_Proposition.mp3', 'assets/audio/Pixel_Peeker_Polka_faster.mp3'
];

for (const file of [...expectedStyles, ...expectedModules, ...expectedAudio]) {
  if (!exists(file)) throw new Error(`release asset is missing: ${file}`);
}
for (const file of expectedStyles) {
  if (!index.includes(`${file}?v=${release}`)) throw new Error(`stylesheet is not version-locked: ${file}`);
}
for (const file of expectedModules) {
  if (!index.includes(`/${file}?v=${release}`) && file !== 'src/v2/main.mjs') {
    throw new Error(`module is missing from the release import map: ${file}`);
  }
}
if (!index.includes(`src/v2/main.mjs?v=${release}`)) throw new Error('main module is not version-locked');
if (!read('src/v2/main.mjs').includes(`build-info.json?v=${release}`)) throw new Error('runtime build-info fetch is not version-locked');
if (!exists('ko/results/enfp/index.html') && !exists('ko/results/enfp/index.md')) throw new Error('legacy ENFP result continuity is missing');

console.log(`Release ${release} verified at ${root}`);
