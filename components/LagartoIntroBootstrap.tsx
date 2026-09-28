/**
 * Runs synchronously in the document head, before the body can paint.
 * CSSOM changes leave the server markup intact for React hydration.
 */
import { siteAsset } from '@/lib/asset-path';
const bootTexture = siteAsset('/assets/escamas-tony-base.webp');
const bootstrap = `(() => {
  if (!['/', '/TonySport', '/TonySport/'].includes(location.pathname)) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let seen = false;
  try { seen = sessionStorage.getItem('tony:intro:v2') === 'seen'; } catch {}
  if (seen || preference.matches || matchMedia('(max-width: 900px), (pointer: coarse)').matches) return;
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
    try { sessionStorage.setItem('tony:intro:v2', 'seen'); } catch {}
  }
  function reduce() { if (preference.matches) state.release(true); }
  window.__tonyIntroBoot = state;
  sheet.insertRule('html::before { content: ""; position: fixed; inset: 0; z-index: 2147483647; background: linear-gradient(115deg, #173b29dd, #0b221ad9), url("${bootTexture}") 0 0 / 640px, #13382a; pointer-events: auto; animation: tony-intro-boot-failsafe 1ms 8s forwards; }');
  sheet.insertRule('@keyframes tony-intro-boot-failsafe { to { visibility: hidden; pointer-events: none; } }');
  sheet.insertRule('@media (prefers-reduced-motion: reduce) { html::before { display: none !important; } }');
  sheet.insertRule('body { overflow: hidden !important; }');
  addEventListener('keydown', escape);
  preference.addEventListener('change', reduce);
  timer = setTimeout(() => state.release(true), 8000);
})();`;

export default function LagartoIntroBootstrap() {
  return <><style id="tony-intro-boot-style" /><script id="tony-intro-bootstrap" dangerouslySetInnerHTML={{ __html: bootstrap }} /></>;
}
