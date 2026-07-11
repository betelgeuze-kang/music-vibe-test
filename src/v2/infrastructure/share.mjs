import { AXES } from '../data/axes.mjs?v=qg1';
import { encodeProfile, getProfileArchetype, localize } from '../domain/profile.mjs?v=qg1';

function xmlEscape(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

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

function polarPoint(center, radius, angleDegrees) {
  const angle = (angleDegrees - 90) * Math.PI / 180;
  return [center + Math.cos(angle) * radius, center + Math.sin(angle) * radius];
}

function glyphMarkup(profile, x, y, size) {
  const center = size / 2;
  const maxRadius = size * 0.39;
  const grid = [0.33, 0.66, 1].map((ratio) => {
    const points = AXES.map((_, index) => polarPoint(center, maxRadius * ratio, index * 60).join(',')).join(' ');
    return `<polygon points="${points}" fill="none" stroke="rgba(255,255,255,.17)" stroke-width="2"/>`;
  }).join('');
  const points = AXES.map((axis, index) => {
    const score = Number(profile.scores[axis.id] ?? 50);
    return polarPoint(center, maxRadius * (0.22 + score / 100 * 0.78), index * 60).join(',');
  }).join(' ');
  return `<g transform="translate(${x} ${y})">${grid}<polygon points="${points}" fill="rgba(255,255,255,.24)" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>${points.split(' ').map((point) => { const [cx, cy] = point.split(','); return `<circle cx="${cx}" cy="${cy}" r="7" fill="#fff"/>`; }).join('')}</g>`;
}

function segmentLines(text, language, maxUnits, maxLines) {
  const source = String(text || '');
  const segmenter = typeof Intl?.Segmenter === 'function'
    ? new Intl.Segmenter(language === 'kr' ? 'ko' : 'en', { granularity: language === 'kr' ? 'grapheme' : 'word' })
    : null;
  const chunks = segmenter ? [...segmenter.segment(source)].map((item) => item.segment) : source.split(language === 'kr' ? '' : /\s+/).map((item) => language === 'kr' ? item : `${item} `);
  const lines = [];
  let line = '';
  for (const chunk of chunks) {
    const candidate = line + chunk;
    const units = [...candidate].reduce((sum, char) => sum + (/[^\u0000-\u00ff]/.test(char) ? 1.8 : 1), 0);
    if (units > maxUnits && line.trim()) { lines.push(line.trim()); line = chunk; }
    else line = candidate;
    if (lines.length >= maxLines - 1) break;
  }
  if (line.trim() && lines.length < maxLines) lines.push(line.trim());
  return lines;
}

function textLines(lines, x, y, lineHeight, attrs = '') {
  return `<text x="${x}" y="${y}" ${attrs}>${lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${xmlEscape(line)}</tspan>`).join('')}</text>`;
}

async function qrDataUrl(value) {
  try {
    const QR = await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm');
    return await QR.toDataURL(value, { errorCorrectionLevel: 'M', width: 260, margin: 1, color: { dark: '#08080b', light: '#ffffff' } });
  } catch (_) {
    return '';
  }
}

export async function createProfileCardSvg(profile, language = 'kr') {
  const archetype = getProfileArchetype(profile);
  const [start, middle, end] = archetype.gradient;
  const strongest = AXES.map((axis) => ({ axis, score: profile.scores[axis.id], distance: Math.abs(profile.scores[axis.id] - 50) })).sort((a, b) => b.distance - a.distance).slice(0, 3);
  const inviteUrl = buildInviteUrl(profile, language);
  const qr = await qrDataUrl(inviteUrl);
  const titleLines = segmentLines(localize(archetype.name, language), language, 19, 2);
  const taglineLines = segmentLines(localize(archetype.tagline, language), language, 44, 3);
  const font = `font-family="Pretendard, Noto Sans KR, Apple SD Gothic Neo, Inter, Arial, sans-serif"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${start}"/><stop offset=".55" stop-color="${middle}"/><stop offset="1" stop-color="${end}"/></linearGradient><radialGradient id="glow" cx="80%" cy="12%" r="58%"><stop stop-color="rgba(255,255,255,.38)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient></defs>
    <rect width="1200" height="1500" fill="url(#bg)"/><rect width="1200" height="1500" fill="url(#glow)"/><rect x="54" y="54" width="1092" height="1392" rx="52" fill="rgba(6,6,10,.43)" stroke="rgba(255,255,255,.2)" stroke-width="2"/>
    <text x="104" y="145" fill="rgba(255,255,255,.75)" font-size="28" font-weight="800" letter-spacing="9" ${font}>MY MUSIC VIBE</text>${glyphMarkup(profile, 720, 120, 390)}<text x="104" y="390" fill="#fff" font-size="156" font-weight="900" ${font}>${xmlEscape(archetype.symbol)}</text>
    ${textLines(titleLines, 104, 560, 104, `fill="#fff" font-size="88" font-weight="900" ${font}`)}${textLines(taglineLines, 108, 740, 48, `fill="rgba(255,255,255,.76)" font-size="33" font-weight="700" ${font}`)}<rect x="88" y="900" width="1024" height="320" rx="36" fill="rgba(0,0,0,.28)"/>
    ${strongest.map((item, index) => { const y = 970 + index * 82; const high = item.score >= 50; const direction = localize(high ? item.axis.high : item.axis.low, language); return `<text x="132" y="${y}" fill="rgba(255,255,255,.66)" font-size="24" font-weight="800" ${font}>${xmlEscape(localize(item.axis.label, language))}</text><text x="1048" y="${y}" text-anchor="end" fill="#fff" font-size="31" font-weight="900" ${font}>${xmlEscape(direction)} ${high ? item.score : 100 - item.score}</text><rect x="132" y="${y + 22}" width="916" height="12" rx="6" fill="rgba(255,255,255,.15)"/><rect x="132" y="${y + 22}" width="${Math.max(18, 916 * item.score / 100)}" height="12" rx="6" fill="#fff"/>`; }).join('')}
    ${qr ? `<rect x="862" y="1170" width="238" height="238" rx="24" fill="#fff"/><image href="${qr}" x="880" y="1188" width="202" height="202"/>` : ''}<text x="104" y="1330" fill="rgba(255,255,255,.58)" font-size="24" font-weight="800" ${font}>${xmlEscape(profile.id)}</text><text x="104" y="1380" fill="#fff" font-size="28" font-weight="900" ${font}>my-music-vibe.com</text><text x="1096" y="1410" text-anchor="end" fill="rgba(255,255,255,.5)" font-size="18" font-weight="700" ${font}>${qr ? (language === 'kr' ? '스캔해서 음악 취향 비교' : 'Scan to compare music taste') : (language === 'kr' ? '비교 링크는 프로필에서 공유' : 'Share the comparison link from your profile')}</text>
  </svg>`;
}

async function svgToPngBlob(svg) {
  if (document.fonts?.ready) await document.fonts.ready;
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 1500;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
  } finally { URL.revokeObjectURL(url); }
}

export async function downloadProfileCard(profile, language = 'kr') {
  const svg = await createProfileCardSvg(profile, language);
  const blob = await svgToPngBlob(svg);
  if (!blob) throw new Error('Could not create profile image.');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `my-music-vibe-${getProfileArchetype(profile).id}.png`;
  document.body.appendChild(link);
  link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return true;
}
