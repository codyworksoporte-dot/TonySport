import Link from 'next/link';
import Icon from '@/components/Icon';
import TonyWordmark from '@/components/TonyWordmark';
import './not-found.css';

export default function NotFound(){return <main id="contenido" className="not-found"><p className="eyebrow orange">404 · FUERA DE LA CANCHA</p><div className="nf-tony" aria-hidden="true"><TonyWordmark sizes="(max-width: 440px) 66vw, 280px" fetchPriority="low"/></div><h1>SE NOS ESCAPÓ<br/><em className="tc-title-accent">ESTA PÁGINA.</em></h1><p>El enlace no existe. Volvamos al juego.</p><Link href="/" className="button primary">Volver al inicio <Icon/></Link></main>}
