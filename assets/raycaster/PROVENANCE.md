# C++ Console Raycaster frame: provenance

| File | Use |
|---|---|
| `frame.txt` | The raw 120 × 40 characters, exactly as read from the console |
| `raycaster-frame.webp` (1200 × 860) | Project card and case-study hero |

## Origin

This is **real program output**, not an illustration. On October 19, 2026 the unmodified
[`Omar-Lyzkru/raycaster`](https://github.com/Omar-Lyzkru/raycaster) source at `e724b73` was built with MSYS2 UCRT64
g++ 14.2 (`g++ -std=c++17 -O2 "1st project/confpsbutbetter.cpp" -luser32 -static`) and run in a standalone `conhost`
window. No keys were pressed, so the frame shows the program's starting position (X=14.70, Y=5.09, A=0.00).

A small helper attached to that console and read its active screen buffer with `ReadConsoleOutputCharacterW`,
which produced `frame.txt`. The image renders those characters unchanged in Consolas on the portfolio's dark
background. The violet color, font, and padding are presentation choices, not part of the program output.
