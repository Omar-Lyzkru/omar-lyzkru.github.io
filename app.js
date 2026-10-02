import { mountBlackHole, drawProjectArt } from './blackhole.js';

const hole = mountBlackHole(document.querySelector('#black-hole'), { fps: 18 });
document.querySelector('.black-hole-art').classList.add('art-ready');
const kinds = { raycaster: 'network', tracker: 'terminal', bakery: 'constellation', job: 'server' };
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
  raycaster: {
    number: '01', category: 'REAL-TIME GRAPHICS / PERSONAL PROJECT', title: 'C++ Raycaster Engine',
    summary: 'A pseudo-3D first-person world, rendered from a 2D map with C++ and SFML.',
    tags: ['C++', 'SFML', 'Raycasting', 'January to February 2025'],
    metrics: [['3', 'core engine systems'], ['2D → 3D', 'raycasting projection'], ['W / S · A / D', 'movement & rotation']],
    problem: 'How can a flat map become a scene you can walk through? This personal project explores the fundamentals of first-person rendering: detecting walls, measuring distance, and turning those measurements into a convincing view.',
    approach: 'I separated the engine into wall detection, distance calculations, and frame rendering. Rays sample the map from the player’s position; their distances drive the projected wall view. Keyboard movement and rotation update that view in real time, while distance-based shading gives the scene depth.',
    process: '[ 2D map + player position ]\n             |\n       Cast rays into map\n             |\n   Detect walls + measure distance\n             |\n   [ Project + shade each frame ]',
    result: 'The result is an interactive first-person scene in an SFML window, with forward and backward movement, rotation, and walls shaded by distance. It gave me a practical way to connect graphics math, input handling, and rendering in C++.',
    repo: 'https://github.com/Omar-Lyzkru/raycaster-sfml', source: 'PERSONAL PROJECT'
  },
  tracker: {
    number: '02', category: 'FRONTEND DEVELOPMENT / PERSONAL PROJECT', title: 'Persistent Task Tracker',
    summary: 'A responsive task manager that remembers your tasks, their edits, and their completion state.',
    tags: ['JavaScript', 'HTML & CSS', 'localStorage', 'August 2026'],
    metrics: [['3', 'task filter views'], ['Enter / Esc', 'save & cancel edits'], ['JSON', 'persistent task state']],
    problem: 'A task list should stay useful after a refresh. I wanted a small browser app that preserves tasks across sessions, makes updates easy, and remains usable with a keyboard.',
    approach: 'I represented tasks as objects in an array, rendered them with the DOM API, and saved state to localStorage as JSON. I added All, Active, and Completed filters, a remaining-task counter, inline editing, and empty-input validation. Loading filters invalid records and handles malformed saved JSON. Accessible labels and live status announcements make task actions clearer.',
    process: '[ Add / edit / complete ]\n             |\n      Update task objects\n        /           \\\n   Render DOM    Save JSON\n        |           |\n  [ Filter view ] [ localStorage ]',
    result: 'Tasks and completion states restore across sessions. Editing supports Enter to save and Escape to cancel, with responsive layouts and accessible feedback. The project brought state management, persistence, validation, and everyday interaction design together in plain JavaScript.',
    repo: 'https://github.com/Omar-Lyzkru/tiny-task-tracker', source: 'PERSONAL PROJECT'
  },
  bakery: {
    number: '03', category: 'APPLIED ALGORITHMS / COURSE PROJECT', title: 'Bakery Demand Predictor',
    summary: 'A C++ K-nearest neighbors model that uses daily context to estimate bakery demand.',
    tags: ['C++', 'K-Nearest Neighbors', 'Euclidean Distance', 'April 2026'],
    metrics: [['20', 'days in the dataset'], ['k = 4', 'nearest neighbors'], ['≈70.5', 'loaves · sample output']],
    problem: 'Bakery demand changes with weather, weekends, holidays, and game days. This course project asks how similar historical days can help estimate demand for a new day.',
    approach: 'Using a 20-day dataset, I encoded weather, weekend or holiday status, and game-day status as input features. I calculated Euclidean distances, ranked the historical records, and used the four nearest neighbors to estimate daily demand.',
    process: '[ Weather + calendar + game day ]\n                 |\n      Compare with 20 recorded days\n                 |\n       Rank Euclidean distances\n                 |\n    [ k = 4 neighbors → estimate ]',
    result: 'The model produced a sample prediction of approximately 70.5 loaves. This is an example estimate from the course dataset, rather than an accuracy benchmark or a measured business outcome. The project helped me turn a familiar real-world question into a concrete algorithm.',
    repo: null, source: 'COURSE PROJECT · RÉSUMÉ'
  },
  job: {
    number: '04', category: 'AUTOMATION & TOOLING / PERSONAL PROJECT', title: 'Job Application Dashboard',
    summary: 'A local dashboard for organizing LinkedIn job searches, supported application workflows, and application history.',
    tags: ['Node.js', 'JavaScript', 'Playwright', 'Linux'],
    metrics: [['Dry run', 'review before submission'], ['CSV', 'exportable history'], ['Local', 'dashboard & browser']],
    problem: 'Job searches involve repetitive forms and scattered application history. I wanted one local workflow to manage explicit answers, review supported applications, and keep an honest record of what happened.',
    approach: 'I combined a Node.js dashboard with a persistent Playwright browser session. Saved profile data and explicitly provided screening answers support repeatable form handling. The workflow includes dry runs, résumé upload verification, duplicate protection, configurable run limits, and durable attempt tracking.',
    process: '[ Saved profile + explicit answers ]\n                  |\n      Find role → inspect supported form\n                  |\n       [ Dry run / review / apply ]\n                  |\n       Record outcome → export CSV',
    result: 'The dashboard distinguishes confirmed submissions, uncertain attempts, missing answers, and skipped or failed applications. Local fixture tests are documented for form, upload, runner, and dashboard behavior. Support depends on the live form; the project does not assume every employer workflow works the same way.',
    repo: 'https://github.com/Omar-Lyzkru/job-applier', source: 'PERSONAL PROJECT'
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
  for (const field of ['category', 'title', 'summary', 'problem', 'approach', 'process', 'result', 'source']) setText(`dialog-${field}`, project[field]);
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
    await navigator.clipboard.writeText('omaraguilarwork97@gmail.com');
    status.textContent = 'Email copied. Say hello when you’re ready.';
  } catch {
    status.textContent = 'You can select the email above to copy it.';
  }
});
document.querySelector('#year').textContent = String(new Date().getFullYear());
