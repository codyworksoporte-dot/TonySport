'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Icon from '@/components/Icon';
import type { Campaign } from '@/lib/home-campaigns';

const SESSION = 'tony:inicio:carteles:v3';
const PREVIOUS_SESSION = 'tony:inicio:carteles:v2';

function savedIds(key: string): string[] | null {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (Array.isArray(saved) && saved.every(id => typeof id === 'string')) {
      return [...new Set<string>(saved)];
    }
  } catch { /* Fall back to an in-memory queue when storage is unavailable. */ }
  return null;
}

function readQueue(ads: Campaign[]) {
  const ids = ads.map(ad => ad.id);
  const saved = savedIds(SESSION);
  if (saved) return saved.filter(id => ids.includes(id));

  const opening = ids.slice(0, 3);
  const remaining = ids.slice(3);
  const previous = savedIds(PREVIOUS_SESSION);
  if (previous) {
    // The two new posters also reach open sessions, without replaying dismissed ads.
    return [...opening.filter(id => id !== 'black-friday' || previous.includes(id)),
      ...previous.filter(id => remaining.includes(id))];
  }
  for (let end = remaining.length - 1; end > 0; end--) {
    const pick = Math.floor(Math.random() * (end + 1));
    [remaining[pick], remaining[end]] = [remaining[end], remaining[pick]];
  }
  return [...opening, ...remaining];
}

export function CampaignDialog({ads}: {ads: Campaign[]}) {
  const [queue, setQueue] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = ads.find(ad => ad.id === queue[0]);
  const active = Boolean(current);

  useEffect(() => {
    const saved = readQueue(ads);
    setQueue(saved);
    try { sessionStorage.setItem(SESSION, JSON.stringify(saved)); } catch {}
  }, [ads]);

  useEffect(() => {
    const element = dialog.current;
    if (!active || !element) return;
    function open() {
      // The intro can own the top layer on the first visit. Its cleanup publishes this same event.
      if (!element?.isConnected || element.open || document.querySelector('.brand-intro[open]')) return;
      element.showModal();
    }
    const timer = window.setTimeout(open, 80);
    window.addEventListener('tony:intro-complete', open);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('tony:intro-complete', open);
      if (element.open) element.close();
    };
  }, [active]);

  if (!current) return null;
  function advance(restoreFocus: boolean) {
    const next = queue.slice(1);
    try { sessionStorage.setItem(SESSION, JSON.stringify(next)); } catch {}
    if (!restoreFocus) return;
    setQueue(next);
    if (!next.length) {
      dialog.current?.close();
      document.getElementById('crear-mi-pedido')?.focus({preventScroll: true});
    }
  }

  return <dialog ref={dialog} className="campaign-dialog" aria-label="Anuncios de Tony"
    onCancel={event => { event.preventDefault(); advance(true); }}>
    <Link className="campaign-poster" href={current.href} onClick={() => advance(false)}>
      <img key={current.id} src={current.image} alt={current.title} width="768" height="512" fetchPriority="high"
        onError={() => advance(true)}/>
    </Link>
    <button autoFocus type="button" aria-label="Cerrar anuncio" className="poster-close" onClick={() => advance(true)}><Icon name="close" size={21}/></button>
  </dialog>;
}

export function CampaignCarousel({label, children, compact = false}: {label: string; children: ReactNode[]; compact?: boolean}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [canRotate, setCanRotate] = useState(false);
  const [focused, setFocused] = useState(false);
  const container = useRef<HTMLElement>(null);
  const touch = useRef<{x: number; y: number} | null>(null);
  const swiped = useRef(false);
  const count = children.length;
  const go = (direction: number) => setIndex(previous => (previous + direction + count) % count);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setCanRotate(!document.hidden && !media.matches);
    sync();
    media.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (container.current) observer.observe(container.current);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  useEffect(() => {
    if (count < 2 || !canRotate || !visible || focused) return;
    const timer = window.setTimeout(() => setIndex(previous => (previous + 1) % count), 7000);
    return () => window.clearTimeout(timer);
  }, [index, count, canRotate, visible, focused]);

  return <section className={'home-carousel ' + (compact ? 'home-carousel--strip' : 'home-carousel--feature')}
    ref={container} aria-label={label} aria-roledescription="carrusel"
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {event.preventDefault(); go(event.key === 'ArrowLeft' ? -1 : 1);}
    }}
    onTouchStart={event => {swiped.current = false; const point = event.touches[0]; touch.current = {x: point.clientX, y: point.clientY};}}
    onTouchEnd={event => {
      if (!touch.current) return;
      const delta = event.changedTouches[0].clientX - touch.current.x;
      if (Math.abs(delta) > 42 && Math.abs(delta) > Math.abs(event.changedTouches[0].clientY - touch.current.y) * 1.5) {
        swiped.current = true; go(delta > 0 ? -1 : 1);
      }
      touch.current = null;
    }}
    onClickCapture={event => {if (swiped.current) {event.preventDefault(); event.stopPropagation(); swiped.current = false;}}}>
    <div className="campaign-view">{children[index]}</div>
    <div className="campaign-nav">
      <button type="button" aria-label="Promoción anterior" onClick={() => go(-1)}><Icon name="left" size={17}/></button>
      <button type="button" aria-label="Promoción siguiente" onClick={() => go(1)}><Icon name="right" size={17}/></button>
    </div>
  </section>;
}
