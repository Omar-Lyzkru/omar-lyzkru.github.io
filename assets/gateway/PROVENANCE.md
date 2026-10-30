# Entrance gateway artwork: provenance

## Current entrance: generated live from characters

The entrance is **not an image**. It is drawn in the browser on a `<canvas>` with `fillText`, one monochrome character per
cell, by [`blackhole.js`](../../blackhole.js) (`createBlackHoleField()` for the geometry, `mountBlackHole()` for the canvas and
animation loop, `journeyState()` for the inward journey). There are no image, video, font-file, or third-party assets in it.

- **What it draws:** a dark empty event horizon, a banded accretion disk seen in perspective (the near side crosses in
  front of the horizon, the far side is hidden behind it), thin lensing arcs and a photon ring, a Doppler-style brighter
  approaching side, and sparse stars. Shades are neutral grays from `#1a1a1a` to `#ffffff`.
- **What moves:** the disk's arms rotate with a Keplerian-style shear (inner material faster), fine rings drift inward, the
  lensing streams shimmer, and stars drift and twinkle. On **Enter Portfolio** a 3.4 s journey recomputes the field every
  frame: magnification toward the hole accelerates, the field is twisted, glyphs stretch into radial strokes (`/ \ | -`),
  the hole drifts to the center of the screen, speed lines and stars pour outward from the middle, the animation clock speeds
  up, and finally a ring opens at the center with the portfolio visible inside it (a CSS radial mask on the gateway dialog) while the page behind scales down from close-up and de-blurs, so the visitor arrives through the hole.
- **How it is bounded:** one loop per mounted scene, paused when the tab is hidden or the motion policy asks for reduced
  motion (it then shows one static frame), destroyed when the gateway closes. A governor coarsens the character grid on
  devices that cannot keep up.
- **What it is not:** an artistic, physically *inspired* rendering. It is not a scientific simulation, a ray-traced image, or a
  recording of one. The geometry uses simple analytic shapes (ellipses, Gaussians) chosen for how they read in ASCII.

### Fallbacks

If the module cannot load or a 2D canvas is unavailable, `index.html` shows a static character picture (`.gw-fallback`, a `<pre>`
produced by running the same `createBlackHoleField()` once at an idle clock and printing its glyphs). If the journey cannot
start, a 380 ms plain dissolve is used instead. Enter Portfolio and Skip Intro never depend on any of this.

## Legacy artwork (retained, unused)

These two files were the gateway background before the animated entrance and are no longer referenced by any page:

| File | Size |
|---|---|
| `gateway-wide.webp` | 1920 × 1080 |
| `gateway-tall.webp` | 900 × 1400 |

They are **original work generated for this portfolio** by [`render_blackhole.py`](render_blackhole.py) in this directory,
rendered with numpy and Pillow: a Schwarzschild null-geodesic ray tracer with a thin accretion disk (gravitational lensing,
secondary image, Doppler and gravitational shift), then violet tone-mapping, a soft bloom, a faint nebula wash, and a sparse
procedural star field. No photographs, NASA/ESA/EHT imagery, stock images, textures, fonts, or third-party code were used or
traced, and no AI image-generation service was used, so there are no licensing restrictions or attribution requirements. They
are violet because the site was violet at the time; the current site uses grayscale only, which is why they were retired.

To reproduce them: `python -m pip install numpy pillow` then `python assets/gateway/render_blackhole.py assets/gateway`.
