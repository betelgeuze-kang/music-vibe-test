import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROFILE_QUESTIONS } from '../src/v2/data/questions.mjs';
import { ORIGINAL_AUDIO_CLIPS, ORIGINAL_AUDIO_BY_ID, isCommercialAudioClip } from '../src/v2/audio/original-clips.mjs';
import { ADS_ENABLED, AD_PROVIDER, AD_PUBLISHER_ID, ADS_TXT_RECORD, ALLOWED_AD_PLACEMENTS, BLOCKED_AD_CONTEXTS, BLOCKED_AD_ROUTES, canRenderAd } from '../src/v2/ads/policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const index = read('index.html');
const manifest = JSON.parse(read('assets/audio/rights-manifest.json'));
const buildInfo = JSON.parse(read('build-info.json'));
const questionsSource = read('src/v2/data/questions.mjs');
const audioSource = read('src/v2/audio/original-clips.mjs');
const audioActions = read('src/v2/ui/commercial-audio-actions.mjs');
const shell = read('src/v2/ui/components/shell.mjs');
const dialogs = read('src/v2/ui/dialogs.mjs');
const privacy = read('privacy/index.html');
const about = read('about/index.html');
const credits = read('audio-credits/index.html');
const adsOps = read('docs/operations/ADS_MONETIZATION_READINESS.md');

const activeAudioOptions = PROFILE_QUESTIONS.flatMap((question) => question.kind === 'audio' ? question.options : []);
const activeIds = activeAudioOptions.map((option) => option.audioClipId);
assert.equal(activeIds.length, 8, 'four A/B audio questions must expose eight clips');
assert.equal(new Set(activeIds).size, 8, 'active audio IDs must be unique');
assert.equal(ORIGINAL_AUDIO_CLIPS.length, 8, 'audio source registry must contain eight clips');
assert.equal(manifest.clips.length, 8, 'rights manifest must contain eight clips');

for (const option of activeAudioOptions) {
  assert.equal(typeof option.audioClipId, 'string');
  assert.equal('audioSrc' in option, false, `${option.id} must not use a self-hosted third-party audio path`);
  assert(ORIGINAL_AUDIO_BY_ID[option.audioClipId], `missing source registry entry: ${option.audioClipId}`);
  assert(isCommercialAudioClip(option.audioClipId), `clip is not allowed for commercial operation: ${option.audioClipId}`);
  assert(manifest.clips.some((item) => item.id === option.audioClipId && item.commercialUseAllowed && item.samplesUsed === false), `rights manifest is incomplete for ${option.audioClipId}`);
}

assert.equal(manifest.release, 'cr1');
assert.equal(manifest.thirdPartySamplesUsed, false);
assert.equal(manifest.license.shortName, 'CC BY 4.0');
assert.equal(manifest.license.commercialUseAllowed, true);
assert(manifest.sourceModule.includes('original-clips.mjs'));
assert(audioSource.includes('generated: true'));
assert(audioSource.includes('samplesUsed: false'));
assert(audioSource.includes('createOriginalAudioUrl'));
assert(audioActions.includes('isCommercialAudioClip'));
assert(audioActions.includes('audio_clip_id'));
assert(!questionsSource.includes('audioSrc'));
assert(!questionsSource.includes('.mp3'));
assert(!questionsSource.includes('Tech_Talk'));

const retiredFiles = ['Funkorama.mp3', 'Dream_Catcher.mp3', 'Lobby_Time.mp3', 'Cipher.mp3', 'Tech_Talk.mp3', 'Dreamy_Flashback.mp3', 'Movement_Proposition.mp3', 'Pixel_Peeker_Polka_faster.mp3'];
for (const filename of retiredFiles) assert.equal(exists(`assets/audio/${filename}`), false, `retired asset remains: ${filename}`);

assert.equal(ADS_ENABLED, false);
assert.equal(AD_PROVIDER, 'google-adsense');
assert.equal(AD_PUBLISHER_ID, 'pub-1386368370627622');
assert.equal(ADS_TXT_RECORD, 'google.com, pub-1386368370627622, DIRECT, f08c47fec0942fa0');
assert.equal(canRenderAd({ route: 'home', placement: ALLOWED_AD_PLACEMENTS[0], consent: true }), false, 'seller configuration must not enable ad delivery by itself');
assert(BLOCKED_AD_ROUTES.includes('discover'));
assert(BLOCKED_AD_ROUTES.includes('match'));
for (const context of ['listening-booth', 'quiz-option', 'track-feedback', 'streaming-link-group', 'dialog', 'consent-region']) {
  assert(BLOCKED_AD_CONTEXTS.includes(context), `blocked ad context is missing: ${context}`);
}
assert.equal(exists('ads.txt'), true, 'the existing authorized seller record must remain public');
assert.equal(read('ads.txt').trim(), ADS_TXT_RECORD, 'ads.txt must match the configured public publisher record exactly');
assert(!/pagead2\.googlesyndication\.com|adsbygoogle|doubleclick\.net/i.test(index), 'live advertising code must not ship in CR1');
assert(index.includes('data-ads-enabled="false"'));

for (const file of ['privacy/index.html', 'about/index.html', 'audio-credits/index.html', 'assets/audio/rights-manifest.json', 'docs/legal/RETIRED_AUDIO_AUDIT.md', 'docs/operations/ADS_MONETIZATION_READINESS.md', 'docs/operations/ads.txt.example', 'ads.txt']) {
  assert(exists(file), `commercial transparency file is missing: ${file}`);
}
assert(shell.includes('/privacy/') && shell.includes('/about/') && shell.includes('/audio-credits/'));
assert(dialogs.includes('/privacy/') && dialogs.includes('/audio-credits/') && dialogs.includes('현재 광고 스크립트'));
assert(privacy.includes('현재 광고 비활성'));
assert(privacy.includes('맞춤형 광고'));
assert(privacy.includes('pub-1386368370627622'));
assert(about.includes('상업 음원 파일'));
assert(about.includes('공식 제휴'));
assert(credits.includes('직접 합성'));
assert(credits.includes('rights-manifest.json'));
assert(adsOps.includes('ADS_ENABLED = false'));
assert(adsOps.includes('pub-1386368370627622'));
assert(adsOps.includes('seller record does not enable ad delivery'));

assert.equal(buildInfo.commercialReadinessRelease, 'cr1');
assert.equal(buildInfo.adsEnabled, false);
assert.equal(buildInfo.adProvider, 'google-adsense');
assert.equal(buildInfo.adPublisherId, 'pub-1386368370627622');
assert.equal(buildInfo.adsTxt, '/ads.txt');
assert.equal(buildInfo.entry, '/src/v2/main.mjs?commercial=cr1');
assert.equal(buildInfo.styleEntry, '/v2-app.css?commercial=cr1');
assert.equal(buildInfo.audioRightsManifest, '/assets/audio/rights-manifest.json');
assert.deepEqual(buildInfo.publicPolicies, ['/about/', '/privacy/', '/audio-credits/']);

console.log('CR1 commercial readiness, audio rights, seller record, and advertising safety checks passed.');
