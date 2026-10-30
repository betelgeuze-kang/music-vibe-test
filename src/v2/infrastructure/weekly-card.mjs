import { getProfileArchetype } from '../domain/profile.mjs?v=qg1';
import { formatWeeklyRange, weeklyAlias, weeklySummary } from '../domain/weekly.mjs?weekly=m4w1&journal=jn1';
import { renderRecordArt } from '../brand/record-art.mjs?result=rs1';
import { wrapCardText } from './profile-card.mjs?result=rs1';

const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
function text(value, x, y, size, units, { muted = false, serif = false, weight = 500 } = {}) {
  return `<text x="${x}" y="${y}" fill="${muted ? '#60685f' : '#243d33'}" font-family="${serif ? 'Georgia, AppleMyungjo, Batang, serif' : 'Arial, Noto Sans KR, Apple SD Gothic Neo, sans-serif'}" font-size="${size}" font-weight="${weight}">${wrapCardText(value, units).map((line, index) => `<tspan x="${x}" dy="${index ? size * 1.4 : 0}">${escape(line)}</tspan>`).join('')}</text>`;
}

export function buildWeeklyCardSvg(vibe, trackById, language = 'kr') {
  const korean = language === 'kr';
  const archetype = getProfileArchetype(vibe);
  const tracks = vibe.topTracks.map(item => trackById[item.trackId]).filter(Boolean).slice(0, 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
    <rect width="1200" height="1500" fill="#f5f1e8"/>
    <path d="M80 124 H1120 M80 822 H1120 M80 1360 H1120" stroke="#c6cebf"/>
    ${text('my music vibe', 80, 88, 38, 35, { serif: true, weight: 600 })}
    ${text('WEEKLY NOTES', 870, 83, 20, 25, { muted: true })}
    ${text(`${String(vibe.weekKey).slice(0, 4)} · ${formatWeeklyRange(vibe, language)}`, 80, 194, 24, 45, { muted: true })}
    ${text(korean ? '나의 일주일은' : 'MY WEEK SOUNDED LIKE', 80, 260, 23, 35, { muted: true })}
    ${text(weeklyAlias(vibe, language), 80, 360, 70, 8.4, { serif: true, weight: 600 })}
    <rect x="744" y="209" width="376" height="376" fill="#fffdf8" stroke="#d9d9cb"/>
    <svg x="762" y="227" width="340" height="340" viewBox="0 0 500 500">${renderRecordArt(archetype.id)}</svg>
    ${text(weeklySummary(vibe, language), 80, 660, 29, 35, { muted: true })}
    ${text(korean ? '다시 펼쳐볼 음악' : 'TRACKS TO REVISIT', 80, 880, 27, 40, { serif: true, weight: 600 })}
    ${tracks.map((track, index) => {
      const y = 958 + index * 122;
      return `${text(String(index + 1).padStart(2, '0'), 80, y, 22, 3, { muted: true })}${text(track.title, 145, y, 29, 32, { weight: 600 })}${text(track.artist, 145, y + 77, 22, 42, { muted: true })}`;
    }).join('')}
    ${tracks.length ? '' : text(korean ? '이번 기록에는 장면 선택이 더 많이 담겼어요.' : 'This note holds more moment choices than song activity.', 80, 970, 28, 34, { muted: true })}
    ${text('my-music-vibe.com', 80, 1410, 24, 35)}
    ${text(korean ? `${vibe.interactionCount}개의 사이트 행동 기록` : `${vibe.interactionCount} actions on this site`, 740, 1408, 20, 33, { muted: true })}
    ${text(korean ? '선택 · 링크 클릭 · 곡 반응 / 외부 재생 이력은 포함하지 않아요.' : 'Choices · link clicks · feedback / external playback is not imported.', 80, 1452, 19, 95, { muted: true })}
  </svg>`;
}
