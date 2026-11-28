'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import TonyWordmark from './TonyWordmark';
import { siteAsset } from '@/lib/asset-path';
import './brand-intro.css';

const SESSION_KEY = 'tony:intro:wordmark:v1';
type IntroBoot = { cancelled: boolean; release: (cancelled?: boolean) => void };
const introBoot = () => (window as Window & { __tonyIntroBoot?: IntroBoot }).__tonyIntroBoot;

function IntroLogo() {
  const image = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (image.current?.complete && !image.current.naturalWidth) setFailed(true);
  }, []);
  return failed
    ? <strong className="intro-wordmark-fallback">TONY <small>SPORTWEAR</small></strong>
    : <TonyWordmark ref={image} alt="Tony Sportwear" sizes="(max-width: 767px) 82vw, 620px" fetchPriority="high" onError={() => setFailed(true)}/>;
}

export default function BrandIntro() {
  const pathname = usePathname();
  const [playing, setPlaying] = useState(false);
  const visitedHome = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    if (pathname !== '/') { setPlaying(false); return; }
    if (visitedHome.current) return;
    visitedHome.current = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try { seen = sessionStorage.getItem(SESSION_KEY) === 'seen' || localStorage.getItem('tony:ambient-effects:v1') === 'off'; } catch {}
    if (seen || reduced || introBoot()?.cancelled) { introBoot()?.release(); return; }
    try { sessionStorage.setItem(SESSION_KEY, 'seen'); } catch {}
    setPlaying(true);
  }, [pathname]);

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!playing || !element) return;
    const target = document.activeElement;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduce = () => { if (preference.matches) setPlaying(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    preference.addEventListener('change', reduce);
    window.dispatchEvent(new Event('tony:intro-start'));
    introBoot()?.release();
    const timeout = window.setTimeout(() => setPlaying(false), window.matchMedia('(max-width: 700px)').matches ? 1900 : 2500);
    return () => {
      clearTimeout(timeout);
      preference.removeEventListener('change', reduce);
      if (element.open) element.close();
      document.body.style.overflow = previousOverflow;
      if (target instanceof HTMLElement && target.isConnected) target.focus({preventScroll:true});
      window.dispatchEvent(new Event('tony:intro-complete'));
    };
  }, [playing]);

  return playing && <dialog ref={dialog} className="brand-intro" aria-label="Entrada de Tony Sportwear" onCancel={() => setPlaying(false)}>
    <div className="intro-floor" aria-hidden="true"><i className="intro-seams"/><i className="intro-wave"/></div>
    <div className="intro-sign" style={{'--intro-silhouette':`url("${siteAsset('/assets/brand/tony-wordmark-640.webp')}")`} as CSSProperties}>
      <div className="intro-wordmark"><IntroLogo/></div>
      <div className="intro-reflection" aria-hidden="true"><TonyWordmark sizes="(max-width: 767px) 82vw, 620px"/></div>
    </div>
    <button autoFocus className="intro-skip" type="button" onClick={() => setPlaying(false)}>Saltar intro <span aria-hidden="true">→</span></button>
  </dialog>;
}
