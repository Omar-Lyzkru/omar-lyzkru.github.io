# Omar Aguilar Portfolio

[Live portfolio](https://omar-lyzkru.github.io/) for a University of Houston Computer Science student, graduating May 2028 and seeking Summer 2027 software engineering internships and technical campus roles.

## Selected projects

The six projects appear in this order. PermitWatch is both the featured project and the first card in the grid.

1. **PermitWatch**: four-person CodeRED Orion team project and Environmental Track Winner. The app currently covers Houston-area permits. The case study describes Omar’s data integration and React/TypeScript frontend work. [Team repository](https://github.com/Abbas9x/permitwatch-houston).
2. **DurableKV**: C++20 persistent key-value storage engine on an append-only, CRC32C-checked binary log, with index reconstruction, incomplete-tail recovery, manual compaction, a static-library target, and deterministic failure-injection tests. Built with AI coding agents; Omar’s role was requirements, design approval, and testing. [Repository](https://github.com/Omar-Lyzkru/DurableKV).
3. **Calendar Intelligence Hub**: full-stack TypeScript (React, Express, PostgreSQL, Prisma) application that turns selected Gmail, Outlook, and Discord messages into reviewed Google Calendar events with deterministic extraction and duplicate-safe writes. Built with AI coding agents; Omar’s role was requirements, design approval, and workflow testing. It is a local development project: not deployed, not production-ready. [Repository](https://github.com/Omar-Lyzkru/calendar-intelligence-hub).
4. **Job Application Automation Platform**: AI-assisted Node.js/Playwright application, with product requirements, workflow safeguards, and review contribution explained.
5. **C++ Console Raycaster**: tutorial-guided Windows console project, with CMake and portable calculation tests.
6. **Persistent Task Tracker**: supporting JavaScript, HTML, and CSS project, with screenshots of the live app.

Each project opens a case study in the same cinematic showcase dialog, with a shareable URL:

| Project | URL |
|---|---|
| PermitWatch | `?project=permitwatch` |
| DurableKV | `?project=durablekv` |
| Calendar Intelligence Hub | `?project=calendar-intelligence-hub` |
| Job Application Automation Platform | `?project=job-automation` |
| C++ Console Raycaster | `?project=raycaster` |
| Persistent Task Tracker | `?project=task-tracker` |

Any other `project` value shows the ordinary portfolio and leaves the URL unchanged. Slugs are registered in one `routes` map in `app.js`, and every project goes through the same showcase coordinator (dialog, history, scroll, focus, Escape).

The DurableKV and Calendar Intelligence Hub case studies state what is verified and what is not. Test counts for those two projects (254 Linux / 247 Windows cases and 13 suites for DurableKV; 443 unit/API/UI, 227 PostgreSQL integration, and 29 Playwright tests for Calendar Intelligence Hub) are copied from each repository’s own documentation and are labeled as recorded results; this site’s build did not rerun them.

## Technical Toolkit

The **Technical Toolkit** (`toolkit.js`) links each technology to the projects that verifiably use it, with a short explanation and a source file or commit as evidence. It covers 19 technologies across the six projects, including C++, GNU Make, TypeScript, React, Node.js, Express, PostgreSQL, Prisma, Vitest, Playwright, and Linux. Technologies without a verified project use are left out (Python is on the résumé but in none of these projects), and there are no skill ratings. AI-assisted projects are labeled as such next to every association. Selecting a technology changes no URL or history; **View case study** opens the same showcase as the project card, and closing it returns focus and scroll to the Toolkit.

## Résumé

`Omar-Aguilar-Resume.pdf` is **Resume 16.3**. It was exported with Microsoft Word from the owner-supplied `Omar_Aguilar_Resume_16.3.docx` (SHA-256 `68e2a72d376e050edd04047b0054a233b3a05e8a2d7eecaf36ce345c5d47fd5f`). The only text change is the approved spelling “Permit Watch” → “PermitWatch”; the one-page layout and all six hyperlinks are unchanged. Site links use `?v=16.3` so a cached earlier version is not served. Project ownership and implementation context are in the case studies.

## Design and media

The site uses a dark violet identity (Manrope for the interface, JetBrains Mono for code and technical labels). The sections run in this order: a developer-first homepage that features PermitWatch, an equal-sized two-column project grid (one column on narrow screens), the Technical Toolkit, an About section (a biography beside an `omar.json` card, with no portrait), and a Contact finale lit by a violet horizon rather than a second black hole. The Pause motion control in the header and the operating-system reduced-motion setting share one motion policy.

Where each visual comes from:

- **PermitWatch**: screenshots of the actual public team demo (landing page captured October 14, 2026; results view captured October 17, 2026). They show the app’s own interface, including its own wordmark.
- **DurableKV**: the real terminal recording committed in the DurableKV repository, copied byte-for-byte. It shows data surviving process exit, not power loss or an operating-system crash. A still frame replaces the animation when motion is paused or reduced. See `assets/durablekv/PROVENANCE.md`.
- **Calendar Intelligence Hub**: the repository has no screenshots, so this project has none. Its card uses an illustrative character-based cover (like the Job card), and its case study uses a workflow diagram built from the repository README and source, labeled as an illustration, plus a verbatim code excerpt. No screenshot of a live provider session exists on this site.
- **Job Application Automation Platform**: an illustrative character-based cover, and a workflow diagram labeled as an illustration.
- **C++ Console Raycaster**: a real frame read from the running program (see `assets/raycaster/PROVENANCE.md`).
- **Persistent Task Tracker**: screenshots of the live app (see `assets/tracker/PROVENANCE.md`).
- **Entrance gateway**: original rendered artwork (see `assets/gateway/PROVENANCE.md`).

## Local preview

GitHub Pages serves the root files directly via `.nojekyll`. For local preview, run `python3 -m http.server 4173` from the repository root (`python -m http.server 4173` or `py -m http.server 4173` where `python3` is not installed) and open <http://localhost:4173/>. No dependencies or build step are needed, and the repository has no automated test suite; changes are checked by hand and with ad-hoc browser automation.
