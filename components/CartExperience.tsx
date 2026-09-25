'use client';

import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import {cartError, removeCartItem, useCart, type CartItem} from '@/lib/cart';
import {activePlayers, orderText, quantityOf, rosterCSV} from '@/lib/order';
import {techniqueLabel} from '@/lib/studio';
import stores from '@/data/tony-stores.json';
import Icon from './Icon';
import StudioCanvas, {exportStudioPNG} from './StudioCanvas';
import TonyMascot from './TonyMascot';
import {CartIcon} from './CartLink';

const noop = () => {};
function sizesOf(item: CartItem) {
  return activePlayers(item.order).reduce<Record<string, number>>((sizes, player) => {sizes[player.size] = (sizes[player.size] || 0) + 1; return sizes;}, {});
}
function download(text: string, name: string, mime = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], {type: mime}));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CartDesign({item, index, removing, eating, onRemove}: {item: CartItem; index: number; removing: boolean; eating: boolean; onRemove: (item: CartItem, button: HTMLButtonElement) => void}) {
  const [side, setSide] = useState<'front'|'back'>('front'), [exporting, setExporting] = useState(false), [message, setMessage] = useState('');
  const canvas = useRef<HTMLDivElement>(null);
  const {order, assets} = item;
  const players = activePlayers(order);
  async function exportView() {
    if (!canvas.current || exporting) return;
    setExporting(true); setMessage('');
    try {
      const blob = await exportStudioPNG(canvas.current);
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `tony-${order.team.replace(/[^\p{L}\p{N}_-]/gu, '-').slice(0, 35)}-${side === 'front' ? 'frente' : 'espalda'}.png`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Vista descargada. Puedes adjuntarla a tu cotización.');
    } catch {setMessage('No pudimos descargar la vista. Conserva tus archivos originales y vuelve a intentarlo.');}
    finally {setExporting(false);}
  }
  function original(key: string) {
    const value = assets[key]; if (!value) return;
    const link = document.createElement('a'); link.href = value;
    link.download = `tony-${key}.${value.startsWith('data:image/jpeg') ? 'jpg' : value.startsWith('data:image/webp') ? 'webp' : 'png'}`;
    link.click(); setMessage('Archivo descargado. Adjunta el original a tu cotización.');
  }
  return <article id={`cart-${item.id}`} className={`cart-design${eating ? ' is-eaten' : ''}`} aria-labelledby={`cart-title-${item.id}`} aria-busy={removing} data-cart-item={item.id}>
    <div className="cart-design-surface">
      <div className="cart-art"><span className="cart-art-index">DISEÑO {String(index + 1).padStart(2, '0')}</span><div className="cart-view-tabs" role="group" aria-label={`Vista de ${order.team}`}><button type="button" aria-pressed={side === 'front'} onClick={() => setSide('front')}>Frente</button><button type="button" aria-pressed={side === 'back'} onClick={() => setSide('back')}>Espalda</button></div>
        <div className="cart-canvas" ref={canvas}><StudioCanvas design={order.design} garment={order.garment} team={order.team} player={players[0]} assets={assets} side={side} line={order.line} selectedId={null} onSelect={noop} onLayerChange={noop} onGestureStart={noop} onGestureEnd={noop} readOnly/></div><span className="cart-preview-note">VISTA ORIENTATIVA · DISEÑO GUARDADO</span>
      </div>
      <div className="cart-design-copy"><div className="cart-item-top"><span className="cart-item-status"><i aria-hidden="true"/>POR COTIZAR</span><button type="button" className="cart-remove" disabled={removing} aria-label={`Eliminar ${order.team} del carrito`} onClick={event => onRemove(item, event.currentTarget)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 7h16M9 7V3h6v4M6 7l1 14h10l1-14M10 10v7m4-7v7"/></svg><span>{removing ? 'Retirando…' : 'Eliminar'}</span></button></div>
        <h2 id={`cart-title-${item.id}`}>{order.team}</h2><p className="cart-line-label">{quantityOf(order)} {order.line === 'kit' ? 'uniformes · camisa + calzoneta' : 'camisas'}</p>
        <dl className="cart-item-specs"><div><dt>Técnica</dt><dd>{techniqueLabel(order.garment.technique)}</dd></div><div><dt>Tela</dt><dd>{order.garment.fabric}</dd></div><div><dt>Molde</dt><dd>{order.garment.mold} · {order.garment.construction}</dd></div><div><dt>Color</dt><dd className="cart-color"><i style={{background: order.design.color}}/><i style={{background: order.design.accent}}/><span>{order.design.color} / {order.design.accent}</span></dd></div></dl>
        <div className="cart-sizes"><p>TALLAS DEL EQUIPO</p><div>{Object.entries(sizesOf(item)).map(([size, count]) => <span key={size}><b>{size}</b><span>× {count}</span></span>)}</div></div>
        <div className="cart-item-bottom"><span>Precio <strong>Por confirmar</strong></span><button type="button" onClick={exportView} disabled={exporting || (order.design.mode === 'reference' && !assets[side])}>{exporting ? 'Preparando…' : `Descargar ${side === 'front' ? 'frente' : 'espalda'}`}<Icon name="diagonal"/></button></div>
      </div>
      <details className="cart-item-details"><summary>Jugadores, archivos y detalles <Icon name="plus"/></summary><div className="cart-detail-content"><div className="cart-roster-wrap"><table><caption>Personalización de {order.team}</caption><thead><tr><th>Nombre</th><th>Talla</th><th>Dorsal</th><th>Rol</th></tr></thead><tbody>{players.map(player => <tr key={player.id}><th scope="row">{player.name}</th><td>{player.size}</td><td>{player.number}</td><td>{player.role === 'goalkeeper' ? 'Portero' : 'Jugador'}</td></tr>)}</tbody></table></div>{order.notes && <p><strong>Indicaciones:</strong> {order.notes}</p>}<div className="cart-file-links"><button type="button" onClick={() => {download(rosterCSV(order), 'tony-lista-jugadores.csv', 'text/csv;charset=utf-8'); setMessage('Lista de jugadores descargada.');}}>Descargar lista de jugadores ↗</button>{Object.keys(assets).map(key => <button type="button" key={key} onClick={() => original(key)}>↓ {key === 'front' ? 'Referencia frontal' : key === 'back' ? 'Referencia posterior' : key === 'crest' ? 'Escudo original' : order.design.layers.find(layer => layer.assetKey === key)?.name || 'Imagen del diseño'}</button>)}</div></div></details>
      {message && <p className="cart-item-message" role="status">{message}</p>}
    </div>
    {eating && <div className="cart-bite" aria-hidden="true"><div className="cart-bite-mascot"><TonyMascot/></div><span>¡ÑAM!</span></div>}
  </article>;
}

export default function CartExperience() {
  const {items, loading, error, refresh} = useCart();
  const [confirm, setConfirm] = useState<CartItem | null>(null), [removing, setRemoving] = useState(''), [departing, setDeparting] = useState<{item: CartItem; index: number} | null>(null);
  const [notice, setNotice] = useState(''), [failure, setFailure] = useState(''), [branch, setBranch] = useState(''), [branchError, setBranchError] = useState('');
  const modal = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement | null>(null), cancel = useRef<HTMLButtonElement>(null), listTitle = useRef<HTMLHeadingElement>(null), branchSelect = useRef<HTMLSelectElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null), mounted = useRef(true), pendingRemoval = useRef(false);
  const selectedBranch = stores.find(store => store.name === branch);
  const total = items.reduce((sum, item) => sum + quantityOf(item.order), 0);
  const displayed = [...items];
  if (departing && !displayed.some(item => item.id === departing.item.id)) displayed.splice(departing.index, 0, departing.item);

  useEffect(() => {mounted.current = true; return () => {mounted.current = false; if (timer.current) clearTimeout(timer.current);};}, []);
  useEffect(() => {
    if (confirm && modal.current && !modal.current.open) {modal.current.showModal(); cancel.current?.focus();}
    if (!confirm && modal.current?.open) modal.current.close();
  }, [confirm]);
  function requestRemove(item: CartItem, button: HTMLButtonElement) {
    if (pendingRemoval.current) return;
    trigger.current = button; setConfirm(item); setFailure(''); setNotice('');
  }
  function closeDialog() {setConfirm(null);}
  function restoreFocus() {if (trigger.current?.isConnected) trigger.current.focus({preventScroll: true});}
  async function remove() {
    if (!confirm || pendingRemoval.current) return;
    const target = confirm;
    const index = items.findIndex(item => item.id === target.id);
    pendingRemoval.current = true; setRemoving(target.id); setConfirm(null);
    try {
      await removeCartItem(target.id);
      if (!mounted.current) return;
      setNotice(`${target.order.team} se eliminó del carrito. Tu borrador del editor no cambia.`);
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduced) setDeparting({item: target, index: Math.max(0, index)});
      const finish = () => {setDeparting(null); setRemoving(''); pendingRemoval.current = false; listTitle.current?.focus({preventScroll: true});};
      if (reduced) finish(); else timer.current = setTimeout(finish, 950);
    } catch (cause) {if (mounted.current) {setFailure(cartError(cause)); setRemoving(''); pendingRemoval.current = false; restoreFocus();}}
  }
  const quoteText = ['Hola, Tony. Quiero cotizar los diseños de mi carrito.', ...items.map((item, index) => `${index + 1}. ${item.order.team}: ${item.order.quantity} ${item.order.line === 'kit' ? 'uniformes completos' : 'camisas'}, ${techniqueLabel(item.order.garment.technique)}. Tallas: ${Object.entries(sizesOf(item)).map(([size, count]) => `${size} × ${count}`).join(', ')}.`), `Total: ${total} unidades.`, 'Adjuntaré el resumen completo y las vistas de mis diseños. Quedo pendiente del precio y la entrega.'].join('\n');
  function downloadSummary() {
    download(['TONY SPORTSWEAR · CARRITO PARA COTIZAR', `${items.length} diseños · ${total} unidades`, '', ...items.map((item, index) => `DISEÑO ${index + 1}\n${orderText(item.order)}\n\n────────────────────\n`)].join('\n'), 'tony-carrito-cotizacion.txt');
    setNotice('Resumen completo descargado. Incluye equipos, tallas, técnica y lista de jugadores.');
  }
  function requireBranch() {setBranchError('Elige la sucursal que atenderá tu cotización.'); branchSelect.current?.focus();}

  return <main id="contenido" className="cart-page"><header className="cart-heading cart-wrap"><nav aria-label="Ubicación"><Link href="/">Inicio</Link><span aria-hidden="true">/</span><span>Carrito</span></nav><div><div><p className="eyebrow">CADA EQUIPO TIENE SU IDENTIDAD</p><h1>TU <em>CARRITO.</em></h1></div><p>Tus diseños, juntos en un mismo lugar.<br/>Revisa los detalles y cotiza con tu sucursal.</p></div></header>
    <div className="cart-wrap cart-status-area"><p className="cart-live" role="status">{notice}</p>{failure && <p className="cart-failure" role="alert">{failure}</p>}</div>
    {loading ? <div className="cart-wrap cart-loading" role="status"><CartIcon/><p>Recuperando tus diseños…</p></div> : error ? <section className="cart-wrap cart-empty"><span className="cart-empty-icon"><CartIcon/></span><h2>VAMOS A RECUPERARLO.</h2><p role="alert">{error}</p><button className="button primary" onClick={() => void refresh()} type="button">Volver a intentar <Icon/></button></section> : displayed.length === 0 ? <section className="cart-wrap cart-empty"><span className="cart-empty-icon"><CartIcon/></span><p className="eyebrow">TODO EMPIEZA CON TU EQUIPO</p><h2 ref={listTitle} tabIndex={-1}>TU PRÓXIMO DISEÑO<br/>TIENE UN LUGAR <em>AQUÍ.</em></h2><p>Añade un equipo desde el paso Revisión del editor. Su diseño, sus tallas y sus imágenes quedarán guardados en este navegador.</p><Link href="/" className="button primary">Volver al inicio <Icon/></Link><Link href="/producto" className="cart-empty-secondary">Explorar producto ↗</Link></section> : <div className="cart-layout cart-wrap">
      <section className="cart-items" aria-labelledby="cart-list-title"><div className="cart-list-heading"><h2 id="cart-list-title" ref={listTitle} tabIndex={-1}>{items.length} {items.length === 1 ? 'DISEÑO GUARDADO' : 'DISEÑOS GUARDADOS'}</h2><span>EN ESTE NAVEGADOR</span></div>{displayed.map((item, index) => <CartDesign key={item.id} item={item} index={index} removing={removing === item.id} eating={departing?.item.id === item.id} onRemove={requestRemove}/>)}</section>
      <aside className="cart-summary" aria-labelledby="cart-summary-title"><p className="eyebrow">DEL DISEÑO A LA CANCHA</p><h2 id="cart-summary-title">TODO TU EQUIPO.<br/><em>CADA DETALLE.</em></h2><dl><div><dt>Diseños</dt><dd>{items.length}</dd></div><div><dt>Total de unidades</dt><dd>{total}</dd></div><div className="cart-price"><dt>Precio total</dt><dd>Por cotizar</dd></div></dl><p>Una unidad equivale a un uniforme completo o una camisa, según cada diseño. Tony confirmará el precio y la entrega contigo.</p>
        <label htmlFor="cart-branch">Tu sucursal</label><select id="cart-branch" ref={branchSelect} value={branch} aria-invalid={!!branchError} aria-describedby={branchError ? 'cart-branch-error' : undefined} onChange={event => {setBranch(event.target.value); setBranchError('');}}><option value="">Elige dónde cotizar</option>{stores.map(store => <option key={store.name} value={store.name}>{store.name} · {store.zone}</option>)}</select>{branchError && <p id="cart-branch-error" className="cart-field-error" role="alert">{branchError}</p>}{selectedBranch && <p className="cart-branch-confirm" role="status"><Icon name="check"/>Te atiende Tony {selectedBranch.name}.</p>}
        {selectedBranch && items.length > 0 ? <a className="button primary cart-quote" href={`https://wa.me/503${selectedBranch.phone.replace(/\D/g, '')}?text=${encodeURIComponent(quoteText)}`} target="_blank" rel="noopener noreferrer">Cotizar por WhatsApp <Icon name="whatsapp"/></a> : <button className="button primary cart-quote" type="button" disabled={items.length === 0} onClick={requireBranch}>Cotizar por WhatsApp <Icon name="whatsapp"/></button>}<button className="cart-download" type="button" onClick={downloadSummary} disabled={items.length === 0}>Descargar resumen completo <Icon name="diagonal"/></button><div className="cart-summary-foot"><Icon name="shield"/><p>Esta es una solicitud de cotización. No se ha realizado ningún cobro ni confirmado una compra. Adjunta los diseños y el resumen a tu conversación.</p></div>
      </aside>
    </div>}
    <dialog className="cart-confirm" ref={modal} aria-labelledby="cart-confirm-title" aria-describedby="cart-confirm-copy" onCancel={closeDialog} onClose={restoreFocus}><span className="cart-confirm-icon"><CartIcon/></span><p className="eyebrow">CONFIRMA ANTES DE CONTINUAR</p><h2 id="cart-confirm-title">¿RETIRAR ESTE<br/><em>DISEÑO?</em></h2><p id="cart-confirm-copy">Se eliminará <strong>{confirm?.order.team}</strong> del carrito, con su lista y los archivos de esta copia. El borrador del editor se conserva.</p><div><button ref={cancel} type="button" className="cart-keep" onClick={closeDialog}>Conservar diseño</button><button type="button" className="cart-confirm-remove" onClick={remove}>Sí, eliminar</button></div></dialog>
  </main>;
}
