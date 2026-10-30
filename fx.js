// Click feedback: a brief burst of ASCII glyphs from the activated control. Purely decorative and never in the way:
// the marks ignore pointer events, last well under half a second, are removed when done, are capped in number, and
// are skipped entirely when the shared motion policy asks for reduced motion or the Web Animations API is missing.
//
// const stop = installClickFeedback({ motion, root: document });
const TARGETS = 'button, .button, a.text-link, .contact-links a, .site-header nav a, .resume-link';
const GLYPHS = ['+', '*', '.', ':', '·'];
const MAX_LIVE = 24;
const LIFE_MS = 420;

export function installClickFeedback({ motion, root = document, win = window }) {
  let live = 0;

  // The host is the control's own modal dialog when it has one: an open dialog sits in the top layer above the page.
  function burst(x, y, host) {
    const spawned = [];
    for (let i = 0; i < 6 && live < MAX_LIVE; i += 1) {
      const mark = root.createElement('span');
      mark.textContent = GLYPHS[i % GLYPHS.length];
      mark.setAttribute('aria-hidden', 'true');
      mark.style.cssText = `position:fixed;left:${x}px;top:${y}px;margin:-.5em 0 0 -.3em;z-index:2147483600;pointer-events:none;`
        + 'font:600 14px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#fff;will-change:transform,opacity';
      host.append(mark);
      live += 1;
      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
      const distance = 18 + Math.random() * 14;
      const remove = () => { if (mark.isConnected) { mark.remove(); live -= 1; } };
      try {
        mark.animate(
          [{ transform: 'translate(0,0) scale(1)', opacity: 0.95 },
            { transform: `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance}px) scale(.6)`, opacity: 0 }],
          { duration: LIFE_MS, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' },
        ).onfinish = remove;
      } catch { remove(); continue; }
      setTimeout(remove, LIFE_MS + 250); // animation events can be lost in background tabs; never leak a mark
      spawned.push(mark);
    }
    return spawned;
  }

  const onClick = event => {
    if (motion.reduced || typeof Element.prototype.animate !== 'function' || !event.isTrusted) return;
    const target = event.target instanceof Element ? event.target.closest(TARGETS) : null;
    if (!target || target.disabled) return;
    let { clientX: x, clientY: y } = event;
    if (!event.detail) { // keyboard activation: burst from the control itself
      const rect = target.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
    burst(x, y, target.closest('dialog') || root.body || root.documentElement);
  };
  root.addEventListener('click', onClick, { capture: true, passive: true });
  return () => root.removeEventListener('click', onClick, { capture: true });
}
