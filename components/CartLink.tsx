'use client';

import Link from 'next/link';
import {useCartCount} from '@/lib/cart';
import './cart-controls.css';

export function CartIcon() {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h18l-2 14H5L3 7ZM8 8V6a4 4 0 0 1 8 0v2"/><path d="m9 14 2 2 4-4"/></svg>;
}

export default function CartLink({className = '', onClick}: {className?: string; onClick?: () => void}) {
  const {count, loading, error} = useCartCount();
  return <Link href="/carrito" className={`cart-link ${className}`} onClick={onClick} aria-label={loading ? 'Abrir carrito' : error ? 'Abrir carrito; requiere revisión' : `Carrito, ${count} ${count === 1 ? 'diseño' : 'diseños'}`} title="Tu carrito"><CartIcon/><span className="cart-link-count" aria-hidden="true">{error ? '!' : loading ? '·' : count}</span></Link>;
}
