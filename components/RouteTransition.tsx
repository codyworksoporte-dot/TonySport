'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { AMBIENT } from '@/lib/ambient-config';
import { siteAsset } from '@/lib/asset-path';
import { whenPageSettles } from '@/lib/page-settled';
import TonyWordmark from './TonyWordmark';
import './route-transition.css';

type Phase = 'idle' | 'cover' | 'wink' | 'reveal';
const { transition } = AMBIENT;
const MOBILE = '(max-width: 900px), (pointer: coarse)';

/**
 * Changing section: the scales close over the page, a ring spreading from the
 * link you clicked; the Tony logo slams in, it settles once the
 * new section is ready, then lets you in. Every moving part is a transform or an
 * opacity, so the compositor keeps it smooth while the new page renders.
 * Purely decorative: it never takes clicks or focus and skips when motion is off.
 */
export default function RouteTransition() {
  const pathname = usePathname();
  const [art, setArt] = useState<'pending' | 'mobile' | 'full'>('pending');
  const root = useRef<HTMLDivElement>(null);
  const run = useRef({ phase: 'idle' as Phase, coveredAt: 0, mobile: false, timers: [] as number[], warm: 0, generation: 0, artShown: false });
  const shown = useRef(pathname);
  /**
   * The artwork (and its logo file, at low priority) mounts once the page has settled, so it never competes with
   * the page's own images, or as soon as the visitor touches, clicks or types, since a section change may follow.
   * A section change before either mounts it right away.
   */
  const showArt = () => { run.current.artShown = true; setArt(matchMedia(MOBILE).matches ? 'mobile' : 'full'); };

  const set = (phase: Phase) => {
    if (run.current.phase === phase) return;
    run.current.phase = phase;
    if (root.current) root.current.dataset.phase = phase;
  };
  const clear = () => { run.current.timers.forEach(id => clearTimeout(id)); run.current.timers = []; };
  const later = (callback: () => void, ms: number) => { run.current.timers.push(window.setTimeout(callback, ms)); };
  const allowed = () => !document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches
    && document.documentElement.dataset.tonyEffects !== 'off'
    && !document.querySelector('.brand-intro[open]');
  /** While the page is covered its entrance animations wait (RevealText, the hero). */
  const setCovered = (covered: boolean) => {
    const html = document.documentElement;
    if (covered === (html.dataset.routeCover === 'true')) return;
    if (covered) html.dataset.routeCover = 'true';
    else delete html.dataset.routeCover;
    window.dispatchEvent(new Event(covered ? 'tony:route-cover' : 'tony:route-reveal'));
  };
  /**
   * Load and decode the artwork ahead of time, then draw every layer once, nearly
   * transparent on desktop. The mobile cover uses a flat surface and cached
   * logo, without downloading the desktop texture or adding blur.
   */
  const arm = () => {
    const element = root.current;
    if (!element || matchMedia(MOBILE).matches || !allowed() || element.classList.contains('is-armed')) return;
    const generation = ++run.current.generation;
    element.classList.add('is-armed');
    const texture = new Image();
    texture.src = siteAsset('/assets/escamas-tony-brasa.webp');
    const decoded = [texture, ...element.querySelectorAll('img')].map(image => image.decode().catch(() => { /* Drawn when it arrives. */ }));
    Promise.all(decoded).then(() => {
      if (generation !== run.current.generation || run.current.phase !== 'idle' || !root.current || !allowed()) return;
      element.classList.add('is-warming');
      run.current.warm = window.setTimeout(() => element.classList.remove('is-warming'), 400);
    });
  };
  const stopWarming = () => { run.current.generation++; clearTimeout(run.current.warm); root.current?.classList.remove('is-warming'); };

  const reveal = () => {
    clear();
    set('reveal');
    setCovered(false);
    later(() => set('idle'), run.current.mobile ? transition.mobile.revealMs : transition.revealMs);
  };
  const wink = () => {
    clear();
    set('wink');
    later(reveal, run.current.mobile ? transition.mobile.winkMs : transition.winkMs);
  };
  const cover = (x: number, y: number) => {
    clear();
    run.current.mobile = matchMedia(MOBILE).matches;
    if (!run.current.artShown) showArt();
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
      if (anchor.closest('[data-no-transition]') || (anchor.closest('.brand') && !matchMedia(MOBILE).matches)) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || !allowed()) return;
      cover(event.clientX || innerWidth / 2, event.clientY || innerHeight / 2);
    };
    const onIntro = () => { clear(); stopWarming(); set('idle'); setCovered(false); };
    const mobile = matchMedia(MOBILE), reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {onIntro(); if (run.current.artShown) showArt();};
    const interrupted = () => {if (!allowed()) onIntro();};
    update();
    const settled = whenPageSettles(() => { if (!run.current.artShown) showArt(); }, { imageWait: 3000 });
    const interest = ['pointerdown', 'touchstart', 'keydown'] as const;
    const stopListening = () => interest.forEach(type => document.removeEventListener(type, onInterest, true));
    function onInterest() { stopListening(); if (!run.current.artShown) showArt(); }
    interest.forEach(type => document.addEventListener(type, onInterest, { capture: true, passive: true }));
    document.addEventListener('click', onClick, true);
    window.addEventListener('tony:intro-start', onIntro);
    window.addEventListener('tony:effects-change', interrupted);
    document.addEventListener('visibilitychange', interrupted);
    mobile.addEventListener('change', update);
    reduced.addEventListener('change', interrupted);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('tony:intro-start', onIntro);
      window.removeEventListener('tony:effects-change', interrupted);
      document.removeEventListener('visibilitychange', interrupted);
      mobile.removeEventListener('change', update);
      reduced.removeEventListener('change', interrupted);
      settled();
      stopListening();
      clear();
      stopWarming();
      setCovered(false);
    };
  }, []);

  // Desktop: once the artwork is drawn, load and decode it (and the scales texture) ahead of the first change.
  useEffect(() => {
    if (art !== 'full') return;
    const idle = window.requestIdleCallback?.(arm, { timeout: 2500 }) ?? window.setTimeout(arm, 1200);
    return () => { if (window.cancelIdleCallback) window.cancelIdleCallback(idle); else clearTimeout(idle); };
  }, [art]);

  useEffect(() => {
    // Effects can run twice for the same page (Strict Mode): only a new path counts.
    if (shown.current === pathname) return;
    shown.current = pathname;
    if (run.current.phase === 'cover') {
      // Let the logo settle, however fast the page was.
      clear();
      later(wink, Math.max(0, (run.current.mobile ? transition.mobile.arriveMs : transition.arriveMs) - (performance.now() - run.current.coveredAt)));
    } else if (allowed()) {
      // Back and forward buttons: the same visit over the page that just arrived.
      cover(innerWidth / 2, innerHeight / 2);
      clear();
      later(wink, run.current.mobile ? transition.mobile.arriveMs : transition.arriveMs);
    }
  }, [pathname]);

  return <div ref={root} className="route-transition" data-phase="idle" data-art={art} aria-hidden="true" style={{
    '--rt-mobile-arrive': `${transition.mobile.arriveMs}ms`,
    '--rt-mobile-wink': `${transition.mobile.winkMs}ms`,
    '--rt-mobile-reveal': `${transition.mobile.revealMs}ms`,
  } as CSSProperties}>
    {art === 'mobile' && <div className="rt-mobile">
      <div className="rt-mobile-content">
        <div className="rt-mobile-emblem">
          <TonyWordmark className="rt-mobile-badge" sizes="min(72vw, 290px)" fetchPriority="low"/>
        </div>
        <span className="rt-mobile-label">Cambiando apartado</span>
        <span className="rt-mobile-track"><i className="rt-mobile-progress"/></span>
      </div>
    </div>}
    {art === 'full' && <>
    <div className="rt-panel"/>
    <span className="rt-ring"/>
    <div className="rt-stage">
      <div className="rt-emblem">
        <span className="rt-shadow"/>
        <TonyWordmark className="rt-badge" sizes="min(72vmin, 500px)" fetchPriority="low"/>
      </div>
    </div></>}
  </div>;
}
