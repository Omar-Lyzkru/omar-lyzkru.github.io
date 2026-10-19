// Entered-portfolio session state: one host-only browser session cookie.
// - No Domain attribute (host-only), no Expires/Max-Age (browser-session lifetime), Path=/, SameSite=Lax,
//   and Secure on HTTPS. The value is the constant "1": no identifier, no personal data, no remembered-visitor setting.
// - Limitation: browsers may restore session cookies after a restart (session restore), so "this session" means the
//   browser-defined session, not a guaranteed reset on every restart.
// States: 'entered', 'not-entered', 'unavailable' (cookies blocked or inaccessible).
const NAME = 'portfolio_entered';

function attributes(win) {
  return `; Path=/; SameSite=Lax${win.location.protocol === 'https:' ? '; Secure' : ''}`;
}

function readCookie(doc) {
  return doc.cookie.split(';').some(part => part.trim() === `${NAME}=1`);
}

export function createEntrySession(win = window) {
  const doc = win.document;
  return {
    // Never throws.
    state() {
      try {
        if (win.navigator.cookieEnabled === false) return 'unavailable';
        return readCookie(doc) ? 'entered' : 'not-entered';
      } catch { return 'unavailable'; }
    },
    // Records entry. Returns true only if the cookie is readable afterwards. Never throws.
    markEntered() {
      try {
        if (win.navigator.cookieEnabled === false) return false;
        doc.cookie = `${NAME}=1${attributes(win)}`;
        return readCookie(doc);
      } catch { return false; }
    }
  };
}
