// Browser-free tests: route classification, motion policy, sound gating and mute, the ASCII field geometry,
// and static guards (grayscale-only site styling, exactly four lead cards).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

const load = file => import(new URL(`file:///${path.join(ROOT, file).replace(/\\/g, '/')}`));
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('route classification: supported, unsupported, and missing parameters', async () => {
  const { classifyProjectRoute } = await load('route.js');
  const routes = { permitwatch: 'permit', 'job-automation': 'job', raycaster: 'raycaster' };
  assert.deepEqual(classifyProjectRoute('https://x.test/?project=permitwatch', routes), { kind: 'supported', slug: 'permitwatch', id: 'permit' });
  assert.equal(classifyProjectRoute('https://x.test/?project=job-automation', routes).id, 'job');
  assert.equal(classifyProjectRoute('https://x.test/', routes).kind, 'none');
  assert.equal(classifyProjectRoute('https://x.test/?other=1', routes).kind, 'none');
  for (const bad of ['?project=', '?project=unknown', '?project=__proto__', '?project=constructor', '?project=PERMITWATCH']) {
    assert.equal(classifyProjectRoute(`https://x.test/${bad}`, routes).kind, 'invalid', bad);
  }
  assert.equal(classifyProjectRoute('not a url', routes).kind, 'none');
  assert.equal(classifyProjectRoute('https://x.test/?project=raycaster&project=permitwatch', routes).slug, 'raycaster', 'only the first value counts');
});

function fakeWindow({ reduced = false } = {}) {
  const listeners = {};
  const query = { matches: reduced, addEventListener: (_, fn) => { listeners.change = fn; }, set(value) { this.matches = value; listeners.change?.(); } };
  return { win: { matchMedia: () => query }, query };
}

test('motion policy: manual Pause OR system reduced motion, with notifications', async () => {
  const { createMotionPolicy } = await load('motion.js');
  const { win, query } = fakeWindow();
  const motion = createMotionPolicy(win);
  const seen = [];
  const off = motion.subscribe(reduced => seen.push(reduced));
  assert.equal(motion.reduced, false);
  motion.toggleManualPaused();
  assert.deepEqual([motion.reduced, motion.manualPaused, motion.systemReduced], [true, true, false]);
  motion.setManualPaused(false);
  query.set(true);
  assert.deepEqual([motion.reduced, motion.systemReduced], [true, true]);
  query.set(false);
  assert.equal(motion.reduced, false);
  assert.deepEqual(seen, [true, false, true, false]);
  off();
  motion.toggleManualPaused();
  assert.equal(seen.length, 4, 'unsubscribed listeners are not called');
});

// A recording AudioContext and a minimal event target for audio.js.
function audioHarness({ throwOnConstruct = false } = {}) {
  const handlers = {};
  const log = { contexts: 0, started: 0 };
  class Param { setValueAtTime() {} exponentialRampToValueAtTime() {} cancelScheduledValues() {} setTargetAtTime() {} }
  class Node { constructor() { this.gain = new Param(); this.frequency = new Param(); this.Q = new Param(); }
    connect(n) { return n; } disconnect() {} start() { log.started += 1; setTimeout(() => this.onended?.(), 5); } stop() {} }
  class Ctx {
    constructor() { if (throwOnConstruct) throw new Error('blocked'); log.contexts += 1; this.currentTime = 0; this.sampleRate = 8000; this.state = 'running'; this.destination = new Node(); }
    createGain() { return new Node(); } createOscillator() { return new Node(); } createBufferSource() { return new Node(); }
    createBiquadFilter() { return new Node(); } createBuffer(c, n) { return { length: n, getChannelData: () => new Float32Array(n) }; }
    resume() { return Promise.resolve(); }
  }
  const win = { addEventListener: (type, fn) => { handlers[type] = fn; }, performance: { now: () => Date.now() + Math.random() * 0 }, AudioContext: Ctx };
  let clock = 1000;
  win.performance.now = () => (clock += 100);
  return { win, log, gesture: (type = 'pointerdown', trusted = true) => handlers[type]?.({ isTrusted: trusted }) };
}

test('sound: nothing before a trusted gesture, no AudioContext until then, untrusted events do not unlock', async () => {
  const { createSoundEffects } = await load('audio.js');
  const h = audioHarness();
  const sounds = createSoundEffects({ win: h.win });
  assert.equal(sounds.play('click'), false);
  assert.equal(h.log.contexts, 0, 'no context is built before a gesture');
  h.gesture('click', false);
  assert.equal(sounds.play('click'), false, 'a scripted event is not a gesture');
  assert.equal(h.log.contexts, 0);
  h.gesture('pointerdown', true);
  assert.equal(sounds.play('click'), true);
  assert.equal(h.log.contexts, 1);
  assert.equal(sounds.play('does-not-exist'), false);
});

test('sound: muted state suppresses every cue, notifies subscribers, and persists nowhere', async () => {
  const { createSoundEffects } = await load('audio.js');
  const h = audioHarness();
  const sounds = createSoundEffects({ win: h.win });
  h.gesture();
  const states = [];
  sounds.subscribe(muted => states.push(muted));
  sounds.setMuted(true);
  for (const name of ['click', 'select', 'open', 'close', 'journey']) assert.equal(sounds.play(name), false, name);
  assert.equal(h.log.started, 0);
  sounds.toggleMuted();
  assert.equal(sounds.muted, false);
  assert.equal(sounds.play('select'), true);
  assert.deepEqual(states, [true, false]);
});

test('sound: construction failure or a missing AudioContext fails silently and stays off', async () => {
  const { createSoundEffects } = await load('audio.js');
  const bad = audioHarness({ throwOnConstruct: true });
  const a = createSoundEffects({ win: bad.win });
  bad.gesture();
  assert.equal(a.play('click'), false);
  assert.equal(a.play('click'), false);
  const none = audioHarness();
  delete none.win.AudioContext;
  const b = createSoundEffects({ win: none.win });
  none.gesture();
  assert.equal(b.supported, false);
  assert.equal(b.play('click'), false);
});

test('sound: concurrent voices are capped and voices release when they end', async () => {
  const { createSoundEffects } = await load('audio.js');
  const h = audioHarness();
  const sounds = createSoundEffects({ win: h.win });
  h.gesture();
  const names = ['click', 'select', 'open', 'close', 'journey'];
  let started = 0;
  for (let i = 0; i < 20; i += 1) if (sounds.play(names[i % names.length])) started += 1;
  assert.ok(started <= 6, `at most six simultaneous voices, got ${started}`);
  await new Promise(resolve => setTimeout(resolve, 60));
  assert.equal(sounds.play('click'), true, 'capacity returns once voices have ended');
});

test('ASCII field: dark horizon, populated disk, real geometry change during the journey', async () => {
  const { createBlackHoleField, journeyState, GLYPHS, SHADES } = await load('blackhole.js');
  const cols = 120, rows = 40, cw = 6, ch = 10;
  const W = cols * cw, H = rows * ch, R = Math.min(W * 0.22, H * 0.33);
  const field = createBlackHoleField({ width: W, height: H, cellWidth: cw, cellHeight: ch, centerX: W * 0.5, centerY: H * 0.5, radius: R });
  const snapshot = () => ({ shade: Array.from(field.shade), glyph: Array.from(field.glyph) });
  const lit = s => s.shade.filter(Boolean).length;
  const cellAt = (px, py) => Math.floor(py / ch) * field.columns + Math.floor(px / cw);

  field.frame(6, null);
  const idle = snapshot();
  assert.ok(lit(idle) > 400, 'a populated scene');
  for (const g of idle.glyph) assert.ok(g >= 0 && g < GLYPHS.length);
  for (const s of idle.shade) assert.ok(s >= 0 && s <= SHADES.length);
  // Inside the horizon (just above center, clear of the front disk) nothing is drawn.
  for (const dy of [-0.55, -0.35, -0.15]) assert.equal(idle.shade[cellAt(W * 0.5, H * 0.5 + dy * R)], 0, `dark horizon at dy=${dy}`);
  // The idle scene itself animates: a later clock changes the picture.
  field.frame(7.3, null);
  assert.notDeepEqual(snapshot(), idle, 'the idle disk rotates');
  // The journey changes geometry progressively: early, middle and late states are all distinct.
  const states = [0.05, 0.4, 0.8].map(p => { field.frame(6 + p * 3, journeyState(p)); return snapshot(); });
  assert.notDeepEqual(states[0], states[1]);
  assert.notDeepEqual(states[1], states[2]);
  // Late in the journey radial strokes (/ \ | -) dominate: the character field is stretched along the direction of travel.
  const strokeShare = s => s.glyph.filter((g, i) => s.shade[i] && g >= 9).length / lit(s);
  assert.ok(strokeShare(states[2]) > 0.5, `late streak share ${strokeShare(states[2]).toFixed(2)}`);
  assert.ok(strokeShare(states[2]) > strokeShare(idle) + 0.4);
  // Acceleration: magnification and stream grow faster than linearly in progress.
  const a = journeyState(0.25), b = journeyState(0.5), c = journeyState(0.75);
  assert.ok(c.stream - b.stream > b.stream - a.stream);
  assert.ok(journeyState(1).zoom > journeyState(0.5).zoom && journeyState(0.5).zoom > journeyState(0.1).zoom);
  assert.ok(journeyState(1).rate > journeyState(0.2).rate);
});

test('page characters converge on their exact on-screen positions as the journey arrives', async () => {
  const { layoutTarget, journeyState } = await load('blackhole.js');
  const hole = { x: 720, y: 405 };
  for (const t of [{ x: 700, y: 300, k: 2.1, delay: 0.2, twist: 1.2 }, { x: 1100, y: 600, k: 0.1, delay: 0.9, twist: -1.4 }, { x: 150, y: 80, k: 1.4, delay: 0, twist: 0.3 }]) {
    const start = layoutTarget(t, 0, hole);
    const end = layoutTarget(t, 1, hole);
    assert.ok(Math.hypot(start.x - t.x, start.y - t.y) > 60, 'starts well away from its place');
    assert.ok(Math.abs(end.x - t.x) < 1e-6 && Math.abs(end.y - t.y) < 1e-6 && end.local === 1, 'lands exactly');
    let last = Infinity;
    for (let a = 0; a <= 1.0001; a += 0.05) { const p = layoutTarget(t, Math.min(a, 1), hole); const d = Math.hypot(p.x - t.x, p.y - t.y); assert.ok(d <= last + 1e-6, 'never moves away'); last = d; }
  }
  // The journey's stages: stretch builds first, then bits, then the field settles for the arriving text.
  const at = p => journeyState(p);
  assert.equal(at(0).stretch, 0);
  assert.equal(at(0.6).stretch, 1);
  assert.ok(at(0.3).stretch > 0 && at(0.3).stretch < 1);
  assert.ok(at(0.2).digital < at(0.5).digital && at(1).digital === 1);
  assert.ok(at(0.5).calm < 0.05 && at(1).calm === 1);
});

test('site styling: grayscale only, with no violet, purple, or sepia accents left', () => {
  const files = ['styles.css', 'blackhole.js', 'fx.js', 'index.html'];
  const offenders = [];
  for (const file of files) {
    const text = read(file);
    for (const match of text.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
      let hex = match[1];
      if (hex.length === 3) hex = [...hex].map(c => c + c).join('');
      const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
      if (Math.max(r, g, b) - Math.min(r, g, b) > 6) offenders.push(`${file}: #${hex}`);
    }
    for (const match of text.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
      const [r, g, b] = match.slice(1).map(Number);
      if (Math.max(r, g, b) - Math.min(r, g, b) > 6) offenders.push(`${file}: ${match[0]}`);
    }
    assert.ok(!/hue-rotate|%2[Bb]79cff|violet|purple|sepia/i.test(text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), `${file} mentions a chromatic treatment`);
  }
  // The only permitted exception: the favicon data URI uses neutral %23 colors, which the hex scan skips.
  assert.deepEqual(offenders, []);
});

test('index.html: exactly four lead cards in the approved order; supporting projects are not cards', () => {
  const html = read('index.html');
  const grid = html.slice(html.indexOf('class="projects-grid"'), html.indexOf('class="support reveal"'));
  const ids = [...grid.matchAll(/<button class="project-open"[^>]*data-project="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids, ['permit', 'durablekv', 'calendar', 'job']);
  const titles = [...grid.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m => m[1]);
  assert.deepEqual(titles, ['PermitWatch', 'DurableKV', 'Calendar Intelligence Hub', 'Job Applier']);
  const repos = [...grid.matchAll(/class="text-link" href="(https:\/\/github\.com\/[^"]+)"/g)].map(m => m[1]);
  for (const repo of ['https://github.com/Abbas9x/permitwatch-houston', 'https://github.com/Omar-Lyzkru/DurableKV',
    'https://github.com/Omar-Lyzkru/calendar-intelligence-hub', 'https://github.com/Omar-Lyzkru/job-applier']) assert.ok(repos.includes(repo), repo);
  assert.ok(!grid.includes('raycaster') && !grid.includes('tracker'));
});
