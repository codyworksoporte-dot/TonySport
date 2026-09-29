'use client';
import {useEffect, useRef, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {COLLECTIONS, COLLECTION_PRODUCTS, type CollectionProduct} from '@/lib/collections';
import {siteAsset} from '@/lib/asset-path';
import './collection-gallery.css';

type Photo = {src: string; preview: string; label: string};
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const pageSize = 20;
export default function CollectionGallery() {
  const params = useSearchParams();
  const [category, setCategory] = useState(() => COLLECTIONS.some(c => c.slug === params.get('categoria')) ? params.get('categoria')! : ''), [query, setQuery] = useState(''), [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CollectionProduct | null>(null), [photos, setPhotos] = useState<Photo[]>([]), [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [imageError, setImageError] = useState(false), [attempt, setAttempt] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLElement | null>(null), resultsTitle = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const slug=params.get('categoria')||'';
    setCategory(COLLECTIONS.some(c => c.slug === slug) ? slug : ''); setPage(1);
  }, [params]);
  useEffect(() => {
    if (!selected) return;
    dialog.current?.showModal(); setPhotos([]); setLoading(true); setError(''); setIndex(0);
    const controller = new AbortController();
    fetch(siteAsset(`/assets/colecciones/${selected.id}.json`), {signal: controller.signal}).then(response => {
      if (!response.ok) throw new Error(); return response.json();
    }).then((data: {images: Photo[]}) => {setPhotos(data.images); setLoading(false);}).catch(() => {
      if (!controller.signal.aborted) {setError('No pudimos abrir el álbum. Comprueba tu conexión y vuelve a intentarlo.'); setLoading(false);}
    });
    return () => controller.abort();
  }, [selected, attempt]);
  useEffect(() => setImageError(false), [index, selected]);
  function close() {dialog.current?.close(); setSelected(null); requestAnimationFrame(() => trigger.current?.focus());}
  function filter(value: string) {
    setCategory(value); setPage(1);
    const url = new URL(location.href); if (value) url.searchParams.set('categoria', value); else url.searchParams.delete('categoria');
    history.replaceState(null, '', url.pathname + url.search); // Keep category links shareable, including the Pages base path.
  }
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  const results = COLLECTION_PRODUCTS.filter(p => (!category || p.categories.includes(category)) && words.every(w => normalize(`${p.name} ${p.categories.join(' ')}`).includes(w)));
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const visible = results.slice((page-1)*pageSize, page*pageSize), photo = photos[index];
  function turnPage(value: number) {setPage(value); resultsTitle.current?.focus(); resultsTitle.current?.scrollIntoView({block: 'start'});}
  return <section className="collection-gallery section-wrap" aria-label="Colecciones oficiales">
    <div className="collection-filters"><label>Buscar una colección<input type="search" value={query} onChange={e => {setQuery(e.target.value); setPage(1);}} placeholder="Anime, Mundial, polos…"/></label>
      <label>Línea de producto<select value={category} onChange={e => filter(e.target.value)}><option value="">Todas las colecciones</option>{COLLECTIONS.map(c => <option key={c.id} value={c.slug}>{c.name} ({c.count})</option>)}</select></label></div>
    <div className="collection-shortcuts" aria-label="Colecciones destacadas">{COLLECTIONS.filter(c => [209,206].includes(c.id)).map(c => <button type="button" key={c.id} aria-pressed={category === c.slug} onClick={() => filter(c.slug)}>{c.name}</button>)}{(category || query) && <button type="button" onClick={() => {filter(''); setQuery('');}}>Ver todas</button>}</div>
    <p className="collection-count" ref={resultsTitle} tabIndex={-1} role="status">{results.length} productos y álbumes · Página {page} de {totalPages}</p>
    <ul className="collection-grid">{visible.map(p => <li key={p.id}><button type="button" onClick={e => {trigger.current = e.currentTarget; setSelected(p);}} aria-label={`Ver ${p.name}`}>
      {p.cover ? <img src={siteAsset(p.cover as `/assets/${string}`)} alt="" width={440} height={540} loading="lazy" decoding="async"/> : <span className="collection-no-image">Imagen no publicada</span>}
      <span className="collection-card-copy"><strong>{p.name}</strong><small>{p.imageCount} {p.imageCount === 1 ? 'imagen' : 'imágenes'} · Abrir álbum ↗</small></span>
    </button></li>)}</ul>
    {!results.length && <p>No encontramos esa colección. Prueba otra palabra o selecciona todas las líneas.</p>}
    {totalPages > 1 && <nav className="collection-pages" aria-label="Páginas de colecciones"><button type="button" disabled={page === 1} onClick={() => turnPage(page-1)}>← Anterior</button><span>{page} / {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => turnPage(page+1)}>Siguiente →</button></nav>}
    <p className="collection-source">Imágenes del catálogo publicado por Tony. Algunas piezas incluyen campañas anteriores; consulta precios, promociones y disponibilidad actuales antes de pedir.</p>
    {selected && <dialog ref={dialog} className="collection-dialog" aria-labelledby="collection-title" onCancel={e => {e.preventDefault(); close();}} onClick={e => {if (e.target === e.currentTarget) close();}} onKeyDown={e => {if (e.target instanceof HTMLSelectElement) return; if (e.key === 'ArrowRight') {e.preventDefault(); setIndex(i => Math.min(i+1, photos.length-1));} if (e.key === 'ArrowLeft') {e.preventDefault(); setIndex(i => Math.max(i-1, 0));}}}>
      <header><h2 id="collection-title">{selected.name}</h2><button type="button" autoFocus onClick={close} aria-label="Cerrar colección">×</button></header>
      {loading && <p role="status">Cargando álbum…</p>}{error && <p role="alert">{error} <button type="button" onClick={() => setAttempt(n => n+1)}>Reintentar</button></p>}
      {photo && <><div className="collection-image">{!imageError ? <img key={photo.src} src={photo.preview} alt={`${selected.name}. Imagen ${index+1} de ${photos.length}.`} referrerPolicy="no-referrer" decoding="async" onError={() => setImageError(true)}/> : <p>Esta imagen no está disponible ahora. Puedes verla en el catálogo original.</p>}</div>
        <div className="collection-pager"><button type="button" disabled={index === 0} aria-label="Imagen anterior" onClick={() => setIndex(i => i-1)}>←</button><label>Imagen <select aria-label="Elegir imagen del álbum" value={index} onChange={e => setIndex(Number(e.target.value))}>{photos.map((_, i) => <option value={i} key={i}>{i+1} de {photos.length}</option>)}</select></label><button type="button" aria-label="Imagen siguiente" disabled={index === photos.length-1} onClick={() => setIndex(i => i+1)}>→</button></div>
        <a className="text-link" href={photo.src} target="_blank" rel="noopener noreferrer">Ampliar imagen original ↗</a></>}
      {!loading && !error && !photos.length && <p>Este producto no tiene imágenes publicadas en el catálogo original.</p>}
      <div className="collection-dialog-actions"><a className="button primary" href={`https://wa.me/50370155571?text=${encodeURIComponent(`Hola, Tony. Quisiera consultar ${selected.name}${photo ? `, imagen ${index+1}` : ''}. ${selected.href}${photo ? `\nReferencia: ${photo.src}` : ''}`)}`} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp ↗</a><a href={selected.href} target="_blank" rel="noopener noreferrer">Ver en la web oficial ↗</a></div>
    </dialog>}
  </section>;
}
