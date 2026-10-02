/**
 * Native ASCII artwork. Every visible mark is drawn with fillText.
 * mountBlackHole(canvas, { fps: 18, parallax: true, seed: 42 }) returns
 * { setPaused(boolean), destroy() }. Add aria-hidden="true" to decorative canvases.
 */

const GLYPHS = [".", ":", "-", "=", "+", "*", "#", "%", "@"];
const SHADES = [
  "#201a15", "#32271d", "#493624", "#634831", "#805c3d", "#a1754d",
  "#bc8b5d", "#d7ad80", "#e0c29e", "#ead4b5", "#f3e5cf",
];
const TAU = Math.PI * 2;
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

/** A readable event horizon, Doppler-bright disk, and gravitational lensing arcs. */
export function mountBlackHole(canvas, options = {}) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return { setPaused() {}, destroy() {} };
  const doc = canvas.ownerDocument;
  const win = doc.defaultView;
  const reducedMotion = win.matchMedia("(prefers-reduced-motion: reduce)");
  const fps = clamp(Number(options.fps) || 18, 1, 20);
  const frameInterval = 1000 / fps;
  const seed = Number(options.seed) || 42;
  const parallaxEnabled = options.parallax !== false;
  let width = 1;
  let height = 1;
  let cellHeight = 10;
  let buckets = [];
  let frameId = 0;
  let lastFrame = -Infinity;
  let manualPaused = false;
  let inView = true;
  let destroyed = false;
  let pointerX = 0;
  let pointerY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let renderedTick = 0;

  function build() {
    if (destroyed) return;
    const size = sizeCanvas(canvas, ctx);
    width = size.width;
    height = size.height;
    cellHeight = width < 600 ? 8.6 : 10.3;
    const cellWidth = cellHeight * 0.60;
    const columns = Math.ceil(width / cellWidth);
    const rows = Math.ceil(height / cellHeight);
    const radius = width < 600
      ? Math.min(width * 0.275, height * 0.28)
      : Math.min(width * 0.218, height * 0.26);
    const centerX = width * 0.505;
    const centerY = height * 0.492;
    const lists = SHADES.map(() => ({ x: [], y: [], glyph: [], alternative: [], phase: [] }));

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const px = (column + 0.5) * cellWidth;
        const py = (row + 0.5) * cellHeight;
        const x = (px - centerX) / radius;
        const y = (py - centerY) / radius;
        const distance = Math.hypot(x, y);
        const grain = noise(column, row, seed);
        const grain2 = noise(column + 317, row + 911, seed);
        const angle = Math.atan2(y, x);
        let intensity = 0;
        let disk = 0;
        let arch = 0;
        let star = false;

        // Perspective projection of a thin disk. The lower, near side crosses
        // the silhouette; the upper, far side is occulted by the horizon.
        const planeY = y + x * 0.058;
        const orbit = Math.hypot(x / 2.84, planeY / 0.208);
        const foreground = planeY > 0.022;
        if (orbit < 1.04 && orbit > 0.32 && (foreground || distance > 1.055)) {
          const innerEdge = smoothstep(0.32, 0.43, orbit);
          const outerEdge = 1 - smoothstep(0.88, 1.045, orbit);
          const bands = 0.73 + 0.16 * Math.sin(orbit * 89 + angle * 1.8)
            + 0.09 * Math.sin(orbit * 169 - angle * 2.1);
          const approaching = 1.0 + 0.21 * clamp(-x / 2.5, -1, 1);
          const rim = 0.24 * gaussian(orbit - 0.88, 0.043);
          disk = (0.89 * innerEdge * outerEdge * bands + rim) * approaching;
          disk *= 0.77 + grain * 0.31;
          if (!foreground) disk *= 0.77;
          intensity = disk;
        }

        // Light from the rear disk bends above and below the black silhouette.
        // Several thin streams create a lensing arch rather than a solid donut.
        const lensRadius = Math.hypot(x / 1.205, y / 1.055);
        if (distance > 1.018) {
          const crown = clamp(-y / 1.1, 0, 1);
          const upper = y < 0.03;
          const fineStream = gaussian(lensRadius - 1.027, 0.034);
          const outerStream = gaussian(lensRadius - 1.105, 0.083);
          const turbulence = 0.73 + 0.16 * Math.sin(angle * 36 + lensRadius * 54)
            + grain * 0.22;
          arch = (fineStream * 0.95 + outerStream * 0.44) * turbulence;
          arch *= upper ? 0.42 + crown * 0.80 : 0.29;
          arch *= 1.0 + clamp(-x, -1, 1) * 0.13;
          const halo = gaussian(lensRadius - 1.14, 0.17) * (upper ? 0.145 : 0.055);
          intensity = Math.max(intensity, arch + halo * grain);

          // A fine photon ring keeps the event horizon sharply legible.
          const photonRing = gaussian(distance - 1.048, 0.017)
            * (upper ? 0.37 : 0.095) * (0.7 + grain * 0.3);
          intensity = Math.max(intensity, photonRing);
        }

        // Empty space inside the horizon is intentional, except for the front disk.
        if (distance < 1.019 && disk === 0) intensity = 0;
        if (distance > 1.55 && grain > 0.9980) {
          star = true;
          intensity = 0.22 + grain2 * 0.29;
        }
        const diskMist = gaussian(Math.abs(planeY) - 0.18, 0.20)
          * gaussian(Math.abs(x) - 1.88, 0.78);
        if (distance > 1.25 && !star && grain > 0.90) {
          intensity = Math.max(intensity, diskMist * 0.066 * grain2);
        }
        if (intensity < 0.043 || (!star && intensity < 0.13 && grain2 > intensity * 5.6)) continue;

        intensity = Math.pow(clamp(intensity, 0, 1), 0.68);
        const shade = clamp(Math.floor(intensity * (SHADES.length - 1) + 0.2), 0, SHADES.length - 1);
        let glyph;
        if (star) glyph = grain2 > 0.86 ? "+" : ".";
        else if (disk > arch && disk > 0.17) {
          glyph = intensity > 0.70 ? (grain2 > 0.53 ? "=" : "#")
            : intensity > 0.38 ? (grain2 > 0.4 ? "-" : "=") : (grain2 > 0.45 ? ":" : ".");
        } else {
          const glyphIndex = clamp(Math.floor(intensity * 8.7 + grain2 * 1.1), 0, GLYPHS.length - 1);
          glyph = GLYPHS[glyphIndex];
        }
        const group = lists[shade];
        group.x.push(px);
        group.y.push(py);
        group.glyph.push(glyph);
        group.alternative.push(star ? glyph : (glyph === "=" ? "-" : glyph === "#" ? "=" : glyph === "." ? ":" : glyph));
        group.phase.push(Math.floor((angle / TAU + 0.5) * 91 + grain * 17));
      }
    }
    // Typed coordinate arrays and cached strings: the frame loop allocates no
    // per-glyph objects, colors, geometry, or strings.
    buckets = lists.map((group) => ({
      x: new Float32Array(group.x),
      y: new Float32Array(group.y),
      glyph: group.glyph,
      alternative: group.alternative,
      phase: new Uint16Array(group.phase),
    }));
    ctx.font = `400 ${cellHeight * 0.98}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    render(renderedTick);
    synchronize();
  }

  function render(tick) {
    ctx.clearRect(0, 0, width, height);
    const motion = parallaxEnabled && !reducedMotion.matches && !manualPaused;
    if (motion) {
      offsetX += (pointerX * 5 - offsetX) * 0.09;
      offsetY += (pointerY * 3 - offsetY) * 0.09;
    } else {
      offsetX = 0;
      offsetY = 0;
    }
    for (let shade = 0; shade < buckets.length; shade += 1) {
      const group = buckets[shade];
      ctx.fillStyle = SHADES[shade];
      for (let i = 0; i < group.x.length; i += 1) {
        const shimmer = !reducedMotion.matches && (tick + group.phase[i]) % 91 < 3;
        ctx.fillText(shimmer ? group.alternative[i] : group.glyph[i], group.x[i] + offsetX, group.y[i] + offsetY);
      }
    }
  }

  function animate(time) {
    frameId = 0;
    if (destroyed || manualPaused || !inView || doc.hidden || reducedMotion.matches) return;
    if (time - lastFrame >= frameInterval) {
      lastFrame = time;
      renderedTick = Math.floor(time / 180);
      render(renderedTick);
    }
    frameId = win.requestAnimationFrame(animate);
  }

  function synchronize() {
    if (frameId) win.cancelAnimationFrame(frameId);
    frameId = 0;
    if (!destroyed && !manualPaused && inView && !doc.hidden && !reducedMotion.matches) {
      lastFrame = -Infinity;
      frameId = win.requestAnimationFrame(animate);
    }
  }

  function movePointer(event) {
    if (!parallaxEnabled || reducedMotion.matches) return;
    const bounds = canvas.getBoundingClientRect();
    pointerX = clamp((event.clientX - bounds.left) / bounds.width - 0.5, -0.5, 0.5);
    pointerY = clamp((event.clientY - bounds.top) / bounds.height - 0.5, -0.5, 0.5);
  }
  function resetPointer() { pointerX = 0; pointerY = 0; }
  function motionChanged() { render(renderedTick); synchronize(); }
  const resizeObserver = win.ResizeObserver ? new win.ResizeObserver(build) : null;
  const intersectionObserver = win.IntersectionObserver ? new win.IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    synchronize();
  }, { threshold: 0.01 }) : null;

  canvas.addEventListener("pointermove", movePointer, { passive: true });
  canvas.addEventListener("pointerleave", resetPointer, { passive: true });
  doc.addEventListener("visibilitychange", synchronize);
  if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", motionChanged);
  else reducedMotion.addListener(motionChanged);
  if (resizeObserver) resizeObserver.observe(canvas);
  else win.addEventListener("resize", build, { passive: true });
  if (intersectionObserver) intersectionObserver.observe(canvas);
  build();

  return {
    setPaused(value) {
      manualPaused = Boolean(value);
      if (manualPaused) render(renderedTick);
      synchronize();
    },
    destroy() {
      destroyed = true;
      if (frameId) win.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      canvas.removeEventListener("pointermove", movePointer);
      canvas.removeEventListener("pointerleave", resetPointer);
      doc.removeEventListener("visibilitychange", synchronize);
      win.removeEventListener("resize", build);
      if (reducedMotion.removeEventListener) reducedMotion.removeEventListener("change", motionChanged);
      else reducedMotion.removeListener(motionChanged);
      buckets = [];
    },
  };
}

function segmentDistance(x, y, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(x - ax - dx * t, y - ay - dy * t);
}

/** Four static project covers. Kinds: server, network, terminal, constellation.
 * Aliases rings, planet, wave are also accepted. Returns { redraw, destroy }.
 */
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
    ctx.font = `400 ${cellHeight}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
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
        let shade = "#71614f";

        if (kind === "server" || kind === "rings") {
          const ellipse = Math.hypot(x / 1.5, (y + x * 0.17) / 0.57);
          if (Math.abs(ellipse - 1) < threshold || Math.abs(ellipse - 0.77) < threshold * 0.65) glyph = grain > 0.4 ? ":" : ".";
          if (Math.abs(x) < 0.63 && Math.abs(y) < 0.89) {
            const section = (y + 0.89) % 0.58;
            if (Math.abs(Math.abs(x) - 0.60) < threshold) glyph = "|";
            else if (section < threshold * 1.9 || section > 0.58 - threshold) glyph = "-";
            else if (x > -0.42 && x < 0.17 && section > 0.22 && section < 0.32) glyph = "=";
            else if (x > 0.32 && x < 0.44 && section > 0.22 && section < 0.32) { glyph = "+"; shade = "#d7ad80"; }
            else glyph = "";
            if (glyph && shade !== "#d7ad80") shade = "#b3a28c";
          }
        } else if (kind === "network" || kind === "planet") {
          const radius = Math.hypot(x, y);
          if (Math.abs(radius - 0.86) < threshold) { glyph = grain > 0.4 ? "+" : ":"; shade = "#d7ad80"; }
          else if (radius < 0.84) {
            const latitude = Math.abs((y + 0.92) % 0.30 - 0.15);
            const longitude = Math.abs(Math.hypot(x / 0.45, y / 0.86) - 1);
            if (latitude < threshold * 0.5 || longitude < threshold || Math.abs(x) < threshold * 0.6) glyph = grain > 0.5 ? ":" : ".";
          }
          const orbit = Math.hypot(x / 1.48, (y + x * 0.39) / 0.51);
          if (Math.abs(orbit - 1) < threshold * 0.7 && radius > 0.89) glyph = "-";
          if (Math.hypot(x + 1.31, y - 0.47) < threshold * 1.8 || Math.hypot(x - 1.22, y + 0.64) < threshold * 1.8) { glyph = "*"; shade = "#ead4b5"; }
        } else if (kind === "terminal" || kind === "wave") {
          const box = Math.abs(x) < 1.43 && Math.abs(y) < 0.91;
          if (box && (Math.abs(Math.abs(x) - 1.38) < threshold || Math.abs(Math.abs(y) - 0.85) < threshold)) glyph = Math.abs(x) > 1.31 ? "|" : "-";
          if (box && Math.abs(y + 0.56) < threshold) glyph = "-";
          if (x > -1.14 && x < -0.93 && y > -0.43 && y < -0.28) { glyph = ">"; shade = "#d7ad80"; }
          const wave = 0.32 * Math.sin(x * 4.6) * Math.cos(x * 1.3) + 0.14;
          if (box && Math.abs(x) < 1.15 && Math.abs(y - wave) < threshold * 1.25) { glyph = grain > 0.5 ? "=" : "+"; shade = "#d7ad80"; }
          if (x > -1.12 && x < 0.75 && y > 0.61 && y < 0.72 && grain > 0.3) glyph = "_";
        } else {
          for (let i = 0; i < edges.length; i += 1) {
            const a = points[edges[i][0]];
            const b = points[edges[i][1]];
            if (segmentDistance(x, y, a[0], a[1], b[0], b[1]) < threshold * 0.64) glyph = ".";
          }
          for (let i = 0; i < points.length; i += 1) {
            if (Math.hypot(x - points[i][0], y - points[i][1]) < threshold * 1.9) { glyph = i === 3 ? "@" : "*"; shade = "#d7ad80"; }
          }
        }
        if (!glyph && grain > 0.998) { glyph = "."; shade = "#493c30"; }
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
