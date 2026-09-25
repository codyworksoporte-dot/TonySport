'use client';

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { FABRICS, type Design, type DesignAssets, type Garment, type Player } from '@/lib/order';
import { DEFAULT_ELEMENTS, ELEMENT_LABELS, MAX_LAYERS, TECHNIQUES, type StudioLayer, type TemplateElements } from '@/lib/studio';
import StudioCanvas, { exportStudioPNG } from './StudioCanvas';
import StudioNumberField from './StudioNumberField';
import './team-design-studio.css';

type StudioProps = {
  design: Design; garment: Garment; team: string; players: Player[]; assets: DesignAssets;
  onDesignChange: (next: Design) => void; onAssetsChange: (next: DesignAssets) => void;
  onGarmentChange: (next: Garment) => void; line: 'kit' | 'shirt';
  onBusyChange?: (busy: boolean) => void;
};
type Snapshot = { design: Design; assets: DesignAssets; garment: Garment };
type UploadTarget = 'design' | 'crest' | 'front' | 'back' | 'replace';
type IconName = 'upload'|'shield'|'text'|'undo'|'redo'|'download'|'eye'|'hidden'|'lock'|'unlock'|'trash'|'copy'|'up'|'down'|'link'|'unlink'|'layers'|'check';
const PALETTE = ['#F3F5EF','#101827','#2264E8','#E63946','#20A568','#FFE15A','#F58232','#B4FF35'];
const HISTORY_LIMIT = 40;
const MAX_BYTES = 20 * 1024 * 1024;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const uid = () => crypto.randomUUID();
const copyDesign = (design: Design): Design => structuredClone(design);
const sameAssets = (first: DesignAssets, second: DesignAssets) => Object.keys(first).length === Object.keys(second).length && Object.keys(first).every(key => first[key] === second[key]);
const bytesOf = (assets: DesignAssets) => Object.values(assets).reduce<number>((total, value) => total + (value ? Math.max(0, value.length - value.indexOf(',') - 1) * .75 : 0), 0);
const layerBase = (side: StudioLayer['side']): StudioLayer => ({ id: uid(), name: 'Mi elemento', kind: 'text', side, x: 50, y: 49, width: 45, height: 9, rotation: 0, opacity: 1, visible: true, locked: false, text: 'TU TEXTO', color: '#17251B', bold: true });
function coverSize(ratio: number) {
  let width = Math.max(100, 100 * 560 * ratio / 480);
  let height = Math.max(100, 100 * 480 / (560 * ratio));
  const fit = Math.min(1, 200 / Math.max(width, height));
  width *= fit; height *= fit;
  return { width: clamp(width, 2, 200), height: clamp(height, 2, 200) };
}
function StudioIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    upload:'M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5', shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z',
    text:'M4 5V3h16v2M12 3v18m-4 0h8', undo:'M9 4 4 9l5 5M4 9h10a6 6 0 0 1 0 12', redo:'m15 4 5 5-5 5m5-5H10a6 6 0 0 0 0 12',
    download:'M12 3v13m-5-5 5 5 5-5M4 16v5h16v-5', eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    hidden:'m3 3 18 18M9 5a14 14 0 0 1 13 7s-2 4-5 6M6 6a20 20 0 0 0-4 6s4 7 10 7h2', lock:'M6 10h12v11H6V10Zm2 0V7a4 4 0 0 1 8 0v3m-4 4v3',
    unlock:'M6 10h12v11H6V10Zm2 0V7a4 4 0 0 1 8-1m-4 8v3', trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',
    copy:'M8 8h13v13H8V8ZM3 16V3h13', up:'m6 11 6-6 6 6M12 5v16M4 2h16', down:'m6 13 6 6 6-6M12 19V3M4 22h16',
    link:'m10 14 4-4m-6 7-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2-1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
    unlink:'m3 3 18 18M7 12l-2 2a4 4 0 0 0 6 6l2-2m4-6 2-2a4 4 0 0 0-6-6l-2 2', layers:'m12 3 10 6-10 6L2 9l10-6Zm-10 11 10 6 10-6M2 19l10 6 10-6', check:'m5 12 4 4L19 6',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default function TeamDesignStudio(props: StudioProps) {
  const { design, garment, team, players, assets, line } = props;
  const [side, setSide] = useState<'front'|'back'>('front');
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [panel, setPanel] = useState<'design'|'layers'|'garment'>('design');
  const [keepRatio, setKeepRatio] = useState(true);
  const [loading, setLoading] = useState<Partial<Record<UploadTarget,boolean>>>({});
  const [uploadErrors, setUploadErrors] = useState<Partial<Record<UploadTarget,string>>>({});
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [, refreshHistory] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const latest = useRef(props); latest.current = props;
  const mounted = useRef(false);
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const gesture = useRef<Snapshot|null>(null);
  const lastOwnedDesign = useRef(design);
  const uploadVersions = useRef<Record<string,number>>({});
  const readers = useRef(new Set<FileReader>());
  const focusText = useRef<string|null>(null);
  const layers = design.layers ?? [];
  const elements = design.elements ?? DEFAULT_ELEMENTS;
  const selected = layers.find(layer => layer.id === selectedId);
  const player = players.find(item => item.id === selectedPlayer) ?? players[0];
  const technique = TECHNIQUES.find(item => item.value === garment.technique) ?? TECHNIQUES[0];
  const activeCount = layers.filter(layer => layer.side === side).length;
  const busy = Object.values(loading).some(Boolean);

  useEffect(() => { props.onBusyChange?.(busy); }, [busy, props.onBusyChange]);
  useEffect(() => () => { latest.current.onBusyChange?.(false); }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; readers.current.forEach(reader => reader.abort()); };
  }, []);
  useEffect(() => {
    if (design !== lastOwnedDesign.current) {
      past.current = []; future.current = []; gesture.current = null;
      lastOwnedDesign.current = design;
      refreshHistory(value => value + 1);
    }
  }, [design]);
  useEffect(() => {
    if (focusText.current !== selectedId) return;
    const frame = requestAnimationFrame(() => { document.getElementById('tds-sponsor')?.focus(); focusText.current = null; });
    return () => cancelAnimationFrame(frame);
  }, [selectedId]);

  function snapshot(): Snapshot { return { design: copyDesign(latest.current.design), assets: { ...latest.current.assets }, garment: { ...latest.current.garment } }; }
  function remember(value: Snapshot) { past.current = [...past.current, value].slice(-HISTORY_LIMIT); }
  function apply(nextDesign: Design, nextAssets = latest.current.assets, record = true, nextGarment = latest.current.garment) {
    const current = latest.current;
    if (JSON.stringify(current.design) === JSON.stringify(nextDesign) && JSON.stringify(current.garment) === JSON.stringify(nextGarment) && sameAssets(current.assets, nextAssets)) return;
    if (record) {
      if (!gesture.current) remember(snapshot());
      future.current = [];
    }
    lastOwnedDesign.current = nextDesign;
    latest.current = { ...current, design: nextDesign, assets: nextAssets, garment: nextGarment };
    current.onDesignChange(nextDesign);
    if (!sameAssets(current.assets, nextAssets)) current.onAssetsChange(nextAssets);
    if (JSON.stringify(current.garment) !== JSON.stringify(nextGarment)) current.onGarmentChange(nextGarment);
    refreshHistory(value => value + 1);
  }
  function beginGesture() { if (!gesture.current) gesture.current = snapshot(); }
  function endGesture() {
    const start = gesture.current; gesture.current = null;
    if (start && (JSON.stringify(start.design) !== JSON.stringify(latest.current.design) || JSON.stringify(start.garment) !== JSON.stringify(latest.current.garment) || !sameAssets(start.assets, latest.current.assets))) {
      remember(start); future.current = []; refreshHistory(value => value + 1);
    }
  }
  function undo() {
    endGesture(); const previous = past.current.pop(); if (!previous) return;
    future.current.push(snapshot()); apply(previous.design, previous.assets, false, previous.garment);
    setSelectedId(current => previous.design.layers.some(layer => layer.id === current) ? current : null);
    setMessage('Último cambio deshecho.');
  }
  function redo() {
    endGesture(); const next = future.current.pop(); if (!next) return;
    remember(snapshot()); apply(next.design, next.assets, false, next.garment); setMessage('Cambio recuperado.');
  }
  function patchDesign(patch: Partial<Design>) { apply({ ...latest.current.design, ...patch }); }
  function patchGarment(patch: Partial<Garment>) { apply(latest.current.design, latest.current.assets, true, { ...latest.current.garment, ...patch }); }
  function selectLayer(id: string|null) {
    if (id !== selectedId) endGesture(); setSelectedId(id);
    const layer = latest.current.design.layers.find(item => item.id === id);
    if (layer) { setSide(layer.side); setPanel('layers'); }
  }
  function updateLayer(id: string, patch: Partial<StudioLayer>) {
    const current = latest.current.design;
    const layer = current.layers.find(item => item.id === id);
    if (!layer || (layer.locked && Object.keys(patch).some(key => key !== 'locked' && key !== 'visible'))) return;
    apply({ ...current, layers: current.layers.map(item => item.id === id ? { ...item, ...patch } : item) });
  }
  function changeSide(next: 'front'|'back') { endGesture(); setSide(next); setSelectedId(null); }
  function canAdd() {
    if (latest.current.design.layers.length < MAX_LAYERS) return true;
    setMessage(`Puedes usar hasta ${MAX_LAYERS} capas. Elimina una para agregar otra.`); return false;
  }
  function addText() {
    endGesture(); if (!canAdd()) return;
    const layer = { ...layerBase(side), name: 'Mi texto', color: latest.current.design.accent };
    apply({ ...latest.current.design, mode: 'template', layers: [...latest.current.design.layers, layer] });
    focusText.current = layer.id; setSelectedId(layer.id); setPanel('layers');
    setMessage(`Texto agregado al ${side === 'front' ? 'frente' : 'reverso'}. Escribe y colócalo en tu camisa.`);
  }
  function duplicateLayer() {
    endGesture(); if (!selected || !canAdd()) return;
    const layer = { ...selected, id: uid(), name: `${selected.name.slice(0,70)} copia`, x: clamp(selected.x + 3,0,100), y: clamp(selected.y + 3,0,100), locked: false };
    apply({ ...latest.current.design, layers: [...latest.current.design.layers, layer] }); setSelectedId(layer.id); setSide(layer.side);
  }
  function removeLayer() {
    endGesture(); if (!selected) return;
    const remaining = latest.current.design.layers.filter(layer => layer.id !== selected.id);
    const nextAssets = { ...latest.current.assets };
    if (selected.assetKey && !remaining.some(layer => layer.assetKey === selected.assetKey)) delete nextAssets[selected.assetKey];
    apply({ ...latest.current.design, layers: remaining }, nextAssets); setSelectedId(null); setMessage('Capa eliminada. Puedes recuperarla con Deshacer.');
  }
  function moveLayer(direction: number) {
    endGesture(); const ordered = [...latest.current.design.layers]; const index = ordered.findIndex(layer => layer.id === selectedId);
    if (index < 0 || index + direction < 0 || index + direction >= ordered.length) return;
    [ordered[index], ordered[index + direction]] = [ordered[index + direction], ordered[index]];
    patchDesign({ layers: ordered });
  }
  function changeSize(key: 'width'|'height', value: number) {
    if (!selected || !Number.isFinite(value)) return;
    const next = clamp(value,2,200);
    const other = key === 'width' ? 'height' : 'width';
    const patch: Partial<StudioLayer> = { [key]: next };
    if (keepRatio) patch[other] = clamp(selected[other] * next / selected[key],2,200);
    updateLayer(selected.id, patch);
  }
  function cleanTemplate() {
    endGesture(); patchDesign({ mode: 'template', elements: { ...latest.current.design.elements, brand: false, trim: false, pattern: false, teamName: false } });
    setMessage('Base limpia: sin marcas Tony, adornos, patrón ni nombre del equipo. Los nombres y dorsales de jugadores conservan tu elección.');
  }
  function setElement(key: keyof TemplateElements, value: boolean) { patchDesign({ elements: { ...latest.current.design.elements, [key]: value } }); }
  function removeReference(view: 'front'|'back') {
    endGesture(); uploadVersions.current[view] = (uploadVersions.current[view] ?? 0) + 1;
    setLoading(current => ({...current, [view]:false}));
    const next = {...latest.current.assets}; delete next[view];
    apply(latest.current.design, next);
    setMessage('Referencia eliminada. Puedes recuperarla con Deshacer.');
  }

  // Migrate old drafts when their images finish loading from IndexedDB, once only.
  useEffect(() => {
    const current = latest.current.design;
    const nextLayers = [...current.layers]; const nextAssets = { ...latest.current.assets };
    let changed = false; let sponsor = current.sponsor;
    if (nextAssets.crest && !nextLayers.some(layer => layer.id === 'legacy-crest' || layer.assetKey === 'crest') && nextLayers.length < MAX_LAYERS) {
      nextAssets['layer-legacy-crest'] = nextAssets.crest; delete nextAssets.crest;
      nextLayers.push({ ...layerBase('front'), id: 'legacy-crest', name: 'Escudo del equipo', kind: 'image', text: undefined, assetKey: 'layer-legacy-crest', x: current.crest.x, y: current.crest.y, width: 11 * current.crest.scale, height: 11 * 480 / 560 * current.crest.scale }); changed = true;
    }
    if (sponsor && !nextLayers.some(layer => layer.id === 'legacy-sponsor') && nextLayers.length < MAX_LAYERS) {
      nextLayers.push({ ...layerBase('front'), id: 'legacy-sponsor', name: 'Patrocinador', text: sponsor, x: current.sponsorPlacement.x, y: current.sponsorPlacement.y, width: 48 * current.sponsorPlacement.scale, height: 8 * current.sponsorPlacement.scale, color: current.accent }); sponsor = ''; changed = true;
    }
    if (changed) apply({ ...current, sponsor, layers: nextLayers }, nextAssets, false);
  }, [design, assets]);

  async function upload(target: UploadTarget, file?: File) {
    if (!file) return;
    const version = (uploadVersions.current[target] ?? 0) + 1; uploadVersions.current[target] = version;
    const targetSide = side; const replacementId = selectedId;
    setUploadErrors(current => ({ ...current, [target]: '' })); setLoading(current => ({ ...current, [target]: false }));
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) { setUploadErrors(current => ({ ...current, [target]: 'Elige una imagen PNG, JPG o WebP.' })); return; }
    if (file.size > 4 * 1024 * 1024) { setUploadErrors(current => ({ ...current, [target]: 'La imagen supera los 4 MB. Usa una versión más liviana.' })); return; }
    if (target !== 'front' && target !== 'back' && target !== 'replace' && !canAdd()) return;
    setLoading(current => ({ ...current, [target]: true }));
    const active = () => mounted.current && uploadVersions.current[target] === version;
    try {
      const data = await new Promise<string>((resolve,reject) => {
        const reader = new FileReader(); readers.current.add(reader);
        reader.onerror = reader.onabort = () => { readers.current.delete(reader); reject(new Error('decode')); };
        reader.onload = () => { readers.current.delete(reader); typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('decode')); };
        reader.readAsDataURL(file);
      });
      const decoded = new Image(); decoded.src = data; await decoded.decode();
      if (!active()) return;
      if (!decoded.naturalWidth || !decoded.naturalHeight || Math.max(decoded.naturalWidth,decoded.naturalHeight) > 12000) throw new Error('dimensions');
      const current = latest.current.design; const nextAssets = { ...latest.current.assets };
      if (target === 'front' || target === 'back') {
        nextAssets[target] = data;
        if (bytesOf(nextAssets) > MAX_BYTES) throw new Error('total');
        endGesture(); apply({ ...current, mode: 'reference' },nextAssets); setSide(target); setSelectedId(null);
        setMessage('Referencia lista. Se conserva como imagen plana; no modifica la camisa del editor.'); return;
      }
      const ratio = decoded.naturalWidth / decoded.naturalHeight;
      let nextLayers = [...current.layers]; let layer: StudioLayer;
      const id = uid(); const assetKey = `layer-${id}`; nextAssets[assetKey] = data;
      if (target === 'replace') {
        const previous = nextLayers.find(item => item.id === replacementId);
        if (!previous || previous.locked) return;
        layer = { ...previous, assetKey, kind: 'image' };
        nextLayers = nextLayers.map(item => item.id === previous.id ? layer : item);
        if (previous.assetKey && !nextLayers.some(item => item.assetKey === previous.assetKey)) delete nextAssets[previous.assetKey];
      } else {
        if (!canAdd()) return;
        layer = { ...layerBase(targetSide), id, assetKey, text: undefined, kind: 'image', name: target === 'crest' ? 'Escudo del equipo' : file.name.replace(/\.[^.]+$/,'').slice(0,80), x: target === 'crest' ? 63 : 50, y: target === 'crest' ? 31 : 50, ...(target === 'crest' ? { width: 17, height: clamp(17 * 480 / 560 / ratio,2,200) } : coverSize(ratio)) };
        nextLayers.push(layer);
      }
      if (bytesOf(nextAssets) > MAX_BYTES) throw new Error('total');
      endGesture(); apply({ ...latest.current.design, mode: 'template', layers: nextLayers },nextAssets);
      setSelectedId(layer.id); setSide(layer.side); setPanel('layers');
      setMessage(`${target === 'crest' ? 'Escudo' : 'Diseño'} aplicado en la camisa. Arrástralo o ajusta su tamaño en Capas.`);
    } catch (error) {
      if (active()) setUploadErrors(current => ({ ...current, [target]: error instanceof Error && error.message === 'total' ? 'El proyecto admite hasta 20 MB de imágenes. Elimina una capa de imagen o usa archivos más livianos.' : 'No se pudo abrir esa imagen. Prueba un PNG, JPG o WebP válido de hasta 12 000 px por lado.' }));
    } finally { if (active()) setLoading(current => ({ ...current, [target]: false })); }
  }
  async function downloadView() {
    if (!stageRef.current || exporting) return;
    setExporting(true); setExportError(false); setMessage('');
    try {
      const png = await exportStudioPNG(stageRef.current);
      if (!mounted.current) return;
      const url = URL.createObjectURL(png); const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `tony-${side === 'front' ? 'frente' : 'espalda'}.png`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url),1000);
      setMessage('PNG descargado. Adjunta este boceto y tus archivos originales manualmente en WhatsApp; no se envían automáticamente.');
    } catch { if (mounted.current) { setExportError(true); setMessage('No se pudo descargar el PNG. Comprueba las imágenes y vuelve a intentarlo.'); } }
    finally { if (mounted.current) setExporting(false); }
  }
  function onKeyboard(event: KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('input,textarea,select,[contenteditable=true]')) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
  }
  function fileInput(target: UploadTarget, label: string) {
    return <input id={`tds-file-${target}`} type="file" accept="image/png,image/jpeg,image/webp" aria-label={label} aria-describedby={uploadErrors[target] ? `tds-error-${target}` : undefined} onChange={event => { void upload(target,event.target.files?.[0]); event.target.value = ''; }} />;
  }
  const uploadIssues = Object.entries(uploadErrors).filter(([,error]) => error);

  return <section className="tds" aria-label="Editor de diseño del equipo" onKeyDown={onKeyboard}>
    <header className="tds-heading"><div><p className="tds-eyebrow"><i /> ESTUDIO DE PERSONALIZACIÓN</p><h3>Tu camisa.<em> A tu manera.</em></h3></div><p>Diseña el frente y la espalda.<br /><strong>Cada elemento, en tus manos.</strong></p></header>
    <div className="tds-add-bar">
      <label className="tds-add-action tds-add-primary"><span className="tds-action-icon"><StudioIcon name="upload" /></span><span><strong>{loading.design ? 'Abriendo diseño…' : 'Subir mi diseño'}</strong><small>Se aplica sobre la camisa</small></span><span className="tds-action-arrow" aria-hidden="true">↗</span>{fileInput('design',`Subir diseño para ${side === 'front' ? 'el frente' : 'la espalda'}`)}</label>
      <label className="tds-add-action"><span className="tds-action-icon"><StudioIcon name="shield" /></span><span><strong>{loading.crest ? 'Abriendo escudo…' : 'Subir escudo'}</strong><small>Tu identidad, en su lugar</small></span>{fileInput('crest',`Subir escudo para ${side === 'front' ? 'el frente' : 'la espalda'}`)}</label>
      <button type="button" className="tds-add-action" aria-label="Agregar texto" onClick={addText}><span className="tds-action-icon"><StudioIcon name="text" /></span><span><strong>Agregar texto</strong><small>Marca, lema o patrocinador</small></span></button>
    </div>
    {uploadIssues.length > 0 && <div className="tds-upload-errors">{uploadIssues.map(([target,error]) => <p className="tds-error" id={`tds-error-${target}`} role="status" key={target}>{error}</p>)}</div>}
    <div className="tds-workspace">
      <div className="tds-preview">
        <div className="tds-toolbar">
          <div className="tds-history"><button type="button" onClick={undo} disabled={!past.current.length && !gesture.current} aria-label="Deshacer" title="Deshacer · Ctrl Z"><StudioIcon name="undo" /></button><button type="button" onClick={redo} disabled={!future.current.length} aria-label="Rehacer" title="Rehacer · Ctrl Shift Z"><StudioIcon name="redo" /></button></div>
          <div className="tds-view-switch" role="group" aria-label="Vista del uniforme"><button type="button" aria-pressed={side === 'front'} onClick={() => changeSide('front')}>Frente</button><button type="button" aria-pressed={side === 'back'} onClick={() => changeSide('back')}>Espalda</button></div>
          <button type="button" className="tds-download" onClick={() => void downloadView()} disabled={exporting || (design.mode === 'reference' && !assets[side])} aria-label="Descargar PNG" title="Descargar esta vista en PNG"><StudioIcon name="download" /><span>{exporting ? '…' : 'PNG'}</span></button>
        </div>
        <div className="tds-stage-label"><span>{design.mode === 'reference' ? 'REFERENCIA PLANA' : 'LIENZO DE TU EQUIPO'}</span><span>{side === 'front' ? '01 / FRENTE' : '02 / ESPALDA'}</span></div>
        <div className="tds-stage" ref={stageRef}><StudioCanvas design={design} garment={garment} team={team} player={player} assets={assets} side={side} line={line} selectedId={selectedId} onSelect={selectLayer} onLayerChange={updateLayer} onGestureStart={beginGesture} onGestureEnd={endGesture} /></div>
        <div className="tds-stage-footer"><span><StudioIcon name="layers" /> {activeCount} {activeCount === 1 ? 'capa' : 'capas'} en esta vista</span><span>{design.mode === 'reference' ? 'Imagen original, sin editar' : 'Arrastra · redimensiona · gira'}</span></div>
        <div className="tds-player-row"><label htmlFor="tds-player">PROBAR EN UN JUGADOR<select id="tds-player" value={player?.id || ''} onChange={event => { setSelectedPlayer(event.target.value); changeSide('back'); }}>{players.map((item,index) => <option value={item.id} key={item.id}>{item.number ? `#${item.number} · ` : ''}{item.name || `Jugador ${index + 1}`}{item.size ? ` · ${item.size}` : ''}</option>)}</select></label><span className="tds-roster-count">{players.length}<small>JUGADORES</small></span></div>
        <p className="tds-preview-note">Boceto orientativo. Tony confirma colores, ubicación y acabados antes de producir.</p>
      </div>
      <aside className="tds-controls" aria-label="Herramientas del editor">
        <div className="tds-tabs" role="group" aria-label="Paneles del editor">{([{value:'design',label:'Diseño'},{value:'layers',label:'Capas'},{value:'garment',label:'Prenda'}] as const).map(tab => <button type="button" key={tab.value} aria-pressed={panel === tab.value} onClick={() => { endGesture(); setPanel(tab.value); }}>{tab.label}{tab.value === 'layers' && <span>{layers.length}</span>}</button>)}</div>
        {panel === 'design' && <div className="tds-panel">
          <div className="tds-panel-title"><span className="tds-kicker">LA BASE ES SOLO EL COMIENZO</span><h4>Empieza por tus colores.</h4><p>Combina una base con tus imágenes, escudos y textos. Las escamas son opcionales.</p></div>
          <div className="tds-color-fields">{([{key:'color',label:'Color principal'},{key:'accent',label:'Color de detalles'}] as const).map(({key,label}) => <fieldset className="tds-color-field" key={key}><legend>{label} <output>{design[key].toUpperCase()}</output></legend><div className="tds-color-row">{PALETTE.map(color => <button type="button" key={color} className="tds-color" style={{backgroundColor:color}} aria-label={`${label}: ${color}`} aria-pressed={design[key].toLowerCase() === color.toLowerCase()} onClick={() => patchDesign({[key]:color})}>{design[key].toLowerCase() === color.toLowerCase() && <span aria-hidden="true">✓</span>}</button>)}<label className="tds-custom-color"><span aria-hidden="true">+</span><input type="color" id={`tds-color-${key}`} aria-label={`${label}: color personalizado`} value={design[key]} onFocus={beginGesture} onBlur={endGesture} onChange={event => patchDesign({[key]:event.target.value})} /></label></div></fieldset>)}</div>
          <fieldset className="tds-fieldset"><legend>Estilo de la base</legend><div className="tds-patterns">{([{value:'clean',label:'Esencial',description:'Color limpio'},{value:'stripe',label:'Franja',description:'Movimiento diagonal'},{value:'scales',label:'Escamas',description:'Solo si tú las eliges'}] as const).map(pattern => <button type="button" key={pattern.value} className={`tds-pattern ${pattern.value}`} aria-pressed={design.variant === pattern.value} onClick={() => patchDesign({mode:'template',variant:pattern.value,elements:{...elements,pattern:true}})}><span className="tds-pattern-art" style={{'--preview-main':design.color,'--preview-accent':design.accent} as CSSProperties} aria-hidden="true" /><strong>{pattern.label}</strong><small>{pattern.description}</small></button>)}</div></fieldset>
          <div className="tds-template-section"><div className="tds-section-label"><h4>Elementos de la plantilla</h4><span>{Object.values(elements).filter(Boolean).length}/6</span></div><div className="tds-template-toggles">{(Object.keys(ELEMENT_LABELS) as (keyof TemplateElements)[]).map(key => <label key={key}><input type="checkbox" checked={elements[key]} onChange={event => setElement(key,event.target.checked)} /><span>{ELEMENT_LABELS[key]}</span><i aria-hidden="true" /></label>)}</div><button type="button" className="tds-clean-button" onClick={cleanTemplate}>Quitar elementos Tony <span aria-hidden="true">↗</span></button><p className="tds-hint">Deja la camisa limpia y conserva los nombres y dorsales de tu nómina.</p></div>
          <details className="tds-reference-options"><summary>¿Prefieres adjuntar una referencia plana?</summary><div className="tds-mode-options"><button type="button" aria-pressed={design.mode === 'template'} onClick={() => patchDesign({mode:'template'})}>Editar sobre la camisa</button><button type="button" aria-pressed={design.mode === 'reference'} onClick={() => { patchDesign({mode:'reference'}); setSelectedId(null); }}>Referencia plana</button></div><p>Úsala para compartir una foto o un uniforme ya diseñado. Esta opción muestra la imagen original.</p>{(['front','back'] as const).map(view => <div className="tds-reference-row" key={view}><label className="tds-reference-upload"><StudioIcon name="upload" /><span>{view === 'front' ? 'Referencia frontal' : 'Referencia posterior'}<small>{assets[view] ? 'Imagen guardada · reemplazar' : 'PNG, JPG o WebP · máximo 4 MB'}</small></span>{fileInput(view,view === 'front' ? 'Referencia frontal' : 'Referencia posterior')}</label>{assets[view]&&<button type="button" className="tds-reference-remove" onClick={()=>removeReference(view)}>Quitar referencia {view==='front'?'frontal':'posterior'}</button>}</div>)}</details>
        </div>}
        {panel === 'layers' && <div className="tds-panel">
          <div className="tds-panel-title tds-layer-title"><div><span className="tds-kicker">CADA DETALLE TIENE SU LUGAR</span><h4>Tus capas.</h4></div><span>{layers.length}<small>/{MAX_LAYERS}</small></span></div>
          {layers.length === 0 ? <div className="tds-empty-layers"><StudioIcon name="layers" /><h4>Todo empieza con una idea.</h4><p>Sube tu diseño, agrega un escudo o escribe un texto con los botones de arriba.</p><button type="button" onClick={addText}><StudioIcon name="text" /> Agregar mi primer texto</button></div> : <ul className="tds-layer-list">{[...layers].reverse().map(layer => <li className={`${selectedId === layer.id ? 'is-selected' : ''}${!layer.visible ? ' is-hidden' : ''}`} key={layer.id}><button type="button" className="tds-select-layer" aria-label={`Seleccionar capa ${layer.name}`} aria-pressed={selectedId === layer.id} onClick={() => selectLayer(layer.id)}><span className="tds-layer-thumb">{layer.kind === 'image' && layer.assetKey && assets[layer.assetKey] ? <img src={assets[layer.assetKey]} alt="" /> : <StudioIcon name={layer.kind === 'text' ? 'text' : 'upload'} />}</span><span><strong>{layer.name}</strong><small>{layer.side === 'front' ? 'Frente' : 'Espalda'} · {layer.kind === 'image' ? 'Imagen' : 'Texto'}{layer.locked ? ' · Bloqueada' : ''}</small></span></button><button type="button" className="tds-layer-icon" aria-label={`${layer.visible ? 'Ocultar' : 'Mostrar'} capa ${layer.name}`} title={layer.visible ? 'Ocultar capa' : 'Mostrar capa'} onClick={() => updateLayer(layer.id,{visible:!layer.visible})}><StudioIcon name={layer.visible ? 'eye' : 'hidden'} /></button><button type="button" className="tds-layer-icon" aria-label={`${layer.locked ? 'Desbloquear' : 'Bloquear'} capa ${layer.name}`} title={layer.locked ? 'Desbloquear capa' : 'Bloquear capa'} onClick={() => updateLayer(layer.id,{locked:!layer.locked})}><StudioIcon name={layer.locked ? 'lock' : 'unlock'} /></button></li>)}</ul>}
          {selected && <div className="tds-inspector">
            <div className="tds-inspector-header"><span className="tds-kicker">ELEMENTO SELECCIONADO</span><span>{selected.kind === 'image' ? 'IMAGEN' : 'TEXTO'}</span></div>
            {selected.locked && <p className="tds-locked-note"><StudioIcon name="lock" /> Capa bloqueada. Usa el candado para editarla.</p>}
            {design.mode === 'reference' && <p className="tds-locked-note">Las capas se aplican sobre la camisa. <button type="button" onClick={() => patchDesign({mode:'template'})}>Volver al lienzo</button></p>}
            <fieldset disabled={selected.locked} className="tds-inspector-fields">
              <label className="tds-field">Nombre del elemento<input id="tds-layer-name" maxLength={80} value={selected.name} onFocus={beginGesture} onBlur={endGesture} onChange={event => updateLayer(selected.id,{name:event.target.value})} /></label>
              {selected.kind === 'text' && <><label className="tds-field">Tu texto<input id="tds-sponsor" maxLength={60} value={selected.text ?? ''} onFocus={beginGesture} onBlur={endGesture} onChange={event => updateLayer(selected.id,{text:event.target.value})} placeholder="Escribe tu marca o lema" /></label><div className="tds-text-options"><label>Color del texto<input type="color" value={selected.color} onFocus={beginGesture} onBlur={endGesture} onChange={event => updateLayer(selected.id,{color:event.target.value})} /></label><button type="button" aria-pressed={selected.bold} onClick={() => updateLayer(selected.id,{bold:!selected.bold})}>Negrita <strong>B</strong></button></div></>}
              <div className="tds-field-grid"><StudioNumberField key={`${selected.id}-x`} id="tds-layer-x" label="Posición horizontal" value={selected.x} min={0} max={100} unit="%" onStart={beginGesture} onEnd={endGesture} onChange={x=>updateLayer(selected.id,{x})}/><StudioNumberField key={`${selected.id}-y`} id="tds-layer-y" label="Posición vertical" value={selected.y} min={0} max={100} unit="%" onStart={beginGesture} onEnd={endGesture} onChange={y=>updateLayer(selected.id,{y})}/></div>
              <div className="tds-size-label"><span>Tamaño del elemento</span><button type="button" aria-pressed={keepRatio} onClick={() => setKeepRatio(value => !value)} title={keepRatio ? 'Desvincular proporciones' : 'Mantener proporciones'}><StudioIcon name={keepRatio ? 'link' : 'unlink'} />{keepRatio ? 'Proporcional' : 'Libre'}</button></div>
              <div className="tds-field-grid"><StudioNumberField key={`${selected.id}-width`} id="tds-layer-width" label="Ancho" value={selected.width} min={2} max={200} unit="%" onStart={beginGesture} onEnd={endGesture} onChange={value=>changeSize('width',value)}/><StudioNumberField key={`${selected.id}-height`} id="tds-layer-height" label="Alto" value={selected.height} min={2} max={200} unit="%" onStart={beginGesture} onEnd={endGesture} onChange={value=>changeSize('height',value)}/></div>
              <div className="tds-field-grid"><StudioNumberField key={`${selected.id}-rotation`} id="tds-layer-rotation" label="Rotación" value={selected.rotation} min={-180} max={180} unit="°" onStart={beginGesture} onEnd={endGesture} onChange={rotation=>updateLayer(selected.id,{rotation})}/><StudioNumberField key={`${selected.id}-opacity`} id="tds-layer-opacity" label="Opacidad" value={selected.opacity*100} min={0} max={100} unit="%" onStart={beginGesture} onEnd={endGesture} onChange={opacity=>updateLayer(selected.id,{opacity:opacity/100})}/></div>
              <div className="tds-presets"><span>Colocar en</span><button type="button" onClick={() => updateLayer(selected.id,{x:50,y:50})}>Centro</button><button type="button" onClick={() => updateLayer(selected.id,{x:63,y:31})}>Pecho izquierdo</button><button type="button" onClick={() => updateLayer(selected.id,{x:37,y:31})}>Pecho derecho</button>{selected.kind === 'image' && <button type="button" onClick={() => updateLayer(selected.id,{x:50,y:50,rotation:0,...coverSize(selected.width * 480 / (selected.height * 560))})}>Cubrir prenda</button>}</div>
              <label className="tds-field">Cara de la prenda<select value={selected.side} onChange={event => { const next = event.target.value as 'front'|'back'; updateLayer(selected.id,{side:next}); setSide(next); }}><option value="front">Frente</option><option value="back">Espalda</option></select></label>
              {selected.kind === 'image' && <label className="tds-replace-image"><StudioIcon name="upload" /> Reemplazar imagen{fileInput('replace','Reemplazar imagen de la capa seleccionada')}</label>}
            </fieldset>
            <div className="tds-layer-actions"><button type="button" onClick={duplicateLayer} disabled={layers.length >= MAX_LAYERS} aria-label="Duplicar capa" title="Duplicar capa"><StudioIcon name="copy" /><span>Duplicar</span></button><button type="button" onClick={() => moveLayer(1)} disabled={layers.indexOf(selected) === layers.length - 1} aria-label="Subir capa" title="Subir una posición"><StudioIcon name="up" /></button><button type="button" onClick={() => moveLayer(-1)} disabled={layers.indexOf(selected) === 0} aria-label="Bajar capa" title="Bajar una posición"><StudioIcon name="down" /></button><button type="button" className="tds-delete-layer" onClick={removeLayer} aria-label="Eliminar capa" title="Eliminar capa"><StudioIcon name="trash" /></button></div>
          </div>}
          {layers.length > 0 && !selected && <p className="tds-hint">Selecciona una capa para ajustar posición, tamaño, rotación y opacidad. Las primeras de la lista se dibujan encima.</p>}
        </div>}
        {panel === 'garment' && <div className="tds-panel"><div className="tds-panel-title"><span className="tds-kicker">TU FORMA DE COMPETIR</span><h4>Define cómo se hace.</h4><p>Elige la técnica y las características de tu prenda. Tony confirma su viabilidad con el diseño final.</p></div><fieldset className="tds-fieldset tds-techniques"><legend>Técnica de personalización</legend>{TECHNIQUES.map(item => <button type="button" key={item.value} aria-label={item.label} aria-pressed={garment.technique === item.value} onClick={() => patchGarment({technique:item.value})}><span><strong>{item.label}</strong><small>{item.description}</small></span><i aria-hidden="true">{garment.technique === item.value && <StudioIcon name="check" />}</i></button>)}</fieldset><div className="tds-garment-fields"><label>Molde<select value={garment.mold} onChange={event => patchGarment({mold:event.target.value as Garment['mold']})}>{['Hombre','Mujer','Mixto'].map(value => <option key={value}>{value}</option>)}</select></label><label>Confección<select value={garment.construction} onChange={event => patchGarment({construction:event.target.value as Garment['construction']})}>{['Estándar','Raglan','Primera División'].map(value => <option key={value}>{value}</option>)}</select></label><label>Tela<select value={garment.fabric} onChange={event => patchGarment({fabric:event.target.value})}>{FABRICS.map(value => <option key={value}>{value}</option>)}</select></label></div><fieldset className="tds-fieldset"><legend>Cuello</legend><div className="tds-option-row">{([{value:'v',label:'En V'},{value:'round',label:'Redondo'},{value:'chinese',label:'Chino'},{value:'polo',label:'Polo'}] as const).map(option => <button type="button" key={option.value} aria-pressed={garment.collar === option.value} onClick={() => { patchGarment({collar:option.value}); changeSide('front'); }}>{option.label}</button>)}</div></fieldset><fieldset className="tds-fieldset"><legend>Manga</legend><div className="tds-option-row"><button type="button" aria-pressed={garment.sleeve === 'short'} onClick={() => patchGarment({sleeve:'short'})}>Corta</button><button type="button" aria-pressed={garment.sleeve === 'long'} onClick={() => patchGarment({sleeve:'long'})}>Larga</button></div></fieldset>{line === 'kit' && <label className="tds-checkbox"><input type="checkbox" checked={garment.shortsNumber} onChange={event => patchGarment({shortsNumber:event.target.checked})} /><span>Agregar dorsal a la calzoneta</span></label>}<p className="tds-hint">La vista cambia cuello y manga. Molde, confección, tela y técnica quedan indicados en tu solicitud.</p></div>}
      </aside>
    </div>
    <footer className="tds-footbar"><span><i /> {technique.label}<b>·</b> {layers.length}/{MAX_LAYERS} capas</span><span>PNG / JPG / WEBP · 4 MB POR IMAGEN</span></footer>
    <p id="tds-studio-message" className={`tds-message${exportError ? ' is-error' : ''}`} role="status">{message}</p>
  </section>;
}
