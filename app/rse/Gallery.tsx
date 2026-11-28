'use client';
import {useRef, useState} from 'react';
import Icon from '@/components/Icon';
import {RSE_CATEGORIES, RSE_PHOTOS, rseImage, type RseCategory} from '@/lib/rse';

const batchSize = 12;
export default function Gallery(){
  const [category, setCategory] = useState<RseCategory | 'Todas'>('Todas');
  const [limit, setLimit] = useState(batchSize);
  const [position, setPosition] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const photos = category === 'Todas' ? RSE_PHOTOS : RSE_PHOTOS.filter(photo => photo.category === category);
  const active = photos[position];
  function filter(next: typeof category) {
    setCategory(next);
    setLimit(batchSize);
    setPosition(0);
  }
  function show(index: number) {
    setPosition(index);
    setOpen(true);
    dialog.current?.showModal();
  }
  function turn(delta: number) {
    setPosition(previous => Math.max(0, Math.min(photos.length - 1, previous + delta)));
  }
  return <section id="galeria" aria-labelledby="rse-gallery-title" className="rse-gallery">
    <header><h2 id="rse-gallery-title">Galería de la comunidad</h2><span aria-live="polite">{photos.length} fotos</span></header>
    <div className="rse-filters" role="group" aria-label="Filtrar por actividad">
      {(['Todas', ...RSE_CATEGORIES] as const).map(item =>
        <button key={item} type="button" aria-pressed={category === item} onClick={() => filter(item)}>{item}</button>)}
    </div>
    <ul className="rse-photos">{photos.slice(0,limit).map((photo,index) =>
      <li key={photo.id}><a href={rseImage(photo.id)} onClick={event => {
        if(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        show(index);
      }} aria-label={`Ampliar foto. ${photo.alt}`}>
        <img src={rseImage(photo.id,true)} width="420" height="300" loading="lazy" decoding="async" alt={photo.alt}/>
        <span className="rse-photo-action" aria-hidden="true"><Icon name="plus" size={18}/></span>
      </a></li>)}</ul>
    {limit < photos.length && <button type="button" className="rse-more" onClick={() => setLimit(limit + batchSize)}>Ver más fotos <Icon name="plus"/></button>}
    <dialog ref={dialog} className="rse-viewer" aria-label="Fotografía ampliada" onClose={() => setOpen(false)}
      onClick={event => {if(event.target === event.currentTarget) dialog.current?.close();}}
      onKeyDown={event => {
        if(event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          turn(event.key === 'ArrowRight' ? 1 : -1);
        }
      }}>
      {open && active && <div className="rse-viewer-inner">
        <div className="rse-viewer-head"><strong>{active.category}</strong><button type="button" autoFocus aria-label="Cerrar foto" onClick={() => dialog.current?.close()}><Icon name="close"/></button></div>
        <img src={rseImage(active.id)} alt={active.alt}/>
        <div className="rse-viewer-foot"><button type="button" aria-label="Foto anterior" disabled={position === 0} onClick={() => turn(-1)}><Icon name="left"/></button>
          <p aria-live="polite">{active.alt}<small>{position + 1} de {photos.length}</small></p>
          <button type="button" aria-label="Foto siguiente" disabled={position === photos.length - 1} onClick={() => turn(1)}><Icon name="right"/></button>
        </div>
      </div>}
    </dialog>
  </section>;
}
