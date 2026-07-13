import { createOriginalAudioUrl as createOnMainThread, isCommercialAudioClip } from './original-clips.mjs?commercial=cr1';

export const AUDIO_PERFORMANCE_RELEASE = 'perf1';

let worker = null;
let requestSequence = 0;
const pending = new Map();
const urlCache = new Map();

function track(name, params) {
  try { window.trackEvent?.(name, params, { allowDuplicate: true }); } catch (_) {}
}

function ensureWorker() {
  if (worker) return worker;
  if (typeof Worker !== 'function') return null;
  try {
    worker = new Worker(new URL('./audio-worker.mjs?perf=perf1', import.meta.url), { type: 'module', name: 'music-vibe-audio' });
    worker.addEventListener('message', (event) => {
      const { requestId, buffer, error } = event.data || {};
      const record = pending.get(requestId);
      if (!record) return;
      pending.delete(requestId);
      if (error) record.reject(new Error(error));
      else record.resolve(buffer);
    });
    worker.addEventListener('error', (event) => {
      const error = new Error(event.message || 'Audio worker failed.');
      for (const record of pending.values()) record.reject(error);
      pending.clear();
      worker?.terminate();
      worker = null;
    });
    return worker;
  } catch (_) {
    worker = null;
    return null;
  }
}

function renderInWorker(clipId) {
  const activeWorker = ensureWorker();
  if (!activeWorker) return Promise.reject(new Error('Audio worker unavailable.'));
  requestSequence += 1;
  const requestId = `audio-${requestSequence}`;
  return new Promise((resolve, reject) => {
    pending.set(requestId, { resolve, reject });
    activeWorker.postMessage({ requestId, clipId });
  });
}

export async function createPerformanceAudioUrl(clipId) {
  const id = String(clipId || '');
  if (!isCommercialAudioClip(id)) throw new Error(`Unregistered commercial audio clip: ${id}`);
  if (globalThis.__musicVibeTestAudioFailure) throw new Error('Synthetic audio failure requested by test hook.');
  if (urlCache.has(id)) return urlCache.get(id);

  const startedAt = performance.now();
  let workerUsed = false;
  let url;
  try {
    const buffer = await renderInWorker(id);
    workerUsed = true;
    url = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  } catch (_) {
    url = await createOnMainThread(id);
  }
  const duration = Math.round(performance.now() - startedAt);
  urlCache.set(id, url);
  window.__musicVibeAudioRuntime = Object.freeze({ release: AUDIO_PERFORMANCE_RELEASE, clipId: id, workerUsed, audioGenerateMs: duration });
  track('audio_generate', { product_version: 'v3-perf1', audio_clip_id: id, audio_generate_ms: duration, worker_used: workerUsed });
  return url;
}

export function releasePerformanceAudioUrls() {
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache.clear();
}

export function audioWorkerSnapshot() {
  return Object.freeze({ release: AUDIO_PERFORMANCE_RELEASE, workerActive: Boolean(worker), pending: pending.size, cachedClips: urlCache.size, latest: window.__musicVibeAudioRuntime || null });
}
