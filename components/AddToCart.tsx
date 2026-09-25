'use client';

import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import {addCartItem, cartError} from '@/lib/cart';
import type {DesignAssets, OrderDraft} from '@/lib/order';
import {CartIcon} from './CartLink';
import './cart-controls.css';

export default function AddToCart({order, assets}: {order: OrderDraft; assets: DesignAssets}) {
  const [busy, setBusy] = useState(false), [status, setStatus] = useState<'idle'|'success'|'error'>('idle'), [message, setMessage] = useState('');
  const saving = useRef(false), mounted = useRef(true);
  useEffect(() => {mounted.current = true; return () => {mounted.current = false;};}, []);
  useEffect(() => {setStatus('idle'); setMessage('');}, [order, assets]);
  async function add() {
    if (saving.current) return;
    saving.current = true; setBusy(true); setStatus('idle'); setMessage('Guardando el equipo y sus imágenes…');
    try {
      const result = await addCartItem(order, assets);
      if (mounted.current) {setStatus('success'); setMessage(result.added ? 'Diseño añadido. Tu equipo y sus archivos quedaron guardados en el carrito.' : 'Este diseño ya está en tu carrito. Puedes revisarlo sin añadirlo de nuevo.');}
    } catch (error) {if (mounted.current) {setStatus('error'); setMessage(cartError(error));}}
    finally {saving.current = false; if (mounted.current) setBusy(false);}
  }
  return <section className="cart-add-panel" aria-label="Guardar diseño en el carrito">
    <div><p className="eyebrow">UNA COPIA DE TU EQUIPO</p><h3>LLÉVALO AL CARRITO.</h3><p>Guarda este diseño, su lista y sus archivos para reunir tu solicitud. Tony confirma el precio y la producción al cotizar.</p></div>
    <div className="cart-add-actions"><button type="button" className="button primary" disabled={busy} onClick={add}><span>{busy ? 'Guardando…' : status === 'success' ? 'Diseño guardado' : 'Añadir al carrito'}</span><CartIcon/></button>{status === 'success' && <Link href="/carrito" className="cart-open-link">Ver mi carrito <span aria-hidden="true">↗</span></Link>}</div>
    <p className={`cart-add-message ${status}`} role={status === 'error' ? 'alert' : 'status'}>{message}</p>
  </section>;
}
