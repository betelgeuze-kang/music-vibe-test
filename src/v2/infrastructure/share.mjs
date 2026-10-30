import { encodeProfile, getProfileArchetype, localize } from '../domain/profile.mjs?v=qg1';
import { weeklyAlias, weeklySummary } from '../domain/weekly.mjs?weekly=m4w1&journal=jn1';

export function buildInviteUrl(profile, language = 'kr') {
  const url = new URL('/', window.location.origin);
  url.searchParams.set('src', 'share');
  url.searchParams.set('utm_source', 'music_vibe');
  url.searchParams.set('utm_medium', 'share');
  url.searchParams.set('utm_campaign', 'vibe_match_qg1');
  url.hash = `/match?compare=${encodeURIComponent(encodeProfile(profile))}&lang=${language === 'en' ? 'en' : 'kr'}`;
  return url.toString();
}

export async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(value); return true; }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const success = document.execCommand('copy');
  textarea.remove();
  if (!success) throw new Error('Copy failed');
  return true;
}

export async function shareProfileInvite(profile, language = 'kr') {
  const archetype = getProfileArchetype(profile);
  const url = buildInviteUrl(profile, language);
  const title = language === 'kr' ? `나의 음악 바이브: ${localize(archetype.name, 'kr')}` : `My music vibe: ${localize(archetype.name, 'en')}`;
  const text = language === 'kr' ? '우리의 음악 취향이 얼마나 잘 섞이는지 확인해봐요.' : 'See how well our music tastes blend.';
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return { status: 'shared', method: 'native', url }; }
    catch (error) { if (error?.name === 'AbortError') return { status: 'cancelled', method: 'native', url }; }
  }
  await copyText(url);
  return { status: 'shared', method: 'copy', url };
}

export async function createProfileCardSvg(profile, language = 'kr', format = 'feed') {
  const { buildProfileCardSvg } = await import('./profile-card.mjs?result=rs1');
  return buildProfileCardSvg(profile, language, format, buildInviteUrl(profile, language));
}

export async function createWeeklyVibeCardSvg(vibe, profile, trackById = {}, language = 'kr') {
  const { buildWeeklyCardSvg } = await import('./weekly-card.mjs?journal=jn1');
  return buildWeeklyCardSvg(vibe, trackById, language);
}

async function svgToPngBlob(svg, { width = 1200, height = 1500 } = {}) {
  if (document.fonts?.ready) await document.fonts.ready;
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
  } finally { URL.revokeObjectURL(url); }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function prepareProfileCard(profile, language = 'kr', requestedFormat = 'feed') {
  const { buildProfileCardSvg, profileCardFormat, PROFILE_CARD_FORMATS } = await import('./profile-card.mjs?result=rs1');
  const format = profileCardFormat(requestedFormat);
  const dimensions = PROFILE_CARD_FORMATS[format];
  const svg = buildProfileCardSvg(profile, language, format, buildInviteUrl(profile, language));
  const blob = await svgToPngBlob(svg, dimensions);
  if (!blob) throw new Error('Could not create profile image.');
  return { blob, format, ...dimensions, filename: `my-music-vibe-${getProfileArchetype(profile).id}-${format}.png` };
}

export function savePreparedProfileCard(card) {
  downloadBlob(card.blob, card.filename);
}

// Called directly by the share button after preparation, preserving user activation.
export async function sharePreparedProfileCard(card, profile, language = 'kr') {
  if (typeof File === 'function' && navigator.share && navigator.canShare) {
    const file = new File([card.blob], card.filename, { type: 'image/png' });
    try {
      if (navigator.canShare({ files: [file] })) {
        const title = localize(getProfileArchetype(profile).name, language);
        await navigator.share({ title, text: buildInviteUrl(profile, language), files: [file] });
        return { status: 'shared', method: 'native' };
      }
    } catch (error) {
      if (error?.name === 'AbortError') return { status: 'cancelled', method: 'native' };
    }
  }
  savePreparedProfileCard(card);
  return { status: 'shared', method: 'download' };
}

export async function downloadProfileCard(profile, language = 'kr', format = 'feed') {
  savePreparedProfileCard(await prepareProfileCard(profile, language, format));
  return true;
}

export async function shareWeeklyVibeCard(vibe, profile, trackById = {}, language = 'kr') {
  const svg = await createWeeklyVibeCardSvg(vibe, profile, trackById, language);
  const blob = await svgToPngBlob(svg);
  if (!blob) throw new Error('Could not create weekly image.');
  const filename = `my-music-vibe-weekly-${vibe.weekKey}.png`;
  const title = language === 'kr' ? `이번 주의 음악 기록: ${weeklyAlias(vibe, 'kr')}` : `My Weekly Vibe: ${weeklyAlias(vibe, 'en')}`;
  const text = weeklySummary(vibe, language);

  if (typeof File === 'function' && navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title, text, files: [file] });
        return { status: 'shared', method: 'native' };
      } catch (error) {
        if (error?.name === 'AbortError') return { status: 'cancelled', method: 'native' };
      }
    }
  }

  downloadBlob(blob, filename);
  return { status: 'shared', method: 'download' };
}
