import catalogue from '@/data/official-collections.json';
export const COLLECTIONS = catalogue.categories;
export const COLLECTION_PRODUCTS = catalogue.products;
export type CollectionProduct = typeof COLLECTION_PRODUCTS[number];
export const collectionHref = (slug: string) => `/colecciones?categoria=${encodeURIComponent(slug)}`;
export function sourceCollectionHref(source: string): string | null {
  const slug = source.split('/').filter(Boolean).at(-1);
  return COLLECTIONS.some(category => category.slug === slug) ? collectionHref(slug!) : null;
}
