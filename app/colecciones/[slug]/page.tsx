import {notFound} from 'next/navigation';
import LineOptions from '@/components/product/LineOptions';
import {PRODUCT_CATEGORIES} from '@/lib/products';
import {PRODUCT_MENU} from '@/lib/product-menu';
import {sourceSlug} from '@/lib/collection-path';
import ScopedDesigns from '@/components/product/ScopedDesigns';
import {DESIGN_ALBUMS, categoryTitles, categoryAlbums} from '@/lib/scoped-collections';

type Props = {params: Promise<{slug: string}>};
const individual = new Map(DESIGN_ALBUMS.filter(album => album.imageCount > 1 || album.categories.includes('moldes-de-futbol')).map(album => ['album-' + album.id, album]));

export function generateStaticParams() {
  return [...categoryTitles.keys(), ...individual.keys()].map(slug => ({slug}));
}

export async function generateMetadata({params}: Props) {
  const {slug} = await params;
  return {title: categoryTitles.get(slug) ?? individual.get(slug)?.name};
}

export default async function Collection({params}: Props) {
  const {slug} = await params;
  const product = individual.get(slug);
  const title = categoryTitles.get(slug) ?? product?.name;
  if (!title) notFound();
  // Bookmarks and the collections directory can also name a whole product line.
  const category = PRODUCT_CATEGORIES.find(item=>sourceSlug(item.sourceHref)===slug);
  const section = category && PRODUCT_MENU.find(item=>item.id===category.id);
  if (section && section.cards.length>1) return <LineOptions title={section.name} cards={section.cards}
    more={section.more && {href:section.more.href,label:section.more.cta}}/>;
  const albums = product ? [product] : categoryAlbums(slug);
  return <ScopedDesigns title={title} albums={albums} individualAlbum={Boolean(product)} back={{name:'Todas las colecciones', href:'/colecciones'}}/>;
}
