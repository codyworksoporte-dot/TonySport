import {siteAsset} from '../asset-path';
import type {Photo} from '../design-photos';
import categoriesForOrders from '../../data/pedido/album-categories.json';
import type {PedidoDraft} from './types';

export interface AlbumDesign {albumId: number; number: number; name: string; image: string}

export function canOrderAlbum(categories?: readonly string[]) {
  return categories?.some(category => categoriesForOrders.includes(category)) ?? false;
}

export const albumOrderHref = (id: number, number: number) => `/configurador?album=${id}&imagen=${number}`;

function officialPhoto(value: string) {
  return /^https:\/\/www\.tonysportselsalvador\.com\/wp-content\/uploads\/[^\s?#]+\.(?:jpe?g|webp|png|gif|avif)$/i.test(value) && value.length <= 1000;
}

export async function loadAlbumDesign(id: string, number: string, signal: AbortSignal): Promise<AlbumDesign> {
  if (!/^[1-9]\d{0,8}$/.test(id) || !/^[1-9]\d{0,5}$/.test(number)) throw new Error('La referencia de la imagen no es válida.');
  const {DESIGN_ALBUMS} = await import('../scoped-collections');
  const album = DESIGN_ALBUMS.find(item => item.id === Number(id));
  if (!album || !canOrderAlbum(album.categories) || Number(number) > album.imageCount) throw new Error('La imagen elegida no figura en el catálogo.');
  const response = await fetch(siteAsset(`/assets/colecciones/${album.id}.json`), {signal});
  if (!response.ok) throw new Error('No se pudo cargar el álbum. Volvé a intentar.');
  const {images}: {images: Photo[]} = await response.json();
  const image = images[Number(number) - 1]?.src;
  if (!image || !officialPhoto(image)) throw new Error('No encontramos la foto original de este diseño.');
  return {albumId: album.id, number: Number(number), name: album.name, image};
}

// The existing production API carries these public details in the order notes
// through cart recovery, payment snapshots and the fulfilment panel.
export function albumNotes(ref: AlbumDesign, notes: string) {
  return `Diseño elegido · ${ref.name} (álbum ${ref.albumId}, imagen ${ref.number})\n${ref.image}${notes ? '\n\n' + notes : ''}`;
}

export function readAlbumNotes(notes: string): {ref: AlbumDesign | null; customer: string} {
  const match = /^Diseño elegido · ([^\r\n]{1,180}) \(álbum ([1-9]\d{0,8}), imagen ([1-9]\d{0,5})\)\n([^\s]+)(?:\n\n([\s\S]*))?$/.exec(notes);
  if (!match || !officialPhoto(match[4])) return {ref: null, customer: notes};
  return {ref: {name: match[1], albumId: Number(match[2]), number: Number(match[3]), image: match[4]}, customer: match[5] || ''};
}

export function orderAlbum(order: PedidoDraft) {
  return order.design.source === 'catalog' && order.design.catalogCode === '' ? readAlbumNotes(order.notes).ref : null;
}

export function albumQuoteMessage(order: PedidoDraft, ref: AlbumDesign, estimate: string) {
  const sizes = (rows: PedidoDraft['players']) => {
    const counts = new Map<string, number>();
    for (const {size} of rows) if (size) counts.set(size, (counts.get(size) || 0) + 1);
    return Array.from(counts, ([size, count]) => `${size} × ${count}`).join(', ');
  };
  return [
    'Hola, Tony. Quiero cotizar este diseño:',
    `${ref.name} · Álbum ${ref.albumId}, imagen ${ref.number}`, ref.image,
    `${order.quantity} ${order.product === 'uniform' ? 'uniformes completos' : 'camisas'} · ${order.gender} · Full sublimado`,
    `Molde: ${order.config.mold} · Tela: ${order.config.fabric} · Cuello: ${order.config.collar} · Manga: ${order.config.sleeve}`,
    `Tallas de campo: ${sizes(order.players)}`,
    order.goalkeepers.length ? `Porteros: ${order.goalkeepers.length} · Tallas: ${sizes(order.goalkeepers)}` : '',
    `Estimado de prendas y extras: ${estimate} USD.`,
  ].filter(Boolean).join('\n');
}
