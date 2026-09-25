'use client';

import {useRef, useState} from 'react';
import type {DesignAssets, OrderDraft} from '@/lib/order';
import {activePlayers} from '@/lib/order';
import {ELEMENT_LABELS, type TemplateElements} from '@/lib/studio';
import StudioCanvas, {exportStudioPNG} from './StudioCanvas';

const noop = () => {};
export default function OrderArtworkReview({order, assets}: {order: OrderDraft; assets: DesignAssets}) {
  const front = useRef<HTMLDivElement>(null), back = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false), [message, setMessage] = useState('');
  const visible = order.design.mode === 'reference' ? [] : order.design.layers.filter(layer => layer.visible && layer.opacity > 0);
  const removed = order.design.mode === 'reference' ? [] : (Object.keys(ELEMENT_LABELS) as (keyof TemplateElements)[]).filter(key => !order.design.elements[key]);
  const files = new Map<string, string>();
  for (const layer of visible) if (layer.kind === 'image' && layer.assetKey && assets[layer.assetKey]) files.set(layer.assetKey, layer.name);
  if (order.design.mode === 'reference') {
    if (assets.front) files.set('front', 'Referencia frontal');
    if (assets.back) files.set('back', 'Referencia posterior');
  }
  async function save(side: 'front'|'back') {
    const stage = side === 'front' ? front.current : back.current;
    if (!stage || exporting) return;
    setExporting(true); setMessage('');
    try {
      const blob = await exportStudioPNG(stage);
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `tony-${side === 'front' ? 'frente' : 'espalda'}.png`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Vista descargada. Adjunta el PNG y los archivos originales al solicitar tu cotización.');
    } catch { setMessage('No se pudo descargar la vista. Vuelve al editor y comprueba tus imágenes.'); }
    finally { setExporting(false); }
  }
  function original(key: string, name: string) {
    const data = assets[key]; if (!data) return;
    const extension = data.startsWith('data:image/jpeg') ? 'jpg' : data.startsWith('data:image/webp') ? 'webp' : 'png';
    const link = document.createElement('a'); link.href = data;
    link.download = `${name.replace(/\.(png|jpe?g|webp)$/i, '').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 70) || 'archivo-tony'}.${extension}`;
    link.click();
  }
  return <section className="order-art-review" aria-label="Revisión del diseño personalizado">
    <div className="order-art-title"><div><p className="eyebrow">TU IDENTIDAD, DE LOS DOS LADOS</p><h3>ASÍ LO DISEÑASTE.</h3></div><p>Vista orientativa de {activePlayers(order)[0]?.name}. Tony revisará el arte y la técnica contigo antes de producir.</p></div>
    <div className="order-art-views">{(['front', 'back'] as const).map(side => <div className="order-art-view" key={side}>
      <div className="order-art-side"><strong>{side === 'front' ? '01 / Frente' : '02 / Espalda'}</strong><button type="button" disabled={exporting || (order.design.mode === 'reference' && !assets[side])} onClick={() => save(side)}>Descargar {side === 'front' ? 'frente' : 'espalda'} PNG ↗</button></div>
      <div ref={side === 'front' ? front : back}><StudioCanvas design={order.design} garment={order.garment} team={order.team} player={activePlayers(order)[0]} assets={assets} side={side} line={order.line} selectedId={null} onSelect={noop} onLayerChange={noop} onGestureStart={noop} onGestureEnd={noop} readOnly/></div>
    </div>)}</div>
    <p className="order-art-message" role="status">{message}</p>
    {removed.length > 0 && <p className="order-art-removed"><strong>Sin estos elementos de plantilla:</strong> {removed.map(key => ELEMENT_LABELS[key]).join(' · ')}.</p>}
    {visible.length > 0 && <div className="order-art-elements"><strong>Elementos incluidos</strong><ul>{visible.map(layer => <li key={layer.id}><span>{layer.side === 'front' ? 'Frente' : 'Espalda'}</span>{layer.kind === 'text' ? `«${layer.text}»` : layer.name}</li>)}</ul></div>}
    {files.size > 0 && <div className="order-originals"><div><strong>Archivos para adjuntar</strong><p>Descarga los originales y compártelos junto con las vistas. WhatsApp no los adjunta automáticamente.</p></div><div>{Array.from(files, ([key, name]) => <button type="button" key={key} onClick={() => original(key, name)}>↓ {name}</button>)}</div></div>}
  </section>;
}
