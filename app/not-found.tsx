import Link from 'next/link';
import Icon from '@/components/Icon';
import { TonyHead } from '@/components/TonyArt';
import './not-found.css';

/** Out of bounds: Tony peeks over the sideline with his eye on fire. */
export default function NotFound(){return <main id="contenido" className="not-found"><p className="eyebrow orange">404 · FUERA DE LA CANCHA</p><div className="nf-tony" aria-hidden="true"><div className="nf-tony-clip"><TonyHead className="nf-tony-head"/></div><span className="nf-tony-line"/></div><h1>SE NOS ESCAPÓ<br/>ESTA PÁGINA.</h1><p>El enlace no existe. Volvamos al juego.</p><Link href="/" className="button primary">Volver al inicio <Icon/></Link></main>}
