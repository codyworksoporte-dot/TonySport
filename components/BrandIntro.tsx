'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import TonyWordmark from './TonyWordmark';
import './brand-intro.css';

const SESSION_KEY = 'tony:intro:wordmark:v1';
type IntroBoot = { pending: boolean; cancelled: boolean; release: (cancelled?: boolean) => void };
const introBoot = () => (window as Window & { __tonyIntroBoot?: IntroBoot }).__tonyIntroBoot;

function IntroLogo() {
  const image = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (image.current?.complete && !image.current.naturalWidth) setFailed(true);
  }, []);
  return failed
    ? <strong className="intro-wordmark-fallback">TONY <small>Sportswear</small></strong>
    : <TonyWordmark ref={image} alt="Tony Sportswear" sizes="(max-width: 767px) 84vw, 620px" fetchPriority="high" onError={() => setFailed(true)}/>;
}

export default function BrandIntro() {
  const pathname = usePathname();
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
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
    try { seen = sessionStorage.getItem(SESSION_KEY) === 'seen' || localStorage.getItem('tony:ambient-effects:v1') === 'off'; } catch { /* Private browsing may disable storage. */ }
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
    const timeout = window.setTimeout(finish, window.matchMedia('(max-width: 700px)').matches ? 1900 : 2600);
    return () => {
      window.clearTimeout(timeout);
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

  return <>
    <button type="button" className="replay-intro" onClick={() => setPlaying(true)} hidden={reducedMotion || pathname !== '/'} disabled={!ready || playing}>Repetir animación del logo</button>
    {playing && <dialog ref={dialog} className="brand-intro" aria-label="Entrada de Tony Sportswear" onCancel={finish}>
      <div className="intro-impact" aria-hidden="true"><i/><i/></div>
      <div className="intro-wordmark"><IntroLogo/></div>
      <button autoFocus className="intro-skip" type="button" onClick={finish}>Saltar intro <span aria-hidden="true">→</span></button>
    </dialog>}
  </>;
}
