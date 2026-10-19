// Entrance gateway controller: the dedicated native modal that precedes the portfolio.
// It coordinates with, but never replaces, the project showcase coordinator in app.js, and it never touches history.
// Motion comes from the shared policy (motion.js), session state from session.js; nothing here stores preferences.
//
// Lifecycle: closed -> idle -> entering -> closed. 'idle' is the resting presentation (initial or voluntary replay);
// 'entering' lasts while the cinematic journey plays. Every way out (journey end, Skip, Return, Escape, a preference
// change, a failed animation, a showcase taking over) goes through conclude(), so there is one finalization path and
// stale animation callbacks (which compare against the current run) cannot touch a newer state.
//
// const gateway = createGateway({ dialog, motion, session, canReplay });
// gateway.show()          // initial presentation; only call it for an eligible route and session
// gateway.replay(invoker) // voluntary replay from the normal portfolio; focus returns to invoker. False if it cannot open
// gateway.yieldToShowcase() // a project showcase is about to open: leave without restoring focus or scroll
// gateway.active          // true from show()/replay() until the gateway has fully concluded
const JOURNEY_MS = 1500;
const SECTION_IDS = new Set(['main', 'work', 'about', 'contact']);

export function createGateway({ dialog, motion, session, canReplay = () => true, doc = document, win = window }) {
  const root = doc.documentElement;
  const part = name => dialog.querySelector(`[data-gateway-${name}]`);
  const enterButton = part('enter');
  const skipButton = part('skip');
  const returnButton = part('return');
  const pauseButton = part('motion');
  const pauseLabel = part('motion-label');
  const status = part('status');
  const stage = part('stage');
  const copy = part('copy');

  let state = 'closed'; // 'closed' | 'idle' | 'entering'
  let mode = 'initial'; // 'initial' | 'replay'
  let run = null;       // the single in-flight journey: { animations, timer }
  let context = null;   // replay only: the portfolio scroll position and focus to restore

  const setState = value => { state = value; dialog.dataset.state = value; };

  function syncMotionControl() {
    const system = motion.systemReduced;
    pauseButton.disabled = system;
    pauseButton.setAttribute('aria-pressed', String(motion.reduced));
    pauseButton.setAttribute('aria-label', system ? 'Animation paused for your reduced motion preference' : motion.manualPaused ? 'Resume animation' : 'Pause animation');
    pauseLabel.textContent = system ? 'Reduced motion' : motion.manualPaused ? 'Resume motion' : 'Pause motion';
  }

  function endRun() {
    const current = run;
    if (!current) return;
    run = null;
    clearTimeout(current.timer);
    current.animations.forEach(animation => { try { animation.cancel(); } catch { /* already gone */ } });
  }

  // Brings the section named by the current fragment into view and focuses it. The URL is never changed.
  // Returns true when a supported section fragment was honored.
  function honorFragment() {
    let id = '';
    try { id = decodeURIComponent(win.location.hash.slice(1)); } catch { return false; }
    if (!SECTION_IDS.has(id)) return false;
    const target = doc.getElementById(id);
    if (!target) return false;
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
    target.focus({ preventScroll: true });
    return true;
  }

  // The one finalization path. restore=false is used when a showcase is taking over and will manage focus and scroll.
  function conclude(restore = true) {
    if (state === 'closed') return;
    endRun();
    const wasMode = mode;
    const saved = context;
    context = null;
    setState('closed');
    try { if (dialog.open) dialog.close(); } catch { /* the modal is gone either way */ }
    delete root.dataset.gateway;
    status.textContent = '';
    enterButton.hidden = false;
    if (!restore) return;
    if (wasMode === 'replay' && saved) {
      win.scrollTo({ left: saved.x, top: saved.y, behavior: 'instant' });
      let target = saved.focus?.isConnected && saved.focus !== doc.body ? saved.focus : doc.querySelector('#main');
      if (target) { if (!target.matches('button, a, input, [tabindex]')) target.tabIndex = -1; target.focus({ preventScroll: true }); }
      win.scrollTo({ left: saved.x, top: saved.y, behavior: 'instant' });
    } else if (!honorFragment()) {
      const main = doc.querySelector('#main');
      if (main) { main.tabIndex = -1; main.focus({ preventScroll: true }); }
    }
  }

  function present(nextMode) {
    mode = nextMode;
    dialog.dataset.mode = nextMode;
    skipButton.hidden = nextMode !== 'initial';
    returnButton.hidden = nextMode !== 'replay';
    enterButton.hidden = false;
    status.textContent = '';
    syncMotionControl();
    setState('idle');
    root.dataset.gateway = 'active';
    try {
      dialog.inert = false; // inert until the controller is ready, so the pending cover is never a focus stop
      if (!dialog.open) dialog.showModal();
      enterButton.focus({ preventScroll: true });
    } catch {
      // The gateway cannot be presented: never leave the visitor behind a blocked screen.
      conclude(false);
    }
  }

  function startJourney() {
    setState('entering');
    status.textContent = 'Entering the portfolio…';
    // Enter is spent for this journey; Skip (or Return, in replay) stays available and takes the focus.
    const keep = mode === 'replay' ? returnButton : skipButton;
    keep.focus({ preventScroll: true });
    enterButton.hidden = true;
    try {
      if (typeof stage.animate !== 'function') throw new Error('no Web Animations');
      const animations = [];
      // The scene rushes toward the hole while the copy fades; the dialog dissolves over the portfolio at the end.
      const lead = stage.animate(
        [{ transform: 'scale(1)', filter: 'brightness(1)' }, { transform: 'scale(2.8)', filter: 'brightness(1.6)' }],
        { duration: JOURNEY_MS, easing: 'cubic-bezier(.55,0,.85,.35)', fill: 'both' });
      animations.push(lead,
        copy.animate({ opacity: [1, 0], transform: ['scale(1)', 'scale(.96)'] }, { duration: 380, easing: 'ease-out', fill: 'both' }),
        dialog.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.68 }, { opacity: 0, offset: 1 }], { duration: JOURNEY_MS, easing: 'linear', fill: 'both' }));
      const current = { animations, timer: 0 };
      run = current;
      const done = () => { if (run === current) conclude(); };
      lead.onfinish = done;
      current.timer = setTimeout(done, JOURNEY_MS + 400); // optional motion can fail; entry never depends on it
    } catch {
      conclude();
    }
  }

  function enter() {
    if (state !== 'idle') return; // repeated activation never stacks journeys
    if (mode === 'initial') session.markEntered();
    if (motion.reduced) { conclude(); return; } // no spatial travel when motion is suppressed
    startJourney();
  }

  function skip() {
    if (state === 'closed') return;
    if (mode === 'initial') session.markEntered();
    conclude();
  }

  // Escape: cancels a journey, leaves a voluntary replay, and does nothing on the idle initial gateway.
  function escape() {
    if (state === 'entering') skip();
    else if (state === 'idle' && mode === 'replay') conclude();
  }

  enterButton.addEventListener('click', enter);
  skipButton.addEventListener('click', skip);
  returnButton.addEventListener('click', () => conclude());
  pauseButton.addEventListener('click', () => motion.toggleManualPaused());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.isComposing) return;
    event.preventDefault(); // also stops the browser's own dismissal, so only escape() decides
    escape();
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); escape(); });
  // Safety net for a native dismissal that skips keydown/cancel: an unexpected close must not strand or trap anyone.
  dialog.addEventListener('close', () => {
    if (dialog.open || state === 'closed') return;
    if (mode === 'initial' && state === 'idle') { try { dialog.showModal(); enterButton.focus({ preventScroll: true }); } catch { conclude(false); } } else conclude();
  });

  // A preference change settles the journey into the usable destination; re-enabling motion never replays it.
  motion.subscribe(reduced => {
    syncMotionControl();
    if (reduced && state === 'entering') conclude();
  });
  syncMotionControl();

  return {
    get active() { return state !== 'closed'; },
    show() { if (state === 'closed') present('initial'); },
    replay(invoker = null) {
      if (state !== 'closed' || !canReplay()) return false;
      // The invoker is passed explicitly: Safari-family browsers do not focus a button on click, so activeElement is unreliable.
      context = { x: win.scrollX, y: win.scrollY, focus: invoker ?? doc.activeElement };
      present('replay');
      return state !== 'closed';
    },
    yieldToShowcase() {
      if (state === 'closed') return;
      if (mode === 'initial') session.markEntered();
      conclude(false);
    }
  };
}
