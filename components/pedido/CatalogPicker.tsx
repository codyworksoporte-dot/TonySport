'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import catalog from '@/data/pedido/catalog.json';
import { siteAsset } from '@/lib/asset-path';
import './editor.css';
import './catalog-lineas.css';

export type CatalogDesign = (typeof catalog.designs)[number];

/** Catalogue lines in catalogue order: Fútbol, Voleibol, Baloncesto, Empresarial. */
export const CATALOG_LINES = [...new Set(catalog.designs.map(design => design.category))];
export const CATALOG_COUNT = catalog.designs.length;

const ROWS = 2;
const BY_LINE = new Map(CATALOG_LINES.map(line => [line, catalog.designs.filter(design => design.category === line)]));
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es');
// Everyday words for each line, so "basket", "vóley" or "polo" also find it.
const LINE_WORDS: Record<string, string> = { Fútbol: 'futbol soccer', Voleibol: 'voley volley voleibol', Baloncesto: 'basket basquet basketball baloncesto', Empresarial: 'polo polos camisa empresa empresarial' };
const SEARCH = new Map(catalog.designs.map(design => [design.code, fold(`${design.code} ${design.name} ${design.category} ${LINE_WORDS[design.category] ?? ''}`)]));
const LAST_CODE = catalog.designs.reduce((max, design) => Math.max(max, Number(design.code.slice(5))), 0);
const slug = (line: string) => fold(line).replace(/[^a-z0-9]+/g, '-');
const frontOnly = (design: CatalogDesign) => 'backIsFront' in design && design.backIsFront === true;
const asset = (path: string) => siteAsset(path as `/assets/${string}`);
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function CatalogPicker({ value, onSelect, onClose, disabled = false }: { value?: string; onSelect: (design: CatalogDesign) => void; onClose?: () => void; disabled?: boolean }) {
  const [query, setQuery] = useState('');
  const [line, setLine] = useState('');
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [columns, setColumns] = useState(4);
  const [preview, setPreview] = useState<CatalogDesign | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const autoOpened = useRef(false);
  const afterToggle = useRef<{ focus?: string; scroll?: string }>({});
  useEffect(() => { if (preview && !dialog.current?.open) dialog.current?.showModal(); }, [preview]);

  // "Two rows" follows the grid's real column count, which changes with the CSS breakpoints.
  useIsoLayoutEffect(() => {
    const box = board.current;
    if (!box) return;
    const measure = () => {
      const grid = box.querySelector<HTMLElement>('.pedido-catalog-grid');
      if (!grid) return;
      const count = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(track => track.endsWith('px')).length;
      if (!count) return;
      setColumns(current => current === count ? current : count);
      // Open the line of an already chosen design when it would sit beyond the first two rows.
      if (!autoOpened.current) {
        autoOpened.current = true;
        const chosen = catalog.designs.find(design => design.code === value);
        if (chosen && (BY_LINE.get(chosen.category) ?? []).indexOf(chosen) >= count * ROWS) setExpanded(current => new Set(current).add(chosen.category));
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [value]);

  const needle = fold(query.trim());
  const searching = needle !== '';
  const sections = useMemo(() => CATALOG_LINES
    .filter(name => !line || name === line)
    .map(name => ({ name, items: (BY_LINE.get(name) ?? []).filter(design => !searching || SEARCH.get(design.code)?.includes(needle)) }))
    .filter(section => section.items.length), [line, needle, searching]);
  const total = sections.reduce((sum, section) => sum + section.items.length, 0);
  const limit = columns * ROWS;

  // After "Ver más" focus the first new design; after "Ver menos" bring the line back into view.
  useEffect(() => {
    const { focus, scroll } = afterToggle.current;
    afterToggle.current = {};
    if (focus) board.current?.querySelector<HTMLElement>(`[data-code="${focus}"]`)?.focus();
    if (scroll) document.getElementById(scroll)?.scrollIntoView({ block: 'nearest' });
  }, [expanded]);

  function toggle(name: string) {
    const opening = !expanded.has(name);
    afterToggle.current = opening ? { focus: (BY_LINE.get(name) ?? [])[limit]?.code } : { scroll: `pedido-linea-${slug(name)}` };
    setExpanded(current => {
      const next = new Set(current);
      if (opening) next.add(name); else next.delete(name);
      return next;
    });
  }

  function search(text: string) {
    // A new search covers the whole catalogue; a line chosen afterwards narrows it.
    if (!query.trim() && text.trim()) setLine('');
    setQuery(text);
  }

  const status = searching
    ? (total ? `${total} ${total === 1 ? 'diseño encontrado' : 'diseños encontrados'} ${line ? `en ${line}` : 'en todo el catálogo'}. Selecciona una lámina para verla completa.` : `Sin resultados${line ? ` en ${line}` : ''}.`)
    : line
      ? `${total} diseños de ${line}. Selecciona una lámina para verla completa.`
      : `${CATALOG_COUNT} diseños en ${CATALOG_LINES.length} líneas. Selecciona una lámina para verla completa.`;

  return <section className="pedido-catalog pedido-catalog--lineas" aria-label="Catálogo oficial Tony">
    <div className="pedido-editor-heading"><div><span className="pedido-editor-kicker">{CATALOG_COUNT} diseños oficiales</span><h3>Encuentra tu identidad.</h3></div>{onClose && <button type="button" className="pedido-tool-button" onClick={onClose}>Cerrar catálogo ×</button>}</div>
    <label className="pedido-field">Buscar por código o nombre<input type="search" value={query} onChange={event => search(event.target.value)} placeholder="Ej. TONY-010, voleibol o polo" /></label>
    <div className="pedido-catalog-chips" role="group" aria-label="Filtrar por línea">
      <button type="button" aria-pressed={!line} onClick={() => setLine('')}>Todas <span>{CATALOG_COUNT}<span className="tc-sr"> diseños</span></span></button>
      {CATALOG_LINES.map(name => <button type="button" key={name} data-linea={slug(name)} aria-pressed={line === name} onClick={() => setLine(current => current === name ? '' : name)}>{name} <span>{BY_LINE.get(name)?.length ?? 0}<span className="tc-sr"> diseños</span></span></button>)}
    </div>
    <p className="pedido-editor-note" role="status">{status}</p>
    <div className="pedido-catalog-lines" ref={board}>
      {sections.map(({ name, items }) => {
        const id = `pedido-linea-${slug(name)}`;
        const all = searching || line === name || expanded.has(name);
        const shown = all ? items : items.slice(0, limit);
        const lineTotal = BY_LINE.get(name)?.length ?? 0;
        const foldable = !searching && line !== name && items.length > limit;
        return <section className="pedido-catalog-line" key={name} id={id} data-linea={slug(name)} aria-labelledby={`${id}-titulo`}>
          <div className="pedido-catalog-line-head"><h4 id={`${id}-titulo`}>{name}</h4><span>{searching ? `${items.length} de ${lineTotal}` : `${lineTotal} ${lineTotal === 1 ? 'diseño' : 'diseños'}`}</span></div>
          <div className="pedido-catalog-grid" id={`${id}-grid`}>{shown.map(item => <button type="button" className="pedido-catalog-card" key={item.code} data-code={item.code} disabled={disabled} onClick={() => setPreview(item)} aria-label={`Ver ${item.code}`} aria-pressed={value === item.code}>
            {/* Local thumbnails keep the complete catalog small on mobile. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(item.thumbnail)} alt={`${item.name}, ${item.code}`} width="220" height="220" loading="lazy" decoding="async" />
            <span><strong>{item.code}</strong><small>{value === item.code ? 'Seleccionado ✓' : 'Ver diseño ↗'}</small></span>
          </button>)}</div>
          {foldable && <button type="button" className="pedido-tool-button pedido-catalog-more" aria-expanded={all} aria-controls={`${id}-grid`} onClick={() => toggle(name)}>
            {all ? `Ver menos ${name}` : <>Ver más {name} <small>+{items.length - shown.length}</small></>}
          </button>}
        </section>;
      })}
    </div>
    {!total && <p className="pedido-editor-empty">No encontramos diseños con esa búsqueda. Prueba con un número del 001 al {String(LAST_CODE).padStart(3, '0')} o con una línea: {CATALOG_LINES.join(', ')}.{line && <> <button type="button" className="pedido-catalog-reset" onClick={() => setLine('')}>Buscar en todas las líneas</button></>}</p>}
    {preview && <dialog ref={dialog} className="pedido-catalog-preview" aria-label={`Vista completa ${preview.code}`} onCancel={() => setPreview(null)}>
      <div className="pedido-editor-heading"><div><h4>{preview.code}</h4><p className="pedido-catalog-preview-name" data-linea={slug(preview.category)}>{preview.name}</p></div><button type="button" className="pedido-tool-button" onClick={() => setPreview(null)} aria-label="Cerrar vista completa">Cerrar ×</button></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(preview.image)} alt={`Diseño oficial completo ${preview.code}, ${frontOnly(preview) ? 'vista frontal' : 'frontal y dorsal'}`} width={preview.width} height={preview.height} />
      <p className="pedido-editor-note">{frontOnly(preview)
        ? 'Esta lámina muestra el frente: lo cargaremos como base de las dos caras y el generador con IA crea la espalda con el mismo diseño. Las nuevas capas se editan por separado.'
        : 'Cargaremos el frontal y el dorsal de esta misma lámina. Los elementos impresos en la imagen forman parte de ella; las nuevas capas se editan por separado.'}</p>
      <button type="button" className="pedido-primary-button" disabled={disabled} onClick={() => { onSelect(preview); setPreview(null); }}>Usar {preview.code} <span aria-hidden="true">↗</span></button>
    </dialog>}
  </section>;
}
