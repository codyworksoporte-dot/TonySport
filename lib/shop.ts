import { COLLECTION_PRODUCTS, COLLECTIONS } from '@/lib/collections';
import { DESIGN_ALBUMS, categoryAlbums } from '@/lib/scoped-collections';
import { albumHref, collectionHref } from '@/lib/collection-path';
import { IMPLEMENTS } from '@/lib/implements';
import { fitted } from '@/lib/responsive-image';
import { siteAsset } from '@/lib/asset-path';
import inventory from '@/data/tienda.json';

export type ShopProduct = {
  id: number;
  name: string;
  href: string;
  image: string;
  categories: string[];
  group: string;
  price: number | null;
};

const categoryNames = new Map(COLLECTIONS.map(category => [category.slug, category.name]));
categoryNames.set('replicas-bordadas-de-futbol-de-10-99', 'Réplicas bordadas de $10.99');
categoryNames.set('replicas-bordadas-de-8-49', 'Réplicas bordadas de $8.49');
categoryNames.set('crea-tu-pedido', 'Personalizados');
const familyRules = [
  { value: 'implementos', label: 'Implementos deportivos', match: /^implementos/ },
  { value: 'replicas', label: 'Réplicas', match: /^replicas/ },
  { value: 'uniformes', label: 'Uniformes', match: /uniforme|^camisa-full-sublimada-y|^centro-full|^presentacion-polo$|^disenos-del-mundial/ },
  { value: 'camisas', label: 'Camisas y jerseys', match: /camisa|jersey|^linea-stamp-line$|^linea-empresarial/ },
];

function displayName(name: string) {
  const value = name.trim().replace(/\s+/g, ' ')
    .replace(/^clic[k]? (?:aqui|aca) para ver (?:el )?(?:cat[aá]logo|[aá]lb[uùú]m)\s*(\d*)\s*(?:de (?:diseños de |diseños )?)?/i, 'Álbum $1 · ')
    .replace(/^click aca para ver los dise[ñn]os de este [aá]lb[uùú]m\s*/i, 'Álbum ')
    .replace(/\breplicas\b/gi, 'réplicas').replace(/\blineas?\b/gi, word => word.toLowerCase().endsWith('s') ? 'líneas' : 'línea')
    .replaceAll('Fùtbol', 'Fútbol').replaceAll('Futbol', 'Fútbol').replaceAll('ciòn', 'ción');
  if (!/[a-záéíóúñ]{2}/.test(name)) {
    const lower = value.toLocaleLowerCase('es').replace(/ +·/g, ' ·').replace(/\bbkb\b/g, 'BKB').replace(/\b3d\b/g, '3D');
    return lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1);
  }
  return value.charAt(0).toLocaleUpperCase('es') + value.slice(1);
}

const multiAlbums = new Set(DESIGN_ALBUMS.filter(item => item.imageCount > 1).map(item => item.id));
const byId = new Map([...COLLECTION_PRODUCTS, ...inventory.newProducts].map(item => [item.id, item]));
const gearNames = new Map(IMPLEMENTS.map(item => [item.id, item.name]));
const renamed = inventory.updatedCategories as Record<string, string[]>;
const CUSTOM_ORDER = 38223;
const shopCovers: Record<number, `/assets/${string}`> = {
  [CUSTOM_ORDER]: '/assets/tienda/crear-pedido.webp',
  38313: '/assets/tienda/replicas-bordadas-futbol.webp',
  38248: '/assets/tienda/replicas-bordadas.webp',
  27582: '/assets/tienda/motorcycle-manga-larga.webp',
};
const familyCovers: Record<string, `/assets/${string}`> = {
  implementos: '/assets/productos/implementos/portada.webp',
  replicas: '/assets/productos/replicas/portada.webp',
  uniformes: '/assets/productos/futbol/portada.webp',
  camisas: '/assets/productos/camisas-polos/portada.webp',
};
// Pin the configurator in the catalogue without changing the chronological sidebar.
const catalogue = [...inventory.pricesInCents].sort(([a], [b]) => Number(b === CUSTOM_ORDER) - Number(a === CUSTOM_ORDER));
export const SHOP_PRODUCTS = catalogue.map(([id, price]): ShopProduct => {
  const product = byId.get(id!)!;
  const categories = renamed[product.id] ?? product.categories;
  const name = gearNames.get(product.id) ?? displayName(product.name);
  const family = familyRules.find(rule => categories.some(category => rule.match.test(category)));
  const image = shopCovers[product.id] ?? (product.cover as `/assets/${string}` | null)
    ?? familyCovers[family?.value ?? ''] ?? '/assets/tienda/crear-pedido.webp';
  return {
    id: product.id, name,
    price: price === null ? null : price / 100,
    href: product.id === CUSTOM_ORDER ? '/configurador' : multiAlbums.has(product.id) ? albumHref(product.id) : product.href,
    image: siteAsset(fitted(image, product.id === CUSTOM_ORDER ? 600 : 240)),
    categories: family ? [...categories, family.value] : categories,
    group: family?.label ?? displayName(categoryNames.get(categories[0]) ?? categories[0].replaceAll('-', ' ')),
  };
});

const used = new Set(SHOP_PRODUCTS.flatMap(product => product.categories));
export const SHOP_CATEGORIES = [
  ...familyRules.map(({value, label}) => ({value, label})),
  ...Array.from(categoryNames, ([value, label]) => ({value, label: displayName(label)}))
    .filter(item => used.has(item.value) && item.value !== 'implementos-deportivos')
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))
    .map(category => {
      const shopItems = SHOP_PRODUCTS.filter(product => product.categories.includes(category.value));
      const albums = categoryAlbums(category.value);
      const ids = new Set(albums.map(album => album.id));
      const sameItems = ids.size === shopItems.length && shopItems.every(item => ids.has(item.id));
      return {...category, galleryHref: sameItems && albums.some(item => multiAlbums.has(item.id)) ? collectionHref(category.value) : undefined};
    }),
];
export const SHOP_LATEST = inventory.latest;
