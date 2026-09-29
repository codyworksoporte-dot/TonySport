import AccountGate from '@/components/AccountGate';
import type {Metadata} from 'next';
import Link from 'next/link';
import RecentOrders from '@/components/RecentOrders';
import '@/components/customer-content.css';
export const metadata:Metadata={title:'Recientes · Tus pedidos',description:'Revisa tus solicitudes recientes, cantidades, tallas y técnicas de personalización.'};
export default function RecentsPage(){return <main id="contenido" className="customer-page"><header className="customer-hero section-wrap"><nav aria-label="Ruta de navegación"><Link href="/">Inicio</Link><span>/</span><span>Recientes</span></nav><p className="eyebrow">TU EQUIPO. CADA DETALLE.</p><h1>TUS IDEAS.<br/><em>A UN VISTAZO.</em></h1><p>Vuelve a tus solicitudes y encuentra lo importante: cuántas prendas, qué tallas y cómo las quieres.</p></header><AccountGate inline><RecentOrders/></AccountGate></main>}
