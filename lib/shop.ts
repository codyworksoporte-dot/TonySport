import { COLLECTION_PRODUCTS, COLLECTIONS } from '@/lib/collections';
import { IMPLEMENTS } from '@/lib/implements';
import { fitted } from '@/lib/responsive-image';
import { siteAsset } from '@/lib/asset-path';
import { storefrontImage } from '@/lib/storefront-image';
import inventory from '@/data/tienda.json';

export type ShopProduct = {
  id: number;
  name: string;
  href: string;
  image: string | null;
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

const byId = new Map([...COLLECTION_PRODUCTS, ...inventory.newProducts].map(item => [item.id, item]));
const gearNames = new Map(IMPLEMENTS.map(item => [item.id, item.name]));
const renamed = inventory.updatedCategories as Record<string, string[]>;
export const SHOP_PRODUCTS = inventory.pricesInCents.map(([id, price]): ShopProduct => {
  const product = byId.get(id!)!;
  const categories = renamed[product.id] ?? product.categories;
  const name = gearNames.get(product.id) ?? displayName(product.name);
  const family = familyRules.find(rule => categories.some(category => rule.match.test(category)));
  return {
    id: product.id, name,
    price: price === null ? null : price / 100,
    href: product.id === 38223 ? '/configurador' : product.href,
    image: product.cover ? siteAsset(fitted(product.cover as `/assets/${string}`, 240)) : storefrontImage('tienda-' + product.id) ?? null,
    categories: family ? [...categories, family.value] : categories,
    group: family?.label ?? displayName(categoryNames.get(categories[0]) ?? categories[0].replaceAll('-', ' ')),
  };
});

const used = new Set(SHOP_PRODUCTS.flatMap(product => product.categories));
export const SHOP_CATEGORIES = [
  ...familyRules.map(({value, label}) => ({value, label})),
  ...Array.from(categoryNames, ([value, label]) => ({value, label: displayName(label)}))
    .filter(item => used.has(item.value) && item.value !== 'implementos-deportivos')
    .sort((a, b) => a.label.localeCompare(b.label, 'es')),
];
export const SHOP_LATEST = inventory.latest;
