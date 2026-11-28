'use client';

import {useRef, useState} from 'react';
import Icon from '@/components/Icon';
import {siteAsset} from '@/lib/asset-path';
import {designBatch, type Album, type Design, type Photo} from '@/lib/design-photos';
import {whatsappLink} from '@/lib/site-links';

export default function DesignGrid({title, albums, first}: {title: string; albums: Album[]; first: Design[]}) {
  const [items, setItems] = useState(first);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const cache = useRef(new Map<number, Photo[]>());
  const pending = useRef(false);
  const gallery = useRef<HTMLUListElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const total = albums.reduce((sum, album) => sum + album.imageCount, 0);
  const selected = active === null ? undefined : items[active];
  const currentAlbum = albums.find(album => album.id === selected?.albumId);

  async function more() {
    if (pending.current || items.length >= total) return;
    pending.current = true; setBusy(true); setError(false);
    try {
      const extra = await designBatch(albums, items.length, async id => {
        const found = cache.current.get(id);
        if (found) return found;
        const response = await fetch(siteAsset(`/assets/colecciones/${id}.json`));
        if (!response.ok) throw new Error();
        const {images}: {images: Photo[]} = await response.json();
        cache.current.set(id, images);
        return images;
      });
      if (!extra.length) throw new Error();
      setItems(previous => [...previous, ...extra]);
      requestAnimationFrame(() => gallery.current?.children[items.length]?.querySelector('a')?.focus({preventScroll:true}));
    } catch {setError(true);}
    finally {pending.current = false; setBusy(false);}
  }
  function step(delta: number) {
    setActive(index => index === null ? null : Math.min(items.length - 1, Math.max(0, index + delta)));
  }
  return <section className="scope-gallery" aria-label={'Fotografías de ' + title}>
    <p className="scope-count" aria-live="polite">{items.length} de {total} {total === 1 ? 'imagen' : 'imágenes'}</p>
    <ul className="scope-grid" ref={gallery}>{items.map(({photo, albumId, number}, index) => {
      const album = albums.find(item => item.id === albumId)!;
      const alt = (albums.length > 1 ? album.name : title) + ' · Imagen ' + number;
      const cover = number === 1 && album.cover ? siteAsset(album.cover as `/assets/${string}`) : photo.preview;
      return <li key={albumId + '-' + number}><a href={photo.src} aria-label={'Ampliar ' + alt} onClick={event => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        event.preventDefault(); setActive(index); dialog.current?.showModal();
      }}>
        <img src={cover} alt={alt} width="440" height="440" loading={index < 2 ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer"
          onError={event => {const img = event.currentTarget; if (img.src !== photo.src) img.src = photo.src;}}/>
        <span className="scope-zoom" aria-hidden="true"><Icon name="plus" size={16}/></span>
      </a></li>;
    })}</ul>
    {error && <p role="alert">No se pudieron cargar más imágenes. Podés volver a intentarlo.</p>}
    {items.length < total && <button type="button" className="tc-btn tc-btn--lime scope-more" disabled={busy} onClick={more}>{busy ? 'Cargando…' : error ? 'Reintentar' : 'Ver más imágenes'} <Icon name="plus"/></button>}
    <dialog className="scope-viewer" ref={dialog} aria-label={'Imagen ampliada de ' + title} onClose={() => setActive(null)}
      onClick={event => {if (event.target === event.currentTarget) dialog.current?.close();}}
      onKeyDown={event => {if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1);}}}>
      {selected && currentAlbum && <div>
        <header><strong>{title}</strong><button aria-label="Cerrar imagen" type="button" autoFocus onClick={() => dialog.current?.close()}><Icon name="close"/></button></header>
        <img src={selected.photo.preview} alt={currentAlbum.name + ' · Imagen ' + selected.number} referrerPolicy="no-referrer"
          onError={event => {const img = event.currentTarget; if (img.src !== selected.photo.src) img.src = selected.photo.src;}}/>
        <div className="scope-controls"><button type="button" aria-label="Imagen anterior" disabled={active===0} onClick={() => step(-1)}><Icon name="left"/></button>
          <span aria-live="polite">{(active ?? 0) + 1} / {items.length}</span>
          <button type="button" aria-label="Imagen siguiente" disabled={active === items.length - 1} onClick={() => step(1)}><Icon name="right"/></button></div>
        <footer><a href={whatsappLink('Hola, Tony. Quisiera consultar ' + currentAlbum.name + ', imagen ' + selected.number + '. ' + selected.photo.src)} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp <Icon name="whatsapp" size={17}/></a>
          <a href={currentAlbum.href} target="_blank" rel="noopener noreferrer">Ver producto <Icon name="diagonal" size={16}/></a>
          <a href={selected.photo.src} target="_blank" rel="noopener noreferrer">Ver original <Icon name="diagonal" size={16}/></a></footer>
      </div>}
    </dialog>
  </section>;
}
