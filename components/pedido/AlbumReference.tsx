import type {AlbumDesign} from '@/lib/pedido/album-design';
import './album-reference.css';

export default function AlbumReference({design, large = false}: {design: AlbumDesign; large?: boolean}) {
  return <a className={`pedido-album-reference${large ? ' is-large' : ''}`} href={design.image} target="_blank" rel="noopener noreferrer" aria-label={`Ver el diseño elegido: ${design.name}, imagen ${design.number}`}>
    <img src={design.image} alt="" width="76" height="76" loading="lazy" decoding="async" referrerPolicy="no-referrer"/>
    <span><small>Diseño elegido · Imagen {design.number}</small><strong>{design.name}</strong><span>Ver imagen original ↗</span></span>
  </a>;
}
