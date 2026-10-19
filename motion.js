// Shared motion policy. Effective rule: manual Pause OR operating-system reduced motion.
// This module owns the state; renderers (the ASCII black hole today, anything later) only consume it.
// There is deliberately one manual preference (Pause) and no per-feature settings.
//
// const motion = createMotionPolicy();
// motion.reduced                 // true when either source asks for reduced motion
// motion.manualPaused            // the visitor's Pause toggle
// motion.systemReduced           // prefers-reduced-motion: reduce
// motion.setManualPaused(bool) / motion.toggleManualPaused()
// motion.subscribe(fn)           // fn(reduced, motion) on every source change; returns an unsubscribe function
export function createMotionPolicy(win = window) {
  const query = typeof win.matchMedia === 'function' ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const listeners = new Set();
  let manualPaused = false;
  const notify = () => listeners.forEach(fn => fn(policy.reduced, policy));
  const policy = {
    get manualPaused() { return manualPaused; },
    get systemReduced() { return Boolean(query?.matches); },
    get reduced() { return manualPaused || Boolean(query?.matches); },
    setManualPaused(value) { manualPaused = Boolean(value); notify(); },
    toggleManualPaused() { policy.setManualPaused(!manualPaused); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
  if (query) {
    if (query.addEventListener) query.addEventListener('change', notify);
    else if (query.addListener) query.addListener(notify);
  }
  return policy;
}
