import inventory from '@/data/tienda.json';
import {COLLECTIONS, COLLECTION_PRODUCTS} from './collections';
import type {Album} from './design-photos';

const updated = inventory.updatedCategories as Record<string,string[]>;
const published = inventory.newProducts.flatMap(item => typeof item.imageCount === 'number' ? [{...item,imageCount:item.imageCount}] : []);

export const DESIGN_ALBUMS = [
  ...published,
  ...COLLECTION_PRODUCTS.map(album=>({...album,categories:[...new Set([...album.categories,...(updated[album.id]??[])])]})),
] satisfies (Album & {categories:string[]})[];

export const categoryTitles = new Map(COLLECTIONS.map(category=>[
  category.slug, category.name.replace(/\s*(?:de\s*)?\$[\d.]+/gi,'').trim(),
]));
categoryTitles.set('camisa-full-sublimada','Camisas full sublimadas');
categoryTitles.set('replicas-bordadas-de-8-49','Réplicas bordadas');
categoryTitles.set('replicas-bordadas-de-futbol-de-10-99','Réplicas bordadas de fútbol');

export const categoryAlbums = (slug:string) => DESIGN_ALBUMS.filter(album=>album.categories.includes(slug));
