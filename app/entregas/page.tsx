import type {Metadata} from 'next';
import OrderLookup from '@/components/pages/OrderLookup';

// "Entregas" became "Consulta tu pedido" (/consulta). Old links land on the same content.
export const metadata: Metadata = {
  title: 'Consulta tu pedido',
  description: 'Consulta el estado de tu pedido Tony Sportswear con tu número de orden.',
};

export default function EntregasPage() {
  return <OrderLookup/>;
}
