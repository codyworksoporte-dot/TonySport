'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import Icon from '@/components/Icon';
import { siteAsset } from '@/lib/asset-path';
import './catalog-gallery.css';

/** The fields of a catalogue design the gallery shows (components/CatalogGallery.tsx picks them on the server). */
export type CatalogDesign = { code: string; thumbnail: string; image: string; width: number; height: number };
const asset = (path: string) => siteAsset(path as `/assets/${string}`);

/**
 * The official Tony catalogue: every design as a light thumbnail; one tap shows
 * the full sheet, front and back, and takes it straight into a new order.
 */
export default function CatalogGalleryView({ designs }: { designs: CatalogDesign[] }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<CatalogDesign | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const entries = useMemo(() => {
    const wanted = query.trim().toLocaleLowerCase('es').replace(/^tony-?/, '');
    return designs.filter(item => !wanted || item.code.toLocaleLowerCase('es').replace('tony-', '').includes(wanted));
  }, [designs, query]);
  const pos = open ? entries.findIndex(d => d.code === open.code) : -1;
  const go = (d: 1 | -1) => { const next = entries[pos + d]; if (next) setOpen(next); };
  useEffect(() => { if (open && !dialog.current?.open) dialog.current?.showModal(); }, [open]);
  const close = () => { dialog.current?.close(); setOpen(null); };
  /* Pointer-driven tilt and spotlight, written straight to the card's style (no React state per move). */
  const tilt = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, s = e.currentTarget.style;
    s.setProperty('--mx', `${x}px`); s.setProperty('--my', `${y}px`);
    s.setProperty('--rx', `${((y / r.height) - .5) * -6}deg`); s.setProperty('--ry', `${((x / r.width) - .5) * 6}deg`);
  };
  const untilt = (e: PointerEvent<HTMLButtonElement>) => { const s = e.currentTarget.style; for (const v of ['--mx', '--my', '--rx', '--ry']) s.removeProperty(v); };

  return <section className="catalog-gallery section-wrap" aria-labelledby="catalog-gallery-title">
    <div className="catalog-gallery-bar">
      <h2 id="catalog-gallery-title">{designs.length} DISEÑOS <span>OFICIALES</span></h2>
      <label className="catalog-gallery-search">Buscar por número<input type="search" inputMode="numeric" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ej. 012"/></label>
    </div>
    <p className="catalog-gallery-count" role="status">{entries.length === designs.length ? 'Toca un diseño para verlo completo.' : `${entries.length} ${entries.length === 1 ? 'diseño encontrado' : 'diseños encontrados'}.`}</p>
    <ul className="catalog-gallery-grid">{entries.map((item, index) => <li key={item.code}>
      <button type="button" onClick={() => setOpen(item)} onPointerMove={tilt} onPointerLeave={untilt} aria-label={`Ver ${item.code} completo`}>
        {/* Local 220 px thumbnails keep the whole catalogue light on a phone. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(item.thumbnail)} alt="" width="220" height="220" loading={index < 8 ? 'eager' : 'lazy'} decoding="async"/>
        <span><strong>{item.code}</strong><small>Ver diseño ↗</small></span>
      </button>
    </li>)}</ul>
    {!entries.length && <p className="catalog-gallery-empty">No encontramos ese número. Los diseños van del 001 al {String(designs.length).padStart(3, '0')}.</p>}
    {open && <dialog ref={dialog} className="catalog-gallery-dialog" aria-labelledby="catalog-gallery-dialog-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }} onKeyDown={event => { if (event.key === 'ArrowRight') { event.preventDefault(); go(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); } }}>
      <div className="catalog-gallery-dialog-head"><h3 id="catalog-gallery-dialog-title">{open.code}</h3><button type="button" autoFocus onClick={close} aria-label="Cerrar vista del diseño">×</button></div>
      <p className="catalog-gallery-pos" role="status">Diseño {pos + 1} de {entries.length}</p>
      <div className="catalog-gallery-sheet">
        <button type="button" className="catalog-gallery-step" disabled={pos <= 0} onClick={() => go(-1)} aria-label="Diseño anterior"><Icon name="arrow"/></button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={open.code} src={asset(open.image)} alt={`Diseño ${open.code}, vista frontal y dorsal`} width={open.width} height={open.height} decoding="async"/>
        <button type="button" className="catalog-gallery-step" disabled={pos >= entries.length - 1} onClick={() => go(1)} aria-label="Diseño siguiente"><Icon name="arrow"/></button>
      </div>
      <p>Sobre este diseño agregas los nombres, números, escudo, marca y patrocinadores de tu equipo en el editor. Usar un diseño del catálogo no tiene costo de creación.</p>
      <Link className="button primary" href={`/configurador?diseno=${open.code}`}>Usar {open.code} en mi pedido <span className="button-icon"><Icon name="diagonal"/></span></Link>
    </dialog>}
  </section>;
}
