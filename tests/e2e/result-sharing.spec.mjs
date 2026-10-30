import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ARCHETYPES } from '../../src/v2/data/archetypes.mjs';
import { profileFromArchetype } from '../../src/v2/domain/profile.mjs';
import { declineAnalytics } from './helpers.mjs';

const fixture = profileFromArchetype('midnight-dreamer','result_design_test');
async function openResult(page, language='kr') {
  await page.addInitScript((profile) => localStorage.setItem('music-vibe-v2-profile',JSON.stringify(profile)),fixture);
  await declineAnalytics(page);
  await page.goto(`/?lang=${language}#/profile`);
  await expect(page.locator('.result-hero')).toBeVisible();
}
async function openCard(page) {
  await page.locator('.result-hero [data-action="download-card"]').click();
  const dialog = page.locator('.profile-card-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-card-share]')).toBeEnabled();
  return dialog;
}
async function evidence(page, testInfo, name) {
  const screenshot = await page.screenshot({fullPage:true,animations:'disabled'});
  await testInfo.attach(name,{body:screenshot,contentType:'image/png'});
  if(process.env.MUSIC_VIBE_DESIGN_OUTPUT) {
    await fs.mkdir(process.env.MUSIC_VIBE_DESIGN_OUTPUT,{recursive:true});
    await fs.writeFile(path.join(process.env.MUSIC_VIBE_DESIGN_OUTPUT,`${testInfo.project.name}-${name}.png`),screenshot);
    if (name === 'result') await page.screenshot({path:path.join(process.env.MUSIC_VIBE_DESIGN_OUTPUT,`${testInfo.project.name}-result-first-screen.png`),animations:'disabled'});
  }
}
async function decodeCard(buffer, expectedHeight) {
  const metadata = await sharp(buffer).metadata();
  expect(metadata.width).toBe(1080);
  expect(metadata.height).toBe(expectedHeight);
  const {data,info} = await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const code = jsQR(new Uint8ClampedArray(data),info.width,info.height);
  expect(code, 'exported QR must be scannable').not.toBeNull();
  const url = new URL(code.data);
  expect(url.searchParams.has('compare')).toBe(false);
  expect(url.hash).toContain('/match?compare=');
  return url;
}

test('result puts songs and sharing before expandable details and keeps them keyboard accessible',async({page},testInfo)=>{
  await openResult(page);
  const layout = await page.evaluate(()=>({songs:document.querySelector('.result-signature').offsetTop, details:document.querySelector('.result-details').offsetTop,share:document.querySelector('.result-hero [data-action="download-card"]').getBoundingClientRect().y}));
  expect(layout.songs).toBeLessThan(layout.details);
  expect(layout.share).toBeLessThan(page.viewportSize().height);
  await expect(page.locator('.profile-signature .track-card')).toHaveCount(3);
  await expect(page.locator('[data-profile-disclosure="axes"]')).not.toHaveAttribute('open','');
  await expect(page.locator('[data-profile-disclosure="timeline"]')).not.toHaveAttribute('open','');
  await evidence(page,testInfo,'result');
  for(const section of ['axes','timeline']) {
    const summary = page.locator(`[data-profile-disclosure="${section}"] > summary`);
    await summary.focus(); await page.keyboard.press('Enter');
    await expect(page.locator(`[data-profile-disclosure="${section}"]`)).toHaveAttribute('open','');
  }
  await expect(page.locator('.bipolar-axis')).toHaveCount(6);
  await expect(page.locator('[data-timeline-entry]')).toHaveCount(1);
  const axe = await new AxeBuilder({page}).analyze();
  expect(axe.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
});

test('feed and story previews export offline PNGs with a working comparison QR and restore focus',async({page},testInfo)=>{
  const external = [];
  page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:4173') && /^https?:/.test(request.url())) external.push(request.url());});
  await openResult(page);
  const trigger=page.locator('.result-hero [data-action="download-card"]');
  const dialog=await openCard(page);
  for (const [format,height] of [['feed',1350],['story',1920]]) {
    await dialog.locator(`[value="${format}"]`).check();
    await expect(dialog.locator('[data-card-save]')).toBeEnabled();
    await expect(dialog.locator('[data-card-image]')).toBeVisible();
    const downloadPromise=page.waitForEvent('download');
    await dialog.locator('[data-card-save]').click();
    const download=await downloadPromise;
    expect(download.suggestedFilename()).toContain(`-${format}.png`);
    const buffer=await fs.readFile(await download.path());
    const url=await decodeCard(buffer,height);
    const decoded=await page.evaluate(async(url)=>{
      const {decodeProfile}=await import('/src/v2/domain/profile.mjs?v=qg1');
      return decodeProfile(new URLSearchParams(new URL(url).hash.split('?')[1]).get('compare'));
    },url.toString());
    expect(decoded.scores).toEqual(fixture.scores);
    if(process.env.MUSIC_VIBE_DESIGN_OUTPUT && testInfo.project.name==='chromium') await fs.writeFile(path.join(process.env.MUSIC_VIBE_DESIGN_OUTPUT,`taste-card-${format}.png`),buffer);
  }
  await evidence(page,testInfo,'card-composer');
  const axe=await new AxeBuilder({page}).analyze();
  expect(axe.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(external).toEqual([]);
});

test('prepared image sharing invokes the native API during the click and respects cancellation',async({page})=>{
  await page.addInitScript(()=>{
    window.__cardShareCalls=[];
    Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
    Object.defineProperty(navigator,'share',{configurable:true,value:async(payload)=>{
      window.__cardShareCalls.push({name:payload.files[0].name,type:payload.files[0].type,size:payload.files[0].size,active:navigator.userActivation.isActive,text:payload.text});
      if(window.__cancelCardShare) throw new DOMException('Cancelled','AbortError');
    }});
  });
  await openResult(page,'en');
  const dialog=await openCard(page);
  const downloads=[]; page.on('download',download=>downloads.push(download));
  await dialog.locator('[data-card-share]').click();
  await expect(dialog.locator('[data-card-status]')).toContainText('Image sent');
  const calls=await page.evaluate(()=>window.__cardShareCalls);
  expect(calls[0]).toMatchObject({type:'image/png',active:true});
  expect(calls[0].size).toBeGreaterThan(20000);
  expect(calls[0].text).toContain('#/match?compare=');
  await page.evaluate(()=>{window.__cancelCardShare=true;});
  await dialog.locator('[data-card-share]').click();
  await expect(dialog.locator('[data-card-status]')).toContainText('cancelled');
  expect(downloads).toHaveLength(0);
});

test('unsupported image sharing saves the selected format and link copying still uses the fragment',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.addInitScript(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:undefined}));
  await openResult(page,'en');
  const dialog=await openCard(page);
  await dialog.locator('[value="story"]').check();
  await expect(dialog.locator('[data-card-share]')).toBeEnabled();
  const downloadPromise=page.waitForEvent('download');
  await dialog.locator('[data-card-share]').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toContain('-story.png');
  await expect(dialog.locator('[data-card-status]')).toContainText('Image saved');
  await dialog.locator('[data-card-copy]').click();
  await expect(dialog.locator('[data-card-status]')).toContainText('link copied');
  const invite=await page.evaluate(()=>navigator.clipboard.readText());
  expect(new URL(invite).searchParams.has('compare')).toBe(false);
  expect(new URL(invite).hash).toContain('compare=');
});

test('all eight sleeves and both languages fit within exported cards',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='chromium','export matrix is viewport independent');
  test.setTimeout(90000);
  await openResult(page);
  const problems=await page.evaluate(async(ids)=>{
    const {profileFromArchetype}=await import('/src/v2/domain/profile.mjs?v=qg1');
    const {createProfileCardSvg}=await import('/src/v2/infrastructure/share.mjs?result=rs1');
    const failures=[];
    for(const id of ids) for(const language of ['kr','en']) for(const format of ['feed','story']) {
      const svg=await createProfileCardSvg(profileFromArchetype(id,'card_matrix'),language,format);
      const documentSvg=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement;
      documentSvg.style.cssText='position:absolute;left:-2000px;top:0;visibility:hidden;';
      document.body.appendChild(documentSvg);
      const texts=[...documentSvg.querySelectorAll('text')];
      for(const text of texts) {
        const box=text.getBBox();
        if(box.x<45 || box.x+box.width>1030 || box.y<30 || box.y+box.height>Number(documentSvg.getAttribute('height'))-10) failures.push({id,language,format,text:text.textContent,box:{x:box.x,y:box.y,w:box.width,h:box.height}});
      }
      const boxes=texts.map(el=>({text:el.textContent,box:el.getBoundingClientRect()}));
      const qr=documentSvg.querySelector('svg[shape-rendering="crispEdges"]').getBoundingClientRect();
      const intersects=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>3 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>3;
      for(let i=0;i<boxes.length;i++) {
        if(intersects(boxes[i].box,qr)) failures.push({id,language,format,qrOverlap:boxes[i].text});
        for(let j=i+1;j<boxes.length;j++) if(intersects(boxes[i].box,boxes[j].box)) failures.push({id,language,format,textOverlap:[boxes[i].text,boxes[j].text]});
      }
      documentSvg.remove();
    }
    return failures;
  },ARCHETYPES.map(a=>a.id));
  expect(problems).toEqual([]);
});
