import {notFound} from 'next/navigation';
import LineOptions from '@/components/product/LineOptions';
import ScopedDesigns from '@/components/product/ScopedDesigns';
import {PRODUCT_MENU} from '@/lib/product-menu';
import {PRODUCT_CATEGORIES} from '@/lib/products';
import {categoryAlbums} from '@/lib/scoped-collections';
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
  if (section.cards.length > 1) return <LineOptions title={section.name} cards={section.cards}/>;
  const albums = categoryAlbums(sourceSlug(category.sourceHref));
  return <ScopedDesigns title={section.name} albums={albums} back={{name:'Todas las disciplinas',href:'/producto'}}/>;
}
