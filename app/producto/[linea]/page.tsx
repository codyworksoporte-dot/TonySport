import {notFound} from 'next/navigation';
import ScopedDesigns from '@/components/product/ScopedDesigns';
import {PRODUCT_MENU} from '@/lib/product-menu';
import {PRODUCT_CATEGORIES} from '@/lib/products';
import {DESIGN_ALBUMS} from '@/lib/scoped-collections';
import {sourceSlug} from '@/lib/collection-path';

type Props = {params: Promise<{linea: string}>};
export const generateStaticParams = () => PRODUCT_MENU.filter(section=>section.id!=='implementos').map(section=>({linea:section.id}));

export async function generateMetadata({params}: Props) {
  const {linea} = await params;
  return {title: PRODUCT_MENU.find(section=>section.id===linea)?.name};
}

export default async function ProductLine({params}: Props) {
  const {linea} = await params;
  const section = PRODUCT_MENU.find(item=>item.id===linea);
  const category = PRODUCT_CATEGORIES.find(item=>item.id===linea);
  if (!section || !category || linea==='implementos') notFound();
  const slugs = new Set([category.sourceHref, ...category.children.map(child=>child.sourceHref)].map(sourceSlug));
  if (linea==='replicas') {slugs.add('replicas-bordadas-de-8-49');slugs.add('replicas-bordadas-de-futbol-de-10-99');}
  const albums = DESIGN_ALBUMS.filter(album=>album.categories.some(slug=>slugs.has(slug)));
  return <ScopedDesigns title={section.name} albums={albums} choices={section.cards} back={{name:'Todas las disciplinas',href:'/producto'}}/>;
}
