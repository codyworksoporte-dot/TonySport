'use client';

import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import {usePathname} from 'next/navigation';
import {CART_FEEDBACK_EVENT, type CartFeedbackDetail} from '@/lib/cart-feedback';
import './cart-feedback.css';

export default function CartFeedback() {
  const [notice, setNotice] = useState<CartFeedbackDetail | null>(null);
  const [tick, setTick] = useState(0);
  const [held, setHeld] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pathname = usePathname();
  const clear = () => {clearTimeout(timer.current);};
  const dismiss = () => {clear(); setNotice(null);};
  const schedule = () => {clear(); timer.current = setTimeout(() => setNotice(null), 6000); setTick(t => t + 1);};
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
    {notice && <div className={`cart-feedback${notice.error ? ' is-error' : ''}`} data-animate={notice.animate !== false} data-held={held} onPointerEnter={() => {clear(); setHeld(true);}} onPointerLeave={() => {setHeld(false); schedule();}} onFocusCapture={() => {clear(); setHeld(true);}} onBlurCapture={event => {if (!event.currentTarget.contains(event.relatedTarget)) {setHeld(false); schedule();}}}>
      <span className="cart-feedback-mark" aria-hidden="true"><b>{notice.error ? '!' : '✓'}</b></span>
      <div><strong>{notice.error ? 'No se pudo guardar' : 'Guardado en tu carrito'}</strong><p>{notice.message}</p>{!notice.error && <Link href="/carrito" onClick={dismiss}>Ir al carrito <span aria-hidden="true">↗</span></Link>}</div>
      <button type="button" onClick={dismiss} aria-label="Cerrar confirmación del carrito">×</button>
      <i key={tick} className="cart-feedback-rail" aria-hidden="true"/>
    </div>}
  </div>;
}
