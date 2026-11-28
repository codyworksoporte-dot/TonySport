/**
 * Runs synchronously in the document head, before the body can paint.
 * CSSOM changes leave the server markup intact for React hydration.
 */
const bootstrap = `(() => {
  if (!['/', '/TonySport', '/TonySport/'].includes(location.pathname)) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let seen = false;
  try { seen = sessionStorage.getItem('tony:intro:wordmark:v1') === 'seen'; } catch {}
  let paused = false;
  try { paused = localStorage.getItem('tony:ambient-effects:v1') === 'off'; } catch {}
  if (seen || paused || preference.matches) return;
  const deadline = matchMedia('(max-width: 700px)').matches ? 2200 : 5500;
  const sheet = document.getElementById('tony-intro-boot-style')?.sheet;
  if (!sheet) return;
  let timer;
  const state = {
    pending: true,
    cancelled: false,
    release(cancelled = state.cancelled) {
      state.pending = false;
      state.cancelled = cancelled;
      clearTimeout(timer);
      while (sheet.cssRules.length) sheet.deleteRule(0);
      removeEventListener('keydown', escape);
      preference.removeEventListener('change', reduce);
    }
  };
  function escape(event) {
    if (event.key !== 'Escape') return;
    state.release(true);
    try { sessionStorage.setItem('tony:intro:wordmark:v1', 'seen'); } catch {}
  }
  function reduce() { if (preference.matches) state.release(true); }
  window.__tonyIntroBoot = state;
  sheet.insertRule('html::before { content: ""; position: fixed; inset: 0; z-index: 2147483647; background: #080b09; pointer-events: auto; animation: tony-intro-boot-failsafe 1ms ' + deadline + 'ms forwards; }');
  sheet.insertRule('@keyframes tony-intro-boot-failsafe { to { visibility: hidden; pointer-events: none; } }');
  sheet.insertRule('@media (prefers-reduced-motion: reduce) { html::before { display: none !important; } }');
  sheet.insertRule('body { overflow: hidden !important; }');
  sheet.insertRule('.tc-rise { animation-play-state: paused !important; }');
  addEventListener('keydown', escape);
  preference.addEventListener('change', reduce);
  timer = setTimeout(() => state.release(true), deadline);
})();`;

export default function BrandIntroBootstrap() {
  return <><style id="tony-intro-boot-style" /><script id="tony-intro-bootstrap" dangerouslySetInnerHTML={{ __html: bootstrap }} /></>;
}
