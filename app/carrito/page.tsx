import type {Metadata} from 'next';
import CartExperience from '@/components/CartExperience';
import './carrito.css';

export const metadata: Metadata = {title: 'Mi carrito', description: 'Tus equipos personalizados, con diseños, tallas y técnicas guardados para solicitar una cotización a Tony.'};
export default function CartPage() {return <CartExperience/>;}
