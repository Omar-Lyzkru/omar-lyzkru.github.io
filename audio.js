// Interaction sound effects: tiny synthesized cues from the browser's own Web Audio API. No audio files, no services.
//
// Rules this module enforces on its own, whatever the callers do:
//  - Nothing sounds before a trusted user gesture, so loading, route restoration and history sync are always silent.
//    The AudioContext is not even constructed until the first cue that follows a gesture.
//  - Muted means silent: every cue is dropped and any running cue is stopped.
//  - Audio never gates behavior: every call is wrapped, failures are swallowed, and play() just returns false.
//  - Resources are bounded: one lazily created context, one master gain, a cap on simultaneous voices, and every voice
//    disconnects itself when it ends.
// The mute state lives for the page's lifetime only (nothing is stored).
//
// const sounds = createSoundEffects();
// sounds.play('click' | 'select' | 'open' | 'close' | 'journey')   // true if a cue started
// sounds.stop('journey')
// sounds.muted / sounds.setMuted(bool) / sounds.toggleMuted() / sounds.subscribe(fn) / sounds.supported
// bindSoundToggles(sounds, buttons)   // keeps any number of mute buttons in sync with the one state

const GESTURES = ['pointerdown', 'keydown', 'touchstart', 'click'];
const MAX_VOICES = 6;
const MIN_GAP_MS = 35;

export function createSoundEffects({ win = window, AudioContextCtor = win.AudioContext || win.webkitAudioContext, initiallyMuted = false } = {}) {
  const listeners = new Set();
  const voices = new Set();   // live cues: { name, stop }
  const lastPlayed = new Map();
  let muted = Boolean(initiallyMuted);
  let activated = false;
  let context = null;
  let master = null;
  let noise = null;
  let broken = !AudioContextCtor;

  // A gesture counts only when the browser itself produced it (isTrusted); scripts cannot unlock audio by dispatching events.
  const mark = event => { if (event.isTrusted) activated = true; };
  for (const type of GESTURES) win.addEventListener(type, mark, { capture: true, passive: true });

  function ensure() {
    if (broken) return null;
    if (!context) {
      context = new AudioContextCtor();
      master = context.createGain();
      master.gain.value = 0.7;
      master.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume?.().catch?.(() => {});
    return context;
  }

  function noiseBuffer(ctx, seconds) {
    if (noise && noise.length >= ctx.sampleRate * seconds) return noise;
    const length = Math.ceil(ctx.sampleRate * seconds);
    noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    return noise;
  }

  // One envelope-shaped oscillator. Frequencies sweep from `from` to `to`; peak is deliberately small.
  function tone(ctx, { type = 'triangle', from, to, at = 0, length, peak = 0.05 }) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + at;
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + length);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.012, length / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + length + 0.03);
    return { osc, gain };
  }

  const cues = {
    click: ctx => [tone(ctx, { type: 'square', from: 1500, to: 820, length: 0.05, peak: 0.028 })],
    select: ctx => [
      tone(ctx, { type: 'triangle', from: 640, to: 700, length: 0.05, peak: 0.045 }),
      tone(ctx, { type: 'triangle', from: 960, to: 1020, length: 0.07, at: 0.045, peak: 0.04 }),
    ],
    open: ctx => [
      tone(ctx, { type: 'triangle', from: 220, to: 700, length: 0.17, peak: 0.05 }),
      tone(ctx, { type: 'sine', from: 1400, to: 1400, length: 0.05, at: 0.15, peak: 0.02 }),
    ],
    close: ctx => [tone(ctx, { type: 'triangle', from: 560, to: 210, length: 0.13, peak: 0.045 })],
    // The entrance journey: a filtered noise rush that rises and brightens as the scene accelerates, over a rising hum.
    journey: ctx => {
      const length = 2.6;
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer(ctx, length);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 0.9;
      const start = ctx.currentTime;
      filter.frequency.setValueAtTime(180, start);
      filter.frequency.exponentialRampToValueAtTime(2600, start + length);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.075, start + length * 0.85);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
      source.connect(filter).connect(gain).connect(master);
      source.start(start);
      source.stop(start + length + 0.05);
      return [{ osc: source, gain }, tone(ctx, { type: 'sine', from: 55, to: 190, length, peak: 0.05 })];
    },
  };

  function stopVoice(voice) {
    const now = context?.currentTime ?? 0;
    for (const node of voice.nodes) {
      try {
        node.gain.gain.cancelScheduledValues(now);
        node.gain.gain.setTargetAtTime(0.0001, now, 0.02);
        node.osc.stop(now + 0.12);
      } catch { /* already stopped */ }
    }
  }

  const api = {
    get supported() { return !broken; },
    get muted() { return muted; },
    setMuted(value) {
      const next = Boolean(value);
      if (next === muted) return;
      muted = next;
      if (muted) api.stop();
      listeners.forEach(fn => { try { fn(muted); } catch { /* a listener must not break the others */ } });
    },
    toggleMuted() { api.setMuted(!muted); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    play(name) {
      try {
        if (muted || !activated || !cues[name]) return false;
        const now = win.performance?.now?.() ?? Date.now();
        if (now - (lastPlayed.get(name) ?? -Infinity) < MIN_GAP_MS || voices.size >= MAX_VOICES) return false;
        const ctx = ensure();
        if (!ctx) return false;
        lastPlayed.set(name, now);
        const nodes = cues[name](ctx);
        const voice = { name, nodes };
        voices.add(voice);
        // Each source disconnects itself when it ends; the voice is forgotten once all of its sources have ended.
        let remaining = nodes.length;
        for (const node of nodes) {
          node.osc.onended = () => {
            try { node.gain.disconnect(); } catch { /* already disconnected */ }
            remaining -= 1;
            if (remaining === 0) voices.delete(voice);
          };
        }
        return true;
      } catch {
        broken = true; // a failing audio stack stays off for the rest of the page's life; the site is unaffected
        return false;
      }
    },
    stop(name) {
      for (const voice of [...voices]) if (!name || voice.name === name) { stopVoice(voice); voices.delete(voice); }
    },
  };
  return api;
}

// Keeps each mute button in sync with the shared state. The button is named for its action ("Mute sound effects") and
// exposes the state with aria-pressed (true = muted); the visible text carries the same state for sighted users.
export function bindSoundToggles(sounds, buttons) {
  const items = [...buttons];
  const sync = () => {
    for (const button of items) {
      const muted = sounds.muted;
      button.setAttribute('aria-pressed', String(muted));
      button.dataset.muted = String(muted);
      const state = button.querySelector('[data-sound-state]');
      if (state) state.textContent = muted ? 'OFF' : 'ON';
      const glyph = button.querySelector('[data-sound-glyph]');
      if (glyph) glyph.textContent = muted ? '×' : '♪';
    }
  };
  const unsubscribe = sounds.subscribe(sync);
  const handlers = items.map(button => {
    const handler = () => { sounds.toggleMuted(); if (!sounds.muted) sounds.play('select'); }; // a cue only after unmuting
    button.addEventListener('click', handler);
    return handler;
  });
  for (const button of items) button.hidden = !sounds.supported;
  sync();
  return () => {
    unsubscribe();
    items.forEach((button, index) => button.removeEventListener('click', handlers[index]));
  };
}
