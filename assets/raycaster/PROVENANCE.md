# C++ Console Raycaster frame: provenance

| File | Use |
|---|---|
| `frame.txt` | The raw 120 × 40 characters, exactly as read from the console |
| `raycaster-frame-mono.webp` (1200 × 860) | Case-study hero: the frame as white text on black (current) |
| `raycaster-frame.webp` (1200 × 860) | The earlier violet-tinted render of the same frame; kept, no longer used |

## Origin

This is **real program output**, not an illustration. On October 19, 2026 the unmodified
[`Omar-Lyzkru/raycaster`](https://github.com/Omar-Lyzkru/raycaster) source at `e724b73` was built with MSYS2 UCRT64
g++ 14.2 (`g++ -std=c++17 -O2 "1st project/confpsbutbetter.cpp" -luser32 -static`) and run in a standalone `conhost`
window. No keys were pressed, so the frame shows the program's starting position (X=14.70, Y=5.09, A=0.00).

A small helper attached to that console and read its active screen buffer with `ReadConsoleOutputCharacterW`,
which produced `frame.txt`. The earlier image (`raycaster-frame.webp`) renders those characters unchanged in Consolas on the portfolio's dark
background. The violet color, font, and padding are presentation choices, not part of the program output.

## Monochrome render

`raycaster-frame-mono.webp` was produced for the site's grayscale identity: every character of `frame.txt` (120 × 40,
unmodified) is drawn in Consolas on an exact 9 × 20 px grid in off-white on black, and full-block characters fill their whole
cell as a console does. Only presentation (font, color, padding, cell grid) differs from the earlier render; no character was
changed. It was rendered with Pillow on Windows by a short throwaway script that is not committed.
