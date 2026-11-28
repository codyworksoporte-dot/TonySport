import type {Metadata} from 'next';
import CategoryAliases from '@/components/product/CategoryAliases';
import LineOptions from '@/components/product/LineOptions';
import {PRODUCT_MENU} from '@/lib/product-menu';
import {IMPLEMENT_FAMILIES} from '@/lib/implements';

export const metadata:Metadata = {title:'Implementos deportivos'};
const section = PRODUCT_MENU.find(category=>category.id==='implementos')!;
const familyPaths = Object.fromEntries(IMPLEMENT_FAMILIES.map(family=>[family.id,'/implementos/'+family.id]));

export default function Implementos() {
  return <LineOptions title="Implementos deportivos" navLabel="Familias de implementos" cards={section.cards}
    more={{href:'/implementos/todos',label:'Ver todos los implementos'}}>
    <CategoryAliases paths={familyPaths}/>
  </LineOptions>;
}
