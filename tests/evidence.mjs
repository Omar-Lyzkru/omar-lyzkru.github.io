// Dev tool (not a test): captures visual evidence and rough performance numbers into tests/.artifacts/evidence/.
//   node evidence.mjs            (uses Chromium; real Web Audio, no stubs)
import fs from 'node:fs';
import { chromium } from 'playwright';
import { startServer } from './helpers.mjs';

const out = new URL('./.artifacts/evidence/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
fs.mkdirSync(out, { recursive: true });
const server = await startServer();
let browser;
try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ channel: 'chrome' }); }
const fontStub = ctx => ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
const FRAME_PROBE = `(() => { window.__frames = []; let last = 0; const tick = t => { if (last) window.__frames.push(t - last); last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick); })();`;
const stats = list => { const a = [...list].sort((x, y) => x - y); const q = p => a[Math.min(a.length - 1, Math.floor(a.length * p))]; return { frames: a.length, avgMs: +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(1), p95Ms: +q(0.95).toFixed(1), maxMs: +a[a.length - 1].toFixed(1) }; };
const report = {};

// 1. Journey frame strips and a recording, desktop + mobile.
for (const [tag, viewport] of [['desktop', { width: 1440, height: 810 }], ['mobile', { width: 390, height: 844 }]]) {
  const context = await browser.newContext({ viewport, recordVideo: { dir: out + `video-${tag}`, size: viewport } });
  await fontStub(context);
  const page = await context.newPage();
  await page.goto(server.origin + '/');
  await page.waitForSelector('#gateway-dialog[open]');
  await page.waitForFunction(() => document.querySelector('#gateway-dialog').dataset.scene === 'ready');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: out + `${tag}-1-idle.png` });
  await page.click('[data-gateway-enter]');
  let t = 0;
  for (const [i, at] of [[2, 1000], [3, 2000], [4, 2800], [5, 3400], [6, 3900]]) { await page.waitForTimeout(at - t); t = at; await page.screenshot({ path: out + `${tag}-${i}-journey-${at}ms.png` }); }
  await page.waitForFunction(() => !document.querySelector('#gateway-dialog').open, null, { timeout: 5000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: out + `${tag}-7-resolved-portfolio.png` });
  await context.close();
}

// 2. Portfolio sections and case studies, desktop + mobile, plus reduced-motion entrance.
for (const [tag, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const context = await browser.newContext({ viewport });
  await fontStub(context);
  const page = await context.newPage();
  await page.goto(server.origin + '/?project=none');
  await page.waitForSelector('.projects-grid');
  for (const img of await page.$$('img[loading="lazy"]')) await img.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({ path: out + `${tag}-home-top.png` });
  await page.locator('#work').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: out + `${tag}-projects.png` });
  await page.locator('#toolkit').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: out + `${tag}-toolkit.png` });
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: out + `${tag}-contact.png` });
  for (const slug of ['permitwatch', 'job-automation', 'raycaster']) {
    await page.goto(`${server.origin}/?project=${slug}`);
    await page.waitForSelector('#project-dialog[open]');
    await page.waitForTimeout(900);
    await page.screenshot({ path: out + `${tag}-case-${slug}.png` });
  }
  await context.close();
}
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 810 }, reducedMotion: 'reduce' });
  await fontStub(context);
  const page = await context.newPage();
  await page.goto(server.origin + '/');
  await page.waitForSelector('#gateway-dialog[open]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: out + 'desktop-reduced-motion-entrance.png' });
  await context.close();
}

// 3. Rough performance: frame intervals during idle and during the journey, desktop and 4x-throttled mobile; heap over replays.
for (const [tag, viewport, throttle] of [['desktop', { width: 1440, height: 810 }, 1], ['mobile-4x-cpu', { width: 390, height: 844 }, 4], ['desktop-6x-cpu', { width: 1440, height: 810 }, 6]]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: tag.startsWith('mobile') ? 2 : 1 });
  await fontStub(context);
  await context.addInitScript(FRAME_PROBE);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await page.goto(server.origin + '/');
  await page.waitForSelector('#gateway-dialog[open]');
  await page.waitForFunction(() => document.querySelector('#gateway-dialog').dataset.scene === 'ready');
  await page.evaluate(() => { window.__frames.length = 0; });
  await page.waitForTimeout(2000);
  const idle = stats(await page.evaluate(() => window.__frames));
  await page.evaluate(() => { window.__frames.length = 0; });
  await page.click('[data-gateway-enter]');
  await page.waitForFunction(() => !document.querySelector('#gateway-dialog').open, null, { timeout: 8000 });
  const journey = stats(await page.evaluate(() => window.__frames));
  const cell = await page.evaluate(() => document.querySelector('[data-gateway-canvas]')?.getContext('2d').font);
  report[tag] = { idle, journey, throttle };
  await context.close();
}
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 810 } });
  await fontStub(context);
  const page = await context.newPage();
  await page.goto(server.origin + '/');
  await page.waitForSelector('#gateway-dialog[open]');
  await page.click('[data-gateway-skip]');
  const cdp = await context.newCDPSession(page);
  const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); const { usedSize } = await cdp.send('Runtime.getHeapUsage'); return +(usedSize / 1048576).toFixed(2); };
  const samples = [await heap()];
  for (let i = 0; i < 8; i += 1) {
    await page.locator('#replay-intro').scrollIntoViewIfNeeded();
    await page.click('#replay-intro');
    await page.waitForSelector('#gateway-dialog[open]');
    await page.waitForTimeout(500);
    await page.click('[data-gateway-enter]');
    await page.waitForFunction(() => !document.querySelector('#gateway-dialog').open, null, { timeout: 6000 });
    await page.waitForTimeout(200);
    if (i % 2 === 1) samples.push(await heap());
  }
  report.heapMBAfterReplays = samples;
  // Real (unstubbed) Web Audio in Chromium: after a click the context is created and running, no errors.
  await page.locator('#replay-intro').scrollIntoViewIfNeeded();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.click('#replay-intro');
  await page.waitForSelector('#gateway-dialog[open]');
  await page.click('[data-gateway-enter]');
  await page.waitForTimeout(600);
  report.realAudioErrors = errors;
  await context.close();
}
fs.writeFileSync(out + 'performance.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
await server.close();
