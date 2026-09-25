'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TonyClawInSvg, TonyFaceInSvg } from './TonyArt';
import { siteAsset } from '@/lib/asset-path';
import './lagarto-intro.css';

const SESSION_KEY = 'tony:intro:v2';
const WORDMARK_SRC = siteAsset('/assets/tony-wordmark.webp');
const INTRO_DURATION = 4200;
type IntroBoot = { pending: boolean; cancelled: boolean; release: (cancelled?: boolean) => void };
const introBoot = () => (window as Window & { __tonyIntroBoot?: IntroBoot }).__tonyIntroBoot;

/**
 * The emblem: Tony peeks over the shield and grips its edges, as in the brand
 * logo. Head and claws are the logo artwork itself, shared with every mascot.
 * With `blink`, he blinks now and then, only while the emblem is on screen.
 */
export function LagartoMark({ className = '', animated = false, referenceFace = false, blink = false }: { className?: string; animated?: boolean; referenceFace?: boolean; blink?: boolean }) {
  const id = useId().replace(/[^\w-]/g, '');
  const [wordmarkReady, setWordmarkReady] = useState(false);
  const mark = useRef<SVGSVGElement>(null);
  const paint = (name: string) => `url(#${id}-${name})`;

  // The wordmark can finish loading before hydration, when the <image> load event is lost: ask the cache.
  useEffect(() => {
    const probe = new Image();
    probe.onload = () => setWordmarkReady(true);
    probe.onerror = () => setWordmarkReady(false);
    probe.src = WORDMARK_SRC;
    if (probe.complete && probe.naturalWidth) setWordmarkReady(true);
    return () => { probe.onload = probe.onerror = null; };
  }, []);

  useEffect(() => {
    const element = mark.current;
    if (!blink || !element) return;
    const observer = new IntersectionObserver(([entry]) => element.classList.toggle('is-blinking', entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [blink]);

  return (
    <svg ref={mark} className={`lagarto-mark ${animated ? 'lagarto-mark--enter' : ''} ${className}`} viewBox="0 0 640 600" fill="none" role="img" aria-label="Lagarto Tony: garra, carácter e identidad">
      <defs>
        <linearGradient id={`${id}-gold`} x1="194" y1="247" x2="443" y2="487" gradientUnits="userSpaceOnUse"><stop stopColor="#ff9a38"/><stop offset=".23" stopColor="#ff781e"/><stop offset=".66" stopColor="#ec570b"/><stop offset="1" stopColor="#ff9431"/></linearGradient>
        <linearGradient id={`${id}-shield`} x1="223" y1="250" x2="395" y2="478" gradientUnits="userSpaceOnUse"><stop stopColor="#2b5940"/><stop offset=".3" stopColor="#143d2b"/><stop offset="1" stopColor="#09271e"/></linearGradient>
        <linearGradient id={`${id}-letter`} x1="320" y1="302" x2="320" y2="397" gradientUnits="userSpaceOnUse"><stop stopColor="#e7ffa5"/><stop offset=".5" stopColor="#b4ff35"/><stop offset="1" stopColor="#74ce32"/></linearGradient>
        <pattern id={`${id}-scale`} width="28" height="24" patternUnits="userSpaceOnUse"><path d="M0 4 8 0 19 2 27 10 23 19 10 24 1 18Z" stroke="#80bc57" strokeWidth=".7" opacity=".2"/></pattern>
        <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="18" stdDeviation="13" floodColor="#020f0a" floodOpacity=".45"/></filter>
      </defs>

      <g filter={paint('shadow')}>
        <g className={`lagarto-head ${referenceFace ? 'lagarto-head--reference' : 'lagarto-head--tony'}`}>
          <TonyFaceInSvg x="172" y="146" width="296" height="108.3"/>
        </g>

        <g className="lagarto-shield">
          <path d="m174 247 146 7 146-7-10 178-136 86-136-86Z" fill="#061e17" stroke="#062018" strokeWidth="12" strokeLinejoin="round"/>
          <path d="m180 253 140 1 140-1-10 168-130 83-130-83Z" fill={paint('gold')}/>
          <path d="m190 264 130 1 130-1-10 151-120 77-120-77Z" fill={paint('shield')}/>
          <path d="m196 270 124 6 124-6-10 141-114 72-114-72Z" fill={paint('scale')} stroke="#86b65c" strokeOpacity=".3" strokeWidth="1.5"/>
          <path d="m197 276 123 5 123-5-2 27-242-1Z" fill="#a3ca60" opacity=".06"/>
          <path d="m207 284 35 2m156 0 35-2" stroke="#cfe3a0" strokeWidth="2" strokeOpacity=".45"/>
          {!wordmarkReady && <g data-wordmark-fallback="true" aria-hidden="true">
            <text x="320" y="371" textAnchor="middle" fill={paint('letter')} stroke="#09271c" strokeWidth="4" paintOrder="stroke" fontFamily="var(--font-display), Impact, sans-serif" fontSize="94" fontWeight="700" fontStyle="italic" textLength="225" lengthAdjust="spacingAndGlyphs">TONY</text>
            <text x="320" y="399" textAnchor="middle" fill="#ff8027" fontFamily="var(--font-body), Arial, sans-serif" fontSize="13" fontWeight="800" fontStyle="italic" letterSpacing="3">SPORTSWEAR</text>
          </g>}
          {/* The wordmark's own pixel space (1774 × 887 source), trimmed to its letters. */}
          <svg x="197" y="293" width="246" height="128" viewBox="60 163 1654 567" aria-hidden="true" data-wordmark-status={wordmarkReady ? 'loaded' : 'fallback'}>
            <image href={WORDMARK_SRC} x="25" y="34" width="1733" height="844" opacity={wordmarkReady ? 1 : 0} onLoad={() => setWordmarkReady(true)} onError={() => setWordmarkReady(false)}/>
          </svg>
          <path d="m280 442 40 23 40-23" stroke="#8ea964" strokeWidth="1.5" strokeOpacity=".65"/>
          <path d="m314 438 6-11 6 11-6 11Z" fill="#b4ed56"/>
        </g>

        <g className="lagarto-hand lagarto-hand--left"><TonyClawInSvg x="70" y="300" width="132" height="138.4"/></g>
        <g className="lagarto-hand lagarto-hand--right"><TonyClawInSvg x="438" y="300" width="132" height="138.4" flip/></g>
      </g>
    </svg>
  );
}

export default function LagartoIntro() {
  const pathname = usePathname();
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const replay = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const returnHome = useRef(false);
  const finish = useCallback(() => setPlaying(false), []);

  useLayoutEffect(() => {
    setReady(true);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreferenceChange = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) {
        introBoot()?.release(true);
        setPlaying(false);
      }
    };
    onPreferenceChange();
    preference.addEventListener('change', onPreferenceChange);
    const replayFromLogo = () => {
      returnHome.current = true;
      if (!preference.matches) setPlaying(true);
    };
    window.addEventListener('tony:intro-replay', replayFromLogo);
    return () => {
      preference.removeEventListener('change', onPreferenceChange);
      window.removeEventListener('tony:intro-replay', replayFromLogo);
    };
  }, []);

  useLayoutEffect(() => {
    if (pathname !== '/') return;
    let seen = false;
    try { seen = sessionStorage.getItem(SESSION_KEY) === 'seen'; } catch { /* Private browsing may disable storage. */ }
    // Keep the synchronous first-paint hand-off when arriving directly at Inicio.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && !seen && !introBoot()?.cancelled) setPlaying(true);
    else introBoot()?.release();
  }, [pathname]);

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!playing || !element) return;
    try { sessionStorage.setItem(SESSION_KEY, 'seen'); } catch { /* The introduction still works without storage. */ }
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    window.dispatchEvent(new Event('tony:intro-start'));
    introBoot()?.release();
    element.classList.add('lagarto-intro--playing');
    const timeout = window.setTimeout(finish, INTRO_DURATION);
    return () => {
      window.clearTimeout(timeout);
      element.classList.remove('lagarto-intro--playing');
      if (element.open) element.close();
      document.body.style.overflow = previousOverflow;
      const target = restoreFocus.current;
      if (returnHome.current) {
        const main = document.querySelector<HTMLElement>('main');
        if (main) {
          const tabindex = main.getAttribute('tabindex');
          main.setAttribute('tabindex', '-1');
          main.focus({ preventScroll: true });
          if (tabindex === null) main.removeAttribute('tabindex'); else main.setAttribute('tabindex', tabindex);
        }
        returnHome.current = false;
      } else if (target?.isConnected) target.focus({ preventScroll: true });
      window.dispatchEvent(new Event('tony:intro-complete'));
    };
  }, [playing, finish]);

  return (
    <>
      <button ref={replay} type="button" className="replay-intro" onClick={() => setPlaying(true)} hidden={reducedMotion || pathname !== '/'} disabled={!ready || playing} aria-label="Repetir entrada del lagarto">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 9 6-9 6V6Z" fill="currentColor"/><circle cx="12" cy="12" r="10" stroke="currentColor"/></svg>
        <span>El instinto cobra vida</span>
      </button>
      {playing && <dialog ref={dialog} className="lagarto-intro" aria-label="La entrada del lagarto Tony" onCancel={finish}>
        <div className="intro-atmosphere" aria-hidden="true"/>
        <div className="intro-light intro-light--one" aria-hidden="true"/><div className="intro-light intro-light--two" aria-hidden="true"/>
        <div className="intro-mascot-scene" aria-hidden="true"><div className="intro-halo"/><LagartoMark animated referenceFace/><div className="intro-brand-caption"><span>NACIMOS PARA COMPETIR.</span><strong>HECHOS PARA IMPONER.</strong></div></div>
        <div className="intro-curtain intro-curtain--top" aria-hidden="true"/><div className="intro-curtain intro-curtain--bottom" aria-hidden="true"/>
        <svg className="intro-watchful-eyes" viewBox="0 0 320 100" fill="none" aria-hidden="true"><defs><radialGradient id="intro-eye-fire"><stop stopColor="#fff9be"/><stop offset=".5" stopColor="#ffc13c"/><stop offset="1" stopColor="#c76c1d"/></radialGradient></defs><path d="M51 39c28-12 54-1 75 16-28 10-49 6-75-16Zm218 0c-28-12-54-1-75 16 28 10 49 6 75-16Z" fill="url(#intro-eye-fire)"/><path d="m90 38 5 21 6-17m123 0 6 17 5-21" fill="#0b2319"/></svg>
        <svg className="intro-rip" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="intro-rip-edge" x1="180" y1="670" x2="1210" y2="180" gradientUnits="userSpaceOnUse"><stop stopColor="#ff792a"/><stop offset=".25" stopColor="#d7ff6a"/><stop offset=".8" stopColor="#bfff48"/><stop offset="1" stopColor="#fff1a0"/></linearGradient></defs>
          <g className="intro-rip-stroke" strokeLinejoin="round">
            <g fill="#001a10" stroke="#07170f" strokeWidth="20">
              <path d="m105 626 167-105 88-18 141-87 60-9 58-40 26-2 210-119 112-10 225-111-131 126-103 26-278 172-87 12-148 82-108 23Z"/>
              <path d="m235 725 165-120 85-24 191-113 111-33 177-101 117-23 264-126-211 160-112 30-212 119-130 41-163 95-97 28Z"/>
              <path d="m395 790 182-132 127-47 134-99 131-39 300-135-218 163-151 43-172 117-112 34Z"/>
            </g>
            <g fill="#173c21" stroke="url(#intro-rip-edge)" strokeWidth="5">
              <path d="m105 626 167-105 88-18 141-87 60-9 58-40 26-2 210-119 112-10 225-111-131 126-103 26-278 172-87 12-148 82-108 23Z"/>
              <path d="m235 725 165-120 85-24 191-113 111-33 177-101 117-23 264-126-211 160-112 30-212 119-130 41-163 95-97 28Z"/>
              <path d="m395 790 182-132 127-47 134-99 131-39 300-135-218 163-151 43-172 117-112 34Z"/>
            </g>
            <g stroke="#edffae" strokeWidth="2" opacity=".9"><path d="m132 616 146-91 88-16 140-87 56-10 64-42 20-2 214-120 110-11 185-91"/><path d="m262 715 143-103 85-24 193-111 109-36 176-97 116-26 231-110"/><path d="m423 776 161-114 127-48 134-99 131-39 251-114"/></g>
            <g fill="#ffa450" opacity=".85"><path d="m302 502 8-20 8 10-8 16Zm288-145 11-19 9 4-10 19Zm439-132 18-19 3 7-15 17Zm-602 383 8-15 4 5-8 16Zm324-160 11-23 5 8-7 19Zm254 17 18-13-4 13-13 6Z"/></g>
          </g>
        </svg>
        <div className="intro-topline"><span>TONY SPORTSWEAR</span><span>EL SALVADOR</span></div>
        <button autoFocus className="intro-skip" type="button" onClick={finish}>Saltar intro <span aria-hidden="true">↗</span></button>
        <div className="intro-progress" aria-hidden="true"><span/></div>
      </dialog>}
    </>
  );
}
