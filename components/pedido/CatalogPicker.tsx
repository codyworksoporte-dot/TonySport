'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import catalog from '@/data/pedido/catalog.json';
import { siteAsset } from '@/lib/asset-path';
import './editor.css';

export type CatalogDesign = (typeof catalog.designs)[number];

export default function CatalogPicker({ value, onSelect, onClose, disabled = false }: { value?: string; onSelect: (design: CatalogDesign) => void; onClose?: () => void; disabled?: boolean }) {
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<CatalogDesign | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (preview && !dialog.current?.open) dialog.current?.showModal(); }, [preview]);
  const entries = useMemo(() => catalog.designs.filter(item => `${item.code} ${item.name} ${item.category}`.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es'))), [query]);
  const asset = (path: string) => siteAsset(path as `/assets/${string}`);
  return <section className="pedido-catalog" aria-label="Catálogo oficial Tony">
    <div className="pedido-editor-heading"><div><span className="pedido-editor-kicker">70 diseños oficiales</span><h3>Encuentra tu identidad.</h3></div>{onClose && <button type="button" className="pedido-tool-button" onClick={onClose}>Cerrar catálogo ×</button>}</div>
    <label className="pedido-field">Buscar por código o nombre<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ej. TONY-010" /></label>
    <p className="pedido-editor-note" role="status">{entries.length} {entries.length === 1 ? 'diseño disponible' : 'diseños disponibles'}. Selecciona una lámina para verla completa.</p>
    <div className="pedido-catalog-grid">{entries.map(item => <button type="button" className="pedido-catalog-card" key={item.code} disabled={disabled} onClick={() => setPreview(item)} aria-label={`Ver ${item.code}`} aria-pressed={value === item.code}>
      {/* Local thumbnails keep the complete catalog small on mobile. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(item.thumbnail)} alt={`Uniforme ${item.code}`} width="220" height="220" loading="lazy" decoding="async" />
      <span><strong>{item.code}</strong><small>{value === item.code ? 'Seleccionado ✓' : 'Ver diseño ↗'}</small></span>
    </button>)}</div>
    {!entries.length && <p className="pedido-editor-empty">No encontramos ese código. Prueba con otro número del 001 al 070.</p>}
    {preview && <dialog ref={dialog} className="pedido-catalog-preview" aria-label={`Vista completa ${preview.code}`} onCancel={() => setPreview(null)}>
      <div className="pedido-editor-heading"><h4>{preview.code}</h4><button type="button" className="pedido-tool-button" onClick={() => setPreview(null)} aria-label="Cerrar vista completa">Cerrar ×</button></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(preview.image)} alt={`Diseño oficial completo ${preview.code}, frontal y dorsal`} width={preview.width} height={preview.height} />
      <p className="pedido-editor-note">Cargaremos el frontal y el dorsal de esta misma lámina. Los elementos impresos en la imagen forman parte de ella; las nuevas capas se editan por separado.</p>
      <button type="button" className="pedido-primary-button" disabled={disabled} onClick={() => { onSelect(preview); setPreview(null); }}>Usar {preview.code} <span aria-hidden="true">↗</span></button>
    </dialog>}
  </section>;
}
