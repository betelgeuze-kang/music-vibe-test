import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NARRATIVE_NOTE_COUNT, NARRATIVE_TRACK_NOTES } from '../src/v2/data/narrative-notes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const activeVoiceFiles = [
  'src/v2/brand/copy.mjs',
  'src/v2/data/archetypes.mjs',
  'src/v2/data/axes.mjs',
  'src/v2/data/contexts.mjs',
  'src/v2/data/questions.mjs',
  'src/v2/domain/presentation.mjs',
  'src/v2/domain/weekly.mjs',
  'src/v2/domain/match.mjs',
  'src/v2/ui/screens/empty.mjs',
  'src/v2/ui/screens/profile.mjs',
  'src/v2/ui/screens/weekly.mjs',
  'src/v2/ui/screens/now.mjs',
  'src/v2/ui/screens/match.mjs'
];
const activeVoice = activeVoiceFiles.map(read).join('\n');

for (const phrase of [
  '타입이에요',
  '리스너예요',
  '공감형 리스너',
  '도시형 리스너',
  '컬러풀한 탐험가',
  '취향의 모양을 보여줘요',
  'MUSIC IDENTITY, NOT ANOTHER MBTI',
  'Bridge Playlist',
  'Vibe Profile Required'
]) {
  assert(!activeVoice.includes(phrase), `AI-template or planning-language phrase returned: ${phrase}`);
}

assert.equal(NARRATIVE_NOTE_COUNT, 60, 'all sixty edited catalog tracks need narrative notes');
const koreanNotes = [];
const englishNotes = [];
for (const [trackId, note] of Object.entries(NARRATIVE_TRACK_NOTES)) {
  assert(note.kr.length >= 55, `${trackId} Korean note is too thin`);
  assert(note.en.length >= 90, `${trackId} English note is too thin`);
  assert(/[.!?。]$/.test(note.kr), `${trackId} Korean note must close as prose`);
  assert(/[.!?]$/.test(note.en), `${trackId} English note must close as prose`);
  assert(!/추천합니다|적합합니다|최적화|기반으로|사용자에게|provides an? |designed to|perfect for/i.test(`${note.kr} ${note.en}`), `${trackId} falls back to recommendation boilerplate`);
  koreanNotes.push(note.kr);
  englishNotes.push(note.en);
}
assert.equal(new Set(koreanNotes).size, 60, 'Korean liner notes must be unique');
assert.equal(new Set(englishNotes).size, 60, 'English liner notes must be unique');
assert.equal(new Set(koreanNotes.map((value) => value.slice(0, 28))).size, 60, 'Korean openings must not repeat');
assert.equal(new Set(englishNotes.map((value) => value.slice(0, 42))).size, 60, 'English openings must not repeat');

const data = JSON.parse(read('_data/v3_static.json'));
assert.equal(Object.keys(data.vibes).length, 8);
assert.equal(Object.keys(data.moments).length, 6);
for (const item of [...Object.values(data.vibes), ...Object.values(data.moments)]) {
  for (const language of ['ko', 'en']) {
    const copy = item[language];
    assert(copy.title && copy.tagline && copy.body && copy.cta, `static ${language} prose is incomplete`);
    assert(copy.body.length >= (language === 'ko' ? 55 : 90), `static ${language} prose is too thin`);
  }
}

console.log('NV1 human narrative voice and sixty unique liner notes passed.');
