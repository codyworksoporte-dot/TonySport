import catalogue from '@/data/official-collections.json';
export const COLLECTIONS = catalogue.categories;
export const COLLECTION_PRODUCTS = catalogue.products;
export type CollectionProduct = typeof COLLECTION_PRODUCTS[number];
export {collectionHref} from './collection-path';
