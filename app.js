import { mountBlackHole, drawProjectArt } from './blackhole.js';
import { createMotionPolicy } from './motion.js';
import { classifyProjectRoute } from './route.js';
import { createEntrySession } from './session.js';

const hole = mountBlackHole(document.querySelector('#black-hole'), { fps: 18 });
document.querySelector('.black-hole-art').classList.add('art-ready');
const kinds = { raycaster: 'network', tracker: 'terminal', job: 'server' };
document.querySelectorAll('[data-art]').forEach(canvas => drawProjectArt(canvas, kinds[canvas.dataset.art]));
// One effective motion policy (manual Pause OR system reduced motion) lives in motion.js; the renderer only consumes it.
const motion = createMotionPolicy();
const systemReduced = () => motion.systemReduced;
function updateMotion(effectivePaused = motion.reduced) {
  document.documentElement.dataset.motion = effectivePaused ? 'reduced' : 'full';
  hole.setPaused(effectivePaused);
  const button = document.querySelector('#motion-toggle');
  button.disabled = systemReduced();
  button.setAttribute('aria-pressed', String(effectivePaused));
  button.setAttribute('aria-label', systemReduced() ? 'Animation paused for your reduced motion preference' : motion.manualPaused ? 'Resume black hole animation' : 'Pause black hole animation');
  document.querySelector('#motion-label').textContent = systemReduced() ? 'Reduced motion' : motion.manualPaused ? 'Resume motion' : 'Pause motion';
  document.querySelector('#motion-icon').textContent = effectivePaused ? '▷' : 'Ⅱ';
  document.querySelector('.art-mode').textContent = effectivePaused ? 'ASCII / STILL' : 'ASCII / LIVE';
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
      "recognition": ["Team achievement", "Best Environment Hack winner · CodeRED Orion"],
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
            "The team won Best Environment Hack at CodeRED Orion, University of Houston.",
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
    "demo": "https://permitwatch-houston.onrender.com/",
    "source": "TEAM PROJECT · BEST ENVIRONMENT HACK WINNER"
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
      "Vanilla JavaScript frontend",
      "Node HTTP server/API",
      "JSON file persistence"
    ],
    "metrics": [
      [
        "Local",
        "dashboard & browser"
      ],
      [
        "JSON",
        "file persistence"
      ],
      [
        "Tests",
        "unit/API & synthetic browser"
      ]
    ],
    "problem": "Repeated forms and scattered application records make a job search difficult to track. The goal is a local workflow for finding relevant roles, handling supported forms, and keeping saved answers and application outcomes together.",
    "approach": "The application uses a vanilla JavaScript dashboard, a Node HTTP server/API, Playwright, and JSON files for persistence. I defined product requirements and workflow/safety behavior, directed iterative AI-assisted development, reviewed results, and requested fixes. Most implementation code was AI-generated under my direction.",
    "process": "[ Job filters + saved answers ]\n              |\n     Inspect a supported form\n              |\n [ Block unknowns / review / apply ]\n              |\n  Record lifecycle + protect duplicates\n              |\n [ Recover interrupted work / explicit retry ]",
    "result": "Application lifecycle records distinguish blocked, interrupted, unconfirmed, and submitted work. Unknown questions stop the workflow instead of being answered by guesswork. Duplicate protection, interrupted-work recovery, and user-controlled retries support a more reliable workflow. Unit/API and synthetic browser tests exercise supported behavior; live forms can still require manual completion.",
    "learningTitle": "What I’m learning",
    "learning": "I’m strengthening my understanding of JavaScript/Node.js workflows and independent debugging. I use unit/API and synthetic browser tests to investigate failures and verify changes in supported application workflows.",
    "repo": "https://github.com/Omar-Lyzkru/job-applier",
    "source": "AI-ASSISTED · PRODUCT DIRECTION & REVIEW"
  },
  "raycaster": {
    "number": "03",
    "category": "CONSOLE RENDERING / TUTORIAL-GUIDED PROJECT",
    "title": "C++ Console Raycaster",
    "summary": "A first-person C++ raycaster that renders a character-based scene using the Windows Console API.",
    "tags": [
      "C++",
      "Windows Console API",
      "CMake",
      "Fixed-distance ray stepping"
    ],
    "metrics": [
      [
        "16×16",
        "map"
      ],
      [
        "120×40",
        "character console"
      ],
      [
        "0.1",
        "fixed ray-step distance"
      ]
    ],
    "problem": "How can a two-dimensional map become a first-person view in a character console? This project was a way to work through rendering, movement, and collision handling in C++.",
    "approach": "The implementation steps rays through a 16×16 map, translates wall distances into character columns, and uses elapsed time for movement and wall-collision checks. I implemented the project while following a YouTube programming tutorial and worked through how these pieces fit together.",
    "process": "[ 16×16 map + player position ]\n               |\n      Step rays at fixed distances\n               |\n      Measure walls → choose shading\n               |\n [ 120×40 console scene + map overlay ]",
    "result": "The checked-in implementation draws a 120×40 character scene with distance-based wall shading and a map overlay. The current repository includes CMake builds and portable movement/ray-calculation regression tests; the interactive renderer remains Windows-only.",
    "learningTitle": "What I learned",
    "learning": "Working through the tutorial helped me connect C++ loops, trigonometry, elapsed-time movement, collision checks, and console output. I’m also practicing CMake builds and regression testing around the renderer’s calculations.",
    "repo": "https://github.com/Omar-Lyzkru/raycaster",
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
      "JSON",
      "August 2026"
    ],
    "metrics": [
      [
        "3",
        "filter views"
      ],
      [
        "Saved",
        "browser state"
      ],
      [
        "Inline",
        "task editing"
      ]
    ],
    "problem": "A useful task list should preserve work after a refresh and make everyday updates straightforward.",
    "approach": "I wrote HTML and JavaScript for task creation, completion, deletion, All / Active / Completed filters, and a remaining-task counter. Tasks are saved as JSON in localStorage, with malformed-data handling, inline editing, and keyboard interactions.",
    "process": "[ Create / edit / complete / delete ]\n                  |\n          Update task objects\n             /         \\\n       Render DOM     Save JSON\n             |         |\n        Filter view  localStorage",
    "result": "Task state persists across visits. Inline edits support Enter to save and Escape to cancel, and invalid saved records are filtered during loading.",
    "learningTitle": "What I practiced",
    "learning": "This project helped me work with DOM updates, arrays and objects, event handling, and keeping browser state synchronized with persistent storage.",
    "repo": "https://github.com/Omar-Lyzkru/tiny-task-tracker",
    "source": "PERSONAL PROJECT · JAVASCRIPT PRACTICE"
  }
};

const dialog = document.querySelector('#project-dialog');
const setText = (id, value) => { document.getElementById(id).textContent = value; };
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
const standard = document.querySelector('#dialog-generic');
const repoBase = 'https://github.com/Abbas9x/permitwatch-houston/';
function showcaseImage(image, className) {
  const figure = el('figure', className);
  const img = el('img');
  img.src = image.src; img.alt = image.alt; img.width = image.width; img.height = image.height; img.decoding = 'async';
  figure.append(img, el('figcaption', 'mono quiet', image.caption));
  return figure;
}
function projectLinks(project) {
  const links = el('div', 'dialog-links');
  const repo = externalLink(project.repo, 'button button-primary', 'View team source on GitHub ');
  const plus = el('span', '', '+');
  plus.setAttribute('aria-hidden', 'true');
  repo.append(plus);
  links.append(repo, externalLink(project.demo, 'text-link', 'Live demo ↗'), el('span', 'mono quiet', project.source));
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
      const contribution = el('div', 'showcase-contribution');
      const team = el('div'); team.append(el('p', 'mono quiet', 'TEAM'), el('p', '', entry.team));
      const mine = el('div'); mine.append(el('p', 'mono copper', 'MY CONTRIBUTION'), el('p', '', entry.mine));
      contribution.append(team, mine);
      const evidence = el('p', 'showcase-evidence mono quiet', 'EVIDENCE');
      for (const [label, path] of entry.evidence) evidence.append(externalLink(repoBase + path, 'text-link', `${label} ↗`));
      item.append(el('h4', '', entry.title), el('p', 'showcase-challenge', entry.challenge), contribution, evidence);
      items.append(item);
    }
    root.append(items);
  }
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
  header.append(copy, showcaseImage(hero, 'showcase-media'), meta);
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
  setText('dialog-number', `${project.number} / SELECTED WORK`);
  const isShowcase = Boolean(project.showcase);
  dialog.dataset.layout = isShowcase ? 'showcase' : 'standard';
  dialog.setAttribute('aria-labelledby', isShowcase ? 'showcase-title' : 'dialog-title');
  showcase.hidden = !isShowcase;
  standard.hidden = isShowcase;
  if (isShowcase) {
    renderShowcase(project);
    return;
  }
  showcase.replaceChildren();
  for (const field of ['category', 'title', 'summary', 'problem', 'approach', 'process', 'result', 'learning', 'source']) setText(`dialog-${field}`, project[field]);
  setText('dialog-learning-title', project.learningTitle);
  const note = document.querySelector('#dialog-note');
  note.hidden = !project.note;
  note.textContent = project.note || '';
  const tags = document.querySelector('#dialog-tags');
  tags.replaceChildren(...project.tags.map(tag => { const span = document.createElement('span'); span.textContent = tag; return span; }));
  const metrics = document.querySelector('#dialog-metrics');
  metrics.replaceChildren(...project.metrics.map(([value, label]) => {
    const item = document.createElement('div'); item.className = 'metric';
    const strong = document.createElement('strong'); strong.textContent = value;
    const span = document.createElement('span'); span.textContent = label;
    item.append(strong, span); return item;
  }));
  const repo = document.querySelector('#dialog-repo');
  repo.hidden = !project.repo;
  if (project.repo) repo.href = project.repo; else repo.removeAttribute('href');
  const demo = document.querySelector('#dialog-demo');
  demo.hidden = !project.demo;
  if (project.demo) demo.href = project.demo; else demo.removeAttribute('href');
}

// Showcase coordinator: the single owner of dialog lifecycle, URL/history, scroll and focus.
// Lifecycle: portfolio -> opening -> open -> closing -> portfolio. 'opening' and 'closing' last while a Task 03 motion
// run plays (and 'closing' also while a card-origin close waits for history.back() to settle). Motion is decorative:
// every run has a single completion step that also runs when the run is cut short, so dismissal never depends on it.
const routes = { permitwatch: 'permit' };
const slugFor = id => Object.keys(routes).find(slug => routes[slug] === id) ?? null;
const routeFromLocation = () => classifyProjectRoute(location.href, routes).id;
const urlFor = slug => {
  const url = new URL(location.href);
  if (slug) url.searchParams.set('project', slug); else url.searchParams.delete('project');
  return url.pathname + url.search + url.hash;
};
const coordinator = (() => {
  let phase = 'portfolio', focusTarget = null, activeId = null, trigger = null, scrollPos = null, openedAt = 0, historyOrigin = null, settleTimer = 0;
  const setPhase = value => { phase = value; dialog.dataset.phase = value; };
  const restoreScroll = () => { if (scrollPos) window.scrollTo({ left: scrollPos.x, top: scrollPos.y, behavior: 'instant' }); };
  const cardFor = id => document.querySelector(`[data-project="${id}"]`);
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
    if (activeId !== 'permit' || motion.reduced || typeof dialog.animate !== 'function') return false;
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

  // source: 'card' pushes a history entry; 'history' (direct entry, refresh, Back/Forward) never touches history.
  function open(id, source, from = null) {
    if (phase !== 'portfolio' || !projects[id]) return false;
    setPhase('opening');
    focusTarget = null;
    activeId = id; trigger = from; scrollPos = { x: window.scrollX, y: window.scrollY };
    renderProject(id);
    const origin = from ? measureOrigin(from) : null; // measured before the modal changes page layout
    const slug = slugFor(id);
    historyOrigin = null;
    if (slug && source === 'card') {
      history.pushState({ showcase: slug, origin: 'card' }, '', urlFor(slug));
      historyOrigin = 'card';
    } else if (slug) {
      historyOrigin = history.state?.origin === 'card' ? 'card' : 'direct';
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
    focusTarget = trigger?.isConnected ? trigger : cardFor(activeId);
    focusTarget?.focus({ preventScroll: true });
    restoreScroll();
    activeId = null; trigger = null;
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
    // Back is only safe when this entry was pushed by a card click, so the entry below is the portfolio.
    const viaBack = Boolean(slug) && historyOrigin === 'card' && history.state?.showcase === slug;
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
    const origin = measureOrigin(trigger);
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
  document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => open(button.dataset.project, 'card', button)));

  // A reduced-motion request or a viewport change mid-run resolves it to its final state at once.
  motion.subscribe(reduced => { if (reduced) endMotion(true); });
  window.addEventListener('resize', () => endMotion(true));

  setPhase('portfolio');
  return { open, close, sync, motion };
})();
// Session foundation for the later entrance: supported and invalid project URLs both count as entry.
// Ordinary URLs establish nothing here. No gateway exists yet, so this has no visible effect.
const entrySession = createEntrySession();
if (classifyProjectRoute(location.href, routes).kind !== 'none') entrySession.markEntered();
coordinator.sync();

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
