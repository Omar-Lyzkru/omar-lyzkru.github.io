# DurableKV terminal demo: provenance

| File | Use |
|---|---|
| `persistence-demo.gif` (790 × 448) | Case-study hero, played while motion is allowed |
| `persistence-demo-final.webp` (790 × 448) | The same recording's last frame, shown instead of the GIF when motion is paused or reduced |
| `persistence-demo-card.webp` (790 × 494) | Project-card image: the last frame centered on a canvas filled with the terminal's own background color, so the 16:10 card never crops the text |

## Origin

`persistence-demo.gif` is a **byte-identical copy** of `docs/images/persistence-demo.gif` in
[`Omar-Lyzkru/DurableKV`](https://github.com/Omar-Lyzkru/DurableKV) at `2929e53` (added in that commit, October 21, 2026).
SHA-256: `c7f32bc0c52af2d3ec74d524d2ca1ed4ca68238c90f69d097bd0d6749205585e`. It was recorded by the DurableKV repository, not by
this portfolio. That repository's README describes it as real terminal output from `examples/persistence_demo.cpp`, which uses
only the public `durablekv::Storage` API, recorded on Ubuntu 24.04 under WSL2 (ext4, g++ 13).

The two WebP files were produced from the GIF's final frame (frame 391 of 391) with Pillow. The only change to the card image
is the added background-colored margin above and below the frame; no characters were altered.

## What it shows, and what it does not

- **Shows:** one process creates a database, puts a value, reads it back, and exits. A second, separately launched process
  (different process ID) opens the same file with `Storage(path)` and reads the same value without writing it.
- **Does not show:** survival of a power loss or an operating-system crash, compaction, recovery of an incomplete tail,
  concurrency, or performance. The DurableKV README states the same limit.

The recording contains no usernames, hostnames, or personal paths: its only path is a throwaway `mktemp` directory under `/tmp`.
