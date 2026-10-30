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

  let reverb = null;

  // Master chain: voices -> master -> (compressor, when available) -> speakers, plus a short synthesized room reverb
  // that every voice is also sent into. The compressor lets the cues be full without clipping.
  function ensure() {
    if (broken) return null;
    if (!context) {
      context = new AudioContextCtor();
      master = context.createGain();
      master.gain.value = 1;
      let out = context.destination;
      if (typeof context.createDynamicsCompressor === 'function') {
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -16;
        compressor.ratio.value = 5;
        compressor.attack.value = 0.004;
        compressor.release.value = 0.22;
        compressor.connect(context.destination);
        out = compressor;
      }
      master.connect(out);
      if (typeof context.createConvolver === 'function') {
        try {
          const length = Math.ceil(context.sampleRate * 1.9);
          const impulse = context.createBuffer(1, length, context.sampleRate);
          const data = impulse.getChannelData(0);
          for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6);
          reverb = context.createConvolver();
          reverb.buffer = impulse;
          const wet = context.createGain();
          wet.gain.value = 0.32;
          reverb.connect(wet).connect(master);
        } catch { reverb = null; }
      }
    }
    if (context.state === 'suspended') context.resume?.().catch?.(() => {});
    return context;
  }

  // Every voice goes to the dry bus and, when present, the reverb send.
  const route = node => { node.connect(master); if (reverb) node.connect(reverb); };

  function noiseBuffer(ctx, seconds) {
    if (noise && noise.length >= ctx.sampleRate * seconds) return noise;
    const length = Math.ceil(ctx.sampleRate * seconds);
    noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    return noise;
  }

  // One envelope-shaped oscillator. Frequencies sweep from `from` to `to` over `length`; `attack` is the rise time.
  // `lowpass` (optional, [from, to]) sweeps a low-pass filter for warmth.
  function tone(ctx, { type = 'triangle', from, to, at = 0, length, peak = 0.1, attack = Math.min(0.012, length / 3), lowpass = null }) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + at;
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + length);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    let head = osc;
    if (lowpass) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(lowpass[0], start);
      filter.frequency.exponentialRampToValueAtTime(lowpass[1], start + length);
      osc.connect(filter);
      head = filter;
    }
    head.connect(gain);
    route(gain);
    osc.start(start);
    osc.stop(start + length + 0.05);
    return { osc, gain };
  }

  // Filtered noise: a band-pass that sweeps, shaped by its own envelope.
  function rush(ctx, { from, to, at = 0, length, peak, attack, type = 'bandpass', q = 0.9 }) {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, length);
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    const start = ctx.currentTime + at;
    filter.frequency.setValueAtTime(from, start);
    filter.frequency.exponentialRampToValueAtTime(to, start + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    source.connect(filter).connect(gain);
    route(gain);
    source.start(start);
    source.stop(start + length + 0.05);
    return { osc: source, gain };
  }

  const cues = {
    // A crisp tick over a soft low thump.
    click: ctx => [
      tone(ctx, { type: 'square', from: 2000, to: 900, length: 0.05, peak: 0.16 }),
      tone(ctx, { type: 'sine', from: 190, to: 80, length: 0.13, peak: 0.5 }),
    ],
    // A two-note chime with a shimmer, soaked in the room reverb.
    select: ctx => [
      tone(ctx, { type: 'sine', from: 880, to: 880, length: 0.32, peak: 0.3 }),
      tone(ctx, { type: 'sine', from: 1320, to: 1320, length: 0.42, at: 0.06, peak: 0.22 }),
      tone(ctx, { type: 'triangle', from: 440, to: 440, length: 0.26, peak: 0.16 }),
    ],
    // Opening: a rising sweep, a sub swell, and a bright chime on top.
    open: ctx => [
      tone(ctx, { type: 'sawtooth', from: 160, to: 900, length: 0.28, peak: 0.14, attack: 0.08, lowpass: [400, 3200] }),
      tone(ctx, { type: 'sine', from: 70, to: 150, length: 0.34, peak: 0.55, attack: 0.05 }),
      tone(ctx, { type: 'sine', from: 1320, to: 1760, length: 0.45, at: 0.2, peak: 0.2 }),
    ],
    // Closing: a falling sweep that settles into a low thud.
    close: ctx => [
      tone(ctx, { type: 'sawtooth', from: 800, to: 150, length: 0.26, peak: 0.12, lowpass: [3000, 300] }),
      tone(ctx, { type: 'sine', from: 130, to: 48, length: 0.34, peak: 0.55 }),
    ],
    // The entrance journey, matched to its 3.4 s: a sub rumble and a growl that climb with the acceleration, a rushing
    // noise sweep, a rising shimmer of fifths, and a deep boom as the ring opens onto the portfolio. The boom's tail rings
    // on over the portfolio; leaving the journey early (Skip, Escape, Pause, mute) stops everything at once.
    journey: ctx => {
      const length = 3.4;
      const nodes = [
        tone(ctx, { type: 'sine', from: 36, to: 120, length, peak: 0.32, attack: 1.7 }),
        tone(ctx, { type: 'sawtooth', from: 52, to: 230, length, peak: 0.075, attack: 1.9, lowpass: [140, 2400] }),
        rush(ctx, { from: 140, to: 4400, length, peak: 0.26, attack: 2.4 }),
        tone(ctx, { type: 'sine', from: 90, to: 28, at: length * 0.66, length: 1.8, peak: 0.5, attack: 0.03 }),
        rush(ctx, { from: 900, to: 90, at: length * 0.66, length: 1.3, peak: 0.2, attack: 0.03, type: 'lowpass', q: 0.7 }),
      ];
      [523, 784, 1047, 1568, 2093].forEach((hz, i) => {
        nodes.push(tone(ctx, { type: 'triangle', from: hz, to: hz, at: length * [0.12, 0.3, 0.46, 0.6, 0.72][i], length: 0.7, peak: 0.07 + i * 0.01 }));
      });
      return nodes;
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
