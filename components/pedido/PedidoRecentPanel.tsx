'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { readReceipts, rememberReceipt, usePedidoCart } from '@/lib/pedido/storage';
import { trackPedido, type Receipt } from '@/lib/pedido/api';
import type { SubmittedReceipt } from '@/lib/pedido/types';
import { pedidoSizes } from './PedidoCartPanel';
import './customer-panels.css';

const readable = (status: string) => ({ pending: 'Pendiente', received: 'Recibido', submitted: 'Enviado', paid: 'Pagado', payment_pending: 'Pago pendiente', processing: 'En revisión', approved: 'Aprobado', cancelled: 'Cancelado', rejected: 'Rechazado', failed: 'No completado', verified: 'Verificado', confirmed: 'Confirmado', transfer_review: 'Transferencia en revisión', deposit_paid: 'Anticipo verificado', awaiting_review: 'Pendiente de revisión', transfer_pending: 'Transferencia pendiente' }[status] || status.replace(/_/g, ' '));
const money = (cents: number) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(cents / 100);

export default function PedidoRecentPanel({ onPresenceChange }: { onPresenceChange?: (hasEntries: boolean) => void }) {
  const { items, loading, error, refresh } = usePedidoCart();
  const [references, setReferences] = useState<SubmittedReceipt[]>([]), [ready, setReady] = useState(false);
  const [verified, setVerified] = useState<Record<string, Receipt>>({}), [checking, setChecking] = useState(''), [failures, setFailures] = useState<Record<string, string>>({});
  useEffect(() => { const update = () => { setReferences(readReceipts()); setReady(true); }; update(); window.addEventListener('tony-pedido-updated', update); window.addEventListener('storage', update); window.addEventListener('focus', update); return () => { window.removeEventListener('tony-pedido-updated', update); window.removeEventListener('storage', update); window.removeEventListener('focus', update); }; }, []);
  useEffect(() => { if (!loading && ready) onPresenceChange?.(Boolean(items.length || references.length || error)); }, [items.length, references.length, loading, ready, error, onPresenceChange]);
  async function check(id: string) {
    if (checking) return; setChecking(id); setFailures(value => ({ ...value, [id]: '' }));
    try { const receipt = await trackPedido(id); if (receipt.id !== id) throw new Error('La respuesta no corresponde a este pedido. Intenta consultar nuevamente.'); setVerified(value => ({ ...value, [id]: receipt })); rememberReceipt({ id: receipt.id, status: receipt.status }); }
    catch (cause) { setFailures(value => ({ ...value, [id]: cause instanceof Error ? cause.message : 'No pudimos verificar el pedido. Vuelve a intentarlo.' })); }
    finally { setChecking(''); }
  }
  if (loading || !ready) return <p className="pedido-customer-note" role="status">Recuperando tus pedidos…</p>;
  if (!items.length && !references.length && !error) return null;
  return <div className="pedido-recents">
    {references.length > 0 && <section aria-labelledby="pedido-references-title"><div className="pedido-customer-heading"><div><p className="eyebrow">TUS REFERENCIAS</p><h2 id="pedido-references-title">Pedidos <em>enviados.</em></h2></div></div><p className="pedido-customer-note">En este navegador conservamos únicamente la referencia y el último estado. Consulta el servicio de Tony para verificar la información actual de tu pedido.</p><div className="pedido-receipt-grid">{references.map(reference => { const receipt = verified[reference.id]; return <article className="pedido-receipt" key={reference.id}><span className="pedido-receipt-label">{receipt ? 'ESTADO VERIFICADO AHORA' : 'ÚLTIMO ESTADO GUARDADO'}</span><h3>{receipt?.reference || reference.id}</h3><p className="pedido-receipt-status">{readable(receipt?.status || reference.status)}</p>{receipt && <dl><div><dt>Pago</dt><dd>{readable(receipt.paymentStatus)}</dd></div><div><dt>Total</dt><dd>{money(receipt.totalCents)}</dd></div><div><dt>Anticipo</dt><dd>{money(receipt.depositCents)}</dd></div><div><dt>Saldo</dt><dd>{money(receipt.balanceCents)}</dd></div></dl>}{receipt && (receipt as Receipt & {panelStatus?: string}).panelStatus === 'pending' && <p className="pedido-customer-note">Envío al Panel pendiente. Tony conserva tu pedido para completar la recepción.</p>}<button type="button" className="pedido-saved-secondary" disabled={Boolean(checking)} onClick={() => check(reference.id)}>{checking === reference.id ? 'Consultando…' : 'Consultar estado'} <span aria-hidden="true">↗</span></button>{failures[reference.id] && <p className="pedido-customer-error" role="alert">{failures[reference.id]}</p>}</article>; })}</div><p className="pedido-customer-note">La consulta requiere la sesión desde la que enviaste el pedido. Una referencia por sí sola no permite abrir datos privados.</p></section>}
    {error && <div className="pedido-customer-error" role="alert"><p>{error}</p><button type="button" className="pedido-saved-secondary" onClick={() => void refresh()}>Volver a intentar</button></div>}
    {items.length > 0 && <section aria-labelledby="pedido-drafts-title"><div className="pedido-customer-heading"><div><p className="eyebrow">EN TU CARRITO</p><h2 id="pedido-drafts-title">Pedidos <em>en preparación.</em></h2></div><Link href="/carrito" className="pedido-saved-secondary">Abrir carrito ↗</Link></div><div className="pedido-receipt-grid">{items.map(item => <article className="pedido-receipt" key={item.id}><span className="pedido-receipt-label">BORRADOR · SIN CONFIRMAR</span><h3>{item.teamName || 'Tu equipo'}</h3><dl><div><dt>Cantidad</dt><dd>{item.quantity} {item.product === 'uniform' ? 'uniformes' : 'camisas'}</dd></div><div><dt>Técnica</dt><dd>Full sublimado</dd></div><div><dt>Diseño</dt><dd>{item.design.catalogCode || 'Propio'}</dd></div><div><dt>Tela</dt><dd>{item.config.fabric || 'Por elegir'}</dd></div>{item.goalkeepers.length > 0 && <div><dt>Porteros</dt><dd>{item.goalkeepers.length}</dd></div>}</dl><div className="pedido-saved-sizes" aria-label="Resumen de tallas">{Object.entries(pedidoSizes(item)).map(([size, count]) => <span key={size}>{size} <b>× {count}</b></span>)}</div><Link href={`/configurador?pedido=${encodeURIComponent(item.id)}`} className="pedido-saved-resume">Continuar pedido ↗</Link></article>)}</div></section>}
  </div>;
}
