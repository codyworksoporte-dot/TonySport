'use client';

import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import {usePathname} from 'next/navigation';
import {CART_FEEDBACK_EVENT, type CartFeedbackDetail} from '@/lib/cart-feedback';
import './cart-feedback.css';

export default function CartFeedback() {
  const [notice, setNotice] = useState<CartFeedbackDetail | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pathname = usePathname();
  const clear = () => {clearTimeout(timer.current);};
  const dismiss = () => {clear(); setNotice(null);};
  const schedule = () => {clear(); timer.current = setTimeout(() => setNotice(null), 6000);};
  useEffect(() => {
    const saved = (event: Event) => {setNotice((event as CustomEvent<CartFeedbackDetail>).detail); schedule();};
    window.addEventListener(CART_FEEDBACK_EVENT, saved);
    return () => {window.removeEventListener(CART_FEEDBACK_EVENT, saved); clear();};
  }, []);
  useEffect(dismiss, [pathname]);
  useEffect(() => {
    if (!notice) return;
    const visibility = () => {if (document.hidden) clear(); else schedule();};
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [notice]);
  return <div className="cart-feedback-region" aria-live="polite" aria-atomic="true">
    {notice && <div className={`cart-feedback${notice.error ? ' is-error' : ''}`} data-animate={notice.animate !== false} onPointerEnter={clear} onPointerLeave={schedule} onFocusCapture={clear} onBlurCapture={event => {if (!event.currentTarget.contains(event.relatedTarget)) schedule();}}>
      <span className="cart-feedback-mark" aria-hidden="true">{notice.error ? '!' : '✓'}</span>
      <div><strong>{notice.error ? 'No se pudo guardar' : 'Guardado en tu carrito'}</strong><p>{notice.message}</p>{!notice.error && <Link href="/carrito" onClick={dismiss}>Ir al carrito <span aria-hidden="true">↗</span></Link>}</div>
      <button type="button" onClick={dismiss} aria-label="Cerrar confirmación del carrito">×</button>
    </div>}
  </div>;
}
