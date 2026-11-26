'use client';
import {Children, cloneElement, isValidElement, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type ReactElement} from 'react';
import {estimatePedido, money, PRICES, SIZES, SOCK_COLORS} from '@/lib/pedido/pricing';
import type {Delivery, PedidoDraft, PedidoErrors, PedidoPlayer, SockColor} from '@/lib/pedido/types';
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
    return <><dl className="pedido-prices"><div className="pedido-unit-price"><dt>Precio por prenda</dt><dd><strong key={unitCents} className="pedido-price-value">{money(unitCents)}</strong></dd></div><div className="pedido-price-total pedido-price-pending"><dt>Total pendiente</dt><dd>Elige la cantidad</dd></div>{unitLines.filter(([, amount]) => amount !== 0).map(([name, amount]) => <div key={name}><dt>{name}</dt><dd>{money(amount)}</dd></div>)}</dl><p className="sr-only" role="status" aria-live="polite" aria-atomic="true">Precio por prenda: {money(unitCents)}</p><p className="pedido-fine">Elige la cantidad para calcular el total y el anticipo. Pedido mínimo: {PRICES.quantity.min} prendas.</p>{pendingDesign && <p className="pedido-fine">El diseño está por elegir. No se ha sumado un servicio de diseño propio.</p>}</>;
  }
  const optionLines: [string, number][] = unitOptions.map(([label, unit]) => [label, unit * p.fieldQuantity]);
  const lines: [string, number][] = [[`Prendas de campo (${draft.quantity})`, p.baseCents], ...optionLines, ['Tallas especiales', p.sizeExtrasCents], ['Creación del diseño', p.creationDesignCents], [`Escudos (${p.crestDesignCount})`, p.crestDesignCents], [`Marcas (${p.brandDesignCount})`, p.brandDesignCents], [`Patrocinadores (${p.sponsorCount})`, p.sponsorCents], ['Marca en 3D', p.brand3dCents], ['Escudo en 3D', p.crest3dCents], ['Porteros', p.keeperCents], [`Medias (${p.sockQuantity} pares)`, p.socksCents], ['Descuento marca Tony', -p.discountCents], ['Entrega', p.deliveryCents]];
  const breakdown = lines.filter(([, amount]) => amount !== 0).map(([name, amount]) => <div key={name}><dt>{name}</dt><dd>{money(amount)}</dd></div>);
  const estimated = pendingSizes > 0 || pendingDesign;
  // Changes are announced by a live region outside the <dl>: a role on a <dl> group breaks its semantics.
  const total = <div className="pedido-price-total"><dt>{estimated ? 'Total estimado' : 'Total'}</dt><dd><span key={p.totalCents} className="pedido-price-value">{money(p.totalCents)}</span></dd></div>;
  return <><dl className="pedido-prices">{full ? breakdown : total}{full && total}<div><dt>{estimated ? 'Anticipo estimado · 50 %' : 'Anticipo · 50 %'}</dt><dd>{money(p.depositCents)}</dd></div><div><dt>{estimated ? 'Saldo estimado contra entrega' : 'Saldo contra entrega'}</dt><dd>{money(p.balanceCents)}</dd></div>{!full && breakdown}</dl><p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{estimated ? 'Total estimado' : 'Total'}: {money(p.totalCents)}</p>{pendingSizes > 0 && <p className="pedido-fine">Estimado para {draft.quantity} prendas de campo{draft.goalkeepers.length ? ` y ${draft.goalkeepers.length} ${draft.goalkeepers.length === 1 ? 'portero' : 'porteros'}` : ''}. {pendingSizes === 1 ? 'Falta una talla' : `Faltan ${pendingSizes} tallas`}; por ahora se consideran sin recargo de talla.</p>}{pendingDesign && <p className="pedido-fine">El diseño está por elegir. No se ha sumado un servicio de diseño propio.</p>}{p.freeKeeper && <p className="pedido-gift">Incluye primer portero gratis y gafete de capitán.</p>}{p.totalCents > 15000 && <p className="pedido-gift">Tu pedido incluye una gorra de regalo.</p>}</>;
}

export function PlayerRow({player, index, keeper, onChange, errors}: {player: PedidoPlayer; index: number; keeper?: boolean; onChange: (patch: Partial<PedidoPlayer>) => void; errors: PedidoErrors}) {
  const prefix = `${keeper ? 'goalkeepers' : 'players'}.${index}`;
  return <div className="pedido-player"><span className="pedido-player-index">{keeper ? 'P' : String(index + 1).padStart(2, '0')}</span><Field label={`Nombre ${keeper ? 'del portero' : `jugador ${index + 1}`}`} error={errors[`${prefix}.name`]}><input value={player.name} maxLength={70} onChange={e => onChange({name: e.target.value})} autoComplete="off"/></Field><Field label={`Talla ${keeper ? 'portero' : `jugador ${index + 1}`}`} error={errors[`${prefix}.size`]}><select value={player.size} onChange={e => onChange({size: e.target.value as PedidoPlayer['size']})}><option value="">Elegir</option>{SIZES.map(size => <option key={size}>{size}</option>)}</select></Field><Field label={`Dorsal ${keeper ? 'portero' : `jugador ${index + 1}`}`} error={errors[`${prefix}.number`]}><input inputMode="numeric" value={player.number} maxLength={3} onChange={e => onChange({number: e.target.value.replace(/\D/g, '')})}/></Field></div>;
}

/** Real dye of each sock colour, the text that reads on it and a rim that shows on the dark page. */
const SOCK_DYES: Record<SockColor, {base: string; ink: string; rim: string}> = {
  'Negro': {base: '#16191b', ink: '#ffffff', rim: '#7b887e'},
  'Blanco': {base: '#f3f4ee', ink: '#10241a', rim: '#ffffff'},
  'Azul negro': {base: '#1b2a44', ink: '#ffffff', rim: '#6585c2'},
  'Rojo': {base: '#c8202f', ink: '#ffffff', rim: '#ff7a83'},
  'Azul bandera': {base: '#1f55c6', ink: '#ffffff', rim: '#86a9ff'},
};
const MAX_SOCK_PAIRS = 198;
const pairsText = (pairs: number) => `${pairs} ${pairs === 1 ? 'par' : 'pares'}`;
const dye = (color: SockColor) => ({'--sock': SOCK_DYES[color].base, '--sock-ink': SOCK_DYES[color].ink, '--sock-rim': SOCK_DYES[color].rim}) as CSSProperties;
const SOCK_SHAPE = 'M30 8H84C85 40 87 66 85 94C84 116 82 128 83 140C90 154 102 162 114 168C130 176 132 200 112 206L48 209C28 210 17 195 20 175C22 160 31 151 31 138C31 112 24 84 25 58C26 38 29 22 30 8Z';

/** A pair of long football socks drawn in the colour set on --sock. */
function SockArt() {
  const id = useId().replace(/[^\w-]/g, '');
  const sock = (back: boolean) => <g>
    <path d={SOCK_SHAPE} className="pedido-sock-fill"/>
    <g clipPath={`url(#${id}-clip)`}>
      <rect x="0" y="0" width="150" height="230" fill={`url(#${id}-knit)`}/>
      <rect x="0" y="0" width="150" height="32" className="pedido-sock-cuff"/>
      <path d="M36 10v20M44 10v20M52 10v20M60 10v20M68 10v20M76 10v20" className="pedido-sock-rib"/>
      <path d="M0 158c22 2 34 22 38 62H0z" className="pedido-sock-heel"/>
      <path d="M108 164c18 12 20 38 2 56h48v-56z" className="pedido-sock-toe"/>
      <rect x="0" y="0" width="150" height="230" fill={`url(#${id}-shade)`}/>
      {back && <rect x="0" y="0" width="150" height="230" className="pedido-sock-dim"/>}
    </g>
    <path d={SOCK_SHAPE} className="pedido-sock-edge"/>
  </g>;
  return <svg className="pedido-sock-art" viewBox="0 0 250 246" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id={`${id}-clip`}><path d={SOCK_SHAPE}/></clipPath>
      <pattern id={`${id}-knit`} width="6" height="10" patternUnits="userSpaceOnUse"><rect width="2" height="10" fill="#fff" opacity=".06"/></pattern>
      <linearGradient id={`${id}-shade`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity=".34"/><stop offset=".4" stopColor="#000" stopOpacity="0"/>
        <stop offset=".64" stopColor="#fff" stopOpacity=".16"/><stop offset="1" stopColor="#000" stopOpacity=".24"/>
      </linearGradient>
    </defs>
    <ellipse cx="124" cy="232" rx="92" ry="8" className="pedido-sock-shadow"/>
    <g transform="translate(98 2) rotate(8 60 110)">{sock(true)}</g>
    <g transform="translate(22 14) rotate(-6 60 110)">{sock(false)}</g>
  </svg>;
}

/** Socks: a live preview in the colour last tapped or added, and one bold button per colour with − / + steppers. */
export function SockPicker({socks, onChange}: {socks: Record<SockColor, number>; onChange: (socks: Record<SockColor, number>) => void}) {
  const [picked, setPicked] = useState<SockColor | null>(null);
  const shown = picked ?? SOCK_COLORS.find(color => socks[color] > 0) ?? SOCK_COLORS[0];
  const pairs = SOCK_COLORS.reduce((sum, color) => sum + socks[color], 0);
  function set(color: SockColor, value: number) {
    setPicked(color);
    if (Number.isInteger(value) && value >= 0 && value <= MAX_SOCK_PAIRS && value !== socks[color]) onChange({...socks, [color]: value});
  }
  return <div className="pedido-sock-studio" data-advisor="socks"><div className="pedido-sock-layout">
    <figure className="pedido-sock-stage" style={dye(shown)}>
      <span className="pedido-sock-glow" aria-hidden="true"/>
      {/* Remounting on each change replays the hop; reduced motion turns it off. */}
      <div key={`${shown}:${socks[shown]}`} className="pedido-sock-motion"><SockArt/></div>
      <figcaption><span>Vista previa</span><strong>{shown}</strong><small>{socks[shown] ? `${pairsText(socks[shown])} · ${money(socks[shown] * PRICES.socks.pairCents)}` : 'Sin pares todavía'}</small></figcaption>
    </figure>
    <div className="pedido-sock-side">
      <ul className="pedido-sock-list" aria-label="Colores de medias">{SOCK_COLORS.map(color => {const count = socks[color]; return <li key={color} className={`pedido-sock-row${shown === color ? ' is-shown' : ''}`} style={dye(color)}>
        <button type="button" className="pedido-sock-swatch" aria-pressed={shown === color} onClick={() => setPicked(color)}><span className="pedido-sock-chip" aria-hidden="true"/><span className="pedido-sock-name">{color}</span>{count > 0 && <span key={count} className="pedido-sock-badge">{pairsText(count)}</span>}</button>
        {/* aria-disabled instead of disabled keeps keyboard focus on the button when a limit is reached. */}
        <div className="pedido-sock-stepper">
          <button type="button" aria-label={`Quitar un par de medias color ${color}`} aria-disabled={count === 0} onClick={() => set(color, count - 1)}>−</button>
          <input type="number" inputMode="numeric" min={0} max={MAX_SOCK_PAIRS} value={count} aria-label={`Pares de medias color ${color}`} onFocus={() => setPicked(color)} onChange={event => set(color, Number(event.target.value))}/>
          <button type="button" aria-label={`Agregar un par de medias color ${color}`} aria-disabled={count >= MAX_SOCK_PAIRS} onClick={() => set(color, count + 1)}>+</button>
        </div>
      </li>;})}</ul>
      <p className="pedido-sock-total" aria-live="polite"><span key={pairs}>{pairs ? `${pairsText(pairs)} en total · ${money(pairs * PRICES.socks.pairCents)}` : 'Sin medias por ahora'}</span></p>
    </div>
  </div></div>;
}
