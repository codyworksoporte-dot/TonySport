'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TONY_ART, viewOf } from '@/lib/tony-art';
import { TonyBadge, tonyArtVars } from './TonyArt';
import './lagarto-intro.css';

const SESSION_KEY = 'tony:intro:v2';
const INTRO_DURATION = 4200;
type IntroBoot = { pending: boolean; cancelled: boolean; release: (cancelled?: boolean) => void };
const introBoot = () => (window as Window & { __tonyIntroBoot?: IntroBoot }).__tonyIntroBoot;
const BADGE_VIEW = viewOf(TONY_ART.badge);
/** Drawn in the badge's own units over the space the logo takes, only if the logo file fails. */
const FALLBACK_SHIELD = 'M300 690L1598 690L1660 1180L1700 1440L1330 1500L949 1690L568 1500L198 1440L238 1180Z';

/**
 * The emblem: the complete logo, Tony roaring over the shield. His eye has a
 * lid (shut while he lands in the intro, then he opens it) and a fire the intro
 * lights. With `blink`, he blinks now and then, only while the emblem is on screen.
 * `data-wordmark-status` reports whether the logo file drew (`loaded`) or the
 * lettered fallback shield took its place (`fallback`).
 */
export function LagartoMark({ className = '', animated = false, referenceFace = false, blink = false }: { className?: string; animated?: boolean; referenceFace?: boolean; blink?: boolean }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'fallback'>('loading');
  const mark = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);

  // The logo can finish loading before hydration, when its load event is lost: ask the element.
  useEffect(() => {
    const element = image.current;
    if (element?.complete) setStatus(element.naturalWidth ? 'loaded' : 'fallback');
  }, []);

  useEffect(() => {
    const element = mark.current;
    if (!blink || !element) return;
    const observer = new IntersectionObserver(([entry]) => element.classList.toggle('is-blinking', entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [blink]);

  return (
    <div ref={mark} className={`lagarto-mark ${animated ? 'lagarto-mark--enter' : ''} ${status === 'fallback' ? 'is-fallback' : ''} ${className}`} role="img" aria-label="Tony Sportswear: el lagarto Tony ruge sobre el escudo" style={tonyArtVars(TONY_ART.badge)}>
      <TonyBadge className="lagarto-badge" sizes="min(560px, 76vw)"
        eyesClassName={`lagarto-head ${referenceFace ? 'lagarto-head--reference' : 'lagarto-head--tony'}`}
        imgRef={image}
        imgProps={{ 'data-wordmark-status': status === 'loaded' ? 'loaded' : 'fallback', onLoad: () => setStatus('loaded'), onError: () => setStatus('fallback') }}/>
      {status === 'fallback' && <svg className="lagarto-fallback" data-wordmark-fallback="true" viewBox={`${BADGE_VIEW.x} ${BADGE_VIEW.y} ${BADGE_VIEW.width} ${BADGE_VIEW.height}`} aria-hidden="true">
        <path d={FALLBACK_SHIELD} fill="#050806" stroke="#ff7a1a" strokeWidth="30" strokeLinejoin="round"/>
        <text x="949" y="1190" textAnchor="middle" fill="#3fd21f" stroke="#c6ff4a" strokeWidth="10" paintOrder="stroke" fontFamily="var(--font-display), Impact, sans-serif" fontSize="400" fontWeight="700" textLength="1080" lengthAdjust="spacingAndGlyphs">TONY</text>
        <text x="949" y="1400" textAnchor="middle" fill="#6bf02a" fontFamily="var(--font-body), Arial, sans-serif" fontSize="120" fontWeight="800" fontStyle="italic" letterSpacing="14">SPORTSWEAR</text>
      </svg>}
    </div>
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
    if (!window.matchMedia('(max-width: 900px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches && !seen && !introBoot()?.cancelled) setPlaying(true);
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
        {/* The logo slams onto the ground, his eye catches fire and he roars once. */}
        <div className="intro-mascot-scene" aria-hidden="true">
          <div className="intro-stage">
            <div className="intro-halo"/>
            <span className="intro-ground"/>
            <span className="intro-impact"/>
            <LagartoMark animated referenceFace/>
          </div>
          <div className="intro-brand-caption"><span>NACIMOS PARA COMPETIR.</span><strong>HECHOS PARA IMPONER.</strong></div>
        </div>
        <div className="intro-curtain intro-curtain--top" aria-hidden="true"/><div className="intro-curtain intro-curtain--bottom" aria-hidden="true"/>
        {/* Before the tear: his eyes in the dark, the logo's own eye (flat brow, slit pupil) as a pair. */}
        <svg className="intro-watchful-eyes" viewBox="0 0 320 100" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="intro-eye-fire" cx=".45" cy=".55" r=".6"><stop stopColor="#fff7b2"/><stop offset=".32" stopColor="#ffd21c"/><stop offset=".68" stopColor="#ff8606"/><stop offset="1" stopColor="#d93a07"/></radialGradient>
            <clipPath id="intro-eye-shape"><path d={WATCHFUL_EYES}/></clipPath>
          </defs>
          <path d={WATCHFUL_EYES} fill="url(#intro-eye-fire)" stroke="#1a0602" strokeWidth="2.4" strokeLinejoin="round"/>
          <path d={WATCHFUL_PUPILS} fill="#0a0502" clipPath="url(#intro-eye-shape)"/>
        </svg>
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

/** The logo's eye outline (lib/tony-art.ts measurements), mirrored into an angry pair. */
const WATCHFUL_EYES = 'M67.2 20.7L144 51.7C135.1 60.5 121.8 69.3 105.1 71.3C94.4 71.5 80.4 66.7 71.6 57.8C64 50.3 58.7 39.4 61.2 28.9C62.4 24.9 65 21.6 67.2 20.7ZM252.8 20.7L176 51.7C184.9 60.5 198.2 69.3 214.9 71.3C225.6 71.5 239.6 66.7 248.4 57.8C256 50.3 261.3 39.4 258.8 28.9C257.6 24.9 255 21.6 252.8 20.7Z';
const WATCHFUL_PUPILS = 'M104 31C108.8 43 108.8 60 104 72C99.2 60 99.2 43 104 31ZM216 31C220.8 43 220.8 60 216 72C211.2 60 211.2 43 216 31Z';
