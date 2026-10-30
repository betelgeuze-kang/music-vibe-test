import qrcode from '../vendor/qrcode-generator.mjs';
import { getProfileArchetype, localize } from '../domain/profile.mjs?v=qg1';
import { recordTheme, renderRecordArt } from '../brand/record-art.mjs?result=rs1';

export const PROFILE_CARD_FORMATS = Object.freeze({
  feed: Object.freeze({ width: 1080, height: 1350 }),
  story: Object.freeze({ width: 1080, height: 1920 })
});
export function profileCardFormat(format = 'feed') { return Object.hasOwn(PROFILE_CARD_FORMATS, format) ? format : 'feed'; }
const escape = (text) => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const textUnits = (text) => [...text].reduce((n, ch) => n + (/[^\u0000-\u00ff]/.test(ch) ? 1 : .56), 0);

// Wrap all input, including the final line. Card copy is bounded by authored archetypes.
export function wrapCardText(text, maxUnits) {
  const words = String(text).split(/(\s+)/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line && textUnits(line + word) > maxUnits) { lines.push(line.trim()); line = ''; }
    for (const ch of word) {
      if (textUnits(line + ch) > maxUnits) { lines.push(line.trim()); line = ''; }
      line += ch;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}
function textBlock(text, x, y, size, maxUnits, { fill='#243d33', serif=false, weight=500, gap=1.4 } = {}) {
  const family = serif ? 'Georgia, AppleMyungjo, NanumMyeongjo, Batang, serif' : 'Arial, Noto Sans KR, Apple SD Gothic Neo, sans-serif';
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${family}" font-size="${size}" font-weight="${weight}">${wrapCardText(text,maxUnits).map((line,i)=>`<tspan x="${x}" dy="${i ? size*gap : 0}">${escape(line)}</tspan>`).join('')}</text>`;
}
export function inviteQrSvg(url, x, y, width) {
  const qr = qrcode(0, 'M');
  qr.addData(url, 'Byte');
  qr.make();
  const count = qr.getModuleCount();
  const path = [];
  for (let r=0;r<count;r++) for(let c=0;c<count;c++) if(qr.isDark(r,c)) path.push(`M${c+4} ${r+4}h1v1h-1z`);
  return `<svg x="${x}" y="${y}" width="${width}" height="${width}" viewBox="0 0 ${count+8} ${count+8}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${path.join('')}" fill="#243d33"/></svg>`;
}
export function buildProfileCardSvg(profile, language, requestedFormat, inviteUrl) {
  const format = profileCardFormat(requestedFormat);
  const { width, height } = PROFILE_CARD_FORMATS[format];
  const story = format === 'story';
  const archetype = getProfileArchetype(profile);
  const theme = recordTheme(archetype.id);
  const korean = language !== 'en';
  const artSize = story ? 680 : 540;
  const artY = story ? 285 : 155;
  const titleY = story ? 1110 : 815;
  const taglineY = story ? 1220 : 895;
  const tagsY = story ? 1410 : 1020;
  const footerY = height - (story ? 420 : 250);
  let tagX = 72;
  const tags = localize(archetype.keywords, language).map((tag) => {
    const tagWidth = Math.ceil(textUnits(tag)*25+48);
    const result = `<rect x="${tagX}" y="${tagsY-30}" width="${tagWidth}" height="48" rx="24" fill="${theme.paper}"/><text x="${tagX+24}" y="${tagsY+2}" font-family="Arial, Noto Sans KR, sans-serif" font-size="25" fill="#243d33">${escape(tag)}</text>`;
    tagX += tagWidth + 14;
    return result;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(localize(archetype.name, language))}">
    <rect width="${width}" height="${height}" fill="#f5f1e8"/>
    <path d="M72 110 H1008 M72 ${footerY-26} H1008" stroke="#c6cebf"/>
    ${textBlock('my music vibe',72,80,36,40,{serif:true,weight:600})}
    ${textBlock('LISTENING NOTE',752,76,19,40,{fill:'#60685f'})}
    <rect x="${(width-artSize)/2+14}" y="${artY+14}" width="${artSize}" height="${artSize}" fill="#dddccd"/>
    <svg x="${(width-artSize)/2}" y="${artY}" width="${artSize}" height="${artSize}" viewBox="0 0 500 500">${renderRecordArt(archetype.id)}</svg>
    ${textBlock(korean ? '나의 음악 취향' : 'MY KIND OF MUSIC',72,titleY-100,22,45,{fill:'#60685f'})}
    ${textBlock(localize(archetype.name, language),72,titleY,76,20,{serif:true,weight:600})}
    ${textBlock(localize(archetype.tagline, language),72,taglineY,32,29,{fill:'#60685f',gap:1.5})}
    ${tags}
    ${textBlock(korean ? '너의 취향과 나의 취향,' : 'Your taste. My taste.',72,footerY+62,30,32,{serif:true})}
    ${textBlock(korean ? '그 사이의 좋은 음악.' : 'Good music in between.',72,footerY+106,30,32,{serif:true})}
    ${textBlock('my-music-vibe.com',72,height-(story ? 220 : 70),25,38,{fill:'#60685f'})}
    ${inviteQrSvg(inviteUrl, 788,footerY,200)}
    ${textBlock(korean ? '스캔해서 취향 비교' : 'SCAN TO COMPARE',797,height-(story ? 195 : 24),17,35,{fill:'#60685f'})}
  </svg>`;
}
