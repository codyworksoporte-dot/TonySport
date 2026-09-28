import type {Metadata} from 'next';
import Link from 'next/link';
import CatalogGallery from '@/components/CatalogGallery';
export const metadata:Metadata={title:'Catálogo de diseños'};
export default function Catalogo(){return <main id="contenido" className="internal-page"><section className="section-wrap internal-hero"><div className="internal-breadcrumb"><Link href="/">Inicio</Link><span>/</span><span>Catálogo</span></div><p className="eyebrow orange">CATÁLOGO OFICIAL TONY</p><h1>ELIGE UN DISEÑO.<br/><span>HAZLO TUYO.</span></h1><p className="lead">Toca cualquier diseño para verlo completo, frontal y dorsal, y úsalo como base de tu pedido.</p></section><CatalogGallery/></main>}
