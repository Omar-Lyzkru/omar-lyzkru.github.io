# Entrance gateway artwork: provenance

| File | Size | Use |
|---|---|---|
| `gateway-wide.webp` | 1920 × 1080 | Gateway background for landscape and wide viewports |
| `gateway-tall.webp` | 900 × 1400 | Gateway background when the viewport is taller than 4:5 (selected with `<picture>`) |

## Origin

Both images are **original work generated for this portfolio** by [`render_blackhole.py`](render_blackhole.py) in this
directory. They are rendered from first principles with numpy and Pillow: a Schwarzschild null-geodesic ray tracer with a
thin accretion disk (gravitational lensing, secondary image, Doppler and gravitational shift), then violet tone-mapping, a
soft bloom, a faint nebula wash, and a sparse procedural star field.

- No photographs, NASA/ESA/EHT imagery, stock images, textures, fonts, or third-party code were used or traced.
- No AI image-generation service was used.
- Because the work is original there are **no licensing restrictions or attribution requirements**.
- It is physically *inspired*, not a scientific simulation: disk turbulence, colour, and bloom are artistic choices.

## Reproducing

```
python -m pip install numpy pillow
python assets/gateway/render_blackhole.py assets/gateway
```

The render is deterministic (fixed seeds) apart from WebP encoder version differences.

## Fallbacks

The artwork is progressive enhancement. If it fails to load, the `<img>` hides itself and the gateway shows a CSS-only
black disc with a violet glow (`.gateway` background in `styles.css`). Enter Portfolio and Skip Intro never depend on it.
There is no video or other optional motion asset; the cinematic entry is a short Web Animations zoom of the still image.
