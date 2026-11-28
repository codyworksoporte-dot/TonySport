'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import BrandScreenArt from './BrandScreenArt';
import './brand-intro.css';

const SESSION_KEY = 'tony:intro:wordmark:v1';
type IntroBoot = { cancelled: boolean; release: (cancelled?: boolean) => void };
const introBoot = () => (window as Window & { __tonyIntroBoot?: IntroBoot }).__tonyIntroBoot;

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
    <BrandScreenArt intro/>
    <button autoFocus className="intro-skip" type="button" onClick={() => setPlaying(false)}>Saltar intro <span aria-hidden="true">→</span></button>
  </dialog>;
}
