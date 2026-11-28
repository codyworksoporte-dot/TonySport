'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Icon from '@/components/Icon';
import type { Campaign } from '@/lib/home-campaigns';

const AD_SESSION = 'tony-home-anuncios-v1';

export function AdStrip({ads}: {ads: Campaign[]}) {
  // Persist the remaining IDs in this tab so returning from an ad continues the sequence.
  const [remaining, setRemaining] = useState(() => ads.map(ad => ad.id));
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(AD_SESSION);
      if (!raw) return;
      const ids: unknown = JSON.parse(raw);
      if (Array.isArray(ids) && ids.every(id => ads.some(ad => ad.id === id)) && new Set(ids).size === ids.length) setRemaining(ids);
    } catch { /* Session storage is optional. */ }
  }, [ads]);
  const current = ads.find(ad => ad.id === remaining[0]);
  if (!current) return null;

  function close() {
    const next = remaining.slice(1);
    if (next.length) {
      const picked = Math.floor(Math.random() * next.length);
      [next[0], next[picked]] = [next[picked], next[0]];
    }
    setRemaining(next);
    try { sessionStorage.setItem(AD_SESSION, JSON.stringify(next)); } catch {}
    if (!next.length) document.getElementById('crear-mi-pedido')?.focus({preventScroll: true});
  }

  return <aside className="home-adstrip" aria-label="Anuncios de Tony">
    <span className="home-adstrip-label">Anuncio <span>{ads.length - remaining.length + 1}/{ads.length}</span></span>
    <Link href={current.href} className="home-adstrip-link" aria-live="polite">
      {current.image && <img alt="" src={current.image} width={51} height={32}/>}
      <span>{current.title}</span><Icon name="diagonal" size={16}/>
    </Link>
    <button type="button" aria-label="Cerrar anuncio" className="home-circle" onClick={close}><Icon name="close" size={19}/></button>
  </aside>;
}

/** The server supplies the slide markup, including its image sizes and links. Only the visible slide mounts. */
export function CampaignCarousel({label, children, compact = false}: {
  label: string; children: ReactNode[]; compact?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [foreground, setForeground] = useState(true);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const box = useRef<HTMLElement>(null);
  const count = children.length;

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const preference = () => setPaused(motion.matches || document.documentElement.dataset.tonyEffects === 'off');
    const visibility = () => setForeground(!document.hidden);
    preference();
    visibility();
    const effects = new MutationObserver(preference);
    effects.observe(document.documentElement, {attributes: true, attributeFilter: ['data-tony-effects']});
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (box.current) observer.observe(box.current);
    document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', preference);
    return () => {
      observer.disconnect();
      effects.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener('change', preference);
    };
  }, []);

  const playing = inView && foreground && !paused && !hover && !focused && count > 1;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setIndex(value => (value + 1) % count), 7000);
    return () => window.clearTimeout(timer);
  }, [playing, count, index]);

  return <section ref={box} aria-label={label} aria-roledescription="carrusel"
    className={'home-carousel ' + (compact ? 'home-carousel--strip' : 'home-carousel--feature')}
    onPointerEnter={event => setHover(event.pointerType === 'mouse')}
    onPointerLeave={() => setHover(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className="campaign-view" aria-live={playing ? 'off' : 'polite'}>{children[index]}</div>
    <div className="campaign-controls" role="group" aria-label="Controles de promociones">
      <button type="button" className="home-circle" aria-label="Promoción anterior" onClick={() => setIndex((index + count - 1) % count)}><Icon name="left" size={18}/></button>
      <span className="campaign-count">{index + 1} / {count}</span>
      <button type="button" className="home-circle" aria-label="Promoción siguiente" onClick={() => setIndex((index + 1) % count)}><Icon name="right" size={18}/></button>
      <button type="button" className="home-circle campaign-play" aria-label={paused ? 'Activar rotación automática' : 'Pausar rotación automática'} onClick={() => setPaused(!paused)}>
        <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">{paused ? <path d="M4 2.5 13 8l-9 5.5z"/> : <path d="M3.5 2h3v12h-3zm6 0h3v12h-3z"/>}</svg>
      </button>
    </div>
  </section>;
}
