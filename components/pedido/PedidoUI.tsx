'use client';
import {Children, cloneElement, isValidElement, useEffect, useId, useRef, type ReactNode, type ReactElement} from 'react';
import {estimatePedido, money, PRICES, SIZES} from '@/lib/pedido/pricing';
import type {Delivery, PedidoDraft, PedidoErrors, PedidoPlayer} from '@/lib/pedido/types';
export function Field({label, error, children}: {label: string; error?: string; children: ReactNode}) {
  const errorId = useId();
  return <div className={`pedido-field${error ? ' has-error' : ''}`}><label className="pedido-field-label"><span>{label}</span>{Children.map(children, child => isValidElement(child) && ['input', 'select', 'textarea'].includes(String(child.type)) ? cloneElement(child as ReactElement<Record<string, unknown>>, {'aria-invalid': !!error, 'aria-describedby': error ? errorId : undefined}) : child)}</label>{error && <small id={errorId} role="alert">{error}</small>}</div>;
}
export function Choice({selected, children, onClick, disabled}: {selected: boolean; children: ReactNode; onClick: () => void; disabled?: boolean}) {return <button type="button" className={`pedido-choice${selected ? ' is-selected' : ''}`} aria-pressed={selected} onClick={onClick} disabled={disabled}>{children}<span className="pedido-choice-check" aria-hidden="true"><svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={selected ? 'M2 6.5l2.6 2.6L10 3.5' : 'M6 2v8M2 6h8'}/></svg></span></button>;}
export function Modal({title, onClose, children}: {title: string; onClose: () => void; children: ReactNode}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {const previous = document.activeElement as HTMLElement | null; dialog.current?.showModal(); return () => {previous?.focus();};}, []);
  return <dialog ref={dialog} className="pedido-modal" aria-labelledby="pedido-dialog-title" onCancel={event => {event.preventDefault(); onClose();}} onClick={event => {if (event.target === event.currentTarget) onClose();}}><div className="pedido-modal-heading"><h2 id="pedido-dialog-title">{title}</h2><button type="button" aria-label="Cerrar ventana" onClick={onClose}>×</button></div>{children}</dialog>;
}
export function PriceLines({draft, delivery, full = false}: {draft: PedidoDraft; delivery: Delivery; full?: boolean}) {
  const pendingSizes = [...draft.players, ...draft.goalkeepers].filter(player => !player.size).length;
  const pendingDesign = !draft.design.front && !draft.design.back;
  const pendingQuantity = draft.choices?.quantity === false;
  const p = estimatePedido(draft, delivery.kind);
  const unitOptions: [string, number][] = ([['mold', 'Molde', PRICES.molds], ['fabric', 'Tela', PRICES.fabrics], ['collar', 'Cuello', PRICES.collars], ['sleeve', 'Manga', PRICES.sleeves]] as const).map(([key, label, table]) => {
    const option = draft.config[key], unit = option ? (table as Record<string, number>)[option] : 0;
    return [`${label}: ${option}`, unit];
  });
  const unitDiscount = draft.config.brand === 'Tony' && draft.product === 'uniform' ? PRICES.tonyUniformDiscountCents : 0;
  const unitLines: [string, number][] = [['Precio base', PRICES.products[draft.product].cents], ...unitOptions, ['Marca en 3D', draft.config.brand3d ? PRICES.design.threeDPerTypePerFieldPlayerCents : 0], ['Escudo en 3D', draft.config.crest3d ? PRICES.design.threeDPerTypePerFieldPlayerCents : 0], ['Descuento marca Tony', -unitDiscount]];
  if (pendingQuantity) {
    const unitCents = unitLines.reduce((sum, [, amount]) => sum + amount, 0);
    return <><dl className="pedido-prices"><div className="pedido-unit-price" role="status" aria-live="polite" aria-atomic="true"><dt>Precio por prenda</dt><dd><strong key={unitCents} className="pedido-price-value">{money(unitCents)}</strong></dd></div><div className="pedido-price-total pedido-price-pending"><dt>Total pendiente</dt><dd>Elige la cantidad</dd></div>{unitLines.filter(([, amount]) => amount !== 0).map(([name, amount]) => <div key={name}><dt>{name}</dt><dd>{money(amount)}</dd></div>)}</dl><p className="pedido-fine">Elige la cantidad para calcular el total y el anticipo. Pedido mínimo: {PRICES.quantity.min} prendas.</p>{pendingDesign && <p className="pedido-fine">El diseño está por elegir. No se ha sumado un servicio de diseño propio.</p>}</>;
  }
  const optionLines: [string, number][] = unitOptions.map(([label, unit]) => [label, unit * p.fieldQuantity]);
  const lines: [string, number][] = [[`Prendas de campo (${draft.quantity})`, p.baseCents], ...optionLines, ['Tallas especiales', p.sizeExtrasCents], ['Creación del diseño', p.creationDesignCents], [`Escudos (${p.crestDesignCount})`, p.crestDesignCents], [`Marcas (${p.brandDesignCount})`, p.brandDesignCents], [`Patrocinadores (${p.sponsorCount})`, p.sponsorCents], ['Marca en 3D', p.brand3dCents], ['Escudo en 3D', p.crest3dCents], ['Porteros', p.keeperCents], [`Medias (${p.sockQuantity} pares)`, p.socksCents], ['Descuento marca Tony', -p.discountCents], ['Entrega', p.deliveryCents]];
  const breakdown = lines.filter(([, amount]) => amount !== 0).map(([name, amount]) => <div key={name}><dt>{name}</dt><dd>{money(amount)}</dd></div>);
  const estimated = pendingSizes > 0 || pendingDesign;
  const total = <div className="pedido-price-total" role="status" aria-live="polite" aria-atomic="true"><dt>{estimated ? 'Total estimado' : 'Total'}</dt><dd><span key={p.totalCents} className="pedido-price-value">{money(p.totalCents)}</span></dd></div>;
  return <><dl className="pedido-prices">{full ? breakdown : total}{full && total}<div><dt>{estimated ? 'Anticipo estimado · 50 %' : 'Anticipo · 50 %'}</dt><dd>{money(p.depositCents)}</dd></div><div><dt>{estimated ? 'Saldo estimado contra entrega' : 'Saldo contra entrega'}</dt><dd>{money(p.balanceCents)}</dd></div>{!full && breakdown}</dl>{pendingSizes > 0 && <p className="pedido-fine">Estimado para {draft.quantity} prendas de campo{draft.goalkeepers.length ? ` y ${draft.goalkeepers.length} ${draft.goalkeepers.length === 1 ? 'portero' : 'porteros'}` : ''}. {pendingSizes === 1 ? 'Falta una talla' : `Faltan ${pendingSizes} tallas`}; por ahora se consideran sin recargo de talla.</p>}{pendingDesign && <p className="pedido-fine">El diseño está por elegir. No se ha sumado un servicio de diseño propio.</p>}{p.freeKeeper && <p className="pedido-gift">Incluye primer portero gratis y gafete de capitán.</p>}{p.totalCents > 15000 && <p className="pedido-gift">Tu pedido incluye una gorra de regalo.</p>}</>;
}

export function PlayerRow({player, index, keeper, onChange, errors}: {player: PedidoPlayer; index: number; keeper?: boolean; onChange: (patch: Partial<PedidoPlayer>) => void; errors: PedidoErrors}) {
  const prefix = `${keeper ? 'goalkeepers' : 'players'}.${index}`;
  return <div className="pedido-player"><span className="pedido-player-index">{keeper ? 'P' : String(index + 1).padStart(2, '0')}</span><Field label={`Nombre ${keeper ? 'del portero' : `jugador ${index + 1}`}`} error={errors[`${prefix}.name`]}><input value={player.name} maxLength={70} onChange={e => onChange({name: e.target.value})} autoComplete="off"/></Field><Field label={`Talla ${keeper ? 'portero' : `jugador ${index + 1}`}`} error={errors[`${prefix}.size`]}><select value={player.size} onChange={e => onChange({size: e.target.value as PedidoPlayer['size']})}><option value="">Elegir</option>{SIZES.map(size => <option key={size}>{size}</option>)}</select></Field><Field label={`Dorsal ${keeper ? 'portero' : `jugador ${index + 1}`}`} error={errors[`${prefix}.number`]}><input inputMode="numeric" value={player.number} maxLength={3} onChange={e => onChange({number: e.target.value.replace(/\D/g, '')})}/></Field></div>;
}
