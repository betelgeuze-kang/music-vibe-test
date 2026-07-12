import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(__dirname, '..');
const rootFlag = process.argv.indexOf('--root');
const root = rootFlag >= 0 ? path.resolve(process.argv[rootFlag + 1]) : repositoryRoot;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const fail = (message) => { throw new Error(message); };

const index = read('index.html');
const buildInfo = JSON.parse(read('build-info.json'));
const releases = {
  release: buildInfo.release,
  brandRelease: buildInfo.brandRelease,
  stabilityRelease: buildInfo.stabilityRelease,
  contentRelease: buildInfo.contentRelease,
  uiRelease: buildInfo.uiRelease,
  engagementRelease: buildInfo.engagementRelease,
  timelineRelease: buildInfo.timelineRelease,
  weeklyRelease: buildInfo.weeklyRelease,
  frontendQualityRelease: buildInfo.frontendQualityRelease,
  humanEditorialRelease: buildInfo.humanEditorialRelease,
  commercialReadinessRelease: buildInfo.commercialReadinessRelease
};

for (const [label, value] of Object.entries(releases)) {
  if (!value || !/^[a-z0-9-]+$/i.test(value)) fail(`build-info.json must define a stable ${label}`);
}

const markerContracts = [
  ['music-vibe-release', 'data-release-id', releases.release],
  ['music-vibe-brand-release', 'data-brand-release', releases.brandRelease],
  ['music-vibe-stability-release', 'data-stability-release', releases.stabilityRelease],
  ['music-vibe-content-release', 'data-content-release', releases.contentRelease],
  ['music-vibe-ui-release', 'data-ui-release', releases.uiRelease],
  ['music-vibe-engagement-release', 'data-engagement-release', releases.engagementRelease],
  ['music-vibe-timeline-release', 'data-timeline-release', releases.timelineRelease],
  ['music-vibe-weekly-release', 'data-weekly-release', releases.weeklyRelease],
  ['music-vibe-frontend-quality-release', 'data-frontend-quality-release', releases.frontendQualityRelease],
  ['music-vibe-human-editorial-release', 'data-human-editorial-release', releases.humanEditorialRelease],
  ['music-vibe-commercial-readiness-release', 'data-commercial-readiness-release', releases.commercialReadinessRelease]
];
for (const [meta, bodyAttribute, value] of markerContracts) {
  if (!index.includes(`name="${meta}" content="${value}"`)) fail(`${meta} does not match build-info.json`);
  if (!index.includes(`${bodyAttribute}="${value}"`)) fail(`${bodyAttribute} does not match build-info.json`);
}

for (const marker of ['Canonical UI F1', 'M4 Feedback M4F1', 'Profile Timeline M4T1', 'Weekly Vibe M4W1', 'Frontend Quality FQ1', 'Human Editorial HE1', 'Commercial Readiness CR1']) {
  if (!index.includes(marker)) fail(`index release marker missing: ${marker}`);
}
if ((index.match(/rel="stylesheet"/g) || []).length !== 1) fail('index must load exactly one canonical stylesheet');
if (!index.includes('v2-app.css?commercial=cr1')) fail('canonical stylesheet must be CR1-versioned');
if (!index.includes('src/v2/main.mjs?commercial=cr1')) fail('canonical app entry must be CR1-versioned');
if (!index.includes('data-ads-enabled="false"')) fail('advertising must be disabled by default');
if (/pagead2\.googlesyndication\.com|adsbygoogle|doubleclick\.net/i.test(index)) fail('live advertising code must not be present in CR1');
if (exists('ads.txt')) fail('root ads.txt must not exist before a real publisher ID is issued');

const requiredFiles = [
  'v2-app.css', 'v2-core.css', 'v2-features.css', 'v2-responsive.css', 'v2-quality.css', 'v2-editorial.css',
  'v2-stabilization.css', 'v2-stabilization-a11y.css', 'v2-m4.css', 'v2-m4-timeline.css', 'v2-m4-weekly.css',
  'v2-frontend-quality.css', 'v2-human-editorial.css', 'v2-commercial-readiness.css', 'legal.css',
  'src/v2/main.mjs', 'src/v2/ui/app.mjs', 'src/v2/ui/actions.mjs', 'src/v2/ui/commercial-audio-actions.mjs',
  'src/v2/ui/components/shell.mjs', 'src/v2/ui/dialogs.mjs', 'src/v2/ui/consent-a11y.mjs',
  'src/v2/ui/screens/home.mjs', 'src/v2/ui/screens/discover.mjs', 'src/v2/ui/screens/profile.mjs',
  'src/v2/ui/screens/weekly.mjs', 'src/v2/ui/screens/now.mjs', 'src/v2/ui/screens/match.mjs',
  'src/v2/audio/original-clips.mjs', 'src/v2/ads/policy.mjs', 'src/v2/data/questions.mjs',
  'src/v2/data/editorial-tracks.mjs', 'src/v2/data/home-showcase.mjs', 'src/v2/domain/recommendation.mjs',
  'src/v2/domain/match.mjs', 'src/v2/domain/weekly.mjs', 'src/v2/domain/timeline.mjs',
  'src/v2/infrastructure/storage.mjs', 'src/v2/infrastructure/share.mjs',
  'assets/audio/rights-manifest.json', 'about/index.html', 'privacy/index.html', 'audio-credits/index.html',
  'docs/legal/RETIRED_AUDIO_AUDIT.md', 'docs/operations/ADS_MONETIZATION_READINESS.md', 'docs/operations/ads.txt.example'
];
for (const file of requiredFiles) if (!exists(file)) fail(`release asset is missing: ${file}`);

const retiredAudioFiles = [
  'assets/audio/Funkorama.mp3', 'assets/audio/Dream_Catcher.mp3', 'assets/audio/Lobby_Time.mp3',
  'assets/audio/Cipher.mp3', 'assets/audio/Tech_Talk.mp3', 'assets/audio/Dreamy_Flashback.mp3',
  'assets/audio/Movement_Proposition.mp3', 'assets/audio/Pixel_Peeker_Polka_faster.mp3'
];
for (const file of retiredAudioFiles) if (exists(file)) fail(`retired audio asset remains in active tree: ${file}`);

const cssEntry = read('v2-app.css');
for (const layer of ['core', 'features', 'responsive', 'quality', 'editorial', 'stability', 'accessibility', 'engagement', 'timeline', 'weekly', 'frontend-quality', 'human-editorial', 'commercial-readiness']) {
  if (!cssEntry.includes(`layer(${layer})`)) fail(`canonical CSS missing layer: ${layer}`);
}
if (!cssEntry.includes('v2-commercial-readiness.css?commercial=cr1')) fail('CR1 CSS is not version-locked');

const mainSource = read('src/v2/main.mjs');
const appSource = read('src/v2/ui/app.mjs');
const audioActions = read('src/v2/ui/commercial-audio-actions.mjs');
const audioSource = read('src/v2/audio/original-clips.mjs');
const questionsSource = read('src/v2/data/questions.mjs');
const adPolicy = read('src/v2/ads/policy.mjs');
const shell = read('src/v2/ui/components/shell.mjs');
const dialogs = read('src/v2/ui/dialogs.mjs');
const manifest = JSON.parse(read('assets/audio/rights-manifest.json'));

if (!mainSource.includes('./ui/app.mjs?commercial=cr1') || !mainSource.includes('build-info.json?commercial=cr1')) fail('main entry is not CR1-versioned');
if (!appSource.includes("COMMERCIAL_READINESS_RELEASE = 'cr1'")) fail('app CR1 marker is missing');
if (!appSource.includes('commercialAudioMethods')) fail('commercial audio methods are not composed into the app');
if (!audioActions.includes('createOriginalAudioUrl') || !audioActions.includes('isCommercialAudioClip')) fail('runtime commercial audio allowlist is incomplete');
if (!questionsSource.includes('audioClipId') || questionsSource.includes('audioSrc') || questionsSource.includes('.mp3')) fail('questions must use only registered synthetic clip IDs');
if (questionsSource.includes('Tech_Talk')) fail('unverified Tech Talk reference must not return');
if (!audioSource.includes('samplesUsed: false') || !audioSource.includes('createOriginalAudioUrl') || !audioSource.includes('CC BY 4.0')) fail('original audio provenance contract is incomplete');

const clipIds = [...questionsSource.matchAll(/audioClipId:\s*'([^']+)'/g)].map((match) => match[1]);
const registryIds = [...audioSource.matchAll(/id:\s*'([^']+-cr1)'/g)].map((match) => match[1]);
const manifestIds = manifest.clips.map((item) => item.id);
if (clipIds.length !== 8 || new Set(clipIds).size !== 8) fail('exactly eight unique active audio clips are required');
for (const id of clipIds) {
  if (!registryIds.includes(id)) fail(`question audio ID missing from source registry: ${id}`);
  if (!manifestIds.includes(id)) fail(`question audio ID missing from rights manifest: ${id}`);
}
if (manifest.release !== 'cr1' || manifest.thirdPartySamplesUsed !== false || manifest.clips.length !== 8) fail('rights manifest release or clip count is invalid');
for (const item of manifest.clips) {
  if (!item.commercialUseAllowed || item.samplesUsed !== false || !item.titleKr || !item.titleEn) fail(`invalid rights manifest entry: ${item.id}`);
}

if (!adPolicy.includes('ADS_ENABLED = false') || !adPolicy.includes("AD_PUBLISHER_ID = ''")) fail('advertising must remain disabled and unconfigured');
if (!adPolicy.includes("'discover'") || !adPolicy.includes("'listening-booth'") || !adPolicy.includes('canRenderAd')) fail('ad route/context safety contract is incomplete');
if (!shell.includes('/about/') || !shell.includes('/privacy/') || !shell.includes('/audio-credits/')) fail('footer legal links are incomplete');
if (!dialogs.includes('/privacy/') || !dialogs.includes('/audio-credits/') || !dialogs.includes('현재 광고 스크립트')) fail('privacy dialog commercial disclosure is incomplete');

const about = read('about/index.html');
const privacy = read('privacy/index.html');
const credits = read('audio-credits/index.html');
if (!about.includes('data-commercial-readiness-release="cr1"') || !about.includes('상업 음원 파일')) fail('about page is incomplete');
if (!privacy.includes('data-commercial-readiness-release="cr1"') || !privacy.includes('현재 광고 비활성') || !privacy.includes('맞춤형 광고')) fail('privacy page is incomplete');
if (!credits.includes('data-commercial-readiness-release="cr1"') || !credits.includes('직접 합성') || !credits.includes('rights-manifest.json')) fail('audio credits page is incomplete');

if (buildInfo.entry !== '/src/v2/main.mjs?commercial=cr1') fail('build-info entry contract is inconsistent');
if (buildInfo.styleEntry !== '/v2-app.css?commercial=cr1') fail('build-info style contract is inconsistent');
if (buildInfo.audioSource !== '/src/v2/audio/original-clips.mjs?commercial=cr1') fail('build-info audio source contract is inconsistent');
if (buildInfo.audioRightsManifest !== '/assets/audio/rights-manifest.json') fail('build-info rights manifest contract is inconsistent');
if (buildInfo.adsEnabled !== false || buildInfo.runtimeOverrides !== false) fail('build-info commercial safety flags are invalid');
if (!Array.isArray(buildInfo.commercialReadinessData) || buildInfo.commercialReadinessData.length !== 8) fail('commercial readiness data contract is incomplete');

const editorialSource = read('src/v2/data/editorial-tracks.mjs');
const editorialTable = editorialSource.match(/const RAW_EDITORIAL_TRACKS = `([\s\S]*?)`;/)?.[1] || '';
if (editorialTable.trim().split('\n').filter(Boolean).length !== 60) fail('editorial catalog must retain exactly 60 curated rows');
if (!exists('ko/results/enfp/index.html') && !exists('ko/results/enfp/index.md')) fail('legacy static result continuity is missing');

console.log(`CR1 commercial-readiness release verified at ${root}`);
