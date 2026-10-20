import { drawProjectArt } from './blackhole.js';
import { createMotionPolicy } from './motion.js';
import { classifyProjectRoute } from './route.js';
import { createEntrySession } from './session.js';

const kinds = { job: 'server' }; // the other cards show genuine captures; the Job card keeps its illustrative cover
document.querySelectorAll('[data-art]').forEach(canvas => drawProjectArt(canvas, kinds[canvas.dataset.art]));
// One effective motion policy (manual Pause OR system reduced motion) lives in motion.js. The header Pause control and the
// data-motion attribute (which scopes decorative CSS motion) only consume it; nothing in the homepage owns preference state.
const motion = createMotionPolicy();
const systemReduced = () => motion.systemReduced;
function updateMotion(effectivePaused = motion.reduced) {
  document.documentElement.dataset.motion = effectivePaused ? 'reduced' : 'full';
  const button = document.querySelector('#motion-toggle');
  button.disabled = systemReduced();
  button.setAttribute('aria-pressed', String(effectivePaused));
  button.setAttribute('aria-label', systemReduced() ? 'Reduced motion' : motion.manualPaused ? 'Resume motion' : 'Pause motion');
  document.querySelector('#motion-label').textContent = systemReduced() ? 'Reduced motion' : motion.manualPaused ? 'Resume motion' : 'Pause motion';
  document.querySelector('#motion-icon').textContent = effectivePaused ? '▷' : 'Ⅱ';
}
motion.subscribe(updateMotion);
document.querySelector('#motion-toggle').addEventListener('click', () => motion.toggleManualPaused());
updateMotion();

const projects = {
  "permit": {
    "number": "01",
    "category": "ENVIRONMENTAL DATA / FOUR-PERSON TEAM PROJECT",
    "title": "PermitWatch Houston",
    "summary": "A bilingual English/Spanish web app for exploring TCEQ and EPA environmental permits near a Houston address or ZIP code, built by a four-person team for CodeRED Orion at the University of Houston.",
    "tags": [
      "React",
      "TypeScript",
      "Node.js",
      "Express",
      "SQLite",
      "MapLibre GL"
    ],
    "metrics": [
      [
        "807",
        "validated permits · source snapshot"
      ],
      [
        "1–10 mi",
        "search radius"
      ],
      [
        "4",
        "permit categories"
      ]
    ],
    "showcase": {
      "recognition": ["Team achievement", "Environmental Track Winner · CodeRED Orion"],
      "hero": {
        "src": "assets/permitwatch-results.jpg",
        "width": 1440,
        "height": 900,
        "alt": "PermitWatch Houston results for 5303 S Lake Houston Pkwy: a dark map with a three-mile boundary and colored permit markers, a search-distance slider, category and status filters, and counts of 18 permits across four categories.",
        "caption": "Results for 5303 S Lake Houston Pkwy within 3 miles: 18 permits across all four categories. Screenshot of the public demo, captured October 17, 2026."
      },
      "sections": [
        {
          "id": "problem",
          "title": "The Problem",
          "paragraphs": [
            "Houston-region permit records are spread across official sources. PermitWatch brings them into a searchable map so people can explore nearby authorizations and follow the source records for details.",
            "It covers four categories from TCEQ and EPA data: concrete batch plants, industrial air permits, wastewater discharge, and solid waste. It shows what is listed, its status, and where to check the official record. It does not measure pollution or assess health impact."
          ]
        },
        {
          "id": "product",
          "title": "The Product",
          "paragraphs": ["A resident searches an address or ZIP code, and the map answers two questions: what is permitted nearby, and where is the official record? The interface is available in English and Spanish, in dark and light appearances."],
          "steps": [
            ["Search a location", "Enter a Houston address or ZIP code. The map centers on it and marks it with a circular location marker."],
            ["Choose a distance", "Pick 1–10 miles (default 3). One distance drives the map boundary, markers, results, category counts, and listed capacity, and it survives refresh and shared links."],
            ["Narrow the results", "Filter by permit category and status. Permits at identical coordinates get separate selectable icons."],
            ["Check the source", "Open a permit for its source details and official links. Missing facts read “Not listed in source – check official record,” and comment deadlines appear only when the official record lists one. Residents can edit a concerns draft; PermitWatch never submits it."]
          ],
          "figure": {
            "src": "assets/permitwatch-preview.jpg",
            "width": 1265,
            "height": 712,
            "alt": "PermitWatch Houston landing page with an address or ZIP code search field, example searches, and a note that permit limits are not measured pollution.",
            "caption": "Landing page: search by address or ZIP code. Screenshot of the public demo, captured October 14, 2026."
          }
        },
        {
          "id": "engineering",
          "title": "Engineering & Contributions",
          "paragraphs": ["Four people built PermitWatch. “Team” describes the shared system. “My contribution” lists changes I implemented and committed in the team repository, linked to the commits."],
          "items": [
            {
              "title": "Dataset integration, validation, and provenance",
              "challenge": "Permit facts come from different official systems, TCEQ air and solid-waste records and EPA ECHO wastewater data, with different fields, statuses, and coordinate quality.",
              "team": "Each source is normalized into one permit schema and validated before publishing: stable IDs, supported category, coordinates, official HTTPS provenance, and duplicates. Excluded rows are recorded in an audit file, and publication requires all four categories.",
              "mine": "I implemented the expansion of the published dataset from 213 to 807 validated records, adding 559 EPA wastewater and 35 TCEQ solid-waste permits (594 total). That included the wastewater and solid-waste collectors and normalizers, updates to the publication step, and the verification report that documents exclusions, for example 559 accepted of 1,513 downloaded wastewater rows.",
              "evidence": [["c27bc23", "commit/c27bc23"], ["Verification report", "blob/main/docs/multi-permit-verification.md"]]
            },
            {
              "title": "URL-preserved radius search and frontend state",
              "challenge": "A search should be shareable and survive a refresh, and one distance setting has to stay consistent across the map boundary, markers, result list, counts, and capacity totals.",
              "team": "Search state (address, coordinates, radius, filters, and selected permit) is carried in the URL by a small History API router, so a link or refresh reproduces the same view.",
              "mine": "I implemented the adjustable 1–10 mile radius search (default 3 miles): the slider, URL preservation, and the shared radius used by the API and map, with tests for geometry, routing, the search API, and the browser. I also implemented persistent dark and light appearances with matching map styling.",
              "evidence": [["0c5cd72", "commit/0c5cd72"], ["1ac7082", "commit/1ac7082"]]
            },
            {
              "title": "Map and UI reliability with regression tests",
              "challenge": "Several permits can share one point, and drafts and panels have to keep working as the layout changes between desktop and narrow screens.",
              "team": "Permits at identical coordinates render as separate selectable icons, and screen offsets never change source coordinates or distances. Browser tests run the real map canvas against a temporary database, offline address fixtures, and a local map style, so external services do not affect results.",
              "mine": "I implemented the separate selectable markers for shared coordinates and the restored concerns drafting, with unit and browser tests. I also fixed concerns drafts being lost across responsive panel changes and added browser regression coverage.",
              "evidence": [["c734368", "commit/c734368"], ["8e9438b", "commit/8e9438b"]]
            }
          ]
        },
        {
          "id": "outcome",
          "title": "Outcome & Lessons",
          "outcomes": [
            "The team received the Environmental Track Winner award at CodeRED Orion, University of Houston.",
            "The public demo and the source repository are both live.",
            "The published snapshot holds 807 validated permits across four categories, each with an official source link.",
            "For the documented demo location, 5303 S Lake Houston Pkwy at 3 miles, the app returns 18 permits across all four categories.",
            "The repository includes unit, API, component, and Playwright browser tests."
          ],
          "limits": [
            "The 807-record dataset is a source-scoped snapshot, not a complete inventory of Houston permits.",
            "Permit limits are not measured pollution, and proximity does not establish a health impact.",
            "An effective or issued authorization does not show that a facility is operating today, and coordinates are official representative points, not surveyed parcel boundaries.",
            "Comment deadlines appear only when the official record lists one. None of the 807 records in the October 11, 2026 snapshot lists a current deadline."
          ],
          "lessonsTitle": "What I practiced",
          "lessons": "This project connected TypeScript and React UI state with geospatial data, database-backed APIs, and regression testing. Team collaboration also gave me practice reviewing changes and tracing frontend behavior across screen sizes."
        }
      ]
    },
    "repo": "https://github.com/Abbas9x/permitwatch-houston",
    "repoLabel": "View team source on GitHub",
    "demo":"https://permitwatch-houston.onrender.com/",
    "source": "TEAM PROJECT · Environmental Track Winner"
  },
  "job": {
    "number": "02",
    "category": "AUTOMATION & TOOLING / AI-ASSISTED PROJECT",
    "title": "Job Application Automation Platform",
    "summary": "A local application for job filtering, supported application-form automation, saved answers, and application history.",
    "tags": [
      "JavaScript",
      "Node.js",
      "Playwright",
      "HTML & CSS",
      "JSON file persistence"
    ],
    "metrics": [
      [
        "Local",
        "loopback-only dashboard"
      ],
      [
        "Dry run",
        "stops before Submit"
      ],
      [
        "2 suites",
        "unit/API & browser fixtures"
      ]
    ],
    "showcase": {
      "recognition": ["How it was built", "AI-assisted development · my requirements, direction & review"],
      "hero": {
        "flow": [
          ["Saved settings and explicit answers", ""],
          ["Search and filter jobs", "Keyword rules, or an opt-in fit ranking"],
          ["Inspect a supported form", "Unknown question → stops as “Needs answer”"],
          ["Fill and verify answers", "Dry run → stops at review, nothing submitted"],
          ["Reserve the attempt, then Submit", "Interrupted → recorded, never resumed automatically"],
          ["Record the outcome", "“Submitted” only when confirmation is observed"]
        ],
        "label": "Application workflow",
        "caption": "Workflow diagram based on the repository README. It is an illustration, not a screenshot of the app."
      },
      "sections": [
        {
          "id": "goal",
          "title": "The Goal",
          "paragraphs": [
            "Repeated forms and scattered application records make a job search difficult to track. The goal is a local workflow for finding relevant roles, handling supported forms, and keeping saved answers and application outcomes together.",
            "It runs on my own computer: a dashboard in the browser, a local Node.js server, and a separate Playwright-controlled browser session. Settings, answers, and history are JSON files kept out of Git."
          ]
        },
        {
          "id": "workflow",
          "title": "The Workflow",
          "paragraphs": ["The safety rules matter more than the speed. Whenever the app is unsure, it stops and asks instead of guessing."],
          "steps": [
            ["Configure the search", "Job titles, location, experience levels, and include/exclude keywords. An optional fit score ranks a bounded scan with a published rubric. It is a ranking, not a hiring probability."],
            ["Dry run first", "With Dry run on, supported forms are filled and stopped at review. Nothing is submitted, and the result reads “Ready — dry run.”"],
            ["Answer explicitly", "Screening answers come only from answers saved in the dashboard. The résumé is never used to guess them, and unknown wording stops the application as “Needs answer.”"],
            ["Review the outcome", "History separates Submitted, Unconfirmed, Interrupted, Needs answer, and Skipped. Blocked work waits for an explicit retry."]
          ]
        },
        {
          "id": "engineering",
          "title": "Engineering & My Role",
          "paragraphs": ["The items below describe what the AI-assisted code does. My own role is stated once, after them, rather than claimed item by item."],
          "items": [
            {
              "title": "No double submissions",
              "challenge": "A crash or a Stop in the middle of an application must never lead to a second submission.",
              "body": "Each application is saved before inspecting or filling, and an attempt is reserved before Submit. After a restart, unfinished work becomes Interrupted and a reserved submission becomes Unconfirmed. Neither resumes automatically, and Submit is never retried automatically.",
              "evidence": [["application-lifecycle.mjs", "blob/main/src/application-lifecycle.mjs"], ["runner.mjs", "blob/main/src/runner.mjs"]]
            },
            {
              "title": "Private, local data",
              "challenge": "Profile details, saved answers, and a signed-in browser session are sensitive.",
              "body": "The server listens only on 127.0.0.1 and rejects cross-origin requests. Personal data stays in a data folder that Git ignores. Failure snapshots keep fixed codes and timings, not form values, employer text, cookies, or screenshots.",
              "evidence": [["server.mjs", "blob/main/src/server.mjs"], ["failure-snapshots.mjs", "blob/main/src/failure-snapshots.mjs"]]
            },
            {
              "title": "Verification without live submissions",
              "challenge": "Real application forms cannot serve as a test suite.",
              "body": "Unit and API tests run on Node.js’s built-in test runner. A separate Playwright suite drives the dashboard against local fixture forms. It never contacts the live site or submits a real application.",
              "evidence": [["Tests", "tree/main/test"], ["test-browser.mjs", "blob/main/scripts/test-browser.mjs"]]
            }
          ],
          "note": ["MY ROLE", "I defined the product requirements and the workflow and safety behavior, directed iterative AI-assisted development, reviewed the results, and requested fixes. Most implementation code was AI-generated under my direction."]
        },
        {
          "id": "outcome",
          "title": "Outcome & Limits",
          "outcomes": [
            "Application records distinguish blocked, interrupted, unconfirmed, and submitted work, and the dashboard lists everything that needs attention.",
            "Unknown questions stop the workflow instead of being answered by guesswork.",
            "Duplicate protection, interrupted-work recovery, and explicit retries keep the workflow predictable.",
            "Unit/API tests and a synthetic browser suite exercise the supported behavior."
          ],
          "limits": [
            "Only supported forms on English-language screens are handled. Applications on company websites need manual completion.",
            "Live layouts change, and fixture tests cannot establish support for every live form, so some applications still need manual completion.",
            "It is a personal tool that runs locally on Linux (on Windows, through WSL2), not a hosted service.",
            "Because the work is AI-assisted, the repository does not show that I wrote every subsystem or test."
          ],
          "lessonsTitle": "What I’m learning",
          "lessons": "I’m strengthening my understanding of JavaScript/Node.js workflows and independent debugging. I use unit/API and synthetic browser tests to investigate failures and verify changes in supported application workflows."
        }
      ]
    },
    "repo": "https://github.com/Omar-Lyzkru/job-applier",
    "repoLabel": "View source on GitHub",
    "source": "AI-ASSISTED · PRODUCT DIRECTION & REVIEW"
  },
  "raycaster": {
    "number": "03",
    "category": "CONSOLE RENDERING / TUTORIAL-GUIDED PROJECT",
    "title": "C++ Console Raycaster",
    "summary": "A first-person C++ raycaster that renders a character-based scene using the Windows Console API.",
    "tags": [
      "C++17",
      "Windows Console API",
      "CMake",
      "CTest"
    ],
    "metrics": [
      [
        "120×40",
        "character frame"
      ],
      [
        "45°",
        "field of view"
      ],
      [
        "5",
        "portable test groups"
      ]
    ],
    "showcase": {
      "recognition": ["How it was built", "Tutorial-guided · followed a YouTube programming tutorial"],
      "hero": {
        "src": "assets/raycaster/raycaster-frame.webp",
        "width": 1200,
        "height": 860,
        "alt": "One frame of the C++ Console Raycaster drawn in characters: a status line reading X=14.70 Y=5.09 A=0.00 FPS=62.4, the 16 by 16 map overlay with the player marked P, solid block-character walls whose height depends on distance, blank gaps at detected tile edges, and rows of x and # characters shading the floor.",
        "caption": "Real output: one frame read from the running Windows renderer’s console screen buffer at its starting position, October 19, 2026. The characters are unchanged; the font and violet color are presentation."
      },
      "sections": [
        {
          "id": "question",
          "title": "The Question",
          "paragraphs": [
            "How can a two-dimensional map become a first-person view in a character console? This project was a way to work through rendering, movement, and collision handling in C++.",
            "I built it by following a YouTube programming tutorial. The rendering approach comes from that tutorial, not from me; implementing it is how I learned how the pieces fit together."
          ]
        },
        {
          "id": "rendering",
          "title": "How a Frame Is Drawn",
          "steps": [
            ["Cast a ray per column", "Each of the 120 columns casts a ray across a 45° field of view. It advances in fixed 0.1-unit steps until it reaches a wall, the map edge, or the 16-unit limit."],
            ["Correct the distance", "Projection uses the perpendicular distance, so a straight wall stays straight instead of bowing into a fish-eye curve."],
            ["Shade by distance", "Closer walls are taller and use denser blocks (█ ▓ ▒ ░). Floor rows fade from # to x, ., and -. A ray that lands on a tile corner is left blank, which outlines wall edges."],
            ["Move with elapsed time", "W and S move, A and D turn. Movement scales with frame time, is checked in small steps along each axis, and slides along walls instead of passing through them."]
          ]
        },
        {
          "id": "code",
          "title": "Code & Tests",
          "paragraphs": ["The repository separates the Windows-only program from calculations that can be built and tested anywhere."],
          "items": [
            {
              "title": "Interactive Windows renderer",
              "body": "confpsbutbetter.cpp creates a 120×40 console screen buffer, polls the keyboard, targets 60 frames per second, and writes each frame one 120-character row at a time, checking every write. Escape or a handled error restores the previous console.",
              "evidence": [["confpsbutbetter.cpp", "blob/main/1st%20project/confpsbutbetter.cpp"]]
            },
            {
              "title": "Portable calculations and tests",
              "body": "raycaster_core.h holds map lookup, movement, ray casting, and projection. Five CTest groups (coordinates, bounds, collision, projection, and rays) check them on Windows, Linux, and macOS without a console.",
              "evidence": [["raycaster_core.h", "blob/main/1st%20project/raycaster_core.h"], ["raycaster_tests.cpp", "blob/main/tests/raycaster_tests.cpp"]]
            }
          ],
          "code": ["Excerpt from raycaster_core.h: fish-eye correction", "inline float projectedDistance(float distance, float rayAngle, float playerAngle) {\n    // Perpendicular depth keeps a straight wall straight across the view.\n    return std::max(0.1f, distance * std::cos(rayAngle - playerAngle));\n}"]
        },
        {
          "id": "outcome",
          "title": "Outcome & Limits",
          "outcomes": [
            "The renderer draws a 120×40 character scene with distance-based wall and floor shading, a map overlay with the player marker, and a status line with position, angle, and FPS.",
            "The current repository builds with CMake and includes portable movement and ray-calculation regression tests."
          ],
          "limits": [
            "The interactive renderer is Windows-only; on other platforms CMake builds just the tests.",
            "Rays use fixed-size steps rather than a grid-traversal algorithm, and the player is treated as a point for collision.",
            "There are no textures, enemies, or map files. It is a learning project, not a game engine.",
            "Keys are polled globally, so they can affect the program while another window has focus."
          ],
          "lessonsTitle": "What I learned",
          "lessons": "Working through the tutorial helped me connect C++ loops, trigonometry, elapsed-time movement, collision checks, and console output. I’m also practicing CMake builds and regression testing around the renderer’s calculations."
        }
      ]
    },
    "repo": "https://github.com/Omar-Lyzkru/raycaster",
    "repoLabel": "View source on GitHub",
    "source": "TUTORIAL-GUIDED · C++ PRACTICE"
  },
  "tracker": {
    "number": "04",
    "category": "FRONTEND DEVELOPMENT / SUPPORTING PROJECT",
    "title": "Persistent Task Tracker",
    "summary": "A small browser task manager with filtering, inline editing, keyboard interactions, and saved state.",
    "tags": [
      "JavaScript",
      "HTML",
      "CSS",
      "localStorage",
      "GitHub Pages"
    ],
    "metrics": [
      [
        "3",
        "filter views"
      ],
      [
        "Saved",
        "between visits"
      ],
      [
        "0",
        "frameworks or build steps"
      ]
    ],
    "showcase": {
      "recognition": ["How it was built", "Personal project · vanilla JavaScript practice"],
      "hero": {
        "src": "assets/tracker/tracker-tasks.webp",
        "width": 1440,
        "height": 900,
        "alt": "Tiny Task Tracker with four sample tasks, two active and two completed with strikethrough, the All filter selected, and a counter reading 2 tasks left.",
        "caption": "The live GitHub Pages app with sample tasks entered for this capture, October 19, 2026."
      },
      "sections": [
        {
          "id": "features",
          "title": "What It Does",
          "paragraphs": ["A task list that keeps its state after a refresh, with everyday edits that work from the keyboard."],
          "steps": [
            ["Add", "Type a task and press Enter or Add Task. Empty tasks are rejected, and tasks are limited to 120 characters."],
            ["Complete and delete", "A checkbox moves a task between active and completed, and Delete removes it."],
            ["Edit inline", "Edit swaps the label for a text field. Enter saves, Escape cancels, and an empty edit is refused."],
            ["Filter and count", "All, Active, and Completed filters, with a live count of the tasks left."]
          ],
          "figure": {
            "src": "assets/tracker/tracker-inline-edit.webp",
            "width": 1440,
            "height": 900,
            "alt": "Inline editing in Tiny Task Tracker: the Active filter is selected, and the first task’s label has become a focused text field with its text selected and a Save button beside it.",
            "caption": "Inline editing under the Active filter, from the same capture session."
          }
        },
        {
          "id": "implementation",
          "title": "How It Works",
          "paragraphs": [
            "The app keeps one in-memory array of task objects as its state. Every change updates the array, saves it to localStorage as JSON, and re-renders the list from that state.",
            "Loading is defensive: unreadable JSON becomes an empty list, and entries without text are dropped. Filter buttons expose their state with aria-pressed, and a live region announces changes such as “Task deleted.”"
          ],
          "code": ["Excerpt from script.js: restoring saved tasks", "const tasks = Array.isArray(parsedTasks)\n    ? parsedTasks\n        .filter(task => task && typeof task.text === 'string')\n        .map(task => ({\n            text: task.text.trim(),\n            completed: Boolean(task.completed)\n        }))\n        .filter(task => task.text !== '')\n    : [];"]
        },
        {
          "id": "outcome",
          "title": "Outcome & Limits",
          "outcomes": [
            "Tasks and their completion state survive refreshes and later visits in the same browser.",
            "A GitHub Actions workflow deploys the app to GitHub Pages."
          ],
          "limits": [
            "Tasks live in one browser’s localStorage. There is no account, backend, or sync between devices.",
            "It is a small practice project, without due dates, reordering, or automated tests."
          ],
          "lessonsTitle": "What I practiced",
          "lessons": "This project helped me work with DOM updates, arrays and objects, event handling, and keeping browser state synchronized with persistent storage."
        }
      ]
    },
    "repo": "https://github.com/Omar-Lyzkru/tiny-task-tracker",
    "repoLabel": "View source on GitHub",
    "demo": "https://omar-lyzkru.github.io/tiny-task-tracker/",
    "source": "PERSONAL PROJECT · JAVASCRIPT PRACTICE"
  }
};

const dialog = document.querySelector('#project-dialog');
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const externalLink = (href, className, text) => {
  const link = el('a', className, text);
  link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
  return link;
};
const showcase = document.querySelector('#dialog-showcase');
// Every project uses the same showcase presentation; case studies differ only in which parts their data provides.
function showcaseImage(image, className) {
  const figure = el('figure', className);
  const img = el('img');
  img.src = image.src; img.alt = image.alt; img.width = image.width; img.height = image.height; img.decoding = 'async';
  figure.append(img, el('figcaption', 'mono quiet', image.caption));
  return figure;
}
// An illustrative workflow, drawn as an ordered list so it reads correctly without the visual styling.
function showcaseFlow(media, className) {
  const figure = el('figure', `${className} showcase-flow`);
  const list = el('ol');
  list.setAttribute('aria-label', media.label);
  for (const [step, branch] of media.flow) {
    const item = el('li');
    item.append(el('span', 'flow-step', step));
    if (branch) item.append(el('span', 'flow-branch mono', branch));
    list.append(item);
  }
  figure.append(list, el('figcaption', 'mono quiet', media.caption));
  return figure;
}
function showcaseCode([caption, text]) {
  const figure = el('figure', 'showcase-code');
  const pre = el('pre');
  pre.append(el('code', '', text));
  figure.append(el('figcaption', 'mono quiet', caption), pre);
  return figure;
}
function projectLinks(project) {
  const links = el('div', 'dialog-links');
  const repo = externalLink(project.repo, 'button button-primary', `${project.repoLabel} `);
  const plus = el('span', '', '+');
  plus.setAttribute('aria-hidden', 'true');
  repo.append(plus);
  links.append(repo);
  if (project.demo) links.append(externalLink(project.demo, 'text-link', 'Live demo ↗'));
  links.append(el('span', 'mono quiet', project.source));
  return links;
}
function showcaseSection(section, number, project) {
  const root = el('section', 'showcase-section');
  root.id = `showcase-${section.id}`;
  root.setAttribute('aria-labelledby', `${root.id}-title`);
  const heading = el('h3', '', section.title);
  heading.id = `${root.id}-title`; heading.tabIndex = -1;
  root.append(el('p', 'eyebrow copper', `0${number} / ${section.id.toUpperCase()}`), heading);
  for (const text of section.paragraphs || []) root.append(el('p', 'showcase-text', text));
  if (section.steps) {
    const steps = el('ol', 'showcase-steps');
    for (const [title, text] of section.steps) { const item = el('li'); item.append(el('h4', '', title), el('p', '', text)); steps.append(item); }
    root.append(steps);
  }
  if (section.figure) root.append(showcaseImage(section.figure, 'showcase-figure'));
  if (section.items) {
    const items = el('div', 'showcase-items');
    for (const entry of section.items) {
      const item = el('article', 'showcase-item');
      item.append(el('h4', '', entry.title));
      if (entry.challenge) item.append(el('p', 'showcase-challenge', entry.challenge));
      if (entry.team) {
        // Team projects separate the shared system from the changes I implemented.
        const contribution = el('div', 'showcase-contribution');
        const team = el('div'); team.append(el('p', 'mono quiet', 'TEAM'), el('p', '', entry.team));
        const mine = el('div'); mine.append(el('p', 'mono copper', 'MY CONTRIBUTION'), el('p', '', entry.mine));
        contribution.append(team, mine);
        item.append(contribution);
      }
      if (entry.body) item.append(el('p', 'showcase-body', entry.body));
      const evidence = el('p', 'showcase-evidence mono quiet', 'EVIDENCE');
      for (const [label, path] of entry.evidence) evidence.append(externalLink(`${project.repo}/${path}`, 'text-link', `${label} ↗`));
      item.append(evidence);
      items.append(item);
    }
    root.append(items);
  }
  if (section.note) {
    const [label, text] = section.note;
    const note = el('div', 'case-note showcase-role');
    note.append(el('p', 'mono copper', label), el('p', '', text));
    root.append(note);
  }
  if (section.code) root.append(showcaseCode(section.code));
  if (section.outcomes) {
    const list = el('ul', 'showcase-list');
    for (const text of section.outcomes) list.append(el('li', '', text));
    const limits = el('div', 'case-note');
    limits.append(el('p', 'mono copper', 'LIMITS TO KEEP IN MIND'));
    const limitList = el('ul', 'showcase-list');
    for (const text of section.limits) limitList.append(el('li', '', text));
    limits.append(limitList);
    const lessons = el('div', 'showcase-lessons');
    lessons.append(el('h4', '', section.lessonsTitle), el('p', '', section.lessons));
    root.append(list, limits, lessons, projectLinks(project));
  }
  return root;
}
function renderShowcase(project) {
  const { recognition, hero, sections } = project.showcase;
  const header = el('header', 'showcase-hero');
  const copy = el('div', 'showcase-copy');
  const title = el('h2', '', project.title);
  title.id = 'showcase-title';
  const award = el('p', 'showcase-award');
  award.append(el('span', 'mono quiet', recognition[0]), el('strong', '', recognition[1]));
  copy.append(el('p', 'eyebrow copper', project.category), title, el('p', 'dialog-summary', project.summary), award);
  const meta = el('div', 'showcase-meta');
  const tags = el('div', 'tags');
  tags.append(...project.tags.map(tag => el('span', '', tag)));
  const metrics = el('div', 'dialog-metrics');
  metrics.append(...project.metrics.map(([value, label]) => { const item = el('div', 'metric'); item.append(el('strong', '', value), el('span', '', label)); return item; }));
  meta.append(tags, metrics, projectLinks(project));
  header.append(copy, hero.flow ? showcaseFlow(hero, 'showcase-media') : showcaseImage(hero, 'showcase-media'), meta);
  const nav = el('nav', 'showcase-nav');
  nav.setAttribute('aria-label', 'Case study sections');
  sections.forEach(section => {
    const button = el('button', '', section.title);
    button.type = 'button';
    button.addEventListener('click', () => jumpToSection(`showcase-${section.id}`));
    nav.append(button);
  });
  showcase.replaceChildren(header, nav, ...sections.map((section, index) => showcaseSection(section, index + 1, project)));
}
function jumpToSection(id) {
  const target = document.getElementById(id);
  const bar = dialog.querySelector('.dialog-top');
  const top = dialog.scrollTop + target.getBoundingClientRect().top - dialog.getBoundingClientRect().top - bar.offsetHeight;
  dialog.scrollTo({ top, behavior: 'auto' });
  target.querySelector('h3').focus({ preventScroll: true });
}
function renderProject(id) {
  const project = projects[id];
  document.querySelector('#dialog-number').textContent = `${project.number} / SELECTED WORK`;
  renderShowcase(project);
}

// Showcase coordinator: the single owner of dialog lifecycle, URL/history, scroll and focus.
// Lifecycle: portfolio -> opening -> open -> closing -> portfolio. 'opening' and 'closing' last while a Task 03 motion
// run plays (and 'closing' also while a card-origin close waits for history.back() to settle). Motion is decorative:
// every run has a single completion step that also runs when the run is cut short, so dismissal never depends on it.
const entrySession = createEntrySession();
let gateway = null; // the entrance gateway (gateway.js); it and the showcase never hold a modal at the same time
let toolkit = null; // the Technical Toolkit (toolkit.js); it owns its selection, the coordinator owns navigation
const routes = { permitwatch: 'permit', 'job-automation': 'job', raycaster: 'raycaster', 'task-tracker': 'tracker' };
const slugFor = id => Object.keys(routes).find(slug => routes[slug] === id) ?? null;
const routeFromLocation = () => classifyProjectRoute(location.href, routes).id;
const urlFor = slug => {
  const url = new URL(location.href);
  if (slug) url.searchParams.set('project', slug); else url.searchParams.delete('project');
  return url.pathname + url.search + url.hash;
};
const coordinator = (() => {
  let phase = 'portfolio', focusTarget = null, activeId = null, trigger = null, source = null, scrollPos = null, openedAt = 0, historyOrigin = null, settleTimer = 0;
  const setPhase = value => { phase = value; dialog.dataset.phase = value; };
  const restoreScroll = () => { if (scrollPos) window.scrollTo({ left: scrollPos.x, top: scrollPos.y, behavior: 'instant' }); };
  const cardFor = id => document.querySelector(`[data-project="${id}"]`);
  // Entries this coordinator pushed (card or Toolkit) sit directly above the portfolio entry, so Back can close them.
  const pushedOrigins = ['card', 'toolkit'];
  // Where focus returns when the invoking control is gone, or the showcase was reopened by Forward: a Toolkit-origin
  // showcase stays in the Toolkit (D3-C) instead of sending focus and scroll to the Projects grid.
  const fallbackFocus = id => (historyOrigin === 'toolkit' && toolkit?.fallbackFocus(id)) || cardFor(id);
  const live = () => phase === 'open' || phase === 'opening';

  // ---- Task 03 motion: FLIP-style card <-> dialog transitions on the Web Animations API ----
  // The dialog surface is the only animated shape: its clip-path moves between the card rect and the dialog rect, so
  // text and screenshots are never scaled. Content is faded in and out separately.
  const OPEN_MS = 520, CLOSE_MS = 440, CLOSE_DELAY = 140, EASE = 'cubic-bezier(.2,.8,.2,1)';
  const shell = dialog.querySelector('.dialog-shell');
  let motionRun = null; // the single in-flight run: { kind, animations, done, timer }

  // Ends the run (if any). complete=true also runs its completion step; stale callbacks find motionRun !== run and no-op.
  function endMotion(complete = true) {
    const run = motionRun;
    if (!run) return;
    motionRun = null;
    clearTimeout(run.timer);
    run.animations.forEach(animation => { try { animation.cancel(); } catch { /* already gone */ } });
    if (complete) run.done();
  }

  // Usable origin geometry from the clicked card, or null (missing, detached, hidden, or mostly outside the viewport).
  // Never scrolls the page to manufacture a target.
  function measureOrigin(node) {
    const card = node?.isConnected ? (node.closest('.project-card') || node) : null;
    if (!card) return null;
    const rect = card.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 24) return null;
    const visibleW = Math.min(rect.right, document.documentElement.clientWidth) - Math.max(rect.left, 0);
    const visibleH = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    if (visibleW <= 0 || visibleH <= 0 || visibleW * visibleH < rect.width * rect.height * 0.5) return null;
    return { rect };
  }

  const clipFor = (c, d, radius) => `inset(${c.top - d.top}px ${d.right - c.right}px ${d.bottom - c.bottom}px ${c.left - d.left}px round ${radius}px)`;

  // Starts one run. Returns false (nothing started, caller finishes immediately) when motion is reduced or unavailable.
  function play(kind, origin, done) {
    if (!activeId || motion.reduced || typeof dialog.animate !== 'function') return false;
    const opening = kind === 'open';
    const animations = [];
    let lead;
    try {
      const d = dialog.getBoundingClientRect();
      const direction = opening ? 'normal' : 'reverse';
      const delay = opening ? 0 : CLOSE_DELAY;
      let span, total;
      if (origin) {
        const c = origin.rect;
        span = opening ? OPEN_MS : CLOSE_MS;
        total = span + delay;
        lead = dialog.animate({ clipPath: [clipFor(c, d, 14), clipFor(d, d, 6)] }, { duration: span, delay, easing: EASE, fill: 'both', direction });
        animations.push(lead);
        // Readable content is faded, never scaled: in after the surface has mostly arrived, out before it contracts.
        animations.push(shell.animate({ opacity: opening ? [0, 1] : [1, 0] }, opening
          ? { duration: 240, delay: 230, easing: 'ease-out', fill: 'both' }
          : { duration: CLOSE_DELAY + 40, easing: 'ease-in', fill: 'both' }));
      } else {
        // No usable origin: restrained non-spatial fade.
        span = total = opening ? 240 : 180;
        lead = dialog.animate({ opacity: opening ? [0, 1] : [1, 0] }, { duration: span, easing: 'ease-out', fill: 'both' });
        animations.push(lead);
      }
      try { animations.push(dialog.animate({ opacity: opening ? [0, 1] : [1, 0] }, { duration: span, delay: origin && !opening ? delay : 0, fill: 'both', pseudoElement: '::backdrop' })); } catch { /* ::backdrop animation unsupported */ }
      const run = { kind, animations, done, timer: 0 };
      motionRun = run;
      const complete = () => { if (motionRun === run) endMotion(true); };
      lead.onfinish = complete;
      run.timer = setTimeout(complete, total + 400);
      return true;
    } catch {
      animations.forEach(animation => { try { animation.cancel(); } catch { /* ignore */ } });
      return false;
    }
  }

  // from: 'card' and 'toolkit' push a history entry; 'history' (direct entry, refresh, Back/Forward) never touches history.
  // Only a card has geometry to expand from; a Toolkit text control gets the restrained non-spatial reveal (D3-A).
  function open(id, from, invoker = null) {
    if (phase !== 'portfolio' || !projects[id]) return false;
    gateway?.yieldToShowcase(); // e.g. Back/Forward onto a project URL while the gateway is up; before scroll is captured
    if (document.documentElement.dataset.gateway === 'pending') delete document.documentElement.dataset.gateway; // a showcase wins over a not-yet-initialized gateway
    setPhase('opening');
    focusTarget = null;
    activeId = id; trigger = invoker; source = from; scrollPos = { x: window.scrollX, y: window.scrollY };
    renderProject(id);
    const origin = from === 'card' && invoker ? measureOrigin(invoker) : null; // measured before the modal changes page layout
    const slug = slugFor(id);
    historyOrigin = null;
    if (slug && pushedOrigins.includes(from)) {
      history.pushState({ showcase: slug, origin: from }, '', urlFor(slug));
      historyOrigin = from;
    } else if (slug) {
      historyOrigin = pushedOrigins.includes(history.state?.origin) ? history.state.origin : 'direct';
    }
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    // Deterministic initial focus: the Close control. Re-asserted after layout and load, because on direct entry the
    // module runs before layout and the browser's fragment scrolling can move focus back to the page afterwards.
    const closeButton = document.querySelector('#dialog-close');
    const assertFocus = () => { if (live() && !dialog.contains(document.activeElement)) closeButton.focus({ preventScroll: true }); };
    closeButton.focus({ preventScroll: true });
    requestAnimationFrame(assertFocus);
    if (document.readyState !== 'complete') window.addEventListener('load', () => setTimeout(assertFocus, 0), { once: true });
    openedAt = performance.now();
    setPhase(play('open', origin, () => { if (phase === 'opening') setPhase('open'); }) ? 'opening' : 'open');
    return true;
  }

  // Dismisses the dialog and restores scroll and focus. Never touches history.
  function finish() {
    if (dialog.open) dialog.close();
    restoreScroll();
    focusTarget = trigger?.isConnected ? trigger : fallbackFocus(activeId);
    focusTarget?.focus({ preventScroll: true });
    restoreScroll();
    activeId = null; trigger = null; source = null;
    setPhase('portfolio');
  }

  // History traversal and the native dialog close each run after our own focus() and can blur it (popstate and
  // close may fire in either order), so the last of them to run re-asserts. It only acts on a settled portfolio whose
  // focus fell to <body>, so it cannot override a newer interaction or an open dialog.
  const reassertFocus = () => {
    if (phase === 'portfolio' && !dialog.open && document.activeElement === document.body && focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
  };

  function settle() {
    clearTimeout(settleTimer);
    if (phase === 'closing') setPhase('portfolio');
    if (routeFromLocation() && phase === 'portfolio' && !dialog.open && historyOrigin === 'closed') history.replaceState(null, '', urlFor(null));
    requestAnimationFrame(() => { restoreScroll(); scrollPos = null; reassertFocus(); });
  }

  function commitClose() {
    const slug = slugFor(activeId);
    // Back is only safe when this entry was pushed by a card or Toolkit click, so the entry below is the portfolio.
    const viaBack = Boolean(slug) && pushedOrigins.includes(historyOrigin) && history.state?.showcase === slug;
    // The page cannot scroll under the modal, so the live position is authoritative. The position captured at open is
    // stale on direct entry, where the module runs before the browser finishes fragment navigation.
    scrollPos = { x: window.scrollX, y: window.scrollY };
    finish();
    if (viaBack) {
      setPhase('closing');
      historyOrigin = 'closed';
      settleTimer = setTimeout(settle, 600);
      history.back();
    } else if (slug) {
      history.replaceState(null, '', urlFor(null));
    }
  }

  function close() {
    if (!live()) return;
    // Closing an unfinished opening skips the reverse motion: it would start from a state the visitor never saw complete.
    if (phase === 'opening') { endMotion(false); setPhase('open'); commitClose(); return; }
    const origin = source === 'card' ? measureOrigin(trigger) : null;
    setPhase('closing');
    if (!play('close', origin, commitClose)) commitClose();
  }

  // Reconciles the dialog with the URL after Back/Forward. Opens/closes without adding history entries.
  function sync() {
    const id = routeFromLocation();
    if (live() && id !== activeId) finish();
    if (phase === 'portfolio' && id) open(id, 'history');
  }

  window.addEventListener('popstate', () => {
    // Navigation overrides any running motion. An unfinished close is completed as a plain dismissal: the URL has
    // already moved, so it must not call history.back() again.
    if (motionRun?.kind === 'close') {
      endMotion(false);
      scrollPos = { x: window.scrollX, y: window.scrollY };
      finish();
    } else endMotion(true);
    const wasClosing = phase === 'closing';
    if (wasClosing) { clearTimeout(settleTimer); setPhase('portfolio'); }
    sync();
    if (wasClosing) settle();
  });
  // Escape: take over from the native close so there is one close path. Deferred so the browser's own
  // cancel handling finishes before focus is restored (closing synchronously inside 'cancel' loses focus).
  dialog.addEventListener('cancel', event => { event.preventDefault(); setTimeout(close, 0); });
  // Safety net for any native dismissal that skips cancel.
  dialog.addEventListener('close', () => {
    // A prior close event can arrive after history navigation has reopened this same dialog.
    if (!dialog.open) close();
    reassertFocus();
  });
  document.querySelector('#dialog-close').addEventListener('click', close);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog || performance.now() - openedAt < 350) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  });
  document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => { if (open(button.dataset.project, 'card', button)) entrySession.markEntered(); }));

  // A reduced-motion request or a viewport change mid-run resolves it to its final state at once.
  motion.subscribe(reduced => { if (reduced) endMotion(true); });
  window.addEventListener('resize', () => endMotion(true));

  setPhase('portfolio');
  return { open, close, sync, motion, get phase() { return phase; } };
})();
// The Toolkit's View case study controls open the same presentation through the coordinator (A-V2.4). Like the gateway,
// toolkit.js is imported dynamically and started outside the coordinator, so a missing or broken module, or a failed
// start, can never take project navigation down with it. Starting it touches no history, focus or scroll.
const toolkitRoot = document.querySelector('[data-toolkit]');
import('./toolkit.js?v=3').then(({ createToolkit }) => {
  const instance = createToolkit({ root: toolkitRoot, projects, motion, onView: (id, button) => { if (coordinator.open(id, 'toolkit', button)) entrySession.markEntered(); } });
  if (typeof instance?.fallbackFocus !== 'function') throw new TypeError('toolkit: unexpected interface');
  toolkit = instance;
}).catch(() => {
  // No half-built picker is left behind: the section stays as a #toolkit destination with a plain note.
  toolkit = null;
  const picker = toolkitRoot.querySelector('[data-toolkit-picker]');
  picker.replaceChildren();
  picker.hidden = true;
  const note = document.createElement('p');
  note.className = 'toolkit-text';
  note.textContent = 'The technology picker could not load. Each project above lists the technologies it uses.';
  toolkitRoot.querySelector('[data-toolkit-panel]').replaceChildren(note);
  toolkitRoot.querySelector('[data-toolkit-status]').textContent = '';
});

// Entry is recorded for supported and invalid project URLs (here) and for card-origin opens (in the coordinator).
// Ordinary page loads establish nothing until the visitor enters or skips.
const routeKind = classifyProjectRoute(location.href, routes).kind;
if (routeKind !== 'none') entrySession.markEntered();
coordinator.sync();

// Entrance gateway. The early bootstrap in index.html only prevents a flash; the real route and session modules decide here.
// Route precedence: any project route bypasses it, otherwise the entered-session cookie does. gateway.js is imported
// dynamically so the portfolio never depends on it: if it fails to load or start, the portfolio is simply revealed.
import('./gateway.js?v=4').then(({ createGateway }) => {
  gateway = createGateway({ dialog: document.querySelector('#gateway-dialog'), motion, session: entrySession, canReplay: () => coordinator.phase === 'portfolio' });
  const replayButton = document.querySelector('#replay-intro');
  replayButton.addEventListener('click', event => gateway.replay(event.currentTarget));
  replayButton.hidden = false; // Replay is only offered once it can work
  // Automatic presentation needs the startup to still be pending: the failsafe (or a showcase) clearing it means the visitor
  // is already in the portfolio, so a late module may initialize for Replay but never opens by itself.
  const pending = document.documentElement.dataset.gateway === 'pending';
  if (pending && routeKind === 'none' && entrySession.state() !== 'entered' && coordinator.phase === 'portfolio') gateway.show();
  else delete document.documentElement.dataset.gateway;
}).catch(() => {
  gateway = null;
  delete document.documentElement.dataset.gateway;
});

document.querySelector('#copy-email').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText('o9086498@gmail.com');
    status.textContent = 'Email copied. Say hello when you’re ready.';
  } catch {
    status.textContent = 'You can select the email above to copy it.';
  }
});
document.querySelector('#year').textContent = String(new Date().getFullYear());
