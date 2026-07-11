import { AXES } from '../data/axes.mjs';
import { encodeProfile, getProfileArchetype, localize } from '../domain/profile.mjs';

export function buildInviteUrl(profile, language = 'kr') {
  const url = new URL('/', window.location.origin);
  url.searchParams.set('compare', encodeProfile(profile));
  url.searchParams.set('lang', language === 'en' ? 'en' : 'kr');
  url.searchParams.set('src', 'share');
  url.searchParams.set('utm_source', 'music_vibe');
  url.searchParams.set('utm_medium', 'share');
  url.searchParams.set('utm_campaign', 'vibe_match');
  url.hash = '/match';
  return url.toString();
}

export async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return true;
  }

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
  const title = language === 'kr'
    ? `나의 음악 바이브: ${localize(archetype.name, 'kr')}`
    : `My music vibe: ${localize(archetype.name, 'en')}`;
  const text = language === 'kr'
    ? '우리의 음악 취향이 얼마나 잘 섞이는지 확인해봐요.'
    : 'See how well our music tastes blend.';

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { status: 'shared', method: 'native', url };
    } catch (error) {
      if (error?.name === 'AbortError') return { status: 'cancelled', method: 'native', url };
    }
  }

  await copyText(url);
  return { status: 'shared', method: 'copy', url };
}

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines - 1) break;
    } else {
      line = candidate;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  lines.forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

export async function downloadProfileCard(profile, language = 'kr') {
  const archetype = getProfileArchetype(profile);
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');

  const [start, middle, end] = archetype.gradient;
  const gradient = context.createLinearGradient(0, 0, 1200, 1500);
  gradient.addColorStop(0, start);
  gradient.addColorStop(0.55, middle);
  gradient.addColorStop(1, end);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 1500);

  const glow = context.createRadialGradient(880, 260, 20, 880, 260, 520);
  glow.addColorStop(0, 'rgba(255,255,255,.30)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 1200, 1500);

  context.fillStyle = 'rgba(7,7,12,.40)';
  roundRect(context, 58, 58, 1084, 1384, 52);
  context.fill();
  context.strokeStyle = 'rgba(255,255,255,.18)';
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = 'rgba(255,255,255,.72)';
  context.font = '700 30px Arial, sans-serif';
  context.letterSpacing = '8px';
  context.fillText('MY MUSIC VIBE', 104, 140);

  context.fillStyle = '#ffffff';
  context.font = '900 190px Arial, sans-serif';
  context.fillText(archetype.symbol, 96, 410);

  context.font = '900 88px Arial, sans-serif';
  const titleEnd = wrapText(context, localize(archetype.name, language), 104, 550, 940, 96, 2);
  context.fillStyle = 'rgba(255,255,255,.74)';
  context.font = '700 34px Arial, sans-serif';
  wrapText(context, localize(archetype.tagline, language), 108, titleEnd + 36, 900, 48, 3);

  const panelY = 860;
  context.fillStyle = 'rgba(0,0,0,.28)';
  roundRect(context, 92, panelY, 1016, 390, 38);
  context.fill();

  AXES.forEach((axis, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 132 + column * 492;
    const y = panelY + 72 + row * 102;
    const score = profile.scores[axis.id];

    context.fillStyle = 'rgba(255,255,255,.72)';
    context.font = '700 24px Arial, sans-serif';
    context.fillText(localize(axis.label, language), x, y);
    context.fillStyle = '#ffffff';
    context.font = '900 34px Arial, sans-serif';
    context.fillText(String(score), x + 352, y);

    context.fillStyle = 'rgba(255,255,255,.18)';
    roundRect(context, x, y + 20, 400, 14, 7);
    context.fill();
    context.fillStyle = 'rgba(255,255,255,.90)';
    roundRect(context, x, y + 20, 400 * (score / 100), 14, 7);
    context.fill();
  });

  context.fillStyle = 'rgba(255,255,255,.55)';
  context.font = '700 25px Arial, sans-serif';
  context.fillText(profile.id, 104, 1352);
  context.textAlign = 'right';
  context.fillText('my-music-vibe.com', 1096, 1352);
  context.textAlign = 'left';

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.94));
  if (!blob) throw new Error('Could not create profile image.');
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `my-music-vibe-${archetype.id}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
  return true;
}
