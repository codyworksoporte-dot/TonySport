import CategoryAliases from '@/components/product/CategoryAliases';
import {LEGACY_PRODUCT_HASHES, PRODUCT_MENU} from '@/lib/product-menu';
import {disciplineHref} from '@/lib/disciplines';

const paths:Record<string,string> = {};
for (const section of PRODUCT_MENU) {
  paths['categoria-'+section.id] = disciplineHref(section.id);
  for (const card of section.cards) paths[card.id] = card.href;
}
for (const [alias,id] of Object.entries(LEGACY_PRODUCT_HASHES)) paths[alias] = paths[id];

export default function ProductDirectorySync() {
  return <CategoryAliases paths={paths}/>;
}
