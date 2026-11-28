import type { Metadata } from 'next';
import Link from 'next/link';
import {Suspense} from 'react';
import Icon from '@/components/Icon';
import { SHOP_CATEGORIES, SHOP_LATEST, SHOP_PRODUCTS } from '@/lib/shop';
import Storefront from './Storefront';
import './tienda.css';

export const metadata: Metadata = {
  title: 'Tienda en línea',
  description: 'Buscá camisas, jerseys, uniformes e implementos de Tony por nombre, categoría y precio.',
};

export default function Tienda() {
  return <main id="contenido" className="tc-page shop-page"><div className="tc-wrap">
    <header className="tc-head shop-heading">
      <Link className="tc-back" href="/"><Icon name="left"/>Inicio</Link>
      <h1>Tienda <em className="tc-title-accent">en línea</em></h1>
    </header>
    <Suspense fallback={<p role="status">Cargando productos…</p>}><Storefront products={SHOP_PRODUCTS} categories={SHOP_CATEGORIES} latest={SHOP_LATEST}/></Suspense>
  </div></main>;
}
