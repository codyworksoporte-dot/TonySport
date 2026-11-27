import catalog from '@/data/pedido/catalog.json';
import CatalogGalleryView, { type CatalogDesign } from './CatalogGalleryView';

/**
 * The official catalogue gallery. Runs on the server: of data/pedido/catalog.json the browser receives only
 * the five fields it shows (code, thumbnail, sheet and its size) instead of the whole file in the JavaScript.
 */
export default function CatalogGallery() {
  const designs: CatalogDesign[] = catalog.designs.map(({ code, thumbnail, image, width, height }) => ({ code, thumbnail, image, width, height }));
  return <CatalogGalleryView designs={designs}/>;
}
