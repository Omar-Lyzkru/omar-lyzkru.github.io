#!/usr/bin/env python3
"""Renders the static black-hole artwork used by the entrance gateway.

Original work, written for this portfolio. No third-party imagery, textures, or code is used.

Physics (units G = c = M = 1, Schwarzschild black hole, event horizon r = 2, photon-capture impact parameter 3*sqrt(3)):
  * Light rays follow the null geodesic orbit equation  u'' + u = 3u^2  with  u = 1/r  and  phi the in-plane angle.
    The deflection is integrated numerically once per impact parameter b and stored in a table.
  * A thin, geometrically flat accretion disk lies in the equatorial plane from the ISCO (r = 6) outward. Each ray's
    equatorial crossings (the direct image and the lensed images that wrap over the shadow) are found from the ray plane.
  * Disk temperature follows the Novikov-Thorne r^(-3/4) profile; the observed brightness includes the combined
    gravitational and Doppler shift  g = sqrt(1 - 3/r) / (1 + Omega * L_z)  (approaching side brighter).
  * Violet tone-mapping, a soft bloom, and a sparse star field are artistic choices on top of the physical model.

Requires numpy and Pillow. Usage:  python render_blackhole.py <output-dir>
Writes gateway-wide.webp and gateway-tall.webp.
"""
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

B_CRIT = 3 * math.sqrt(3)
R_ISCO, R_OUT = 6.0, 17.0
D_PHI = 0.004
PHI_MAX = 4.2 * math.pi


def build_table():
    """u(phi; b) for a dense, critical-weighted grid of impact parameters."""
    near = B_CRIT + np.geomspace(1e-4, 1.0, 1400) * 6.0
    far = np.linspace(B_CRIT + 6.0, 90.0, 900)
    inner = B_CRIT - np.geomspace(1e-4, 1.0, 700)[::-1] * (B_CRIT - 0.05)
    b = np.unique(np.concatenate([inner, near, far]))
    steps = int(PHI_MAX / D_PHI) + 2
    u = np.zeros_like(b)
    v = 1.0 / b  # du/dphi at the observer
    table = np.empty((steps, b.size), dtype=np.float32)
    dead = np.zeros(b.size, dtype=bool)
    gone = np.zeros(b.size, dtype=bool)  # escaped to infinity: the orbit equation must not be continued past u = 0

    def f(u_, v_):
        return v_, -u_ + 3.0 * u_ * u_

    for i in range(steps):
        # Finite sentinels: captured rays stay "inside the horizon" (1e3); escaped rays stay at infinity (0).
        table[i] = np.where(dead, 1e3, np.where(gone, 0.0, u))
        k1u, k1v = f(u, v)
        k2u, k2v = f(u + 0.5 * D_PHI * k1u, v + 0.5 * D_PHI * k1v)
        k3u, k3v = f(u + 0.5 * D_PHI * k2u, v + 0.5 * D_PHI * k2v)
        k4u, k4v = f(u + D_PHI * k3u, v + D_PHI * k3v)
        u = u + D_PHI / 6.0 * (k1u + 2 * k2u + 2 * k3u + k4u)
        v = v + D_PHI / 6.0 * (k1v + 2 * k2v + 2 * k3v + k4v)
        newly = u > 0.5  # inside the horizon: captured
        dead |= newly
        gone |= (u < 0.0) & ~dead
        u = np.where(dead | gone, 0.0, u)
        v = np.where(dead | gone, 0.0, v)
    return b, table


PALETTE = np.array([
    [0.00, 4, 2, 14],
    [0.18, 38, 14, 92],
    [0.38, 104, 52, 190],
    [0.60, 176, 128, 246],
    [0.82, 232, 212, 255],
    [1.00, 255, 252, 255],
], dtype=np.float32)


def palette(q):
    q = np.clip(q, 0.0, 1.0)
    out = np.empty(q.shape + (3,), dtype=np.float32)
    for c in range(3):
        out[..., c] = np.interp(q, PALETTE[:, 0], PALETTE[:, c + 1])
    return out / 255.0


def render(width, height, cx, cy, scale, theta_deg, ssaa, seed):
    rng = np.random.default_rng(seed)
    b_grid, table = build_table()
    theta = math.radians(theta_deg)
    s0, c0 = math.sin(theta), math.cos(theta)
    W, H = width * ssaa, height * ssaa
    img = np.zeros((H, W, 3), dtype=np.float32)

    # Soft violet nebula wash behind everything.
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dx, dy = (xx / ssaa - cx) / scale, (yy / ssaa - cy) / scale
    rr = np.sqrt(dx * dx + dy * dy)
    wash = np.exp(-(rr / 34.0) ** 1.5)
    img += wash[..., None] * np.array([0.030, 0.013, 0.074], dtype=np.float32)
    img += np.exp(-(rr / 11.0) ** 1.2)[..., None] * np.array([0.020, 0.008, 0.050], dtype=np.float32)

    chunk = 400_000
    flat = np.arange(H * W)
    out = img.reshape(-1, 3)
    for start in range(0, flat.size, chunk):
        idx = flat[start:start + chunk]
        py, px = idx // W, idx % W
        X = ((px + 0.5) / ssaa - cx) / scale
        Y = -((py + 0.5) / ssaa - cy) / scale  # image y points up
        b = np.hypot(X, Y)
        b = np.maximum(b, 1e-3)
        lz = X * s0  # L_z / E for this ray
        phi0 = np.arctan2(-c0 * b, Y * s0)
        phi0 = np.mod(phi0, math.pi)
        bi = np.clip(np.searchsorted(b_grid, b) - 1, 0, b_grid.size - 2)
        bw = np.clip((b - b_grid[bi]) / (b_grid[bi + 1] - b_grid[bi]), 0, 1)
        rgb = np.zeros((idx.size, 3), dtype=np.float32)
        transmit = np.ones(idx.size, dtype=np.float32)
        for k in range(4):
            phi = phi0 + k * math.pi
            valid = phi < PHI_MAX - 3 * D_PHI
            fj = np.clip(phi / D_PHI, 0, table.shape[0] - 2)
            j = fj.astype(np.int64)
            jw = (fj - j).astype(np.float32)
            u00, u01 = table[j, bi], table[j, bi + 1]
            u10, u11 = table[j + 1, bi], table[j + 1, bi + 1]
            u = (u00 * (1 - bw) + u01 * bw) * (1 - jw) + (u10 * (1 - bw) + u11 * bw) * jw
            with np.errstate(divide="ignore", invalid="ignore"):
                r = np.where((u > 1e-4) & (u < 0.5), 1.0 / u, np.inf)
            hit = valid & (r >= R_ISCO) & (r <= R_OUT)
            if not hit.any():
                continue
            rh = np.where(hit, r, 10.0).astype(np.float32)
            omega = rh ** -1.5
            g = np.sqrt(np.maximum(1 - 3.0 / rh, 1e-4)) / (1.0 + omega * lz)
            temp = (rh / R_ISCO) ** -0.75 * np.maximum(1 - np.sqrt(R_ISCO / rh), 0) ** 0.25 * 1.9
            # Disk azimuth at the crossing, for streaky turbulence in the emission.
            sphi, cphi = np.sin(phi), np.cos(phi)
            px_, py_ = rh * (cphi * s0 - sphi * Y * c0 / b), rh * sphi * X / b
            psi = np.arctan2(py_, px_)
            turb = (1.0
                    + 0.20 * np.sin(psi * 7 + np.log(rh) * 9)
                    + 0.14 * np.sin(psi * 19 - np.log(rh) * 21 + 1.3)
                    + 0.10 * np.sin(rh * 3.1 + psi * 3))
            ring = 1.0 + 0.16 * np.sin(rh * 2.4) + 0.09 * np.sin(rh * 7.3)
            observed = g * temp
            level = np.clip(observed, 0, None) ** 3.2 * turb * ring
            edge = np.clip((R_OUT - rh) / 7.0, 0, 1) ** 1.3  # fade the outer disk
            level = level * edge * 1.15
            q = np.clip(observed * 0.78, 0, 1.2)
            color = palette(q) * level[..., None]
            alpha = np.where(hit, 0.80, 0.0).astype(np.float32)
            rgb += (transmit * alpha)[..., None] * color
            transmit = transmit * (1 - alpha)
        out[idx] = out[idx] * transmit[..., None] + rgb
        # Event horizon shadow: captured rays contribute no background light.
        shadow = b < B_CRIT * 0.985
        out[idx[shadow]] = out[idx[shadow]] * 0.0 + rgb[shadow]

    # Sparse stars (kept out of the shadow).
    n_stars = int(W * H / (ssaa * ssaa) / 2600)
    sx = rng.integers(0, W, n_stars)
    sy = rng.integers(0, H, n_stars)
    sr = np.hypot((sx / ssaa - cx), (sy / ssaa - cy)) / scale
    keep = sr > B_CRIT * 1.15
    sx, sy = sx[keep], sy[keep]
    mag = rng.pareto(2.6, sx.size).astype(np.float32) * 0.28 + 0.10
    tint = rng.uniform(0, 1, sx.size).astype(np.float32)
    star = np.stack([0.80 + 0.2 * tint, 0.78 + 0.1 * tint, 1.0 - 0.05 * tint], axis=1)
    np.add.at(img, (sy, sx), np.clip(mag, 0, 1.4)[:, None] * star)

    # Tone map (filmic-ish), bloom, light grain.
    img = img * 1.35
    img = img / (1.0 + img * 0.55)
    img = np.clip(img, 0, 1) ** (1 / 1.12)
    pil = Image.fromarray((img * 255).astype(np.uint8)).resize((width, height), Image.LANCZOS)
    bloom = pil.filter(ImageFilter.GaussianBlur(width * 0.011))
    bloom2 = pil.filter(ImageFilter.GaussianBlur(width * 0.035))
    a = np.asarray(pil).astype(np.float32) / 255
    b1 = np.asarray(bloom).astype(np.float32) / 255
    b2 = np.asarray(bloom2).astype(np.float32) / 255
    mix = 1 - (1 - a) * (1 - b1 * 0.55) * (1 - b2 * 0.45)
    grain = rng.normal(0, 0.006, mix.shape[:2]).astype(np.float32)[..., None]
    mix = np.clip(mix + grain, 0, 1)
    return Image.fromarray((mix * 255 + 0.5).astype(np.uint8))


def main():
    out = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    out.mkdir(parents=True, exist_ok=True)
    # Wide: the hole sits right of centre so the copy has room on the left.
    wide = render(1920, 1080, cx=1920 * 0.64, cy=1080 * 0.50, scale=31.0, theta_deg=80, ssaa=2, seed=7)
    wide.save(out / "gateway-wide.webp", quality=86, method=6)
    # Tall: the hole sits in the upper half so the copy stacks beneath it on narrow screens.
    tall = render(900, 1400, cx=900 * 0.50, cy=1400 * 0.30, scale=21.0, theta_deg=80, ssaa=2, seed=11)
    tall.save(out / "gateway-tall.webp", quality=86, method=6)


if __name__ == "__main__":
    main()
