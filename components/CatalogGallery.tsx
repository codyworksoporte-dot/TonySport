'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import catalog from '@/data/pedido/catalog.json';
import Icon from '@/components/Icon';
import { siteAsset } from '@/lib/asset-path';
import './catalog-gallery.css';

type Design = (typeof catalog.designs)[number];
const asset = (path: string) => siteAsset(path as `/assets/${string}`);

/**
 * The official Tony catalogue: every design as a light thumbnail; one tap shows
 * the full sheet, front and back, and takes it straight into a new order.
 */
export default function CatalogGallery() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Design | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const entries = useMemo(() => {
    const wanted = query.trim().toLocaleLowerCase('es').replace(/^tony-?/, '');
    return catalog.designs.filter(item => !wanted || item.code.toLocaleLowerCase('es').replace('tony-', '').includes(wanted));
  }, [query]);
  useEffect(() => { if (open && !dialog.current?.open) dialog.current?.showModal(); }, [open]);
  const close = () => { dialog.current?.close(); setOpen(null); };

  return <section className="catalog-gallery section-wrap" aria-labelledby="catalog-gallery-title">
    <div className="catalog-gallery-bar">
      <h2 id="catalog-gallery-title">{catalog.designs.length} DISEÑOS <span>OFICIALES</span></h2>
      <label className="catalog-gallery-search">Buscar por número<input type="search" inputMode="numeric" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ej. 012"/></label>
    </div>
    <p className="catalog-gallery-count" role="status">{entries.length === catalog.designs.length ? 'Toca un diseño para verlo completo.' : `${entries.length} ${entries.length === 1 ? 'diseño encontrado' : 'diseños encontrados'}.`}</p>
    <ul className="catalog-gallery-grid">{entries.map((item, index) => <li key={item.code}>
      <button type="button" onClick={() => setOpen(item)} aria-label={`Ver ${item.code} completo`}>
        {/* Local 220 px thumbnails keep the whole catalogue light on a phone. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(item.thumbnail)} alt="" width="220" height="220" loading={index < 8 ? 'eager' : 'lazy'} decoding="async"/>
        <span><strong>{item.code}</strong><small>Ver diseño ↗</small></span>
      </button>
    </li>)}</ul>
    {!entries.length && <p className="catalog-gallery-empty">No encontramos ese número. Los diseños van del 001 al {String(catalog.designs.length).padStart(3, '0')}.</p>}
    {open && <dialog ref={dialog} className="catalog-gallery-dialog" aria-labelledby="catalog-gallery-dialog-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="catalog-gallery-dialog-head"><h3 id="catalog-gallery-dialog-title">{open.code}</h3><button type="button" onClick={close} aria-label="Cerrar vista del diseño">×</button></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(open.image)} alt={`Diseño ${open.code}, vista frontal y dorsal`} width={open.width} height={open.height} decoding="async"/>
      <p>Sobre este diseño agregas los nombres, números, escudo, marca y patrocinadores de tu equipo en el editor. Usar un diseño del catálogo no tiene costo de creación.</p>
      <Link className="button primary" href={`/configurador?diseno=${open.code}`}>Usar {open.code} en mi pedido <span className="button-icon"><Icon name="diagonal"/></span></Link>
    </dialog>}
  </section>;
}
