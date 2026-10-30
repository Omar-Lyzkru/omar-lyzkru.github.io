/**
 * Native monochrome ASCII artwork. Every visible mark is a character drawn with fillText; there are no images.
 *
 * createBlackHoleField(options)  Pure geometry: turns (clock, travel) into per-cell shade and glyph arrays. No DOM.
 * mountBlackHole(canvas, opts)   The animated entrance scene. Returns { ready, setPaused, travel, cancelTravel, destroy }.
 * drawProjectArt(canvas, kind)   Static illustrative covers (Job Applier, Calendar Intelligence Hub).
 *
 * The scene is recomputed every frame (differentially rotating disk, drifting rings, streaming stars), and the inward
 * journey changes the sampled geometry itself: the field is magnified toward the hole, twisted, and its glyphs stretch into
 * radial streaks. Nothing here is a CSS transform of a still image.
 *
 * Motion policy is not decided here: the owner calls setPaused(true) for system reduced motion or manual Pause, which
 * stops the loop and leaves one static frame.
 */

// Neutral grayscale only, dark to light.
export const SHADES = [
  "#1a1a1a", "#262626", "#343434", "#444444", "#575757", "#6b6b6b",
  "#808080", "#979797", "#afafaf", "#c9c9c9", "#e4e4e4", "#ffffff",
];
// 0-8: density ramp. 9-12: oriented strokes used for radial streaks.
export const GLYPHS = [".", ":", "-", "=", "+", "*", "#", "%", "@", "/", "\\", "|", "-"];
const STROKE = { slash: 9, backslash: 10, bar: 11, dash: 12 };
const TAU = Math.PI * 2;
const IDLE_GLOW = 1.3; // resting brightness gain: the disk reads clearly against the dark horizon
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const gaussian = (distance, width) => Math.exp(-(distance * distance) / (width * width));
const smoothstep = (a, b, value) => {
  const t = clamp((value - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function noise(x, y, seed) {
  let n = Math.imul(x + seed, 374761393) + Math.imul(y + seed, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function strokeFor(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  if (Math.abs(c) > 0.92) return STROKE.dash;
  if (Math.abs(s) > 0.92) return STROKE.bar;
  return c * s > 0 ? STROKE.backslash : STROKE.slash;
}

function sizeCanvas(canvas, context) {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, bounds.width || canvas.clientWidth || 900);
  const height = Math.max(1, bounds.height || canvas.clientHeight || 650);
  const dpr = Math.min(canvas.ownerDocument.defaultView.devicePixelRatio || 1, 1.5);
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

/**
 * Geometry for one canvas size. Static per-cell data is computed once; frame() only does the time-dependent work.
 * travel (optional): { zoom, twist, streak, glow, tunnel, stream, pan, lines } as produced by journeyState().
 */
export function createBlackHoleField({ width, height, cellWidth, cellHeight, centerX, centerY, radius, seed = 42 }) {
  const columns = Math.max(1, Math.ceil(width / cellWidth));
  const rows = Math.max(1, Math.ceil(height / cellHeight));
  const count = columns * rows;
  const X = new Float32Array(count);
  const Y = new Float32Array(count);
  const G1 = new Float32Array(count);
  const G2 = new Float32Array(count);
  const RADIAL = new Float32Array(count); // screen-space angle from the center, for streak orientation
  const LINE = new Float32Array(count);   // per-angle phase of the late-journey speed lines
  const LOGR = new Float32Array(count);   // log of the screen radius, so a line is a pattern along the radius
  const PX = new Float32Array(count);
  const PY = new Float32Array(count);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const i = row * columns + column;
      const px = (column + 0.5) * cellWidth;
      const py = (row + 0.5) * cellHeight;
      PX[i] = px;
      PY[i] = py;
      X[i] = (px - centerX) / radius;
      Y[i] = (py - centerY) / radius;
      G1[i] = noise(column, row, seed);
      G2[i] = noise(column + 317, row + 911, seed);
      RADIAL[i] = Math.atan2(Y[i], X[i]);
      LINE[i] = noise(Math.floor((RADIAL[i] + Math.PI) / TAU * 720), 5, seed + 29);
      LOGR[i] = Math.log(Math.max(0.03, Math.hypot(X[i], Y[i])));
    }
  }

  // Stars live in log-radius space around the center so a single "stream" value moves them all outward, with wrap-around.
  const starCount = Math.max(80, Math.round(count / 45));
  const LMIN = Math.log(0.04);
  const LMAX = Math.log(4.6);
  const LSPAN = LMAX - LMIN;
  const starAngle = new Float32Array(starCount);
  const starLog = new Float32Array(starCount);
  const starBright = new Float32Array(starCount);
  const starRank = new Float32Array(starCount);
  const starPhase = new Float32Array(starCount);
  for (let s = 0; s < starCount; s += 1) {
    starAngle[s] = noise(s, 3, seed + 7) * TAU;
    // A little extra weight on the screen's outskirts: the area near the hole is already busy.
    starLog[s] = LMIN + Math.pow(noise(s, 11, seed + 13), 0.7) * LSPAN;
    starBright[s] = 0.3 + noise(s, 19, seed + 5) * 0.7;
    starRank[s] = noise(s, 23, seed + 17);
    starPhase[s] = noise(s, 29, seed + 3) * TAU;
  }

  const shade = new Uint8Array(count);
  const glyph = new Uint8Array(count);

  const put = (column, row, level, glyphIndex) => {
    if (column < 0 || row < 0 || column >= columns || row >= rows) return;
    const i = row * columns + column;
    if (level >= shade[i]) { shade[i] = level; glyph[i] = glyphIndex; }
  };

  function frame(clock, travel = null) {
    const zoom = travel ? travel.zoom : 1;
    const twist = travel ? travel.twist : 0;
    const streak = travel ? travel.streak : 0;
    const glow = travel ? travel.glow : IDLE_GLOW;
    const tunnel = travel ? travel.tunnel : 0;
    const stream = travel ? travel.stream : 0;
    const lines = travel ? travel.lines : 0;
    const pan = travel ? travel.pan : 0;
    // As the camera falls in, the hole drifts from its resting place to the middle of the screen.
    const panX = (width / 2 - centerX) * pan;
    const panY = (height / 2 - centerY) * pan;
    const offX = panX / radius;
    const offY = panY / radius;
    const inv = 1 / zoom;
    const levels = SHADES.length;
    shade.fill(0);

    for (let i = 0; i < count; i += 1) {
      let x = (X[i] - offX) * inv;
      let y = (Y[i] - offY) * inv;
      if (twist > 0) {
        // Differential twist: the inner field is dragged around further than the outer, like frame dragging.
        const a = twist / (0.45 + Math.hypot(x, y));
        const c = Math.cos(a);
        const s = Math.sin(a);
        const nx = x * c - y * s;
        y = x * s + y * c;
        x = nx;
      }
      const distance = Math.hypot(x, y);
      const g1 = G1[i];
      const g2 = G2[i];
      const angle = Math.atan2(y, x);
      let intensity = 0;
      let disk = 0;
      let arch = 0;

      // Perspective projection of a thin disk. The near side crosses the silhouette; the far side is occulted.
      const planeY = y + x * 0.058;
      const ox = x / 2.84;
      const oy = planeY / 0.235;
      const orbit = Math.hypot(ox, oy);
      const foreground = planeY > 0.022;
      if (orbit < 1.04 && orbit > 0.32 && (foreground || distance > 1.055)) {
        const phi = Math.atan2(oy, ox);
        const innerEdge = smoothstep(0.32, 0.43, orbit);
        const outerEdge = 1 - smoothstep(0.88, 1.045, orbit);
        // Keplerian-style shear: inner material orbits faster, so the arms wind into spirals as time passes.
        const omega = 0.55 / (orbit * Math.sqrt(orbit));
        const arm = Math.sin(3 * (phi - omega * clock) + orbit * 13);
        const bands = 0.66
          + 0.15 * Math.sin(orbit * 89 + phi * 1.8 + clock * 1.1)  // fine rings drifting inward
          + 0.09 * Math.sin(orbit * 169 - phi * 2.1 + clock * 1.7)
          + 0.16 * arm * (1 - 0.5 * orbit);
        const approaching = 1 + 0.26 * clamp(-x / 2.5, -1, 1);
        const rim = 0.24 * gaussian(orbit - 0.88, 0.043);
        disk = (0.89 * innerEdge * outerEdge * bands + rim) * approaching * (0.77 + g1 * 0.31);
        if (!foreground) disk *= 0.77;
        intensity = disk;
      }

      // Rear-disk light bends over and under the silhouette: thin streams, a halo, and a fine photon ring.
      if (distance > 1.018) {
        const lensRadius = Math.hypot(x / 1.205, y / 1.055);
        const crown = clamp(-y / 1.1, 0, 1);
        const upper = y < 0.03;
        const fineStream = gaussian(lensRadius - 1.027, 0.034);
        const outerStream = gaussian(lensRadius - 1.105, 0.083);
        const turbulence = 0.73 + 0.16 * Math.sin(angle * 36 + lensRadius * 54 - clock * 1.6) + g1 * 0.22;
        arch = (fineStream * 0.95 + outerStream * 0.44) * turbulence;
        arch *= upper ? 0.42 + crown * 0.80 : 0.29;
        arch *= 1.0 + clamp(-x, -1, 1) * 0.13;
        const halo = gaussian(lensRadius - 1.14, 0.17) * (upper ? 0.145 : 0.055);
        intensity = Math.max(intensity, arch + halo * g1);
        const photonRing = gaussian(distance - 1.048, 0.017) * (upper ? 0.37 : 0.095)
          * (0.7 + g1 * 0.3) * (0.94 + 0.06 * Math.sin(clock * 2.3));
        intensity = Math.max(intensity, photonRing);
      }

      // The event horizon is intentionally empty, except for the front of the disk.
      if (distance < 1.019 && disk === 0) intensity = 0;

      // Sparse dust in the disk plane.
      const mist = gaussian(Math.abs(planeY) - 0.18, 0.20) * gaussian(Math.abs(x) - 1.88, 0.78);
      if (distance > 1.25 && g1 > 0.90) intensity = Math.max(intensity, mist * 0.066 * g2);

      if (intensity < 0.043 || (intensity < 0.13 && g2 > intensity * 7.5)) {
        // Empty space. Late in the journey it fills with speed lines rushing outward from the center, including from
        // inside the horizon: each angular bucket carries a pattern along the radius that moves with the stream.
        if (lines > 0 && (distance >= 1.019 || tunnel > 0.3)) {
          let v = (LINE[i] + LOGR[i] * 1.7 - stream * 1.1) % 1;
          if (v < 0) v += 1;
          const threshold = 0.9 - 0.07 * lines;
          if (v > threshold) {
            shade[i] = clamp(2 + Math.floor(((v - threshold) / (1 - threshold)) * lines * (levels - 3)), 1, levels);
            glyph[i] = strokeFor(RADIAL[i]);
          }
        }
        continue;
      }

      intensity = Math.pow(clamp(intensity * glow, 0, 1), 0.68);
      const level = clamp(1 + Math.floor(intensity * (levels - 1) + 0.2), 1, levels);
      let index;
      if (streak > 0 && g2 < streak * 0.9) {
        index = strokeFor(RADIAL[i]); // the character field is stretched along the direction of travel
      } else if (disk > arch && disk > 0.17) {
        index = intensity > 0.70 ? (g2 > 0.53 ? 3 : 6)
          : intensity > 0.38 ? (g2 > 0.4 ? 2 : 3) : (g2 > 0.45 ? 1 : 0);
      } else {
        index = clamp(Math.floor(intensity * 8.7 + g2 * 1.1), 0, 8);
      }
      shade[i] = level;
      glyph[i] = index;
    }

    // Stars: slow twinkling drift while idle; during the journey they rush outward in growing streaks. In the late
    // journey the horizon mask lifts, so streaks pour out of the dark center like a tunnel.
    const visibleShare = 0.38 + 0.62 * Math.max(streak, tunnel);
    const drift = clock * 0.012 + stream;
    const horizon = zoom * 1.02 * (1 - tunnel);
    const starCenterX = centerX + panX;
    const starCenterY = centerY + panY;
    for (let s = 0; s < starCount; s += 1) {
      if (starRank[s] > visibleShare) continue;
      let l = (starLog[s] - LMIN + drift) % LSPAN;
      if (l < 0) l += LSPAN;
      const r = Math.exp(LMIN + l);
      if (r < horizon) continue;
      const cosA = Math.cos(starAngle[s]);
      const sinA = Math.sin(starAngle[s]);
      const column = Math.floor((starCenterX + cosA * r * radius) / cellWidth);
      const row = Math.floor((starCenterY + sinA * r * radius) / cellHeight);
      const twinkle = 0.75 + 0.25 * Math.sin(clock * 1.7 + starPhase[s]);
      const brightness = clamp(starBright[s] * twinkle * (1 + streak * 0.8), 0, 1);
      const level = clamp(2 + Math.floor(brightness * (levels - 3)), 1, levels);
      const head = streak > 0.04 ? strokeFor(starAngle[s]) : (brightness > 0.8 ? 4 : 0);
      put(column, row, level, head);
      if (streak > 0.04) {
        const tail = Math.min(22, Math.floor(streak * r * radius * 0.17 / cellHeight));
        for (let k = 1; k <= tail; k += 1) {
          const rr = r - (k * cellHeight) / radius;
          if (rr < horizon || rr <= 0) break;
          put(
            Math.floor((starCenterX + cosA * rr * radius) / cellWidth),
            Math.floor((starCenterY + sinA * rr * radius) / cellHeight),
            clamp(level - Math.ceil(k * 0.5), 1, levels),
            head,
          );
        }
      }
    }
  }

  return { columns, rows, count, cellWidth, cellHeight, PX, PY, shade, glyph, frame };
}

/**
 * Journey parameters for progress p in [0, 1]: magnification accelerates toward the hole, the twist and star stream
 * ramp up, the horizon mask lifts into a tunnel, and the brightness peaks then dims for the hand-off to the portfolio.
 * `rate` multiplies the animation clock so the disk spins faster as the camera falls inward.
 */
export function journeyState(p) {
  const q = clamp(p, 0, 1);
  const approach = clamp(q / 0.62, 0, 1);
  return {
    zoom: 1 + 3.4 * Math.pow(approach, 2.3) + 2.2 * Math.max(0, q - 0.62),
    twist: 2.6 * q * q,
    stream: 7 * Math.pow(q, 2.4),
    streak: Math.pow(clamp((q - 0.1) / 0.5, 0, 1), 1.4),
    tunnel: smoothstep(0.45, 0.72, q),
    glow: (IDLE_GLOW + 0.4 * smoothstep(0.05, 0.55, q)) * (1 - 0.85 * smoothstep(0.85, 1, q)),
    pan: smoothstep(0.05, 0.8, q),
    lines: smoothstep(0.3, 0.75, q),
    rate: 1 + 9 * q * q,
  };
}

const defaultLayout = (width, height) => (width < 600
  ? { cx: 0.5, cy: 0.40, radius: Math.min(width * 0.275, height * 0.28) }
  : { cx: 0.505, cy: 0.492, radius: Math.min(width * 0.218, height * 0.26) });

const FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const STILL_CLOCK = 6; // the phase shown while motion is paused or reduced

/**
 * Mounts the animated scene on a canvas. Options:
 *   fps (1-24, idle frame rate), seed, parallax (default true), layout(width, height) -> { cx, cy, radius } (cx, cy as 0-1).
 * Returns { ready, setPaused(bool), travel({ duration, onProgress, onComplete }), cancelTravel(), destroy() }.
 * If no 2D context exists, returns an inert controller with ready === false.
 */
export function mountBlackHole(canvas, options = {}) {
  let ctx = null;
  try { ctx = canvas.getContext("2d", { alpha: true }); } catch { ctx = null; }
  if (!ctx) return { ready: false, setPaused() {}, travel() { return false; }, cancelTravel() {}, destroy() {} };
  const doc = canvas.ownerDocument;
  const win = doc.defaultView;
  const frameInterval = 1000 / clamp(Number(options.fps) || 20, 1, 24);
  const travelInterval = 1000 / 40; // quantizes to ~30 fps on a 60 Hz display
  const seed = Number(options.seed) || 42;
  const layout = options.layout || defaultLayout;
  const parallaxEnabled = options.parallax !== false;

  let field = null;
  let width = 1;
  let height = 1;
  let quality = 1; // cell-size multiplier; rises when frames are too slow for the device
  let frameId = 0;
  let lastFrame = -Infinity;
  let clock = STILL_CLOCK;
  let paused = Boolean(options.paused);
  let inView = true;
  let destroyed = false;
  let run = null; // the single in-flight journey: { duration, start, onProgress, onComplete }
  let pointerX = 0;
  let pointerY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let slow = 0;
  let averageMs = 0;

  function build() {
    if (destroyed) return;
    const size = sizeCanvas(canvas, ctx);
    width = size.width;
    height = size.height;
    const cellHeight = (width < 600 ? 8.6 : 10.3) * quality;
    const cellWidth = cellHeight * 0.6;
    const lay = layout(width, height);
    field = createBlackHoleField({
      width, height, cellWidth, cellHeight, centerX: width * lay.cx, centerY: height * lay.cy, radius: lay.radius, seed,
    });
    ctx.font = `400 ${cellHeight * 0.98}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    draw(null);
    synchronize();
  }

  function draw(travel) {
    if (!field) return;
    const started = performance.now();
    field.frame(clock, travel);
    ctx.clearRect(0, 0, width, height);
    const driftOn = parallaxEnabled && !paused;
    if (driftOn) {
      offsetX += (pointerX * 10 - offsetX) * 0.09;
      offsetY += (pointerY * 6 - offsetY) * 0.09;
    } else {
      offsetX = 0;
      offsetY = 0;
    }
    const { shade, glyph, PX, PY, count } = field;
    for (let level = 1; level <= SHADES.length; level += 1) {
      ctx.fillStyle = SHADES[level - 1];
      for (let i = 0; i < count; i += 1) {
        if (shade[i] === level) ctx.fillText(GLYPHS[glyph[i]], PX[i] + offsetX, PY[i] + offsetY);
      }
    }
    // Quality governor: a device that cannot keep up gets a coarser (cheaper) character grid, never a stuttering one.
    averageMs = averageMs ? averageMs * 0.9 + (performance.now() - started) * 0.1 : performance.now() - started;
    if (averageMs > 22 && quality < 1.6) slow += 1; else slow = 0;
    if (slow > 12) { quality = Math.min(1.6, quality * 1.25); slow = 0; averageMs = 0; build(); }
  }

  function finishRun(completed) {
    const finished = run;
    run = null;
    if (finished && completed) { try { finished.onComplete?.(); } catch { /* the owner's callback must not break rendering */ } }
  }

  function animate(time) {
    frameId = 0;
    if (destroyed || paused || !inView || doc.hidden) return;
    frameId = win.requestAnimationFrame(animate);
    if (time - lastFrame < (run ? travelInterval : frameInterval) - 1) return;
    const dt = Number.isFinite(lastFrame) ? Math.min(time - lastFrame, 100) / 1000 : 1 / 60;
    lastFrame = time;
    let travel = null;
    let progress = 0;
    let rate = 1;
    if (run) {
      if (run.start === null) run.start = time;
      progress = clamp((time - run.start) / run.duration, 0, 1);
      travel = journeyState(progress);
      rate = travel.rate;
    }
    clock += dt * rate;
    draw(travel);
    if (run) {
      try { run.onProgress?.(progress); } catch { /* ignore */ }
      if (progress >= 1) finishRun(true);
    }
  }

  function synchronize() {
    if (frameId) win.cancelAnimationFrame(frameId);
    frameId = 0;
    if (!destroyed && !paused && inView && !doc.hidden) {
      lastFrame = -Infinity;
      frameId = win.requestAnimationFrame(animate);
    }
  }

  function movePointer(event) {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    pointerX = clamp((event.clientX - bounds.left) / bounds.width - 0.5, -0.5, 0.5);
    pointerY = clamp((event.clientY - bounds.top) / bounds.height - 0.5, -0.5, 0.5);
  }
  const resizeObserver = win.ResizeObserver ? new win.ResizeObserver(build) : null;
  const intersectionObserver = win.IntersectionObserver ? new win.IntersectionObserver(entries => {
    inView = entries[entries.length - 1].isIntersecting;
    synchronize();
  }, { threshold: 0.01 }) : null;

  if (parallaxEnabled) doc.addEventListener("pointermove", movePointer, { passive: true });
  doc.addEventListener("visibilitychange", synchronize);
  if (resizeObserver) resizeObserver.observe(canvas);
  else win.addEventListener("resize", build, { passive: true });
  intersectionObserver?.observe(canvas);
  build();

  return {
    ready: true,
    setPaused(value) {
      paused = Boolean(value);
      if (paused) { run = null; draw(null); } // a paused scene is one static frame; the owner decides what happens to a journey
      synchronize();
    },
    /** Starts the inward journey. Returns false if it cannot run (paused or destroyed). Only one runs at a time. */
    travel({ duration = 2800, onProgress, onComplete } = {}) {
      if (destroyed || paused) return false;
      run = { duration: Math.max(200, duration), start: null, onProgress, onComplete };
      synchronize();
      return true;
    },
    cancelTravel() { run = null; },
    destroy() {
      destroyed = true;
      run = null;
      if (frameId) win.cancelAnimationFrame(frameId);
      frameId = 0;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      doc.removeEventListener("pointermove", movePointer);
      doc.removeEventListener("visibilitychange", synchronize);
      win.removeEventListener("resize", build);
      try { ctx.clearRect(0, 0, canvas.width, canvas.height); } catch { /* ignore */ }
      field = null;
    },
  };
}

function segmentDistance(x, y, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(x - ax - dx * t, y - ay - dy * t);
}

// Illustrative project covers share one grayscale palette.
const ART = { dim: "#6e6e6e", soft: "#b0b0b0", bright: "#e8e8e8", white: "#ffffff", dust: "#4a4a4a" };

/** Static illustrative covers. Kinds: server, network, terminal, constellation (aliases rings, planet, wave). Returns { redraw, destroy }. */
export function drawProjectArt(canvas, kind = "constellation") {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return { redraw() {}, destroy() {} };
  const win = canvas.ownerDocument.defaultView;
  let destroyed = false;

  function redraw() {
    if (destroyed) return;
    const { width, height } = sizeCanvas(canvas, ctx);
    const cellHeight = 10;
    const cellWidth = 6.1;
    const columns = Math.ceil(width / cellWidth);
    const rows = Math.ceil(height / cellHeight);
    const unit = Math.min(width * 0.34, height * 0.41);
    const points = [[-1.20, 0.39], [-0.78, -0.42], [-0.13, -0.72], [0.46, -0.08], [1.13, -0.56], [0.86, 0.65], [0.0, 0.48]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [6, 0], [3, 6]];
    ctx.clearRect(0, 0, width, height);
    ctx.font = `400 ${cellHeight}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const px = (column + 0.5) * cellWidth;
        const py = (row + 0.5) * cellHeight;
        const x = (px - width * 0.5) / unit;
        const y = (py - height * 0.5) / unit;
        const grain = noise(column, row, 91);
        const threshold = cellWidth / unit * 0.72;
        let glyph = "";
        let shade = ART.dim;

        if (kind === "server" || kind === "rings") {
          const ellipse = Math.hypot(x / 1.5, (y + x * 0.17) / 0.57);
          if (Math.abs(ellipse - 1) < threshold || Math.abs(ellipse - 0.77) < threshold * 0.65) glyph = grain > 0.4 ? ":" : ".";
          if (Math.abs(x) < 0.63 && Math.abs(y) < 0.89) {
            const section = (y + 0.89) % 0.58;
            if (Math.abs(Math.abs(x) - 0.60) < threshold) glyph = "|";
            else if (section < threshold * 1.9 || section > 0.58 - threshold) glyph = "-";
            else if (x > -0.42 && x < 0.17 && section > 0.22 && section < 0.32) glyph = "=";
            else if (x > 0.32 && x < 0.44 && section > 0.22 && section < 0.32) { glyph = "+"; shade = ART.bright; }
            else glyph = "";
            if (glyph && shade !== ART.bright) shade = ART.soft;
          }
        } else if (kind === "network" || kind === "planet") {
          const radius = Math.hypot(x, y);
          if (Math.abs(radius - 0.86) < threshold) { glyph = grain > 0.4 ? "+" : ":"; shade = ART.bright; }
          else if (radius < 0.84) {
            const latitude = Math.abs((y + 0.92) % 0.30 - 0.15);
            const longitude = Math.abs(Math.hypot(x / 0.45, y / 0.86) - 1);
            if (latitude < threshold * 0.5 || longitude < threshold || Math.abs(x) < threshold * 0.6) glyph = grain > 0.5 ? ":" : ".";
          }
          const orbit = Math.hypot(x / 1.48, (y + x * 0.39) / 0.51);
          if (Math.abs(orbit - 1) < threshold * 0.7 && radius > 0.89) glyph = "-";
          if (Math.hypot(x + 1.31, y - 0.47) < threshold * 1.8 || Math.hypot(x - 1.22, y + 0.64) < threshold * 1.8) { glyph = "*"; shade = ART.white; }
        } else if (kind === "terminal" || kind === "wave") {
          const box = Math.abs(x) < 1.43 && Math.abs(y) < 0.91;
          if (box && (Math.abs(Math.abs(x) - 1.38) < threshold || Math.abs(Math.abs(y) - 0.85) < threshold)) glyph = Math.abs(x) > 1.31 ? "|" : "-";
          if (box && Math.abs(y + 0.56) < threshold) glyph = "-";
          if (x > -1.14 && x < -0.93 && y > -0.43 && y < -0.28) { glyph = ">"; shade = ART.bright; }
          const wave = 0.32 * Math.sin(x * 4.6) * Math.cos(x * 1.3) + 0.14;
          if (box && Math.abs(x) < 1.15 && Math.abs(y - wave) < threshold * 1.25) { glyph = grain > 0.5 ? "=" : "+"; shade = ART.bright; }
          if (x > -1.12 && x < 0.75 && y > 0.61 && y < 0.72 && grain > 0.3) glyph = "_";
        } else {
          for (let i = 0; i < edges.length; i += 1) {
            const a = points[edges[i][0]];
            const b = points[edges[i][1]];
            if (segmentDistance(x, y, a[0], a[1], b[0], b[1]) < threshold * 0.64) glyph = ".";
          }
          for (let i = 0; i < points.length; i += 1) {
            if (Math.hypot(x - points[i][0], y - points[i][1]) < threshold * 1.9) { glyph = i === 3 ? "@" : "*"; shade = ART.bright; }
          }
        }
        if (!glyph && grain > 0.998) { glyph = "."; shade = ART.dust; }
        if (glyph) { ctx.fillStyle = shade; ctx.fillText(glyph, px, py); }
      }
    }
  }
  const observer = win.ResizeObserver ? new win.ResizeObserver(redraw) : null;
  observer?.observe(canvas);
  if (!observer) win.addEventListener("resize", redraw, { passive: true });
  redraw();
  return {
    redraw,
    destroy() {
      destroyed = true;
      observer?.disconnect();
      win.removeEventListener("resize", redraw);
    },
  };
}
