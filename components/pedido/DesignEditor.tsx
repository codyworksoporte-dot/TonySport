'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, PointerEvent } from 'react';
import type { PedidoDesign, PedidoDraft, PedidoLayer } from '@/lib/pedido/types';
import { siteAsset } from '@/lib/asset-path';
import CatalogPicker, { type CatalogDesign } from './CatalogPicker';
import './editor.css';

type Side = 'front' | 'back';
type AIResult = { front?: string; back?: string; image?: string };
export type PedidoEditorAI = (operation: 'mockup' | 'erase', payload: Record<string, unknown>) => Promise<AIResult>;
type Region = { x: number; y: number; width: number; height: number };
const WIDTH = 800;
const HEIGHT = 1000;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));
const resolveImage = (src: string) => src.startsWith('/assets/') ? siteAsset(src as `/assets/${string}`) : src;

async function imageFrom(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('No pudimos abrir la imagen. Vuelve a cargarla.')); img.src = resolveImage(src); });
}

function contain(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const scale = Math.min(WIDTH / img.naturalWidth, HEIGHT / img.naturalHeight);
  const width = img.naturalWidth * scale, height = img.naturalHeight * scale;
  ctx.drawImage(img, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);
}

/** Export the same normalized geometry shown in the editor, without selection handles. */
export async function renderPedidoDesign(design: PedidoDesign, side: Side): Promise<string> {
  if (!design[side]) throw new Error(`Carga el ${side === 'front' ? 'frontal' : 'dorsal'} antes de exportar.`);
  const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Tu navegador no pudo preparar la imagen.');
  ctx.fillStyle = '#101712'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  contain(ctx, await imageFrom(design[side]!));
  for (const layer of design.layers.filter(item => item.side === side && item.visible)) {
    const w = layer.width * WIDTH / 100, h = layer.height * HEIGHT / 100;
    ctx.save(); ctx.translate(layer.x * WIDTH / 100, layer.y * HEIGHT / 100); ctx.rotate(layer.rotation * Math.PI / 180);
    if (layer.type === 'Texto') {
      const text = layer.text || '';
      ctx.fillStyle = layer.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${layer.fontSize}px Arial`;
      const naturalWidth = ctx.measureText(text).width;
      const displayedWidth = Math.min(w, text.length * layer.fontSize * .6);
      if (naturalWidth > 0) { ctx.scale(displayedWidth / naturalWidth, 1); ctx.fillText(text, 0, 0); }
    } else if (layer.data) {
      const img = await imageFrom(layer.data); const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const iw = img.naturalWidth * scale, ih = img.naturalHeight * scale; ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
    }
    ctx.restore();
  }
  return canvas.toDataURL('image/png');
}

async function readUpload(file: File): Promise<{ data: string; key: string; ratio: number }> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Elige una imagen JPG, PNG o WEBP.');
  if (file.size > MAX_FILE_BYTES) throw new Error('La imagen supera 4 MB. Reduce su tamaño y vuelve a intentarlo.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!(jpeg || png || webp)) throw new Error('El archivo no contiene una imagen JPG, PNG o WEBP válida.');
  const key = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
  const objectURL = URL.createObjectURL(file);
  try {
    const img = await imageFrom(objectURL);
    if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth * img.naturalHeight > 40_000_000) throw new Error('Esta imagen es demasiado grande para el editor. Usa una versión de hasta 40 megapíxeles.');
    const scale = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(img.naturalWidth * scale); canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('No pudimos procesar esta imagen.'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL('image/webp', .88), key, ratio: img.naturalWidth / img.naturalHeight };
  } finally { URL.revokeObjectURL(objectURL); }
}

export default function DesignEditor({ draft, onChange, onAI }: { draft: PedidoDraft; onChange: (draft: PedidoDraft) => void; onAI?: PedidoEditorAI }) {
  const [side, setSide] = useState<Side>('front');
  const [catalogOpen, setCatalogOpen] = useState(!draft.design.front);
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [historyVersion, setHistoryVersion] = useState(0);
  const [eraseMode, setEraseMode] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  const [frame, setFrame] = useState({ zoom: 1, x: 0, y: 0 });
  const [framing, setFraming] = useState(false);
  const current = useRef(draft); current.current = draft;
  const past = useRef<PedidoDesign[]>([]), future = useRef<PedidoDesign[]>([]);
  const uploadRole = useRef<PedidoLayer['type']>('Escudo');
  const fileInput = useRef<HTMLInputElement>(null);
  const layerInput = useRef<HTMLInputElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; x: number; y: number; startX: number; startY: number } | null>(null);
  const regionStart = useRef<{ x: number; y: number } | null>(null);
  const operationToken = useRef(0);
  const selected = draft.design.layers.find(item => item.id === selectedId && item.side === side);
  const sideLayers = draft.design.layers.filter(item => item.side === side);
  const disabled = Boolean(busy);
  useEffect(() => { past.current = []; future.current = []; setHistoryVersion(value => value + 1); operationToken.current++; return () => { operationToken.current++; }; }, [draft.id]);
  useEffect(() => { setSelectedId(''); setRegion(null); setFrame({ zoom: 1, x: 0, y: 0 }); setFraming(false); setEraseMode(false); }, [side]);

  function remember() { past.current = [...past.current.slice(-19), current.current.design]; future.current = []; setHistoryVersion(value => value + 1); }
  function change(design: PedidoDesign, record = true) {
    if (record) remember();
    const next = { ...current.current, design: { ...design, approved: false, finalFront: null, finalBack: null } }; current.current = next; onChange(next);
  }
  function patchLayer(id: string, patch: Partial<PedidoLayer>, record = true) { change({ ...current.current.design, layers: current.current.design.layers.map(item => item.id === id ? { ...item, ...patch } : item) }, record); }
  function undo() { const item = past.current.pop(); if (!item) return; future.current.push(current.current.design); change(item, false); setHistoryVersion(value => value + 1); setSelectedId(''); setMessage('Cambio deshecho.'); }
  function redo() { const item = future.current.pop(); if (!item) return; past.current.push(current.current.design); change(item, false); setHistoryVersion(value => value + 1); setMessage('Cambio restaurado.'); }
  function selectCatalog(item: CatalogDesign) {
    operationToken.current++; change({ ...current.current.design, source: 'catalog', catalogCode: item.code, front: item.front, back: item.back });
    setCatalogOpen(false); setSide('front'); setMessage(`${item.code}: frontal y dorsal cargados.`); setError('');
  }
  async function upload(event: ChangeEvent<HTMLInputElement>, isLayer: boolean) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    const token = ++operationToken.current; setError(''); setBusy('Preparando imagen…');
    try {
      const result = await readUpload(file); if (token !== operationToken.current) return;
      if (isLayer) {
        const role = uploadRole.current; const layer: PedidoLayer = { id: crypto.randomUUID(), side, type: role, name: `${role} ${sideLayers.filter(item => item.type === role).length + 1}`, data: result.data, designKey: result.key, x: 50, y: 35, width: 22, height: clamp(22 * WIDTH / HEIGHT / result.ratio, 5, 35), rotation: 0, color: '#ffffff', fontSize: 42, visible: true };
        change({ ...current.current.design, layers: [...current.current.design.layers, layer] }); setSelectedId(layer.id); setMessage(`${role} agregado. Arrástralo para colocarlo.`);
      } else {
        change({ ...current.current.design, source: 'own', catalogCode: '', [side]: result.data }); setMessage(`${side === 'front' ? 'Frontal' : 'Dorsal'} cargado. Puedes ajustar el encuadre.`); setCatalogOpen(false);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos cargar esa imagen.'); } finally { if (token === operationToken.current) setBusy(''); }
  }
  function addText(text = 'TU EQUIPO', name = 'Texto') {
    const layer: PedidoLayer = { id: crypto.randomUUID(), side, type: 'Texto', name, text, x: 50, y: 48, width: 65, height: 12, rotation: 0, color: '#ffffff', fontSize: 46, visible: true };
    change({ ...current.current.design, layers: [...current.current.design.layers, layer] }); setSelectedId(layer.id); setMessage('Texto agregado. Puedes escribir y moverlo.');
  }
  const localPoint = (event: PointerEvent<HTMLElement>) => { const rect = stage.current!.getBoundingClientRect(); return { x: clamp((event.clientX - rect.left) / rect.width * 100, 0, 100), y: clamp((event.clientY - rect.top) / rect.height * 100, 0, 100) }; };
  function removeLayer(id: string) { change({ ...current.current.design, layers: current.current.design.layers.filter(item => item.id !== id) }); setSelectedId(''); setMessage('Elemento eliminado. Puedes recuperarlo con Deshacer.'); }
  async function adjustFrame() {
    if (!draft.design[side]) return; setBusy('Aplicando encuadre…'); setError('');
    try {
      const img = await imageFrom(draft.design[side]!); const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT; const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#101712'; ctx.fillRect(0, 0, WIDTH, HEIGHT); const scale = Math.min(WIDTH / img.naturalWidth, HEIGHT / img.naturalHeight) * frame.zoom;
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale; ctx.drawImage(img, (WIDTH - w) / 2 + frame.x * WIDTH / 100, (HEIGHT - h) / 2 + frame.y * HEIGHT / 100, w, h);
      change({ ...current.current.design, [side]: canvas.toDataURL('image/webp', .9) }); setFrame({ zoom: 1, x: 0, y: 0 }); setFraming(false); setMessage('Encuadre aplicado.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos aplicar el encuadre.'); } finally { setBusy(''); }
  }
  async function askAI(operation: 'mockup' | 'erase') {
    if (!onAI) { setError('Esta herramienta necesita la conexión con el servicio de Tony. Tu diseño queda guardado para continuar.'); return; }
    if (!current.current.design.front) { setError('Primero carga el diseño frontal.'); return; }
    if (operation === 'erase' && (!region || region.width < 1 || region.height < 1)) { setError('Marca primero un área en la imagen, arrastrando sobre ella.'); return; }
    const token = ++operationToken.current; setError(''); setBusy(operation === 'mockup' ? 'Preparando tu mockup con IA…' : 'Solicitando borrado de la imagen…');
    try {
      const design = current.current.design;
      const payload = operation === 'mockup' ? { front: await renderPedidoDesign(design, 'front'), back: design.back ? await renderPedidoDesign(design, 'back') : undefined, catalogCode: design.catalogCode } : { image: await renderPedidoDesign({ ...design, layers: [] }, side), side, region: { x: region!.x / 100, y: region!.y / 100, width: region!.width / 100, height: region!.height / 100 } };
      const result = await onAI(operation, payload); if (token !== operationToken.current) return;
      if (operation === 'erase') {
        const image = result.image || result[side]; if (!image) throw new Error('El servicio no devolvió la imagen corregida. Tu diseño se mantiene.'); await imageFrom(image);
        change({ ...current.current.design, [side]: image }); setRegion(null); setEraseMode(false); setMessage('Imagen base corregida. Revisa el resultado; puedes deshacerlo.');
      } else {
        if (!result.front || !result.back) throw new Error('Falta una de las vistas del mockup. Tu diseño se mantiene para volver a intentar.'); await Promise.all([imageFrom(result.front), imageFrom(result.back)]);
        // The generated mockup already contains the composited layers. Keeping them visible would duplicate the artwork.
        change({ ...current.current.design, front: result.front, back: result.back, layers: current.current.design.layers.map(layer => ({ ...layer, visible: false })) }); setMessage('Mockup recibido. Revisa ambas caras antes de continuar. Las capas incluidas están ocultas y conservan sus servicios asociados.');
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'El servicio no respondió. Puedes volver a intentarlo; conservamos tu diseño.'); } finally { if (token === operationToken.current) setBusy(''); }
  }
  async function download() {
    setError(''); try { const href = await renderPedidoDesign(current.current.design, side); const link = document.createElement('a'); link.href = href; link.download = `tony-${draft.design.catalogCode || 'propio'}-${side === 'front' ? 'frontal' : 'dorsal'}.png`; link.click(); setMessage('Vista preparada para descargar.'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos exportar la vista.'); }
  }
  return <section className="pedido-editor" aria-label="Editor de tu uniforme" data-history={historyVersion}>
    <div className="pedido-editor-heading"><div><span className="pedido-editor-kicker">Tu identidad, a tu manera</span><h3>Diseña las dos caras.</h3></div><span className="pedido-design-code">{draft.design.catalogCode || 'Diseño propio'}</span></div>
    <div className="pedido-editor-toolbar"><button type="button" className="pedido-tool-button" disabled={disabled} onClick={() => setCatalogOpen(value => !value)}>▦ {catalogOpen ? 'Ocultar catálogo' : 'Explorar 70 diseños'}</button><button type="button" className="pedido-tool-button" disabled={disabled || !past.current.length} onClick={undo}>↶ Deshacer</button><button type="button" className="pedido-tool-button" disabled={disabled || !future.current.length} onClick={redo}>↷ Rehacer</button></div>
    {catalogOpen && <CatalogPicker value={draft.design.catalogCode} disabled={disabled} onSelect={selectCatalog} onClose={() => setCatalogOpen(false)} />}
    <div className="pedido-editor-workspace" aria-busy={disabled}>
      <div className="pedido-editor-visual">
        <div className="pedido-side-tabs" role="group" aria-label="Cara del uniforme">{(['front', 'back'] as const).map(value => <button type="button" key={value} aria-pressed={side === value} disabled={disabled} onClick={() => setSide(value)}>{value === 'front' ? 'Frontal' : 'Dorsal'} <small>{draft.design[value] ? '✓' : 'Por cargar'}</small></button>)}</div>
        <div ref={stage} className={`pedido-design-stage${eraseMode ? ' is-erasing' : ''}`} aria-label={`Lienzo ${side === 'front' ? 'frontal' : 'dorsal'}`} onPointerDown={event => {
          if (!eraseMode || disabled || !draft.design[side]) return; event.currentTarget.setPointerCapture(event.pointerId); const point = localPoint(event); regionStart.current = point; setRegion({ ...point, width: 0, height: 0 });
        }} onPointerMove={event => { if (!regionStart.current) return; const p = localPoint(event), start = regionStart.current; setRegion({ x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), width: Math.abs(p.x - start.x), height: Math.abs(p.y - start.y) }); }} onPointerUp={event => { regionStart.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { regionStart.current = null; }}>
          {draft.design[side] ? <img className="pedido-design-base" src={resolveImage(draft.design[side]!)} alt={`Base ${side === 'front' ? 'frontal' : 'dorsal'} ${draft.design.catalogCode}`} draggable={false} style={framing ? { transform: `translate(${frame.x}%, ${frame.y}%) scale(${frame.zoom})` } : undefined} /> : <div className="pedido-design-placeholder"><span aria-hidden="true">＋</span><strong>{side === 'front' ? 'Empecemos por el frontal.' : 'Completa el dorsal.'}</strong><p>Selecciona un diseño oficial o sube tu imagen.</p></div>}
          {sideLayers.filter(item => item.visible).map(layer => <button type="button" key={layer.id} aria-label={`Mover ${layer.name}. Flechas para posicionar; Suprimir para eliminar.`} aria-pressed={selectedId === layer.id} disabled={disabled || eraseMode || framing} className={`pedido-design-layer${selectedId === layer.id ? ' is-selected' : ''}`} style={{ left: `${layer.x}%`, top: `${layer.y}%`, width: `${layer.width}%`, height: `${layer.height}%`, transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`, color: layer.color }} onClick={() => setSelectedId(layer.id)} onPointerDown={event => {
            if (event.button !== 0) return; event.stopPropagation(); setSelectedId(layer.id); remember(); const p = localPoint(event); drag.current = { id: layer.id, x: p.x, y: p.y, startX: layer.x, startY: layer.y }; event.currentTarget.setPointerCapture(event.pointerId);
          }} onPointerMove={event => { const movement = drag.current; if (!movement || movement.id !== layer.id) return; const p = localPoint(event); patchLayer(layer.id, { x: clamp(movement.startX + p.x - movement.x, 0, 100), y: clamp(movement.startY + p.y - movement.y, 0, 100) }, false); }} onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { drag.current = null; }} onKeyDown={event => {
            const step = event.shiftKey ? 5 : 1; const offset: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
            if (offset[event.key]) { event.preventDefault(); const [x, y] = offset[event.key]; patchLayer(layer.id, { x: clamp(layer.x + x, 0, 100), y: clamp(layer.y + y, 0, 100) }); }
            if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); removeLayer(layer.id); }
          }}>{layer.type === 'Texto' ? <svg viewBox={`0 0 ${layer.width * 8} ${layer.height * 10}`} width="100%" height="100%" aria-hidden="true"><text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill={layer.color} fontSize={layer.fontSize} fontFamily="Arial" fontWeight="700" textLength={Math.min(layer.width * 8, (layer.text?.length || 0) * layer.fontSize * .6)} lengthAdjust="spacingAndGlyphs">{layer.text}</text></svg> : layer.data && <img src={resolveImage(layer.data)} alt="" draggable={false} />}</button>)}
          {eraseMode && region && <div className="pedido-erase-region" style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` }} />}
          {disabled && <div className="pedido-editor-busy" role="status"><span className="pedido-editor-spinner" />{busy}</div>}
        </div>
        <div className="pedido-editor-toolbar"><button type="button" className="pedido-tool-button" disabled={disabled} onClick={() => fileInput.current?.click()}>↑ Subir {side === 'front' ? 'frontal' : 'dorsal'}</button><button type="button" className="pedido-tool-button" aria-pressed={framing} disabled={disabled || !draft.design[side]} onClick={() => { setFraming(value => !value); setEraseMode(false); }}>⤢ Encuadrar</button><button type="button" className="pedido-tool-button" disabled={disabled || !draft.design[side]} onClick={download}>↓ PNG</button></div>
        <input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" tabIndex={-1} aria-label="Cargar imagen del uniforme" onChange={event => upload(event, false)} />
        <p className="pedido-editor-note">JPG, PNG o WEBP · hasta 4 MB por imagen. Vista orientativa para revisar tu diseño.</p>
        {framing && <div className="pedido-frame-controls"><h4>Encuadre del {side === 'front' ? 'frontal' : 'dorsal'}</h4>{[{ key: 'zoom', label: 'Zoom', min: .5, max: 3, step: .05 }, { key: 'x', label: 'Horizontal', min: -50, max: 50, step: 1 }, { key: 'y', label: 'Vertical', min: -50, max: 50, step: 1 }].map(control => <label className="pedido-range-field" key={control.key}>{control.label}<input type="range" min={control.min} max={control.max} step={control.step} value={frame[control.key as keyof typeof frame]} onChange={event => setFrame(value => ({ ...value, [control.key]: Number(event.target.value) }))} /></label>)}<button type="button" className="pedido-primary-button" disabled={disabled} onClick={adjustFrame}>Aplicar encuadre</button></div>}
      </div>
      <aside className="pedido-editor-tools" aria-label="Herramientas de personalización">
        <h4>Agrega tu identidad</h4><div className="pedido-layer-actions">{(['Escudo', 'Marca', 'Sponsor'] as const).map(role => <button type="button" className="pedido-tool-button" key={role} disabled={disabled || !draft.design[side]} onClick={() => { uploadRole.current = role; layerInput.current?.click(); }}>＋ {role}</button>)}<button type="button" className="pedido-tool-button" disabled={disabled || !draft.design[side]} onClick={() => addText()}>＋ Texto</button></div>
        <input ref={layerInput} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" tabIndex={-1} aria-label="Subir elemento personalizado" onChange={event => upload(event, true)} />
        {side === 'back' && <div className="pedido-layer-actions"><button type="button" className="pedido-text-button" disabled={disabled || !draft.design.back} onClick={() => addText(draft.teamName || 'TU EQUIPO', 'Equipo')}>+ Equipo</button><button type="button" className="pedido-text-button" disabled={disabled || !draft.design.back} onClick={() => addText(draft.players[0]?.name || 'NOMBRE', 'Nombre')}>+ Nombre</button><button type="button" className="pedido-text-button" disabled={disabled || !draft.design.back} onClick={() => addText(draft.players[0]?.number || '10', 'Número')}>+ Número</button></div>}
        <p className="pedido-editor-note">Arrastra cada elemento; las flechas del teclado también lo mueven. Cada cara guarda sus propias capas.</p>
        <div className="pedido-layer-list"><h4>Capas del {side === 'front' ? 'frontal' : 'dorsal'} <span>{sideLayers.length}</span></h4>{!sideLayers.length && <p className="pedido-editor-empty">Aún no agregaste elementos en esta cara.</p>}{sideLayers.map(layer => <div className={`pedido-layer-row${selectedId === layer.id ? ' is-selected' : ''}`} key={layer.id}><button type="button" disabled={disabled} onClick={() => setSelectedId(layer.id)}><span>{layer.type === 'Texto' ? 'T' : '◈'}</span><span>{layer.name}<small>{layer.visible ? 'Visible' : 'Oculto · conserva su servicio'}</small></span></button><button type="button" disabled={disabled} className="pedido-layer-delete" onClick={() => removeLayer(layer.id)} aria-label={`Eliminar ${layer.name}`}>×</button></div>)}</div>
        {selected && <div className="pedido-layer-properties"><h4>Editar {selected.name}</h4><label className="pedido-field">Nombre de la capa<input value={selected.name} maxLength={40} disabled={disabled} onChange={event => patchLayer(selected.id, { name: event.target.value })} /></label>{selected.type === 'Texto' && <><label className="pedido-field">Texto<input value={selected.text || ''} maxLength={50} disabled={disabled} onChange={event => patchLayer(selected.id, { text: event.target.value })} /></label><div className="pedido-property-grid"><label className="pedido-field">Color<input type="color" value={selected.color} disabled={disabled} onChange={event => patchLayer(selected.id, { color: event.target.value })} /></label><label className="pedido-field">Letra<input type="number" min="10" max="180" value={selected.fontSize} disabled={disabled} onChange={event => patchLayer(selected.id, { fontSize: clamp(Number(event.target.value), 10, 180) })} /></label></div></>}
          <div className="pedido-property-grid">{[{ key: 'x', label: 'Posición X', min: 0, max: 100 }, { key: 'y', label: 'Posición Y', min: 0, max: 100 }, { key: 'width', label: 'Ancho', min: 2, max: 100 }, { key: 'height', label: 'Alto', min: 2, max: 100 }, { key: 'rotation', label: 'Giro °', min: -180, max: 180 }].map(control => <label className="pedido-field" key={control.key}>{control.label}<input type="number" min={control.min} max={control.max} step="1" disabled={disabled} value={Math.round(selected[control.key as 'x' | 'y' | 'width' | 'height' | 'rotation'])} onChange={event => patchLayer(selected.id, { [control.key]: clamp(Number(event.target.value), control.min, control.max) })} /></label>)}</div>
          <div className="pedido-editor-toolbar"><button type="button" className="pedido-tool-button" disabled={disabled} onClick={() => patchLayer(selected.id, { visible: !selected.visible })}>{selected.visible ? 'Ocultar' : 'Mostrar'}</button><button type="button" className="pedido-tool-button" disabled={disabled} onClick={() => { const target: Side = side === 'front' ? 'back' : 'front'; change({ ...current.current.design, layers: [...current.current.design.layers, { ...selected, id: crypto.randomUUID(), side: target }] }); setMessage(`Elemento copiado al ${target === 'front' ? 'frontal' : 'dorsal'}.`); }}>Copiar a otra cara</button><button type="button" className="pedido-tool-button is-danger" disabled={disabled} onClick={() => removeLayer(selected.id)}>Eliminar</button></div>
        </div>}
        <details className="pedido-image-tools"><summary>Elementos impresos e IA</summary><p className="pedido-editor-note">Los escudos, nombres y números que ya están impresos en una lámina no son capas independientes. Para quitarlos, selecciona su área y solicita el borrado de la imagen base. Las capas agregadas arriba se eliminan directamente.</p><button type="button" className="pedido-tool-button" disabled={disabled || !draft.design[side]} aria-pressed={eraseMode} onClick={() => { setEraseMode(value => !value); setFraming(false); setRegion(null); setSelectedId(''); }}>{eraseMode ? 'Cancelar selección' : 'Seleccionar área para borrar'}</button>{eraseMode && <><p className="pedido-editor-note">Arrastra sobre la imagen para delimitar el área. Revisa la selección antes de solicitar el cambio.</p><button type="button" className="pedido-primary-button" disabled={disabled || !region || region.width < 1 || region.height < 1} onClick={() => askAI('erase')}>Borrar área con IA</button></>}<button type="button" className="pedido-tool-button" disabled={disabled || !draft.design.front} onClick={() => askAI('mockup')}>Generar mockup con IA</button><p className="pedido-editor-note">Estas herramientas requieren conexión con el servicio de Tony. Siempre podrás revisar el resultado y deshacerlo.</p></details>
      </aside>
    </div>
    {error && <p className="pedido-editor-message is-error" role="alert">{error}</p>}{message && !error && <p className="pedido-editor-message is-success" role="status">✓ {message}</p>}
  </section>;
}
