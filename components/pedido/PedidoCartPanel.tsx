'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { removePedidoCart, type usePedidoCart } from '@/lib/pedido/storage';
import type { PedidoDraft } from '@/lib/pedido/types';
import { siteAsset } from '@/lib/asset-path';
import TonyMascot from '../TonyMascot';
import './customer-panels.css';

type CartState = ReturnType<typeof usePedidoCart>;
const imagePath = (src: string) => src.startsWith('/assets/') ? siteAsset(src as `/assets/${string}`) : src;
export function pedidoSizes(draft: PedidoDraft) { return [...draft.players, ...draft.goalkeepers].reduce<Record<string, number>>((all, player) => { const size = player.size || 'Por elegir'; all[size] = (all[size] || 0) + 1; return all; }, {}); }

function CartPreview({ item }: { item: PedidoDraft }) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [composed, setComposed] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const base = side === 'front' ? item.design.finalFront || item.design.front : item.design.finalBack || item.design.back;
  useEffect(() => {
    let active = true; setComposed(''); setPreviewError(false);
    if (!base || (side === 'front' ? item.design.finalFront : item.design.finalBack) || !item.design.layers.some(layer => layer.side === side && layer.visible)) return;
    import('./DesignEditor').then(module => module.renderPedidoDesign(item.design, side)).then(src => { if (active) setComposed(src); }).catch(() => { if (active) setPreviewError(true); });
    return () => { active = false; };
  }, [base, item.design, side]);
  return <div className="pedido-saved-preview"><div className="pedido-saved-tabs" role="group" aria-label={`Vista de ${item.teamName || 'tu equipo'}`}><button type="button" aria-pressed={side === 'front'} onClick={() => setSide('front')}>Frontal</button><button type="button" aria-pressed={side === 'back'} onClick={() => setSide('back')}>Dorsal</button></div>{base ? <img src={composed || imagePath(base)} alt={`Diseño ${side === 'front' ? 'frontal' : 'dorsal'} de ${item.teamName || 'tu equipo'}`} loading="lazy" width="320" height="400" /> : <div className="pedido-saved-placeholder">Vista pendiente</div>}<p>{previewError ? 'Abre el editor para revisar todas las capas.' : 'Vista de tu borrador'}</p></div>;
}

export default function PedidoCartPanel({ cart }: { cart: CartState }) {
  const { items, loading, error, refresh } = cart;
  const [confirm, setConfirm] = useState<PedidoDraft | null>(null);
  const [departing, setDeparting] = useState<PedidoDraft | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [failure, setFailure] = useState('');
  const dialog = useRef<HTMLDialogElement>(null), heading = useRef<HTMLHeadingElement>(null), trigger = useRef<HTMLButtonElement | null>(null), cancel = useRef<HTMLButtonElement>(null);
  const pending = useRef(false), timer = useRef<ReturnType<typeof setTimeout> | null>(null), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (timer.current) clearTimeout(timer.current); }; }, []);
  useEffect(() => { if (confirm && !dialog.current?.open) { dialog.current?.showModal(); cancel.current?.focus(); } else if (!confirm && dialog.current?.open) dialog.current.close(); }, [confirm]);
  function focusTrigger() { if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true }); }
  async function remove() {
    if (!confirm || pending.current) return; const item = confirm; pending.current = true; setBusy(true); setFailure(''); setConfirm(null);
    try {
      await removePedidoCart(item.id); if (!mounted.current) return;
      setMessage(`${item.teamName || 'El diseño'} se retiró del carrito. El borrador que estabas editando se conserva.`);
      const finish = () => { setDeparting(null); setBusy(false); pending.current = false; heading.current?.focus({ preventScroll: true }); };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.tonyEffects === 'off') finish(); else { setDeparting(item); timer.current = setTimeout(finish, 950); }
    } catch (cause) { if (mounted.current) { setFailure(cause instanceof Error ? cause.message : 'No pudimos retirar el diseño. Vuelve a intentarlo.'); setBusy(false); pending.current = false; focusTrigger(); } }
  }
  const displayed = [...items]; if (departing && !displayed.some(item => item.id === departing.id)) displayed.push(departing);
  if (loading) return <div className="pedido-saved-panel cart-wrap"><p role="status">Recuperando tus diseños del nuevo configurador…</p></div>;
  if (error) return <section className="pedido-saved-panel cart-wrap"><p className="pedido-customer-error" role="alert">{error}</p><button type="button" onClick={() => void refresh()} className="pedido-saved-secondary">Volver a intentar</button></section>;
  if (!displayed.length && !message && !failure) return null;
  return <section className="pedido-saved-panel cart-wrap" aria-labelledby="pedido-cart-title"><div className="pedido-customer-heading"><div><p className="eyebrow">CONFIGURADOR TONY</p><h2 ref={heading} tabIndex={-1} id="pedido-cart-title">Tus diseños <em>guardados.</em></h2></div><span>{items.length} {items.length === 1 ? 'diseño' : 'diseños'}</span></div><p className="pedido-customer-note">Retoma cada equipo para completar su pedido. El pago y la confirmación se realizan individualmente.</p>
    <div className="pedido-saved-list">{displayed.map(item => <article className={`pedido-saved-card cart-design${departing?.id === item.id ? ' is-eaten' : ''}`} key={item.id} id={`pedido-cart-${item.id}`} aria-busy={busy && departing?.id === item.id}>
      <div className="pedido-saved-surface cart-design-surface"><CartPreview item={item} /><div className="pedido-saved-copy"><div className="pedido-saved-top"><span>EN PREPARACIÓN</span><button type="button" className="pedido-saved-delete" disabled={busy} aria-label={`Eliminar ${item.teamName || 'diseño'} del nuevo carrito`} onClick={event => { trigger.current = event.currentTarget; setConfirm(item); setFailure(''); }}>Eliminar ×</button></div><h3>{item.teamName || 'Tu equipo'}</h3><p className="pedido-saved-code">{item.design.catalogCode || 'Diseño propio'} · {item.product === 'uniform' ? 'Uniforme completo' : 'Camisa'}</p><dl><div><dt>Cantidad</dt><dd>{item.quantity} de campo{item.goalkeepers.length > 0 ? ` + ${item.goalkeepers.length} ${item.goalkeepers.length === 1 ? 'portero' : 'porteros'}` : ''}</dd></div><div><dt>Técnica</dt><dd>Full sublimado</dd></div><div><dt>Tela</dt><dd>{item.config.fabric || 'Por elegir'}</dd></div><div><dt>Acabado</dt><dd>{[item.config.brand3d ? 'Marca 3D' : '', item.config.crest3d ? 'Escudo 3D' : ''].filter(Boolean).join(' · ') || 'Sublimado'}</dd></div></dl><div className="pedido-saved-sizes" aria-label="Tallas del equipo">{Object.entries(pedidoSizes(item)).map(([size, count]) => <span key={size}>{size} <b>× {count}</b></span>)}</div><Link className="pedido-saved-resume" href={`/configurador?pedido=${encodeURIComponent(item.id)}`}>Continuar este pedido <span aria-hidden="true">↗</span></Link></div></div>
      {departing?.id === item.id && <div className="cart-bite" aria-hidden="true"><div className="cart-bite-mascot"><TonyMascot /></div><span>¡ÑAM!</span></div>}
    </article>)}</div>
    {message && <p className="pedido-customer-success" role="status">{message}</p>}{failure && <p className="pedido-customer-error" role="alert">{failure}</p>}
    <dialog ref={dialog} className="cart-confirm" aria-labelledby="pedido-remove-title" aria-describedby="pedido-remove-description" onCancel={() => setConfirm(null)} onClose={focusTrigger}><p className="eyebrow">CONFIRMA ANTES DE CONTINUAR</p><h2 id="pedido-remove-title">¿Retirar este <em>diseño?</em></h2><p id="pedido-remove-description">Se retirará <strong>{confirm?.teamName || 'este equipo'}</strong> del carrito. El borrador del editor se conserva.</p><div><button ref={cancel} type="button" className="cart-keep" onClick={() => setConfirm(null)}>Conservar diseño</button><button type="button" className="cart-confirm-remove" onClick={remove}>Sí, eliminar</button></div></dialog>
  </section>;
}
