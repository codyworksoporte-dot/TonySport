'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { whenPageSettles } from '@/lib/page-settled';
import BrandScreenArt from './BrandScreenArt';
import './route-transition.css';

type Phase = 'idle' | 'cover' | 'wink' | 'reveal';
const transition = {
  mobile: {arriveMs: 240, winkMs: 280, revealMs: 200},
  arriveMs: 480, winkMs: 300, revealMs: 380, timeoutMs: 3200,
};
const MOBILE = '(max-width: 900px), (pointer: coarse)';

/** The decorative cover follows navigation without intercepting clicks or focus. */
export default function RouteTransition() {
  const pathname = usePathname();
  const [art, setArt] = useState<'pending' | 'mobile' | 'full'>('pending');
  const root = useRef<HTMLDivElement>(null);
  const destination = useRef<string | null>(null);
  const run = useRef({ phase: 'idle' as Phase, coveredAt: 0, mobile: false, timers: [] as number[], artShown: false });
  const shown = useRef(pathname);
  /**
   * The artwork (and its logo file, at low priority) mounts once the page has settled, so it never competes with
   * the page's own images, or as soon as the visitor touches, clicks or types, since a section change may follow.
   * A section change before either mounts it right away.
   */
  const showArt = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.tonyEffects === 'off') return;
    run.current.artShown = true;
    setArt(matchMedia(MOBILE).matches ? 'mobile' : 'full');
  };

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
  const cover = () => {
    clear();
    run.current.mobile = matchMedia(MOBILE).matches;
    if (!run.current.artShown) showArt();
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
      if (anchor.closest('[data-no-transition]')) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || !allowed()) return;
      destination.current = url.pathname.replace(/\/$/, '');
      cover();
    };
    const onIntro = () => { clear(); set('idle'); setCovered(false); };
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
      setCovered(false);
    };
  }, []);

  useEffect(() => {
    // Effects can run twice for the same page (Strict Mode): only a new path counts.
    if (shown.current === pathname) return;
    shown.current = pathname;
    const expectedArrival = destination.current === location.pathname.replace(/\/$/, '');
    destination.current = null;
    if (run.current.phase === 'cover') {
      // Let the logo settle, however fast the page was.
      clear();
      later(wink, Math.max(0, (run.current.mobile ? transition.mobile.arriveMs : transition.arriveMs) - (performance.now() - run.current.coveredAt)));
    } else if (!expectedArrival && allowed()) {
      // Back and forward buttons: the same visit over the page that just arrived.
      cover();
      clear();
      later(wink, run.current.mobile ? transition.mobile.arriveMs : transition.arriveMs);
    }
  }, [pathname]);

  return <div ref={root} className="route-transition" data-phase="idle" data-art={art} aria-hidden="true"
    style={{'--rt-reveal': `${art === 'mobile' ? transition.mobile.revealMs : transition.revealMs}ms`} as CSSProperties}>
    {art !== 'pending' && <>
      <BrandScreenArt/>
      {art === 'mobile' && <div className="rt-mobile-status">
        <span>Cambiando apartado</span>
        <span className="rt-mobile-track"><i/></span>
      </div>}
    </>}
  </div>;
}
