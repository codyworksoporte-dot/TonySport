'use client';
import Link from 'next/link';
import {useCart} from '@/lib/cart';
import {activePlayers,variantLabel} from '@/lib/order';
import {techniqueLabel} from '@/lib/studio';
import Jersey from './Jersey';
import Icon from './Icon';

export default function RecentOrders(){
  const {items,loading,error,refresh}=useCart();
  const sorted=[...items].sort((a,b)=>new Date(b.addedAt).getTime()-new Date(a.addedAt).getTime());
  return <section className="recent-content section-wrap">
    <div className="recent-private-note"><Icon name="shield"/><div><strong>Este espacio es tuyo.</strong><p>Las solicitudes se guardan en este navegador. Tus nombres, tallas y diseños no aparecen en un muro público.</p></div></div>
    <div className="recent-section-heading"><div><p className="eyebrow">EN TU CARRITO</p><h2>Solicitudes<br/><em>recientes.</em></h2></div><Link className="text-link" href="/carrito">Abrir mi carrito <Icon name="diagonal"/></Link></div>
    {loading?<p className="customer-loading" role="status">Recuperando tus solicitudes…</p>:error?<div className="customer-error" role="alert"><h3>No pudimos abrir tu historial.</h3><p>{error}</p><button className="button outline" type="button" onClick={()=>void refresh()}>Volver a intentar <Icon/></button></div>:sorted.length?<div className="recent-list">{sorted.map(item=>{
      const order=item.order;
      const sizes=activePlayers(order).reduce<Record<string,number>>((all,player)=>{all[player.size]=(all[player.size]||0)+1;return all;},{});
      const date=new Date(item.addedAt);
      return <article className="recent-order" key={item.id}>
        <div className="recent-order-art" aria-hidden="true"><Jersey color={order.design.color} accent={order.design.accent} variant={order.design.elements.pattern?order.design.variant:'clean'} name={order.team} elements={order.design.elements} collar={order.garment.collar} sleeve={order.garment.sleeve}/><span>RESUMEN DEL ESTILO</span></div>
        <div className="recent-order-copy"><div className="recent-order-top"><span className="customer-status">POR COTIZAR</span><time dateTime={date.toISOString()}>{new Intl.DateTimeFormat('es-SV',{day:'2-digit',month:'short',year:'numeric'}).format(date)}</time></div><h3>{order.team}</h3><dl><div><dt>Cantidad</dt><dd>{order.quantity} {order.line==='kit'?'uniformes':'camisas'}</dd></div><div><dt>Técnica</dt><dd>{techniqueLabel(order.garment.technique)}</dd></div><div><dt>Diseño</dt><dd>{order.design.mode==='reference'?'Referencia propia':variantLabel(order.design.elements.pattern?order.design.variant:'clean')}</dd></div><div><dt>Tela</dt><dd>{order.garment.fabric}</dd></div></dl><div className="recent-sizes" role="group" aria-label="Resumen de tallas">{Object.entries(sizes).map(([size,quantity])=><span key={size}><strong>{size}</strong> × {quantity}</span>)}</div><Link href={`/carrito#cart-${item.id}`} className="recent-detail-link">Ver diseño completo y detalles <Icon name="diagonal"/></Link></div>
      </article>;
    })}</div>:<div className="recent-empty"><div className="recent-empty-sheets" aria-hidden="true"><i/><i/><i/><span>TONY</span></div><div><h3>Tu próxima idea<br/><em>tendrá su lugar aquí.</em></h3><p>Aún no tienes solicitudes guardadas. Cuando añadas un diseño al carrito desde la revisión de tu equipo, encontrarás aquí sus detalles.</p><Link href="/" className="button outline">Volver al inicio <Icon/></Link></div></div>}
    <aside className="recent-purchases-note"><span className="recent-purchases-icon" aria-hidden="true">✓</span><div><h3>Compras confirmadas</h3><p>El historial de compras confirmadas todavía no está disponible. Guardar una solicitud en el carrito no confirma una compra, un pago ni la producción.</p></div></aside>
  </section>;
}

