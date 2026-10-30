// Real-browser regression tests, run against every available engine (Chromium, Firefox, WebKit).
// They drive the static site through a local server with Playwright; audio is replaced by a recording fake.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launchBrowsers, openPage, INSTRUMENT } from './helpers.mjs';

const server = await startServer();
const engines = await launchBrowsers(); // top-level: the per-engine tests below are generated from what actually launched
after(async () => { for (const { browser } of engines) await browser.close(); await server.close(); });

const SLUGS = { permitwatch: 'PermitWatch', durablekv: 'DurableKV', 'calendar-intelligence-hub': 'Calendar Intelligence Hub',
  'job-automation': 'Job Applier', raycaster: 'C++ Console Raycaster', 'task-tracker': 'Persistent Task Tracker' };
const GW = '#gateway-dialog';
const gatewayState = page => page.getAttribute(GW, 'data-state');
const probe = page => page.evaluate(() => ({ ...window.__probe }));
const canvasHash = page => page.evaluate(() => {
  const data = document.querySelector('[data-gateway-canvas]').toDataURL();
  let h = 0; for (let i = 0; i < data.length; i += 7) h = (h * 31 + data.charCodeAt(i)) | 0; return h;
});

async function freshGateway(browser, options = {}) {
  const session = await openPage(browser, { initScript: INSTRUMENT, ...options });
  await session.page.goto(server.origin + '/');
  await session.page.waitForSelector(`${GW}[open]`);
  if (!options.expectNoScene) await session.page.waitForFunction(sel => document.querySelector(sel).dataset.scene === 'ready', GW);
  return session;
}
const waitClosed = (page, timeout = 5200) => page.waitForFunction(sel => !document.querySelector(sel).open, GW, { timeout });
const quiet = errors => errors.filter(e => !/blackhole\.js/.test(e));

for (const { name, browser } of engines) {
  test.describe(`[${name}]`, () => {
    test('startup: no console or page errors, hero and the four lead cards render', async () => {
      const { page, errors, context } = await openPage(browser);
      await page.goto(server.origin + '/?project=none-such');
      await page.waitForSelector('.projects-grid');
      assert.equal(await page.evaluate(() => document.querySelector(`#gateway-dialog`).open), false);
      const titles = await page.$$eval('.projects-grid .project-card h3', nodes => nodes.map(n => n.textContent));
      assert.deepEqual(titles, ['PermitWatch', 'DurableKV', 'Calendar Intelligence Hub', 'Job Applier']);
      assert.equal(await page.locator('.projects-grid .project-card').count(), 4);
      assert.equal(await page.locator('.support-open').count(), 2, 'supporting projects are a separate compact list');
      await page.waitForTimeout(400);
      assert.deepEqual(errors, []);
      await context.close();
    });

    test('deep links: all six slugs open their case study without the gateway; invalid values change nothing', async () => {
      for (const [slug, title] of Object.entries(SLUGS)) {
        const { page, errors, context } = await openPage(browser);
        await page.goto(`${server.origin}/?project=${slug}`);
        await page.waitForSelector('#project-dialog[open]');
        assert.equal(await page.textContent('#showcase-title'), title, slug);
        assert.equal(await page.evaluate(() => document.querySelector('#gateway-dialog').open), false, `${slug}: gateway bypassed`);
        assert.deepEqual(errors, [], slug);
        await context.close();
      }
      for (const bad of ['?project=bogus', '?project=']) {
        const { page, context } = await openPage(browser);
        await page.goto(server.origin + '/' + bad);
        await page.waitForTimeout(500);
        assert.equal(await page.evaluate(() => document.querySelector('#project-dialog').open || document.querySelector('#gateway-dialog').open), false);
        assert.equal(new URL(page.url()).search, bad === '?project=' ? '?project=' : bad, 'URL left unchanged');
        await context.close();
      }
    });

    test('card open/close: Escape closes, URL and focus restore; Back/Forward reconcile without new entries', async () => {
      const { page, errors, context } = await openPage(browser);
      await page.goto(server.origin + '/?project=zz');
      await page.waitForSelector('.projects-grid');
      const card = page.locator('.project-open[data-project="durablekv"]');
      await card.scrollIntoViewIfNeeded();
      await card.click();
      await page.waitForSelector('#project-dialog[open]');
      assert.match(page.url(), /project=durablekv/);
      await page.waitForTimeout(700);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('#project-dialog').open);
      await page.waitForTimeout(800);
      assert.equal(new URL(page.url()).searchParams.get('project'), 'zz', 'back to the prior URL');
      assert.equal(await page.evaluate(() => document.activeElement?.dataset?.project), 'durablekv', 'focus returns to the card');
      // Back/Forward
      await card.click();
      await page.waitForSelector('#project-dialog[open]');
      await page.waitForTimeout(700);
      await page.goBack();
      await page.waitForFunction(() => !document.querySelector('#project-dialog').open);
      await page.goForward();
      await page.waitForSelector('#project-dialog[open]');
      assert.equal(await page.textContent('#showcase-title'), 'DurableKV');
      await page.click('#dialog-close');
      await page.waitForFunction(() => !document.querySelector('#project-dialog').open);
      assert.deepEqual(errors, []);
      await context.close();
    });

    test('supporting case studies open from their list and from the Toolkit, returning focus', async () => {
      const { page, context } = await openPage(browser);
      await page.goto(server.origin + '/?project=zz');
      const row = page.locator('.support-open[data-project="raycaster"]');
      await row.scrollIntoViewIfNeeded();
      await row.click();
      await page.waitForSelector('#project-dialog[open]');
      assert.equal(await page.textContent('#showcase-title'), 'C++ Console Raycaster');
      assert.match(await page.textContent('#dialog-number'), /SUPPORTING PROJECT/);
      await page.waitForTimeout(700);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('#project-dialog').open);
      await page.waitForTimeout(800);
      assert.equal(await page.evaluate(() => document.activeElement?.dataset?.project), 'raycaster');
      await page.click('[data-tech="cmake"]');
      assert.match(await page.textContent('.toolkit-use .toolkit-tier'), /Supporting/);
      await page.click('.toolkit-view');
      await page.waitForSelector('#project-dialog[open]');
      await context.close();
    });

    test('gateway journey: scene is character-rendered, geometry changes over time, ends in the portfolio, resources released', async () => {
      const { page, errors, context } = await freshGateway(browser);
      const idleProbe = await probe(page);
      assert.ok(idleProbe.rafOutstanding >= 1, 'the idle scene animates');
      const transform = await page.evaluate(() => getComputedStyle(document.querySelector('[data-gateway-canvas]')).transform);
      assert.equal(transform, 'none', 'no CSS transform on the scene');
      assert.equal(await page.locator(`${GW} img`).count(), 0, 'no still image in the gateway');
      const hashes = [await canvasHash(page)];
      await page.click('[data-gateway-enter]');
      assert.equal(await gatewayState(page), 'entering');
      assert.equal(await page.isHidden('[data-gateway-enter]'), true, 'Enter is spent');
      await page.evaluate(() => document.querySelector('[data-gateway-enter]').click()); // repeated input must not stack journeys
      for (const wait of [350, 900, 900]) { await page.waitForTimeout(wait); hashes.push(await canvasHash(page)); }
      assert.equal(new Set(hashes).size, hashes.length, 'initial, early, middle and late frames all differ');
      // Late in the journey a ring opens in the hole onto the portfolio, which rushes toward the visitor and settles.
      await page.waitForFunction(sel => parseFloat(document.querySelector(sel).style.getPropertyValue('--iris')) > 8, GW, { timeout: 3000 });
      const arriving = await page.evaluate(() => ({ arrive: document.documentElement.dataset.arrive, transform: getComputedStyle(document.querySelector('.site')).transform, iris: parseFloat(document.querySelector('#gateway-dialog').style.getPropertyValue('--iris')) }));
      assert.equal(arriving.arrive, 'on');
      assert.notEqual(arriving.transform, 'none', 'the portfolio is scaled while arriving');
      assert.ok(arriving.iris > 0, 'the ring has opened');
      await waitClosed(page);
      assert.deepEqual(await page.evaluate(() => ({ arrive: document.documentElement.dataset.arrive, style: document.documentElement.getAttribute('style') || '', transform: getComputedStyle(document.querySelector('.site')).transform })), { arrive: undefined, style: '', transform: 'none' }, 'arrival effects are fully cleaned up');
      assert.equal(await page.evaluate(() => document.documentElement.dataset.gateway), undefined);
      assert.match(await page.evaluate(() => document.cookie), /portfolio_entered=1/);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'main');
      await page.waitForTimeout(300);
      const done = await probe(page);
      assert.equal(done.rafOutstanding, 0, 'no render loop remains after the gateway closes');
      assert.ok(done.observers <= idleProbe.observers - 1, 'the scene released its observers');
      assert.deepEqual(errors, []);
      await context.close();
    });

    test('Skip Intro: portfolio is entered, cookie set, reload bypasses the gateway', async () => {
      const { page, context } = await freshGateway(browser);
      await page.click('[data-gateway-skip]');
      await waitClosed(page, 1500);
      await page.reload();
      await page.waitForSelector('.projects-grid');
      assert.equal(await page.evaluate(() => document.querySelector('#gateway-dialog').open), false);
      await context.close();
    });

    test('Replay x4: honors Enter, Escape, Return; loops, observers and canvases do not accumulate', async () => {
      const { page, errors, context } = await freshGateway(browser);
      await page.click('[data-gateway-skip]');
      await waitClosed(page, 1500);
      const baseline = await probe(page);
      const modes = ['enter', 'escape', 'return', 'enter'];
      for (const mode of modes) {
        await page.locator('#replay-intro').scrollIntoViewIfNeeded();
        await page.click('#replay-intro');
        await page.waitForSelector(`${GW}[open]`);
        await page.waitForFunction(sel => document.querySelector(sel).dataset.scene === 'ready', GW);
        assert.equal(await page.isVisible('[data-gateway-return]'), true);
        if (mode === 'enter') { await page.click('[data-gateway-enter]'); await page.waitForTimeout(500); assert.equal(await gatewayState(page), 'entering'); await waitClosed(page); }
        else if (mode === 'escape') { await page.keyboard.press('Escape'); await waitClosed(page, 1000); }
        else { await page.click('[data-gateway-return]'); await waitClosed(page, 1000); }
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'replay-intro', `${mode}: focus returns to Replay`);
        await page.waitForTimeout(250);
        const now = await probe(page);
        assert.equal(now.rafOutstanding, 0, `${mode}: no loop`);
        assert.equal(now.observers, baseline.observers, `${mode}: observers back to baseline`);
      }
      assert.deepEqual(errors, []);
      await context.close();
    });

    test('header Replay button reopens the entrance anytime and returns focus to itself', async () => {
      const { page, context } = await freshGateway(browser);
      await page.click('[data-gateway-skip]');
      await waitClosed(page, 1500);
      const button = page.locator('.site-header [data-replay-intro]');
      assert.equal(await button.isVisible(), true);
      assert.equal(await button.getAttribute('aria-label'), 'Replay intro animation');
      const box = await button.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
      for (let i = 0; i < 2; i += 1) {
        await button.click();
        await page.waitForSelector(`${GW}[open]`);
        await page.waitForFunction(sel => document.querySelector(sel).dataset.scene === 'ready', GW);
        await page.click('[data-gateway-return]');
        await waitClosed(page, 1000);
        assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-replay-intro') && !!document.activeElement.closest('.site-header')), true);
      }
      await context.close();
    });

    test('Escape during a journey cancels it into the portfolio at once', async () => {
      const { page, context } = await freshGateway(browser);
      await page.click('[data-gateway-enter]');
      await page.waitForTimeout(600);
      await page.keyboard.press('Escape');
      await waitClosed(page, 800);
      await page.waitForTimeout(250);
      assert.equal((await probe(page)).rafOutstanding, 0);
      await context.close();
    });

    test('system reduced motion before load: static character scene, Enter goes straight in', async () => {
      const { page, errors, context } = await freshGateway(browser, { reducedMotion: 'reduce' });
      await page.waitForTimeout(500);
      assert.equal((await probe(page)).rafOutstanding, 0, 'no animation loop for a static scene');
      assert.ok(await canvasHash(page) !== 0);
      assert.equal(await page.isDisabled('[data-gateway-motion]'), true);
      const lit = await page.evaluate(() => { const c = document.querySelector('[data-gateway-canvas]'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
      assert.ok(lit > 2000, 'a character scene is still drawn');
      await page.click('[data-gateway-enter]');
      await waitClosed(page, 800);
      assert.deepEqual(errors, []);
      await context.close();
    });

    test('Pause during a journey settles into the portfolio; replay then honors Pause', async () => {
      const { page, context } = await freshGateway(browser);
      await page.click('[data-gateway-enter]');
      await page.waitForTimeout(700);
      await page.click('[data-gateway-motion]');
      await waitClosed(page, 800);
      assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), 'reduced');
      await page.locator('#replay-intro').scrollIntoViewIfNeeded();
      await page.click('#replay-intro');
      await page.waitForSelector(`${GW}[open]`);
      await page.waitForTimeout(400);
      assert.equal((await probe(page)).rafOutstanding, 0, 'paused scene does not animate');
      await page.click('[data-gateway-enter]');
      await waitClosed(page, 800);
      await context.close();
    });

    test('canvas unavailable: static fallback shows and Enter still reaches the portfolio', async () => {
      const { page, errors, context } = await openPage(browser, { initScript: INSTRUMENT + `;HTMLCanvasElement.prototype.getContext = function () { return null; };` });
      await page.goto(server.origin + '/');
      await page.waitForSelector(`${GW}[open]`);
      await page.waitForFunction(sel => document.querySelector(sel).dataset.scene === 'fallback', GW);
      assert.equal(await page.isVisible('.gw-fallback'), true);
      await page.click('[data-gateway-enter]');
      await waitClosed(page, 2000);
      assert.deepEqual(quiet(errors), []);
      await context.close();
    });

    test('renderer module fails to load: gateway still works and the rest of the page is intact', async () => {
      const session = await openPage(browser, { initScript: INSTRUMENT });
      await session.context.route(/blackhole\.js/, route => route.abort());
      await session.page.goto(server.origin + '/');
      await session.page.waitForSelector(`${GW}[open]`);
      await session.page.waitForFunction(sel => document.querySelector(sel).dataset.scene === 'fallback', GW);
      await session.page.click('[data-gateway-enter]');
      await waitClosed(session.page, 2000);
      await session.page.click('.project-open[data-project="permit"]');
      await session.page.waitForSelector('#project-dialog[open]');
      await session.context.close();
    });

    test('Web Animations unavailable: gateway, case studies, and the Toolkit still work', async () => {
      const { page, errors, context } = await openPage(browser, { initScript: INSTRUMENT + `;delete Element.prototype.animate;` });
      await page.goto(server.origin + '/');
      await page.waitForSelector(`${GW}[open]`);
      await page.click('[data-gateway-enter]');
      await waitClosed(page, 5200);
      await page.click('.project-open[data-project="durablekv"]');
      await page.waitForSelector('#project-dialog[open]');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('#project-dialog').open);
      await page.click('[data-tech="typescript"]');
      assert.match(await page.textContent('.toolkit-panel-title'), /TypeScript/);
      assert.deepEqual(quiet(errors), []);
      await context.close();
    });

    test('sound: silent until a gesture; Enter produces cues; gateway and header mute controls share one state', async () => {
      const { page, errors, context } = await freshGateway(browser);
      await page.waitForTimeout(500);
      let p = await probe(page);
      assert.equal(p.audioContexts, 0, 'no AudioContext on load');
      assert.equal(p.oscillators + p.bufferSources, 0, 'no sound on load');
      // Mute inside the gateway; the header control (hidden behind the modal) reflects it.
      assert.equal(await page.getAttribute(`${GW} [data-sound-toggle]`, 'aria-pressed'), 'false');
      await page.click(`${GW} [data-sound-toggle]`);
      p = await probe(page);
      assert.equal(await page.getAttribute(`${GW} [data-sound-toggle]`, 'aria-pressed'), 'true');
      assert.equal(await page.getAttribute('#sound-toggle', 'aria-pressed'), 'true');
      assert.equal(p.oscillators + p.bufferSources, 0, 'muting makes no sound');
      await page.click('[data-gateway-skip]'); // a muted action: no cue
      await waitClosed(page, 1500);
      p = await probe(page);
      assert.equal(p.oscillators + p.bufferSources, 0, 'muted: Skip is silent');
      // Unmute from the header: a cue plays, and later actions sound.
      await page.click('#sound-toggle');
      assert.equal(await page.getAttribute('#sound-toggle', 'aria-pressed'), 'false');
      await page.waitForTimeout(100);
      p = await probe(page);
      assert.ok(p.oscillators >= 1, 'unmuting plays a confirmation cue');
      const before = p.oscillators;
      await page.waitForTimeout(150);
      await page.click('[data-tech="react"]');
      await page.waitForTimeout(100);
      assert.ok((await probe(page)).oscillators > before, 'Toolkit selection sounds');
      // Mute again: no further cues from case-study open/close.
      await page.click('#sound-toggle');
      const muted = await probe(page);
      await page.click('.project-open[data-project="permit"]');
      await page.waitForSelector('#project-dialog[open]');
      await page.waitForTimeout(700);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('#project-dialog').open);
      const after = await probe(page);
      assert.equal(after.oscillators, muted.oscillators);
      assert.deepEqual(errors, []);
      await context.close();
    });

    test('sound: the entrance journey cue plays only after the Enter gesture, and Back/Forward restoration is silent', async () => {
      const { page, context } = await freshGateway(browser);
      await page.click('[data-gateway-enter]');
      await page.waitForTimeout(200);
      const p = await probe(page);
      assert.equal(p.audioContexts, 1);
      assert.ok(p.bufferSources >= 1 && p.oscillators >= 1, 'journey cue');
      await waitClosed(page);
      await page.waitForTimeout(300);
      await page.click('.project-open[data-project="durablekv"]');
      await page.waitForSelector('#project-dialog[open]');
      await page.waitForTimeout(700);
      await page.goBack();
      await page.waitForFunction(() => !document.querySelector('#project-dialog').open);
      await page.waitForTimeout(150);
      const settled = await probe(page);
      await page.goForward();
      await page.waitForSelector('#project-dialog[open]');
      await page.waitForTimeout(300);
      const restored = await probe(page);
      assert.equal(restored.oscillators, settled.oscillators, 'history restoration makes no sound');
      await context.close();
    });

    test('sound: audio construction failure never affects the site', async () => {
      const { page, errors, context } = await openPage(browser, { initScript: `window.AudioContext = window.webkitAudioContext = function () { throw new Error('no audio'); };` });
      await page.goto(server.origin + '/');
      await page.waitForSelector(`${GW}[open]`);
      await page.click('[data-gateway-enter]');
      await waitClosed(page, 5200);
      await page.click('.project-open[data-project="job"]');
      await page.waitForSelector('#project-dialog[open]');
      assert.equal(await page.textContent('#showcase-title'), 'Job Applier');
      assert.deepEqual(errors, []);
      await context.close();
    });

    test('no AudioContext at all: the mute controls stay hidden and the gateway works', async () => {
      const { page, context } = await openPage(browser, { initScript: `delete window.AudioContext; delete window.webkitAudioContext;` });
      await page.goto(server.origin + '/');
      await page.waitForSelector(`${GW}[open]`);
      assert.equal(await page.isVisible(`${GW} [data-sound-toggle]`), false);
      await page.click('[data-gateway-skip]');
      await waitClosed(page, 1500);
      await context.close();
    });

    test('keyboard: Enter Portfolio is focused first, mute is keyboard operable with a visible name and state', async () => {
      const { page, context } = await freshGateway(browser);
      assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-gateway-enter')), true);
      const toggle = page.locator(`${GW} [data-sound-toggle]`);
      assert.equal(await toggle.getAttribute('aria-label'), 'Mute sound effects');
      const box = await toggle.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44, `hit area ${box.width}x${box.height}`);
      for (let i = 0; i < 6 && !(await page.evaluate(() => document.activeElement?.hasAttribute('data-sound-toggle'))); i += 1) await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-sound-toggle')), true, 'reachable by Tab');
      await page.keyboard.press('Enter');
      assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
      await page.keyboard.press('Space');
      assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
      await context.close();
    });

    for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['tablet', { width: 820, height: 1100 }], ['mobile', { width: 375, height: 740 }]]) {
      test(`responsive (${label}): no horizontal overflow on the page, gateway, or a case study; controls sized for touch`, async () => {
        const { page, errors, context } = await freshGateway(browser, { viewport });
        const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(await overflow() <= 0, 'gateway');
        for (const sel of ['[data-gateway-enter]', '[data-gateway-skip]']) { const b = await page.locator(sel).boundingBox(); assert.ok(b.height >= 44 && b.x >= 0 && b.x + b.width <= viewport.width, sel); }
        await page.click('[data-gateway-skip]');
        await waitClosed(page, 1500);
        assert.ok(await overflow() <= 0, 'portfolio');
        for (const sel of ['#sound-toggle', '#motion-toggle']) { const b = await page.locator(sel).boundingBox(); assert.ok(b.width >= 44 && b.height >= 44 && b.x + b.width <= viewport.width, `${sel} ${JSON.stringify(b)}`); }
        await page.click('.project-open[data-project="calendar"]');
        await page.waitForSelector('#project-dialog[open]');
        await page.waitForTimeout(700);
        const dialogOverflow = await page.evaluate(() => { const d = document.querySelector('#project-dialog'); return d.scrollWidth - d.clientWidth; });
        assert.ok(dialogOverflow <= 0, 'case study');
        assert.deepEqual(errors, []);
        await context.close();
      });
    }

    test('authentic media: case-study images load with their provenance captions', async () => {
      for (const [slug, expect] of [['permitwatch', /Screenshot of the public demo/], ['durablekv', /Real terminal recording/], ['raycaster', /Real output/], ['task-tracker', /live GitHub Pages app/], ['calendar-intelligence-hub', /not a screenshot/], ['job-automation', /not a screenshot/]]) {
        const { page, context } = await openPage(browser);
        await page.goto(`${server.origin}/?project=${slug}`);
        await page.waitForSelector('#project-dialog[open]');
        assert.match(await page.textContent('.showcase-media figcaption'), expect, slug);
        const broken = await page.$$eval('#project-dialog img', imgs => imgs.filter(i => i.complete && i.naturalWidth === 0).length);
        assert.equal(broken, 0, `${slug}: images decode`);
        await context.close();
      }
    });
  });
}
