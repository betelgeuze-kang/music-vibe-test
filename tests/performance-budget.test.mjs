import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const budget = JSON.parse(fs.readFileSync(path.join(root, 'performance-budget.json'), 'utf8'));

assert.equal(budget.release, 'perf1');
for (const [file, maximum] of Object.entries(budget.staticBytes)) {
  const target = path.join(root, file);
  assert(fs.existsSync(target), `budgeted file is missing: ${file}`);
  const bytes = fs.statSync(target).size;
  assert(bytes <= maximum, `${file} is ${bytes} bytes; budget is ${maximum}`);
}

const client = fs.readFileSync(path.join(root, 'src/v2/audio/audio-worker-client.mjs'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'src/v2/audio/audio-worker.mjs'), 'utf8');
const actions = fs.readFileSync(path.join(root, 'src/v2/ui/commercial-audio-actions.mjs'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/v2/ui/app.mjs'), 'utf8');
const analytics = fs.readFileSync(path.join(root, 'p2-analytics.js'), 'utf8');

assert(client.includes("new Worker(new URL('./audio-worker.mjs?perf=perf1'"));
assert(client.includes('workerUsed'));
assert(client.includes("track('audio_generate'"));
assert(worker.includes('postMessage({ requestId, clipId, buffer }, [buffer])'));
assert(actions.includes("track('audio_first_sound'"));
assert(actions.includes('audio_first_sound_ms'));
assert(app.includes("track('route_module_load'"));
assert(app.includes('prefetchRoute'));
assert(analytics.includes('PerformanceObserver'));
for (const key of ['lcpMs', 'inpMs', 'cls']) assert(key in budget.coreWebVitals);

console.log('PERF1 static and instrumentation budgets passed.');
