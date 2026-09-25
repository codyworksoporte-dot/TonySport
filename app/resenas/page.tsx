import type {Metadata} from 'next';
import Link from 'next/link';
import ReviewExperience from '@/components/ReviewExperience';
import '@/components/customer-content.css';
export const metadata:Metadata={title:'Reseñas · Tu experiencia con Tony',description:'Comparte tu experiencia y conoce las reseñas publicadas de la comunidad Tony.'};
export default function ReviewsPage(){return <main id="contenido" className="customer-page"><header className="customer-hero section-wrap"><nav aria-label="Ruta de navegación"><Link href="/">Inicio</Link><span>/</span><span>Reseñas</span></nav><p className="eyebrow">DE EQUIPO A EQUIPO.</p><h1>TU EXPERIENCIA<br/><em>DEJA HUELLA.</em></h1><p>Lo que viviste con Tony importa. Cuéntanos qué funcionó, qué te gustó y en qué podemos mejorar.</p></header><ReviewExperience/></main>}
