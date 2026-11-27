'use client';
import Link from 'next/link';
import {useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject} from 'react';
import Icon, {type IconName} from '../Icon';
import NavAnchor from './NavAnchor';
import {chipThumb, disciplineThumb} from './thumbs';
import {siteAsset} from '@/lib/asset-path';
import {DISCIPLINES, DISCIPLINES_TITLE, disciplineHref} from '@/lib/disciplines';
import {SEARCH_SHORTCUTS} from '@/lib/nav';
import type {DirectoryEntry} from '@/lib/site-directory';
import {whatsappLink} from '@/lib/site-links';

type Props = {open: boolean; dialogRef: RefObject<HTMLDialogElement | null>; onDismiss: () => void; onClosed: () => void};
type IndexItem = {entry: DirectoryEntry; label: string; text: string};

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// The full directory (every album, store, line and option) loads when the search is about to open
// (hover, focus or touch on a search button, or the palette itself), not with every page.
let loaded: IndexItem[] | null = null;
let loading: Promise<IndexItem[]> | null = null;
export function loadSearchIndex(): Promise<IndexItem[]> {
  loading ??= import('@/lib/site-directory').then(({SITE_DIRECTORY}) => {
    loaded = SITE_DIRECTORY.map(entry => ({entry, label: normalize(entry.label), text: normalize(`${entry.label} ${entry.terms} ${entry.group}`)}));
    return loaded;
  }).catch(error => { loading = null; throw error; });
  return loading;
}
export const warmSearchIndex = () => { void loadSearchIndex().catch(() => { /* Retried when the search opens. */ }); };
const GROUP_ICON: Record<string, IconName> = {
  'ACCESOS': 'sparkle', 'TIENDAS': 'pin', 'AYUDA': 'help', 'PEDIDOS Y CUENTA': 'user', 'INFORMACIÓN': 'shield',
  'SOMOS TONY': 'star', 'COLECCIONES': 'grid', 'OPCIONES DE CONFECCIÓN': 'grid', 'IMPLEMENTOS DEPORTIVOS': 'ball', 'TONY': 'home',
};

/** Every word must appear; entries whose name holds the words come first. */
function search(index: IndexItem[], query: string): DirectoryEntry[] {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return index.filter(item => words.every(word => item.text.includes(word)))
    .map((item, order) => ({item, order, rank: item.label.startsWith(words[0]) ? 0 : words.every(word => item.label.includes(word)) ? 1 : 2}))
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .map(({item}) => item.entry);
}

/** The site search: a native modal dialog that works as a big command palette. */
export default function SearchDialog({open, dialogRef, onDismiss, onClosed}: Props) {
  const input = useRef<HTMLInputElement>(null), body = useRef<HTMLDivElement>(null), chosen = useRef(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<IndexItem[] | null>(loaded);
  // The directory could not be fetched (no network, or a new deploy replaced its file): tried again on the next keystroke.
  const [failed, setFailed] = useState(false);
  const pendingEnter = useRef(false);
  // Until the directory arrives (a moment, once) the starting points stay on screen instead of "Sin resultados".
  const typed = query.trim().length > 0 && (index !== null || failed);
  const results = useMemo(() => index ? search(index, query) : [], [index, query]);

  useEffect(() => {
    if (!open || index || failed) return;
    let current = true;
    loadSearchIndex().then(items => { if (current) setIndex(items); }).catch(() => { if (current) setFailed(true); });
    return () => { current = false; };
  }, [open, index, failed]);

  // Enter pressed while the directory was still arriving opens the first result as soon as it is there.
  useEffect(() => {
    if (!pendingEnter.current || !index) return;
    pendingEnter.current = false;
    if (results.length) body.current?.querySelector<HTMLAnchorElement>('.tony-search-results>a')?.click();
  }, [index, results]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (chosen.current) { chosen.current = false; setQuery(''); }
      dialog.showModal(); input.current?.focus(); input.current?.select();
      if (body.current) body.current.scrollTop = 0;
    }
    else if (!open && dialog.open) dialog.close();
  }, [open, dialogRef]);

  const items = () => Array.from(body.current?.querySelectorAll<HTMLElement>('a[href],button') ?? []);
  function onInputKey(event: KeyboardEvent<HTMLInputElement>) {
    // While the directory is still arriving, the list below is about to be replaced: keep the focus in the field.
    if (event.key === 'ArrowDown') { event.preventDefault(); if (index || failed || !query.trim()) items()[0]?.focus(); }
    // Esc closes the palette at once (a search field would otherwise only clear its text first).
    else if (event.key === 'Escape') { event.preventDefault(); onDismiss(); }
    else if (event.key === 'Enter' && results.length) { event.preventDefault(); body.current?.querySelector<HTMLAnchorElement>('.tony-search-results>a')?.click(); }
    else if (event.key === 'Enter' && !index && query.trim()) { event.preventDefault(); pendingEnter.current = true; }
  }
  // Arrow keys walk the visible options; going up from the first returns to the field.
  function onBodyKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const list = items(), index = list.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    event.preventDefault();
    const next = index + (event.key === 'ArrowDown' ? 1 : -1);
    if (next < 0) input.current?.focus(); else list[Math.min(next, list.length - 1)]?.focus();
  }
  function reset() { setQuery(''); input.current?.focus(); }
  // Picking a destination closes the palette; it opens fresh next time (cleared on open, not during the fade-out).
  function choose() { onDismiss(); chosen.current = true; }

  return <dialog ref={dialogRef} className="tony-search" aria-labelledby="tony-search-title" onClose={onClosed}
    onClick={event => { if (event.target === event.currentTarget) onDismiss(); }}>
    <div className="tony-search-inner">
      <div className="tony-search-heading">
        <h2 id="tony-search-title">¿QUÉ BUSCAS <em>EN ESPECÍFICO?</em></h2>
        <button type="button" className="tony-search-close" aria-label="Cerrar búsqueda" onClick={onDismiss}><Icon name="close" size={24}/></button>
      </div>
      <label htmlFor="site-search" className="sr-only">Buscar una sección</label>
      <div className="tony-search-input">
        <Icon name="search" size={26}/>
        <input ref={input} id="site-search" type="search" value={query} onChange={event => { setQuery(event.target.value); pendingEnter.current = false; if (failed) setFailed(false); }} onKeyDown={onInputKey}
          placeholder="Fútbol, balones, tiendas…" autoComplete="off" spellCheck={false} enterKeyHint="search"/>
        {query && <button type="button" className="tony-search-clear" aria-label="Limpiar búsqueda" onClick={reset}><Icon name="close" size={20}/></button>}
        <kbd aria-hidden="true">Esc</kbd>
      </div>
      <p className="tony-search-count" data-state={typed ? (results.length ? 'found' : 'empty') : 'initial'} aria-live="polite">
        {typed ? (results.length ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}` : index ? 'Sin resultados' : 'No se pudo cargar la búsqueda') : 'Escribe o toca una opción'}
      </p>
      <div ref={body} className="tony-search-body" onKeyDown={onBodyKey}>
        {!typed && <div className="tony-search-start">
          <h3>Accesos rápidos</h3>
          <ul className="tony-search-quick">
            {SEARCH_SHORTCUTS.map(link => <li key={link.href}>
              <NavAnchor className="tony-search-chip" href={link.href} external={link.external} prefetch={false} onClick={choose}>
                <Icon name={link.icon} size={24}/><span>{link.label}</span>{link.external && <Icon name="diagonal" className="tony-search-ext"/>}
              </NavAnchor>
            </li>)}
          </ul>
          <h3>{DISCIPLINES_TITLE}</h3>
          <ul className="tony-search-disc">
            {DISCIPLINES.map(discipline => <li key={discipline.id}>
              <Link className="tony-search-chip tony-search-chip--img" href={disciplineHref(discipline.id)} prefetch={false} onClick={choose}>
                <img src={siteAsset(disciplineThumb(discipline, 'chip'))} alt="" width={160} height={160} loading="lazy" decoding="async"/><span>{discipline.name}</span>
              </Link>
            </li>)}
            <li><Link className="tony-search-chip tony-search-chip--all" href="/producto" prefetch={false} onClick={choose}><span className="tony-search-chip-icon"><Icon name="grid" size={22}/></span><span>Ver todas</span></Link></li>
          </ul>
        </div>}
        {typed && (results.length ? <div className="tony-search-results">
          {results.map(item => <NavAnchor key={item.href} href={item.href} external={item.external} prefetch={false} onClick={choose} aria-label={item.label}>
            <span className="tony-search-thumb">{item.image
              ? <img src={siteAsset(chipThumb(item.image))} alt="" width={96} height={96} loading="lazy" decoding="async"/>
              : <Icon name={GROUP_ICON[item.group] ?? 'arrow'} size={22}/>}</span>
            <span className="tony-search-text"><small>{item.group}</small><strong>{item.label}</strong></span>
            <Icon name={item.external ? 'diagonal' : 'arrow'} className="tony-search-go"/>
          </NavAnchor>)}
        </div> : <div className="tony-search-empty">
          <span className="tony-search-empty-mark" aria-hidden="true"><Icon name="search"/></span>
          <strong>{index ? 'Probemos otra palabra.' : 'No pudimos cargar la búsqueda.'}</strong>
          <p>{index ? <>No encontramos “{query.trim()}”. Prueba con un deporte, un producto o una tienda.</> : 'Revisa tu conexión y vuelve a escribir, o recarga la página.'}</p>
          <div className="tony-search-empty-actions">
            <button type="button" className="tc-btn tc-btn--ghost tc-btn--sm" onClick={reset}>Ver puntos de partida<Icon name="arrow"/></button>
            <a className="tc-btn tc-btn--wa tc-btn--sm" href={whatsappLink(`Hola, Tony. Busco: ${query.trim()}`)} target="_blank" rel="noopener noreferrer">Pregúntale a Tony<Icon name="whatsapp-solid"/></a>
          </div>
        </div>)}
      </div>
      <p className="tony-search-hint" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> para moverte <kbd>Enter</kbd> para abrir <span><kbd>Esc</kbd> para cerrar</span></p>
    </div>
  </dialog>;
}
