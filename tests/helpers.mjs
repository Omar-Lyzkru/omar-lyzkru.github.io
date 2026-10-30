// Shared test helpers: a dependency-free static server for the repository root, and browser launching.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.png': 'image/png',
  '.pdf': 'application/pdf', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

// Serves the repository root. Fonts come from Google Fonts in production; tests stub those requests (see openPage).
export function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    resolve({ origin: `http://127.0.0.1:${port}`, close: () => new Promise(done => { server.close(done); server.closeAllConnections?.(); }) });
  }));
}

// Engines to test. TEST_BROWSERS=chromium,firefox,webkit narrows the run; unavailable engines are reported and skipped.
export async function launchBrowsers() {
  const wanted = (process.env.TEST_BROWSERS || 'chromium,firefox,webkit').split(',');
  const launched = [];
  for (const name of wanted) {
    const type = { chromium, firefox, webkit }[name];
    if (!type) continue;
    try {
      let browser;
      try { browser = await type.launch(); } catch (error) {
        if (name !== 'chromium') throw error;
        browser = await type.launch({ channel: 'chrome' }); // the bundled build may not match this Playwright version
      }
      launched.push({ name, browser });
    } catch (error) {
      console.warn(`[tests] ${name} unavailable: ${String(error.message).split('\n')[0]}`);
    }
  }
  return launched;
}

// A fresh isolated context + page with network fonts stubbed (the site falls back to system fonts) and console errors collected.
export async function openPage(browser, { reducedMotion = 'no-preference', viewport = { width: 1280, height: 800 }, initScript, deviceScaleFactor = 1 } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion, deviceScaleFactor });
  await context.route(/fonts\.(googleapis|gstatic)\.com/, route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  if (initScript) await context.addInitScript(initScript);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('requestfailed', request => { if (!/fonts\./.test(request.url())) errors.push(`requestfailed: ${request.url()}`); });
  return { page, context, errors };
}

// Test instrumentation, injected before any site script. Counts outstanding animation-frame loops, observers and listeners
// on the document, AudioContext construction, and AudioNode starts, without touching production code.
export const INSTRUMENT = `(() => {
  const w = window;
  w.__probe = { rafOutstanding: 0, rafTotal: 0, observers: 0, audioContexts: 0, oscillators: 0, bufferSources: 0, audioConstructed: false, effects: [] };
  const raf = w.requestAnimationFrame.bind(w), caf = w.cancelAnimationFrame.bind(w);
  const live = new Map();
  w.requestAnimationFrame = cb => { w.__probe.rafTotal++; w.__probe.rafOutstanding++; const id = raf(t => { if (live.delete(id)) w.__probe.rafOutstanding--; cb(t); }); live.set(id, true); return id; };
  w.cancelAnimationFrame = id => { if (live.delete(id)) w.__probe.rafOutstanding--; caf(id); };
  for (const name of ['ResizeObserver', 'IntersectionObserver']) {
    const Native = w[name]; if (!Native) continue;
    w[name] = class extends Native {
      constructor(cb) { super(cb); this.__n = 0; }
      observe(...a) { w.__probe.observers++; return super.observe(...a); }
      disconnect() { w.__probe.observers--; return super.disconnect(); }
    };
  }
  if (!w.__noAudioStub) {
    class FakeParam { setValueAtTime() {} exponentialRampToValueAtTime() {} cancelScheduledValues() {} setTargetAtTime() {} set value(v) {} }
    class FakeNode { constructor() { this.gain = new FakeParam(); this.frequency = new FakeParam(); this.Q = new FakeParam(); }
      connect(n) { return n; } disconnect() {} start() { w.__probe.effects.push(this.constructor.name); setTimeout(() => this.onended && this.onended(), 20); } stop() {} }
    class FakeContext {
      constructor() { w.__probe.audioContexts++; w.__probe.audioConstructed = true; this.currentTime = 0; this.sampleRate = 8000; this.state = 'running'; this.destination = new FakeNode(); }
      createGain() { return new (class GainNode extends FakeNode {})(); }
      createOscillator() { w.__probe.oscillators++; return new (class OscillatorNode extends FakeNode {})(); }
      createBufferSource() { w.__probe.bufferSources++; return new (class BufferSourceNode extends FakeNode {})(); }
      createBiquadFilter() { return new (class BiquadFilterNode extends FakeNode {})(); }
      createBuffer(c, n) { return { length: n, getChannelData: () => new Float32Array(n) }; }
      resume() { return Promise.resolve(); }
    }
    w.AudioContext = FakeContext; w.webkitAudioContext = FakeContext;
  }
})();`;
