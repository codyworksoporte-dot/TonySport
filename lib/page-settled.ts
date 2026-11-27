/**
 * Runs `task` once the page has loaded, the images on screen have arrived (or `imageWait` ms passed)
 * and the main thread is idle, so work that can wait (decorative artwork for later, code for features
 * nobody opened yet) never competes with what the visitor is looking at. Returns a cancel function.
 */
export function whenPageSettles(task: () => void, {imageWait = 5000, idleTimeout = 2500} = {}): () => void {
  let cancelled = false, idle = 0, timer = 0;
  const cleanups: (() => void)[] = [];
  const run = () => { if (!cancelled) task(); };
  const idleThen = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(run, {timeout: idleTimeout});
    else timer = window.setTimeout(run, 1200);
  };
  const onScreen = (image: HTMLImageElement) => {
    const box = image.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.bottom > 0 && box.right > 0 && box.top < innerHeight && box.left < innerWidth;
  };
  const afterImages = () => {
    if (cancelled) return;
    const pending = [...document.images].filter(image => !image.complete && onScreen(image));
    if (!pending.length) { idleThen(); return; }
    let left = pending.length, finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(cap);
      pending.forEach(image => { image.removeEventListener('load', done); image.removeEventListener('error', done); });
      idleThen();
    };
    const done = () => { if (--left <= 0) finish(); };
    pending.forEach(image => { image.addEventListener('load', done); image.addEventListener('error', done); });
    const cap = window.setTimeout(finish, imageWait);
    cleanups.push(() => { finished = true; clearTimeout(cap); pending.forEach(image => { image.removeEventListener('load', done); image.removeEventListener('error', done); }); });
  };
  if (document.readyState === 'complete') afterImages();
  else {
    window.addEventListener('load', afterImages, {once: true});
    cleanups.push(() => window.removeEventListener('load', afterImages));
  }
  return () => {
    cancelled = true;
    cleanups.forEach(cleanup => cleanup());
    if (idle && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle);
    clearTimeout(timer);
  };
}
