'use client';

import Link from 'next/link';
import {useCartCount} from '@/lib/cart';
import {usePedidoCart} from '@/lib/pedido/storage';
import './cart-controls.css';

export function CartIcon() {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h18l-2 14H5L3 7ZM8 8V6a4 4 0 0 1 8 0v2"/><path d="m9 14 2 2 4-4"/></svg>;
}

export default function CartLink({className = '', onClick}: {className?: string; onClick?: () => void}) {
  const {count, loading, error} = useCartCount();
  const pedido = usePedidoCart();
  const total = count + pedido.items.length, busy = loading || pedido.loading, failure = error || pedido.error;
  return <Link href="/carrito" className={`cart-link ${className}`} onClick={onClick} aria-label={busy ? 'Abrir carrito' : failure ? 'Abrir carrito; requiere revisión' : `Carrito, ${total} ${total === 1 ? 'diseño' : 'diseños'}`} title="Tu carrito"><CartIcon/><span className="cart-link-count" aria-hidden="true">{failure ? '!' : busy ? '·' : total}</span></Link>;
}
