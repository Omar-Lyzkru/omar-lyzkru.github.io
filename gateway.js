// Entrance gateway controller: the dedicated native modal that precedes the portfolio.
// It coordinates with, but never replaces, the project showcase coordinator in app.js, and it never touches history.
// Motion comes from the shared policy (motion.js), session state from session.js; nothing here stores preferences.
//
// Lifecycle: closed -> idle -> entering -> closed. 'idle' is the resting presentation (initial or voluntary replay);
// 'entering' lasts while the inward journey plays. Every way out (journey end, Skip, Return, Escape, a preference
// change, a failed journey, a showcase taking over) goes through conclude(), so there is one finalization path and
// stale callbacks (which compare against the current run) cannot touch a newer state.
//
// The animated ASCII scene is an enhancement. It is loaded lazily through loadScene(), mounted when the gateway is
// presented and destroyed when it concludes. The gateway never depends on it: if the module fails to load, a canvas
// context is missing, or the journey cannot start, the controls still work and the visitor still reaches the portfolio.
// dialog.dataset.scene reports 'loading' | 'ready' | 'fallback' so CSS can show a static character fallback.
//
// const gateway = createGateway({ dialog, motion, session, sound, loadScene, canReplay });
// gateway.show()          // initial presentation; only call it for an eligible route and session
// gateway.replay(invoker) // voluntary replay from the normal portfolio; focus returns to invoker. False if it cannot open
// gateway.yieldToShowcase() // a project showcase is about to open: leave without restoring focus or scroll
// gateway.active          // true from show()/replay() until the gateway has fully concluded
export const JOURNEY_MS = 2800;
const SAFETY_MS = 700;    // the journey is force-finished this long after its nominal end, whatever the renderer does
const FALLBACK_MS = 380;  // the short dissolve used when there is no scene to travel through
const SECTION_IDS = new Set(['main', 'work', 'toolkit', 'about', 'contact']);
const silent = { play() { return false; }, stop() {} };

// Where the hole sits on screen: right of the copy on wide screens, above it on tall ones (matches the CSS scrim).
export function gatewayLayout(width, height) {
  return width / height <= 0.8
    ? { cx: 0.5, cy: 0.3, radius: Math.min(width * 0.36, height * 0.21) }
    : { cx: 0.66, cy: 0.5, radius: Math.min(width * 0.22, height * 0.33) };
}

const smoothstep = (a, b, value) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function createGateway({ dialog, motion, session, sound = silent, loadScene = null, canReplay = () => true, doc = document, win = window }) {
  const root = doc.documentElement;
  const part = name => dialog.querySelector(`[data-gateway-${name}]`);
  const enterButton = part('enter');
  const skipButton = part('skip');
  const returnButton = part('return');
  const pauseButton = part('motion');
  const pauseLabel = part('motion-label');
  const status = part('status');
  const canvas = part('canvas');

  let state = 'closed'; // 'closed' | 'idle' | 'entering'
  let mode = 'initial'; // 'initial' | 'replay'
  let run = null;       // the single in-flight journey: { timer }
  let context = null;   // replay only: the portfolio scroll position and focus to restore
  let scene = null;     // the mounted ASCII scene, if any
  let sceneToken = 0;   // invalidates a scene load that finishes after the gateway has moved on

  const setState = value => { state = value; dialog.dataset.state = value; };
  const setScene = value => { dialog.dataset.scene = value; };

  function syncMotionControl() {
    const system = motion.systemReduced;
    pauseButton.disabled = system;
    pauseButton.setAttribute('aria-pressed', String(motion.reduced));
    pauseButton.setAttribute('aria-label', system ? 'Reduced motion' : motion.manualPaused ? 'Resume motion' : 'Pause motion');
    pauseLabel.textContent = system ? 'Reduced motion' : motion.manualPaused ? 'Resume motion' : 'Pause motion';
  }

  function unmountScene() {
    sceneToken += 1; // a load still in flight must not mount into a gateway that is gone
    const current = scene;
    scene = null;
    try { current?.destroy(); } catch { /* the loop is already unreferenced */ }
  }

  function mountScene() {
    unmountScene();
    const token = sceneToken;
    if (!loadScene || !canvas) { setScene('fallback'); return; }
    setScene('loading');
    Promise.resolve().then(loadScene).then(module => {
      if (token !== sceneToken || state === 'closed') return;
      const next = module.mountBlackHole(canvas, { fps: 20, layout: gatewayLayout, paused: motion.reduced });
      if (!next?.ready) { try { next?.destroy(); } catch { /* inert */ } setScene('fallback'); return; }
      scene = next;
      setScene('ready');
    }).catch(() => { if (token === sceneToken) setScene('fallback'); });
  }

  function endRun() {
    const current = run;
    if (!current) return;
    run = null;
    clearTimeout(current.timer);
    try { scene?.cancelTravel(); } catch { /* ignore */ }
    sound.stop('journey');
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
    unmountScene();
    const wasMode = mode;
    const saved = context;
    context = null;
    setState('closed');
    dialog.style.opacity = '';
    dialog.style.transition = '';
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
    dialog.style.opacity = '';
    dialog.style.transition = '';
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
      return;
    }
    mountScene(); // after the dialog is laid out, so the canvas has its real size
  }

  function startJourney() {
    setState('entering');
    status.textContent = 'Entering the portfolio…';
    // Enter is spent for this journey; Skip (or Return, in replay) stays available and takes the focus.
    const keep = mode === 'replay' ? returnButton : skipButton;
    keep.focus({ preventScroll: true });
    enterButton.hidden = true;
    const current = { timer: 0 };
    run = current;
    const done = () => { if (run === current) conclude(); };
    current.timer = setTimeout(done, JOURNEY_MS + SAFETY_MS); // the renderer can stall or fail; entry never depends on it
    let started = false;
    try {
      started = Boolean(scene?.travel({
        duration: JOURNEY_MS,
        // The scene itself falls toward the hole; over the last stretch the dialog dissolves into the portfolio beneath it.
        onProgress: progress => { if (run === current) dialog.style.opacity = String(1 - smoothstep(0.86, 1, progress)); },
        onComplete: done,
      }));
    } catch { started = false; }
    if (started) { sound.play('journey'); return; }
    // No scene to travel through (not loaded, no canvas, or it failed): a short plain dissolve, still bounded.
    clearTimeout(current.timer);
    dialog.style.transition = `opacity ${FALLBACK_MS}ms ease-out`;
    dialog.style.opacity = '0';
    current.timer = setTimeout(done, FALLBACK_MS + 60);
  }

  function enter() {
    if (state !== 'idle') return; // repeated activation never stacks journeys
    if (mode === 'initial') session.markEntered();
    if (motion.reduced) { sound.play('click'); conclude(); return; } // no spatial travel when motion is suppressed
    startJourney();
  }

  function skip() {
    if (state === 'closed') return;
    if (mode === 'initial') session.markEntered();
    sound.play('click');
    conclude();
  }

  // Escape: cancels a journey, leaves a voluntary replay, and does nothing on the idle initial gateway.
  function escape() {
    if (state === 'entering') skip();
    else if (state === 'idle' && mode === 'replay') conclude();
  }

  enterButton.addEventListener('click', enter);
  skipButton.addEventListener('click', skip);
  returnButton.addEventListener('click', () => { sound.play('click'); conclude(); });
  pauseButton.addEventListener('click', () => { sound.play('click'); motion.toggleManualPaused(); });
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
    try { scene?.setPaused(reduced); } catch { /* the scene is decorative */ }
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
