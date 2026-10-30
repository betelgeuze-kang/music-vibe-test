import { AXES } from '../data/axes.mjs?v=qg1';
import { CONTEXT_BY_ID } from '../data/contexts.mjs?v=qg1';
import { encodeProfile, getProfileArchetype, localize } from '../domain/profile.mjs?v=qg1';
import { formatWeeklyRange, weeklyAlias, weeklySummary } from '../domain/weekly.mjs?weekly=m4w1';

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

export async function createProfileCardSvg(profile, language = 'kr', format = 'feed') {
  const { buildProfileCardSvg } = await import('./profile-card.mjs?result=rs1');
  return buildProfileCardSvg(profile, language, format, buildInviteUrl(profile, language));
}

function weeklyTrackText(vibe, trackById, language) {
  return vibe.topTracks.slice(0, 3).map((item, index) => {
    const track = trackById[item.trackId];
    return track ? `${String(index + 1).padStart(2, '0')}  ${track.title} — ${track.artist}` : '';
  }).filter(Boolean);
}

export async function createWeeklyVibeCardSvg(vibe, profile, trackById = {}, language = 'kr') {
  const archetype = getProfileArchetype(vibe);
  const [start, middle, end] = archetype.gradient;
  const alias = weeklyAlias(vibe, language);
  const range = formatWeeklyRange(vibe, language);
  const summary = weeklySummary(vibe, language);
  const context = CONTEXT_BY_ID[vibe.dominantContextId];
  const titleLines = segmentLines(alias, language, 20, 2);
  const summaryLines = segmentLines(summary, language, 43, 4);
  const tracks = weeklyTrackText(vibe, trackById, language);
  const tags = vibe.topTags.slice(0, 5).map((item) => `#${item.tag.replaceAll(' ', '-')}`).join('   ');
  const font = `font-family="Pretendard, Noto Sans KR, Apple SD Gothic Neo, Inter, Arial, sans-serif"`;
  const glyphProfile = { ...profile, scores: vibe.scores, archetypeId: vibe.archetypeId };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
    <defs><linearGradient id="weekly-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${start}"/><stop offset=".52" stop-color="${middle}"/><stop offset="1" stop-color="${end}"/></linearGradient><radialGradient id="weekly-light" cx="82%" cy="8%" r="70%"><stop stop-color="rgba(255,255,255,.34)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient></defs>
    <rect width="1200" height="1500" fill="url(#weekly-bg)"/><rect width="1200" height="1500" fill="url(#weekly-light)"/><rect x="52" y="52" width="1096" height="1396" rx="44" fill="rgba(5,5,8,.48)" stroke="rgba(255,255,255,.22)" stroke-width="2"/>
    <text x="104" y="138" fill="rgba(255,255,255,.74)" font-size="25" font-weight="800" letter-spacing="8" ${font}>MY MUSIC VIBE · WEEKLY</text>
    <text x="104" y="205" fill="rgba(255,255,255,.62)" font-size="24" font-weight="700" ${font}>${xmlEscape(range)}</text>
    ${glyphMarkup(glyphProfile, 735, 120, 360)}
    <text x="104" y="392" fill="#fff" font-size="118" font-weight="900" ${font}>${xmlEscape(archetype.symbol)}</text>
    ${textLines(titleLines, 104, 550, 100, `fill="#fff" font-size="86" font-weight="900" ${font}`)}
    ${textLines(summaryLines, 108, 745, 45, `fill="rgba(255,255,255,.82)" font-size="31" font-weight="650" ${font}`)}
    <rect x="88" y="920" width="1024" height="382" rx="30" fill="rgba(0,0,0,.28)"/>
    <text x="128" y="982" fill="rgba(255,255,255,.58)" font-size="20" font-weight="800" letter-spacing="4" ${font}>${language === 'kr' ? '이번 주의 장면' : 'TOP MOMENT'}</text>
    <text x="128" y="1040" fill="#fff" font-size="39" font-weight="850" ${font}>${xmlEscape(context ? localize(context.shortLabel, language) : localize(archetype.name, language))}</text>
    <text x="128" y="1102" fill="rgba(255,255,255,.58)" font-size="20" font-weight="800" letter-spacing="4" ${font}>${language === 'kr' ? '이번 주의 세 곡' : 'THREE TRACKS'}</text>
    ${tracks.map((line, index) => `<text x="128" y="${1152 + index * 45}" fill="#fff" font-size="27" font-weight="720" ${font}>${xmlEscape(line)}</text>`).join('')}
    <text x="128" y="1270" fill="rgba(255,255,255,.66)" font-size="21" font-weight="700" ${font}>${xmlEscape(tags)}</text>
    <text x="104" y="1385" fill="#fff" font-size="27" font-weight="900" ${font}>my-music-vibe.com</text>
    <text x="1096" y="1385" text-anchor="end" fill="rgba(255,255,255,.58)" font-size="20" font-weight="700" ${font}>${xmlEscape(vibe.interactionCount)} ${language === 'kr' ? '개의 청취 행동' : 'listening actions'}</text>
  </svg>`;
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
