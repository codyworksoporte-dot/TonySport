'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AMBIENT } from '@/lib/ambient-config';
import { siteAsset } from '@/lib/asset-path';
import { TonyClaw, TonyFace } from './TonyArt';
import './route-transition.css';

type Phase = 'idle' | 'cover' | 'wink' | 'reveal';
const { transition } = AMBIENT;

/**
 * Changing section: the scales close over the page, a ring spreading from the
 * link you clicked; Tony comes up holding the Tony shield, winks once the new
 * section is ready, then lets you in. Every moving part is a transform or an
 * opacity, so the compositor keeps it smooth while the new page renders.
 * Purely decorative: it never takes clicks or focus and skips when motion is off.
 */
export default function RouteTransition() {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const run = useRef({ phase: 'idle' as Phase, coveredAt: 0, timers: [] as number[], warm: 0 });
  const shown = useRef(pathname);

  const set = (phase: Phase) => {
    if (run.current.phase === phase) return;
    run.current.phase = phase;
    if (root.current) root.current.dataset.phase = phase;
  };
  const clear = () => { run.current.timers.forEach(id => clearTimeout(id)); run.current.timers = []; };
  const later = (callback: () => void, ms: number) => { run.current.timers.push(window.setTimeout(callback, ms)); };
  const allowed = () => !matchMedia('(prefers-reduced-motion: reduce)').matches
    && document.documentElement.dataset.tonyEffects !== 'off'
    && !document.querySelector('.lagarto-intro[open]');
  /** While the page is covered its entrance animations wait (RevealText, the hero) and so does the peeking lizard. */
  const setCovered = (covered: boolean) => {
    const html = document.documentElement;
    if (covered === (html.dataset.routeCover === 'true')) return;
    if (covered) html.dataset.routeCover = 'true';
    else delete html.dataset.routeCover;
    window.dispatchEvent(new Event(covered ? 'tony:route-cover' : 'tony:route-reveal'));
  };
  /**
   * Load and decode the artwork ahead of time, then draw every layer once, nearly
   * transparent: the GPU rasterises its tiles and prepares its shaders now instead
   * of on the first frames of the first section change (measured: from about half
   * the frames dropped to about one in ten on a fresh browser).
   */
  const arm = () => {
    const element = root.current;
    if (!element || element.classList.contains('is-armed')) return;
    element.classList.add('is-armed');
    const texture = new Image();
    texture.src = siteAsset('/assets/escamas-tony-brasa.webp');
    const decoded = [texture, ...element.querySelectorAll('img')].map(image => image.decode().catch(() => { /* Drawn when it arrives. */ }));
    Promise.all(decoded).then(() => {
      if (run.current.phase !== 'idle' || !root.current) return;
      element.classList.add('is-warming');
      run.current.warm = window.setTimeout(() => element.classList.remove('is-warming'), 400);
    });
  };
  const stopWarming = () => { clearTimeout(run.current.warm); root.current?.classList.remove('is-warming'); };

  const reveal = () => {
    clear();
    set('reveal');
    setCovered(false);
    later(() => set('idle'), transition.revealMs);
  };
  const wink = () => {
    clear();
    set('wink');
    later(reveal, transition.winkMs);
  };
  const cover = (x: number, y: number) => {
    clear();
    arm();
    stopWarming();
    root.current?.style.setProperty('--from-x', `${Math.round(x)}px`);
    root.current?.style.setProperty('--from-y', `${Math.round(y)}px`);
    set('cover');
    setCovered(true);
    run.current.coveredAt = performance.now();
    later(reveal, transition.timeoutMs);
  };

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;
      // The logo replays the intro, which is its own entrance.
      if (anchor.closest('.brand, [data-no-transition]')) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || !allowed()) return;
      cover(event.clientX || innerWidth / 2, event.clientY || innerHeight / 2);
    };
    const onIntro = () => { clear(); set('idle'); setCovered(false); };
    const idle = window.requestIdleCallback?.(arm, { timeout: 2500 }) ?? window.setTimeout(arm, 1200);
    document.addEventListener('click', onClick, true);
    window.addEventListener('tony:intro-start', onIntro);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('tony:intro-start', onIntro);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle); else clearTimeout(idle);
      clear();
      stopWarming();
      setCovered(false);
    };
  }, []);

  useEffect(() => {
    // Effects can run twice for the same page (Strict Mode): only a new path counts.
    if (shown.current === pathname) return;
    shown.current = pathname;
    if (run.current.phase === 'cover') {
      // Let Tony arrive before the wink, however fast the page was.
      clear();
      later(wink, Math.max(0, transition.arriveMs - (performance.now() - run.current.coveredAt)));
    } else if (run.current.phase === 'idle' && allowed()) {
      // Back and forward buttons: the same visit over the page that just arrived.
      cover(innerWidth / 2, innerHeight / 2);
      clear();
      later(wink, transition.arriveMs);
    }
  }, [pathname]);

  return <div ref={root} className="route-transition" data-phase="idle" aria-hidden="true">
    <div className="rt-panel"/>
    <span className="rt-ring"/>
    <div className="rt-stage">
      <div className="rt-emblem">
        <span className="rt-shadow"/>
        <TonyFace className="rt-head"/>
        <div className="rt-plaque"><img src={siteAsset('/assets/tony-wordmark.webp')} alt="" width="720" height="351" decoding="async" draggable={false}/></div>
        <div className="rt-claw rt-claw--left"><TonyClaw/></div>
        <div className="rt-claw rt-claw--right"><TonyClaw flip/></div>
      </div>
    </div>
  </div>;
}
