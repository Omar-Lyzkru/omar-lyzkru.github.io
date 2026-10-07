import { mountBlackHole, drawProjectArt } from './blackhole.js';

const hole = mountBlackHole(document.querySelector('#black-hole'), { fps: 18 });
document.querySelector('.black-hole-art').classList.add('art-ready');
const kinds = { raycaster: 'network', tracker: 'terminal', job: 'server' };
document.querySelectorAll('[data-art]').forEach(canvas => drawProjectArt(canvas, kinds[canvas.dataset.art]));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = false;
function updateMotion() {
  const effectivePaused = paused || reducedMotion.matches;
  hole.setPaused(effectivePaused);
  const button = document.querySelector('#motion-toggle');
  button.disabled = reducedMotion.matches;
  button.setAttribute('aria-pressed', String(effectivePaused));
  button.setAttribute('aria-label', reducedMotion.matches ? 'Animation paused for your reduced motion preference' : paused ? 'Resume black hole animation' : 'Pause black hole animation');
  document.querySelector('#motion-label').textContent = reducedMotion.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
  document.querySelector('#motion-icon').textContent = effectivePaused ? '▷' : 'Ⅱ';
  document.querySelector('.art-mode').textContent = effectivePaused ? 'ASCII / STILL' : 'ASCII / LIVE';
}
document.querySelector('#motion-toggle').addEventListener('click', () => { paused = !paused; updateMotion(); });
reducedMotion.addEventListener('change', updateMotion);
updateMotion();

const projects = {
  "job": {
    "number": "01",
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
    "learning": "I’m learning to translate requirements into testable behavior and evaluate workflow outcomes. My current focus is understanding the JavaScript/Node.js code and building more independent debugging skills.",
    "repo": "https://github.com/Omar-Lyzkru/job-applier",
    "source": "AI-ASSISTED · PRODUCT DIRECTION & REVIEW"
  },
  "raycaster": {
    "number": "02",
    "category": "CONSOLE RENDERING / TUTORIAL-GUIDED PROJECT",
    "title": "C++ Console Raycaster",
    "summary": "A first-person C++ raycaster that renders a character-based scene using the Windows Console API.",
    "tags": [
      "C++",
      "Windows Console API",
      "Fixed-distance ray stepping",
      "January to February 2025"
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
    "result": "The checked-in implementation draws a 120×40 character scene with distance-based wall shading and a map overlay using the Windows Console API. Keyboard input controls forward/backward movement and rotation.",
    "learningTitle": "What I learned",
    "learning": "Working through the tutorial helped me connect C++ loops, trigonometry, elapsed-time movement, collision checks, and console output in a first-person scene.",
    "note": "Repository note: the README still describes a different graphics library. This case study reflects the checked-in Windows console source; repository documentation cleanup is a separate follow-up.",
    "repo": "https://github.com/Omar-Lyzkru/raycaster",
    "source": "TUTORIAL-GUIDED · C++ PRACTICE"
  },
  "tracker": {
    "number": "03",
    "category": "FRONTEND DEVELOPMENT / PERSONAL PROJECT",
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
let lastProjectButton = null;
const setText = (id, value) => { document.getElementById(id).textContent = value; };
function openProject(id, trigger) {
  const project = projects[id];
  if (!project) return;
  lastProjectButton = trigger;
  setText('dialog-number', `${project.number} / SELECTED WORK`);
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
  dialog.showModal();
  dialog.scrollTop = 0;
}
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => openProject(button.dataset.project, button)));
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => lastProjectButton?.focus({ preventScroll: true }));

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
