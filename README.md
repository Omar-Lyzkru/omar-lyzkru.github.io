# Omar Aguilar Portfolio

[Live portfolio](https://omar-lyzkru.github.io/) for a University of Houston Computer Science student, graduating May 2028 and seeking Summer 2027 software engineering internships and technical campus roles.

## Lead projects

The home page features PermitWatch beside the introduction, and the main **Lead projects** grid shows exactly four projects, in this order:

1. **PermitWatch**: four-person CodeRED Orion team project and Environmental Track Winner. The app currently covers Houston-area permits. The case study describes Omar’s data integration and React/TypeScript frontend work. [Team repository](https://github.com/Abbas9x/permitwatch-houston).
2. **DurableKV**: C++20 persistent key-value storage engine on an append-only, CRC32C-checked binary log, with index reconstruction, incomplete-tail recovery, manual compaction, a static-library target, and deterministic failure-injection tests. Built with AI coding agents; Omar’s role was requirements, design approval, and testing. The demo shows data surviving process exit, not power-loss or crash durability. [Repository](https://github.com/Omar-Lyzkru/DurableKV).
3. **Calendar Intelligence Hub**: full-stack TypeScript (React, Express, PostgreSQL, Prisma) application that turns selected Gmail, Outlook, and Discord messages into reviewed Google Calendar events with deterministic extraction and duplicate-safe writes. Built with AI coding agents; Omar’s role was requirements, design approval, and workflow testing. It is a local development project: not deployed, not production-ready. [Repository](https://github.com/Omar-Lyzkru/calendar-intelligence-hub).
4. **Job Applier**: AI-assisted Node.js/Playwright application, with product requirements, workflow safeguards, and review contribution explained. Dry runs stop before Submit; no application was submitted for this portfolio. [Repository](https://github.com/Omar-Lyzkru/job-applier).

Below the grid, a compact **Supporting projects** list links to two smaller projects that keep their full case studies:

- **C++ Console Raycaster**: tutorial-guided Windows console project, with CMake and portable calculation tests.
- **Persistent Task Tracker**: supporting JavaScript, HTML, and CSS project, with screenshots of the live app.

Every project opens a case study in the same showcase dialog, with a shareable URL. All six routes work, including the two supporting projects, whose cards are no longer in the main grid:

| Project | Tier | URL |
|---|---|---|
| PermitWatch | Lead | `?project=permitwatch` |
| DurableKV | Lead | `?project=durablekv` |
| Calendar Intelligence Hub | Lead | `?project=calendar-intelligence-hub` |
| Job Applier | Lead | `?project=job-automation` (the slug is unchanged from the longer former title) |
| C++ Console Raycaster | Supporting | `?project=raycaster` |
| Persistent Task Tracker | Supporting | `?project=task-tracker` |

Any other `project` value shows the ordinary portfolio and leaves the URL unchanged. Slugs are registered in one `routes` map in `app.js`, and every project goes through the same showcase coordinator (dialog, history, scroll, focus, Escape). Each project record in `app.js` has a `tier` (`lead` or `supporting`) that labels the dialog (`LEAD PROJECT` / `SUPPORTING PROJECT`) and the Toolkit.

The DurableKV and Calendar Intelligence Hub case studies state what is verified and what is not. Test counts for those two projects (254 Linux / 247 Windows cases and 13 suites for DurableKV; 443 unit/API/UI, 227 PostgreSQL integration, and 29 Playwright tests for Calendar Intelligence Hub) are copied from each repository’s own documentation and are labeled as recorded results; this site’s build did not rerun them.

## Technical Toolkit

The **Technical Toolkit** (`toolkit.js`) links each technology to the projects that verifiably use it, with a short explanation and a source file or commit as evidence. It covers 19 technologies across all six projects (the four lead projects and the two supporting ones), including C++, GNU Make, TypeScript, React, Node.js, Express, PostgreSQL, Prisma, Vitest, Playwright, and Linux. Technologies without a verified project use are left out (Python is on the résumé but in none of these projects), and there are no skill ratings. Each association is labeled **Lead** or **Supporting** and with how the project was built (team, AI-assisted, tutorial-guided, personal). Selecting a technology changes no URL or history; **View case study** opens the same showcase as the project card, and closing it returns focus and scroll to the Toolkit.

## Résumé

`Omar-Aguilar-Resume.pdf` is **Resume 16.3**. It was exported with Microsoft Word from the owner-supplied `Omar_Aguilar_Resume_16.3.docx` (SHA-256 `68e2a72d376e050edd04047b0054a233b3a05e8a2d7eecaf36ce345c5d47fd5f`). The only text change is the approved spelling “Permit Watch” → “PermitWatch”; the one-page layout and all six hyperlinks are unchanged. Site links use `?v=16.3` so a cached earlier version is not served. Project ownership and implementation context are in the case studies.

## Design and media

**Monochrome ASCII identity.** Every site-authored color is black, white, or a neutral gray: the interface, borders, glows, the entrance scene, and the illustrative covers. The look is terminal-inspired (square corners, `[ bracket ]` and corner-mark framing, mono labels from JetBrains Mono, `>` and `_` markers) around readable body text in Manrope. All meaningful content is real, selectable DOM text; canvases only draw decoration. `tests/unit.test.mjs` scans the stylesheet, scripts, and HTML for any chromatic color so a violet accent cannot return quietly.

The sections run in this order: a developer-first homepage that features PermitWatch, the four lead projects plus the supporting list, the Technical Toolkit, an About section (a biography beside an `omar.json` card, with no portrait), and a Contact finale lit by a gray horizon rather than a second black hole.

**Animated ASCII entrance.** The entrance gateway is drawn live on a canvas with `fillText` (`blackhole.js`): a dark event horizon, a broad banded accretion disk that shears and drifts as time passes, thin lensing arcs and a photon ring, and drifting stars, all in grays. Pressing **Enter Portfolio** starts a 2.8-second inward journey (`journeyState()` in `blackhole.js`): the sampled field is magnified toward the hole with accelerating speed, twisted, and re-glyphed into radial streaks; the hole drifts to the middle of the screen, speed lines pour outward from the center, and the dialog dissolves into the portfolio. Nothing is a CSS zoom of an image. Skip Intro, Replay intro, Return to Portfolio, and Escape (which cancels a journey) all work, one journey at a time, and the render loop, observers, and canvas work are released when the gateway closes. The scene is an enhancement: if its module cannot load, a canvas context is missing, or the journey cannot start, a static character fallback is shown (or a short plain dissolve plays) and the visitor still reaches the portfolio. A device that renders frames slowly gets a coarser character grid rather than a stuttering one.

**Replaying the intro.** A **Replay intro** button sits in the header (an icon-only ↻ below 1100 px wide) and another in the footer, so the entrance can be watched as many times as you like. Replay returns focus to the button you used and works from any scroll position.

**Motion.** The Pause motion control (header and gateway) and the operating-system reduced-motion setting share one policy (`motion.js`). Either one shows a still character scene, makes Enter go straight to the portfolio, stops decorative animation (reveals, hover effects, the cursor blink, click bursts, the animated DurableKV recording), and settles a journey in progress. Replay honors the current setting.

**Interaction feedback.** Buttons, cards, Toolkit selections, and case-study controls have brief transitions (bracket marks that grow, a sliding marker, inverted buttons) and a short ASCII burst on click (`fx.js`). Case-study dialogs keep their card-to-dialog clip animation. None of it delays navigation, and all of it is skipped when motion is reduced.

**Sound.** Synthesized cues (`audio.js`, the browser’s own Web Audio API; no audio files or services) play only after a direct user action: button and card clicks (a tick over a low thump), Toolkit selection (a chime), opening and closing a case study (sweeps with a sub swell), copying the email address, and an entrance journey soundtrack (a rising sub rumble and growl, a rushing noise sweep, a shimmer of fifths, and a deep boom whose tail rings on over the portfolio). Everything goes through a small synthesized room reverb and a compressor so it is full without clipping; the cues are short except for the entrance. Nothing sounds on load, on a restored deep link, on Back/Forward, or on hover, and the audio context is not even created until the first cue after a real user gesture. A **Sound** button in the top-right corner of the header, and a matching one in the entrance gateway (the header is unavailable behind that modal), share one mute state for the life of the page. They are named “Mute sound effects”, expose the state with `aria-pressed` (true = muted), show it with a struck-through label, and have a 44 px hit area. The mute state is not stored across visits. If audio is unsupported or fails, the buttons are hidden or cues are silently dropped and nothing else changes.

Where each visual comes from. Genuine screenshots and recordings are documentary material and keep their original colors; they are not recolored or filtered:

- **PermitWatch**: screenshots of the actual public team demo (landing page captured October 14, 2026; results view captured October 17, 2026). They show the app’s own interface, including its own wordmark.
- **DurableKV**: the real terminal recording committed in the DurableKV repository, copied byte-for-byte. It shows data surviving process exit, not power loss or an operating-system crash. A still frame replaces the animation when motion is paused or reduced. See `assets/durablekv/PROVENANCE.md`.
- **Calendar Intelligence Hub**: the repository has no screenshots, so this project has none. Its card uses an illustrative character-based cover, and its case study uses a workflow diagram built from the repository README and source, labeled as an illustration, plus a verbatim code excerpt. No screenshot of a live provider session exists on this site.
- **Job Applier**: an illustrative character-based cover, and a workflow diagram labeled as an illustration.
- **C++ Console Raycaster**: a real frame read from the running program (see `assets/raycaster/PROVENANCE.md`), shown as white-on-black text (`raycaster-frame-mono.webp`, rendered from the unchanged `frame.txt`). The earlier violet render is kept as `raycaster-frame.webp` but is no longer used.
- **Persistent Task Tracker**: screenshots of the live app (see `assets/tracker/PROVENANCE.md`).
- **Entrance gateway**: generated live in the browser from character glyphs; it is an artistic rendering, not a simulation or a recording. The earlier still artwork in `assets/gateway/` is kept as legacy and unused (see `assets/gateway/PROVENANCE.md`).

## Local preview

GitHub Pages serves the root files directly via `.nojekyll`. For local preview, run `python3 -m http.server 4173` from the repository root (`python -m http.server 4173` or `py -m http.server 4173` where `python3` is not installed) and open <http://localhost:4173/>. The site itself needs no dependencies or build step. Fonts load from Google Fonts and fall back to system fonts offline.

## Tests

The `tests/` folder is a dev-only harness that is not part of the site and adds nothing to what GitHub Pages needs. It needs Node 20+ and Playwright:

```bash
cd tests
npm install                      # installs Playwright
npx playwright install           # downloads browser engines, if you do not have them yet
npm test                         # unit tests, then browser tests on every available engine
TEST_BROWSERS=chromium npm test  # or: chromium,firefox,webkit
node evidence.mjs                # optional: screenshots and rough timings into tests/.artifacts/evidence/
```

`tests/unit.test.mjs` runs without a browser: route classification, the motion policy, sound gating and mute, the ASCII field geometry (dark horizon, journey changes), grayscale-only styling, and the four-card showcase. `tests/browser.test.mjs` serves the repository with a small Node server and drives it in Chromium, Firefox, and WebKit: startup errors, the six deep links and invalid values, case-study open/close/Back/Forward/focus, the gateway lifecycle (Enter, Skip, Replay, Escape, repeated input, resource release), reduced motion and Pause (including mid-journey), canvas, module, Web Animations and audio failure, mute synchronization and gesture gating (with a recording fake `AudioContext`), keyboard access, responsive overflow, and authentic media captions. If the bundled Chromium does not match the installed Playwright, the tests fall back to the system Chrome.

Limits to know about: the tests do not judge visual quality (that is a human review), do not play real audio (`evidence.mjs` separately checks that the real Web Audio path raises no errors), and WebKit here means Playwright’s WebKit build, not Safari on a device.

Material limitations: the entrance draws several thousand to roughly thirty thousand characters per frame depending on screen size, which is light on a desktop but noticeable on slow hardware (a governor coarsens the grid when frames run long); it has not been tried on physical mobile devices; and the cinematic entrance is deliberately skipped when motion is reduced.
