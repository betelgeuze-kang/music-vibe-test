import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LISTENING_GUIDES, guidePath } from '../src/v2/data/listening-guides.mjs';
import { VERIFIED_TRACK_LINKS } from '../src/v2/data/verified-track-links.mjs';
import { renderRecordArt } from '../src/v2/brand/record-art.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checking = process.argv.includes('--check');
const origin = 'https://my-music-vibe.com';
const escape = (s) => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const loc = (obj, lang) => obj?.[lang] || obj?.en || '';
const indexPath = (lang) => `${lang === 'en' ? '/en' : ''}/listening/`;
const outputs = new Map();

function frame({ language, title, description, pathname, alternate, body, guide }) {
  const kr = language === 'kr';
  const ld = guide ? { '@context':'https://schema.org', '@type':'Article', headline:title, description, inLanguage:kr?'ko':'en', datePublished:guide.publishedAt, dateModified:guide.publishedAt, author:{ '@type':'Organization',name:'My Music Vibe',url:origin+'/about/' }, mainEntityOfPage:origin+pathname } : null;
  return `<!doctype html>
<html lang="${kr?'ko':'en'}">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <title>${escape(title)} | My Music Vibe</title>
  <meta name="description" content="${escape(description)}">
  <link rel="canonical" href="${origin}${pathname}">
  <link rel="alternate" hreflang="ko" href="${origin}${kr?pathname:alternate}">
  <link rel="alternate" hreflang="en" href="${origin}${kr?alternate:pathname}">
  <meta property="og:type" content="${guide?'article':'website'}"><meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${origin}${pathname}">
  <meta property="og:image" content="${origin}/assets/icon_main.webp">
  <link rel="stylesheet" href="/v2-listening-guides.css?listening=ln1">
  ${ld?`<script type="application/ld+json">${JSON.stringify(ld).replaceAll('<','\\u003c')}</script>`:''}
  <script src="/p2-analytics.js?v=ga4-isolated-20261025" defer></script>
  <script type="module" src="/src/v2/ui/listening-page.mjs?listening=ln1"></script>
</head>
<body data-page-type="listening_guide" data-language="${kr?'ko':'en'}" data-guide-id="${guide?.id||'index'}" data-analytics-consent-ui="standalone" data-ads-enabled="false">
  <a class="skip-link" href="#main">${kr?'본문으로 건너뛰기':'Skip to content'}</a>
  <header class="guide-header"><a class="guide-brand" href="/?lang=${language}#/home">my music vibe<small>YOUR EVERYDAY SOUNDTRACK</small></a><nav aria-label="${kr?'주요 메뉴':'Main navigation'}"><a href="${indexPath(language)}">${kr?'상황별 선곡':'Listening notes'}</a><a href="/?lang=${language}#/discover">${kr?'내 취향 찾기':'Find my taste'}</a><a href="${alternate}" lang="${kr?'en':'ko'}">${kr?'EN':'한국어'}</a></nav></header>
  <main id="main">${body}</main>
  <footer class="guide-footer"><div><strong>MY MUSIC VIBE</strong><p>${kr?'소리를 고르고, 이유를 읽고, 나만의 음악으로.':'Choose a sound. Read its story. Make it your own.'}</p></div><nav aria-label="${kr?'운영 정보':'Site information'}"><a href="/about/">${kr?'서비스 소개':'About'}</a><a href="/audio-credits/">${kr?'오디오 권리':'Audio rights'}</a><a href="/privacy/">${kr?'개인정보·쿠키':'Privacy'}</a><button type="button" data-guide-consent>${kr?'분석 설정':'Analytics settings'}</button></nav></footer>
</body>
</html>
`;
}

for (const language of ['kr','en']) {
  const kr = language === 'kr';
  const idx = indexPath(language);
  for (const guide of LISTENING_GUIDES) {
    const pathname = guidePath(guide.id,language);
    const alternate = guidePath(guide.id,kr?'en':'kr');
    const title = loc(guide.title,language);
    const body = `
    <nav class="guide-breadcrumb" aria-label="${kr?'현재 위치':'Breadcrumb'}"><a href="${idx}">${kr?'상황별 선곡':'Listening notes'}</a><span aria-hidden="true"> / </span><span>${escape(loc(guide.label,language))}</span></nav>
    <article class="guide-article">
      <header class="guide-hero"><div><span class="guide-kicker">LISTENING NOTES / ${guide.number}</span><h1>${escape(title)}</h1><p class="guide-dek">${escape(loc(guide.description,language))}</p><p class="guide-byline">${kr?'My Music Vibe 편집 선곡':'An editorial selection by My Music Vibe'} · <time datetime="${guide.publishedAt}">${guide.publishedAt}</time> · 3 TRACKS</p></div><div class="guide-sleeve" aria-hidden="true">${renderRecordArt(guide.art)}<span>${escape(loc(guide.label,language))}</span></div></header>
      <section class="guide-intro" aria-labelledby="intro-title"><h2 id="intro-title">${kr?'이 장면을 고른 이유':'A note for this moment'}</h2><div>${guide.intro[language].map((p)=>`<p>${escape(p)}</p>`).join('')}</div></section>
      <nav class="guide-track-index" aria-label="${kr?'세 곡 바로 보기':'Jump to a track'}">${guide.tracks.map((c,i)=>`<a href="#track-${i+1}"><span>0${i+1}</span>${escape(c.track.title)}</a>`).join('')}</nav>
      <section class="guide-tracks" aria-label="${kr?'세 곡과 듣기 포인트':'Three songs and listening notes'}">${guide.tracks.map((c,i)=>{
        const version = VERIFIED_TRACK_LINKS[c.track.id]?.version;
        return `<article class="guide-track" id="track-${i+1}" data-track-id="${escape(c.track.id)}" data-track-artist="${escape(c.track.artist)}"><span class="guide-track-number" aria-hidden="true">0${i+1}</span><div><p class="guide-kicker">${c.track.year} / ${escape(c.track.region)}</p><h2>${escape(c.track.title)}</h2><p class="guide-track-artist">${escape(c.track.artist)}${version?` · ${escape(loc(version,language))}`:''}</p><p>${escape(loc(c.reason,language))}</p><div class="guide-listening-point"><h3>${kr?'이 소리를 들어보세요':'Listen for this'}</h3><p>${escape(loc(guide.points[c.track.id],language))}</p></div><div class="guide-track-links"><a class="guide-button guide-button--ink" href="${escape(c.urls.youtube)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="youtube" data-placement="listening_guide" aria-label="${escape(c.track.title)} · YouTube · ${kr?'곡 열기 · 새 창':'open track · new tab'}">YouTube ${kr?'곡 열기':'open track'} ↗</a><a class="guide-button" href="${escape(c.urls.spotify)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="spotify" data-placement="listening_guide" aria-label="${escape(c.track.title)} · Spotify · ${kr?'검색 · 새 창':'search · new tab'}">Spotify ${kr?'검색':'search'} ↗</a></div></div></article>`;
      }).join('')}</section>
      <section class="guide-flow"><span class="guide-kicker">SIDE A → SIDE B</span><h2>${kr?'이 순서로 이어 들어보세요':'A way through the sequence'}</h2><p>${escape(loc(guide.flow,language))}</p></section>
      <aside class="guide-method"><h2>${kr?'이 선곡에 대하여':'About this selection'}</h2><p>${kr?'직접 작성한 감상과 고정된 편집 선곡입니다. 개인 취향을 분석한 결과나 집중·기분 변화의 효과를 측정한 자료는 아닙니다. YouTube는 확인한 곡으로, Spotify는 곡·아티스트 검색으로 연결하며 서비스·지역에 따라 재생 조건이 다를 수 있습니다. 곡을 여는 행동과 실제 청취 기록은 구분합니다.':'These are original listening notes and a fixed editorial selection, rather than a personal analysis or measured effect on concentration or mood. YouTube opens a reviewed track; Spotify opens a song-and-artist search. Availability varies by service and region. Opening a link is distinct from confirmed listening.'}</p></aside>
    </article>
    <section class="guide-next"><div><span class="guide-kicker">MAKE IT YOURS</span><h2>${kr?'이 장면에 내 취향을 더하면?':'What would this moment sound like for you?'}</h2><p>${kr?'소리와 장면을 열 번 고르고, 내 취향에 맞는 음악을 만나보세요. 가입 없이 시작할 수 있어요.':'Choose ten sounds and scenes, then meet music that fits your taste. No sign-up needed.'}</p></div><a class="guide-button guide-button--ink" data-guide-personalize href="/?lang=${language}#/discover">${kr?'내 취향 찾기':'Find my taste'} ↗</a></section>
    <section class="guide-related"><h2>${kr?'다른 장면도 둘러보세요':'Try another moment'}</h2><div>${LISTENING_GUIDES.filter(g=>g.id!==guide.id).map((g)=>`<a href="${guidePath(g.id,language)}"><span>${g.number}</span>${escape(loc(g.label,language))} ↗</a>`).join('')}</div></section>`;
    outputs.set(`${pathname.slice(1)}index.html`,frame({language,title,description:loc(guide.description,language),pathname,alternate,body,guide}));
  }
  const title = kr?'상황별 음악 선곡과 듣기 노트':'Music for the moment: listening notes';
  const description = kr?'밤 산책, 집중하는 오후, 기분 전환, 함께 듣기. 세 곡의 선정 이유와 듣기 포인트를 담은 My Music Vibe 편집 선곡.':'Night walks, focused afternoons, a little lift, and time together. Three songs, an editorial reason, and something to listen for.';
  const body = `<section class="guide-index-hero"><span class="guide-kicker">MUSIC FOR THE MOMENT</span><h1>${title}</h1><p>${description}</p><p>${kr?'오늘의 장면을 고르고, 한 곡의 이야기에 잠시 머물러보세요.':'Choose a scene from your day and stay with the story of a song.'}</p></section><section class="guide-index-grid" aria-label="${kr?'네 가지 선곡':'Four listening notes'}">${LISTENING_GUIDES.map((g)=>`<a class="guide-index-card" href="${guidePath(g.id,language)}"><div aria-hidden="true">${renderRecordArt(g.art)}</div><span class="guide-kicker">${g.number} / 3 TRACKS</span><h2>${escape(loc(g.title,language))}</h2><p>${escape(loc(g.description,language))}</p><span class="guide-read">${kr?'선곡 이야기 읽기':'Read the listening note'} ↗</span></a>`).join('')}</section>`;
  outputs.set(`${idx.slice(1)}index.html`,frame({language,title,description,pathname:idx,alternate:indexPath(kr?'en':'kr'),body}));
}

const sitemapFile = path.join(root,'sitemap.xml');
let sitemap = fs.readFileSync(sitemapFile,'utf8').replace(/\s*<url><loc>https:\/\/my-music-vibe\.com\/(?:en\/)?listening\/[^<]*<\/loc>.*?<\/url>/g,'');
sitemap = sitemap.replace('</urlset>', `${[...outputs.keys()].map((key)=>`  <url><loc>${origin}/${key.replace(/index\.html$/,'')}</loc><lastmod>2026-10-30</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join('\n')}\n</urlset>`);
outputs.set('sitemap.xml',sitemap);
for (const [file,rawContent] of outputs) {
  const content = rawContent.replace(/^[ \t]+$/gm,'');
  const target = path.join(root,file);
  if (checking) {
    if (!fs.existsSync(target) || fs.readFileSync(target,'utf8') !== content) throw Error(`Regenerate listening pages: ${file}`);
  } else { fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,content); }
}
console.log(`Listening guides: ${outputs.size-1} static pages + sitemap ${checking?'verified':'generated'}.`);
