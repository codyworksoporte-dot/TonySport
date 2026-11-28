import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import Icon from '@/components/Icon';
import {LineCover} from '@/components/business/BusinessLines';
import ProductGallery from '@/components/business/ProductGallery';
import factory from '@/data/factory.json';
import prestige from '@/data/prestige.json';
import {businessLines, businessLineIds} from '@/lib/business-lines';

const products = {factory, prestige};
type Props = {params: Promise<{linea: string}>};

export const dynamicParams = false;
export function generateStaticParams() {
  return businessLineIds.map(linea => ({linea}));
}

async function resolveLine(params: Props['params']) {
  const {linea} = await params;
  const line = businessLineIds.find(id => id === linea);
  if (!line) notFound();
  return line;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {name, description} = businessLines[await resolveLine(params)];
  return {title: `Línea ${name} | Tony Empresarial`, description};
}

export default async function BusinessPage({params}: Props) {
  const line = await resolveLine(params);
  return <main id="contenido" className={`tc-page business-page business-${line}`}><div className="tc-wrap">
    <Link className="tc-back" href="/producto/empresarial"><Icon name="left"/>Línea empresarial</Link>
    <header className="business-cover"><LineCover line={line} heading/></header>
    <ProductGallery line={line} products={products[line]}/>
  </div></main>;
}
