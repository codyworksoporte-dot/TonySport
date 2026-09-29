import type {Metadata} from 'next';
import Link from 'next/link';
import {Suspense} from 'react';
import CollectionGallery from '@/components/CollectionGallery';
export const metadata: Metadata = {title: 'Todas las colecciones · Mundial, Anime y más'};
export default function CollectionsPage() {
  return <main id="contenido" className="internal-page"><section className="section-wrap internal-hero">
    <div className="internal-breadcrumb"><Link href="/">Inicio</Link><span>/</span><Link href="/catalogo">Catálogo</Link><span>/</span><span>Colecciones</span></div>
    <p className="eyebrow orange">EL CATÁLOGO DE TONY, A TU ALCANCE</p><h1>TODAS LAS LÍNEAS.<br/><em>TU IDENTIDAD.</em></h1>
    <p className="lead">Mundial, Anime, fútbol, empresa y mucho más. Abre una colección para recorrer sus diseños y consultar con Tony.</p>
    <Link className="text-link" href="/catalogo">Ver los 70 diseños listos para personalizar ↗</Link>
  </section><Suspense fallback={<p className="section-wrap" role="status">Cargando colecciones…</p>}><CollectionGallery/></Suspense></main>;
}
