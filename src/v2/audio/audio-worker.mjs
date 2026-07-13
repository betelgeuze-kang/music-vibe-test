import { createOriginalAudioUrl, releaseOriginalAudioUrls } from './original-clips.mjs?commercial=cr1';

self.addEventListener('message', async (event) => {
  const { requestId, clipId } = event.data || {};
  if (!requestId || !clipId) return;
  try {
    const url = await createOriginalAudioUrl(clipId);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Generated audio fetch failed: ${response.status}`);
    const buffer = await response.arrayBuffer();
    releaseOriginalAudioUrls();
    self.postMessage({ requestId, clipId, buffer }, [buffer]);
  } catch (error) {
    self.postMessage({ requestId, clipId, error: String(error?.message || error || 'Audio worker failed') });
  }
});
