import type {Metadata} from 'next';
import Link from 'next/link';
import {RSE_SOURCE, rseImage} from '@/lib/rse';
import Gallery from './Gallery';
import './rse.css';

export const metadata: Metadata = {
  title: 'RSE Tony · Responsabilidad social empresarial',
  description: 'El archivo fotográfico de la comunidad deportiva de Tony en El Salvador. Equipos, partidos, boxeo y premiaciones.',
};

export default function RsePage() {
  return <main id="contenido" className="rse-page">
    <nav aria-label="Ruta de navegación" className="rse-path"><Link href="/">Inicio</Link> / RSE Tony</nav>
    <header className="rse-cover">
      <img src={rseImage(1)} alt="Trofeos de una jornada deportiva de Tony" width="1152" height="648" fetchPriority="high" />
      <div className="rse-cover-copy">
        <span>RSE Tony</span>
        <h1>Responsabilidad<br/><em>social empresarial.</em></h1>
        <p>Equipos, deportistas y premiaciones de nuestra comunidad en El Salvador.</p>
        <a href="#galeria">Ver la galería <span aria-hidden="true">↓</span></a>
      </div>
    </header>
    <Gallery/>
    <p className="rse-source">Fotografías del <a href={RSE_SOURCE} target="_blank" rel="noopener noreferrer">archivo oficial de Tony</a>.</p>
  </main>;
}
