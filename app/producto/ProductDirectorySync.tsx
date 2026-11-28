import CategoryAliases from '@/components/product/CategoryAliases';
import {LEGACY_PRODUCT_HASHES, PRODUCT_MENU} from '@/lib/product-menu';
import {disciplineHref} from '@/lib/disciplines';

// Preserve saved links to the two collections previously listed under Empresarial.
const paths:Record<string,string> = {
  'opcion-empresarial-1':'/colecciones/linea-empresarial-con-cinta-reflectiva',
  'opcion-empresarial-2':'/colecciones/camisas-polo-lisas',
};
for (const section of PRODUCT_MENU) {
  paths['categoria-'+section.id] = disciplineHref(section.id);
  for (const card of section.cards) paths[card.id] = card.href;
}
for (const [alias,id] of Object.entries(LEGACY_PRODUCT_HASHES)) paths[alias] = paths[id];

export default function ProductDirectorySync() {
  return <CategoryAliases paths={paths}/>;
}
