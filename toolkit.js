// Technical Toolkit: technologies linked to the projects that verifiably use them.
// Every association names its evidence (a source file or one of my commits); a technology with no verified project use
// is left out rather than implied. There are no proficiency ratings or years of experience.
//
// The Toolkit owns its selection and evidence panel. Selecting a technology never touches history or the URL; opening a
// case study is delegated to the showcase coordinator in app.js, which owns the dialog, URL, scroll and focus.
//
// const toolkit = createToolkit({ root, projects, motion, onView });
// onView(projectId, button)     // a View case study control was activated
// toolkit.fallbackFocus(id)     // where focus should return when the invoking control is gone
const gh = 'https://github.com/';
const pw = `${gh}Abbas9x/permitwatch-houston/`;
const job = `${gh}Omar-Lyzkru/job-applier/blob/main/`;
const ray = `${gh}Omar-Lyzkru/raycaster/blob/main/`;
const tracker = `${gh}Omar-Lyzkru/tiny-task-tracker/blob/main/`;

// How each project was built, repeated beside every association so no claim reads as solo work by accident.
const projectContext = { permit: 'Team project', job: 'AI-assisted', raycaster: 'Tutorial-guided', tracker: 'Personal project' };

export const toolkitGroups = [
  {
    name: 'Languages',
    technologies: [
      { id: 'javascript', name: 'JavaScript', uses: [
        { project: 'job', text: 'The dashboard, the local Node.js server, and the browser automation are JavaScript modules, implemented with AI assistance under my direction.', evidence: [['src/', `${gh}Omar-Lyzkru/job-applier/tree/main/src`], ['public/app.js', `${job}public/app.js`]] },
        { project: 'tracker', text: 'All of the app’s behavior is one vanilla JavaScript file: task state, rendering, inline editing, filtering, and saving.', evidence: [['script.js', `${tracker}script.js`]] }
      ] },
      { id: 'typescript', name: 'TypeScript', uses: [
        { project: 'permit', text: 'The team app is TypeScript throughout. My changes include the radius-slider React component and the TypeScript collectors and normalizers that expanded the dataset.', evidence: [['0c5cd72', `${pw}commit/0c5cd72`], ['c27bc23', `${pw}commit/c27bc23`]] }
      ] },
      { id: 'cpp', name: 'C++', uses: [
        { project: 'raycaster', text: 'The renderer and its calculations are C++17: ray casting, movement, and collision in a portable header, and console output in the Windows program.', evidence: [['raycaster_core.h', `${ray}1st%20project/raycaster_core.h`], ['confpsbutbetter.cpp', `${ray}1st%20project/confpsbutbetter.cpp`]] }
      ] },
      { id: 'html-css', name: 'HTML & CSS', uses: [
        { project: 'tracker', text: 'Semantic HTML with labeled controls and live status announcements, and a responsive CSS layout for desktop and mobile.', evidence: [['index.html', `${tracker}index.html`], ['styles.css', `${tracker}styles.css`]] },
        { project: 'job', text: 'The local dashboard’s pages and its light and dark appearances are HTML and CSS, written with AI assistance.', evidence: [['public/index.html', `${job}public/index.html`], ['public/styles.css', `${job}public/styles.css`]] }
      ] }
    ]
  },
  {
    name: 'Frameworks & runtimes',
    technologies: [
      { id: 'react', name: 'React', uses: [
        { project: 'permit', text: 'The frontend is a React app. I implemented the 1–10 mile radius slider, persistent dark and light appearances, and the restored concerns drafting in its components.', evidence: [['0c5cd72', `${pw}commit/0c5cd72`], ['1ac7082', `${pw}commit/1ac7082`], ['c734368', `${pw}commit/c734368`]] }
      ] },
      { id: 'nodejs', name: 'Node.js', uses: [
        { project: 'job', text: 'A local Node.js HTTP server serves the dashboard and its API, schedules application runs, and stores data as JSON files.', evidence: [['server.mjs', `${job}src/server.mjs`], ['runner.mjs', `${job}src/runner.mjs`]] },
        { project: 'permit', text: 'The team’s API runs on Node.js with Express. I updated the search route and service so the API and the map share one search radius.', evidence: [['0c5cd72', `${pw}commit/0c5cd72`]] }
      ] },
      { id: 'maplibre', name: 'MapLibre GL', uses: [
        { project: 'permit', text: 'The map is built on MapLibre GL. I implemented separate selectable markers for permits at shared coordinates and the map side of the adjustable search radius.', evidence: [['c734368', `${pw}commit/c734368`], ['0c5cd72', `${pw}commit/0c5cd72`]] }
      ] },
      { id: 'windows-console', name: 'Windows Console API', uses: [
        { project: 'raycaster', text: 'Each frame is written to a dedicated console screen buffer, one 120-character row at a time with every write checked, and the previous console is restored on exit.', evidence: [['confpsbutbetter.cpp', `${ray}1st%20project/confpsbutbetter.cpp`]] }
      ] }
    ]
  },
  {
    name: 'Data, testing & tools',
    technologies: [
      { id: 'sqlite', name: 'SQLite', uses: [
        { project: 'permit', text: 'The team’s API reads permits from SQLite. Expanding the published dataset from 213 to 807 records included my migration and repository changes for the new permit categories.', evidence: [['c27bc23', `${pw}commit/c27bc23`], ['Verification report', `${pw}blob/main/docs/multi-permit-verification.md`]] }
      ] },
      { id: 'localstorage', name: 'localStorage', uses: [
        { project: 'tracker', text: 'Tasks are saved to localStorage as JSON after every change and restored on the next visit, with malformed entries filtered out.', evidence: [['script.js', `${tracker}script.js`]] },
        { project: 'permit', text: 'The dark and light appearance I added is remembered in localStorage, with an in-memory fallback when storage is unavailable.', evidence: [['1ac7082', `${pw}commit/1ac7082`]] }
      ] },
      { id: 'playwright', name: 'Playwright', uses: [
        { project: 'job', text: 'Playwright drives a separate Chromium session for applications, and a Playwright suite tests the dashboard against local fixture forms.', evidence: [['session.mjs', `${job}src/browser/session.mjs`], ['test-browser.mjs', `${job}scripts/test-browser.mjs`]] },
        { project: 'permit', text: 'I added Playwright browser regression tests for markers at shared coordinates and for concerns drafts that survive responsive layout changes.', evidence: [['c734368', `${pw}commit/c734368`], ['8e9438b', `${pw}commit/8e9438b`]] }
      ] },
      { id: 'cmake', name: 'CMake & CTest', uses: [
        { project: 'raycaster', text: 'CMake builds the Windows program and a portable test executable. CTest runs five calculation test groups, which also run on Linux and macOS.', evidence: [['CMakeLists.txt', `${ray}CMakeLists.txt`], ['raycaster_tests.cpp', `${ray}tests/raycaster_tests.cpp`]] }
      ] },
      { id: 'git', name: 'Git & GitHub', uses: [
        { project: 'permit', text: 'A shared four-person repository. Each contribution in the case study links to the commit I authored.', evidence: [['My commits', `${pw}commits?author=Omar-Lyzkru`]] },
        { project: 'tracker', text: 'A GitHub Actions workflow deploys the app to GitHub Pages on every push to main.', evidence: [['pages.yml', `${tracker}.github/workflows/pages.yml`]] }
      ] },
      { id: 'linux', name: 'Linux', uses: [
        { project: 'job', text: 'The app runs on Linux (on Windows, through WSL2). A Linux-only ownership lock keeps two app processes from using the same data folder.', evidence: [['data-ownership.mjs', `${job}src/data-ownership.mjs`]] },
        { project: 'raycaster', text: 'The portable calculation tests also build and run on Linux. Only the interactive renderer needs Windows.', evidence: [['CMakeLists.txt', `${ray}CMakeLists.txt`]] }
      ] }
    ]
  }
];

export function createToolkit({ root, projects, motion, onView, initial = 'javascript' }) {
  const picker = root.querySelector('[data-toolkit-picker]');
  const panel = root.querySelector('[data-toolkit-panel]');
  const status = root.querySelector('[data-toolkit-status]');
  const byId = new Map(toolkitGroups.flatMap(group => group.technologies.map(tech => [tech.id, { ...tech, group: group.name }])));
  let selected = null;
  let reveal = null; // the in-flight panel transition, if any

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  toolkitGroups.forEach((group, index) => {
    const wrapper = el('div', 'toolkit-group');
    const heading = el('h3', 'toolkit-group-title mono', group.name);
    heading.id = `toolkit-group-${index}`;
    const list = el('ul', 'toolkit-techs');
    list.setAttribute('aria-labelledby', heading.id);
    for (const tech of group.technologies) {
      const button = el('button', 'toolkit-tech', tech.name);
      button.type = 'button';
      button.dataset.tech = tech.id;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-controls', panel.id);
      button.addEventListener('click', () => select(tech.id, true));
      const item = el('li');
      item.append(button);
      list.append(item);
    }
    wrapper.append(heading, list);
    picker.append(wrapper);
  });

  function renderPanel(tech) {
    const count = tech.uses.length;
    const title = el('h3', 'toolkit-panel-title', tech.name);
    title.id = 'toolkit-panel-title';
    const list = el('ul', 'toolkit-uses');
    for (const use of tech.uses) {
      const project = projects[use.project];
      const item = el('li', 'toolkit-use');
      const head = el('div', 'toolkit-use-head');
      head.append(el('h4', '', project.title), el('span', 'toolkit-context mono', projectContext[use.project]));
      const evidence = el('p', 'toolkit-evidence mono');
      evidence.append(el('span', 'quiet', 'EVIDENCE'));
      for (const [label, href] of use.evidence) {
        const link = el('a', 'text-link', `${label} ↗`);
        link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
        evidence.append(link);
      }
      item.append(head, el('p', 'toolkit-text', use.text), evidence);
      if (project.showcase) {
        const view = el('button', 'toolkit-view', 'View case study');
        view.type = 'button';
        view.dataset.view = use.project;
        const target = el('span', 'visually-hidden', `: ${project.title}`);
        const arrow = el('span', 'toolkit-view-arrow', '→');
        arrow.setAttribute('aria-hidden', 'true');
        view.append(target, arrow);
        view.addEventListener('click', () => onView(use.project, view));
        item.append(view);
      }
      list.append(item);
    }
    panel.setAttribute('aria-labelledby', title.id);
    panel.replaceChildren(el('p', 'toolkit-kicker mono', tech.group), title, el('p', 'toolkit-count mono', `Used in ${count} of ${Object.keys(projects).length} projects`), list);
  }

  // announce=false for the initial render, so the page does not speak on load.
  function select(id, announce) {
    const tech = byId.get(id);
    if (!tech || id === selected) return;
    selected = id;
    picker.querySelectorAll('[data-tech]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tech === id)));
    reveal?.cancel();
    reveal = null;
    renderPanel(tech);
    if (announce) {
      const names = tech.uses.map(use => projects[use.project].title).join(' and ');
      status.textContent = `${tech.name}: used in ${names}.`;
    }
    // A subtle settle-in when motion is allowed; the content is already in place either way.
    if (announce && !motion.reduced && typeof panel.animate === 'function') {
      try { reveal = panel.animate({ opacity: [0.35, 1], transform: ['translateY(6px)', 'none'] }, { duration: 220, easing: 'ease-out' }); } catch { reveal = null; }
    }
  }
  motion.subscribe(reduced => { if (reduced) { reveal?.finish(); reveal = null; } });

  select(initial, false);
  return {
    get selected() { return selected; },
    // The View case study control for this project when it is still shown, otherwise the selected technology.
    fallbackFocus(projectId) {
      return panel.querySelector(`[data-view="${projectId}"]`) || picker.querySelector(`[data-tech="${selected}"]`);
    }
  };
}
