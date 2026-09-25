import Link from 'next/link';
import Icon from '@/components/Icon';
export default function NotFound(){return <main id="contenido" className="not-found"><p className="eyebrow orange">404 · FUERA DE LA CANCHA</p><div className="reptile-eyes" aria-hidden="true"><i/><i/></div><h1>SE NOS ESCAPÓ<br/>ESTA PÁGINA.</h1><p>El enlace no existe. Volvamos al juego.</p><Link href="/" className="button primary">Volver al inicio <Icon/></Link></main>}
