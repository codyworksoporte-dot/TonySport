'use client';
import Link from 'next/link';
import {useEffect, useRef, type RefObject} from 'react';
import AppDownload from '../AppDownload';
import Brand from '../Brand';
import Icon from '../Icon';
import IntentLink from '../IntentLink';
import NavAnchor from './NavAnchor';
import {warmSearchIndex} from './SearchDialog';
import {disciplineThumb} from './thumbs';
import {siteAsset} from '@/lib/asset-path';
import {DISCIPLINES, DISCIPLINES_TITLE, disciplineHref} from '@/lib/disciplines';
import {CREATE_ORDER_HREF, MENU_MORE, NAV, SEARCH_LABEL, type NavLink} from '@/lib/nav';
import {TONY_WHATSAPP, TONY_WHATSAPP_NUMBER} from '@/lib/site-links';

type Props = {
  open: boolean; path: string; dialogRef: RefObject<HTMLDialogElement | null>;
  /** Number of stores in data/tony-stores.json (counted by the layout, on the server). */
  storeCount: number;
  onDismiss: () => void; onClosed: () => void; onSearch: () => void;
};

// `focus` is the photo's object-position: the implementos photo keeps its ball and bag in narrow phone tiles.
type Tile = NavLink & {note?: string; flag?: string; wide?: boolean; focus?: string};
const tiles = (storeCount: number): Tile[] => [
  {...NAV.promociones, flag: 'Promos', wide: true},
  {...NAV.implementos, focus: '0% 50%'},
  {...NAV.tiendas, note: `${storeCount} tiendas`},
  NAV.consulta,
];

/** The site menu: one native modal dialog, a full-screen sheet on phones and a large right panel on desktop. */
export default function MenuDialog({open, path, dialogRef, storeCount, onDismiss, onClosed, onSearch}: Props) {
  const body = useRef<HTMLDivElement>(null), closeButton = useRef<HTMLButtonElement>(null);
  const onConfigurator = path === CREATE_ORDER_HREF || path.startsWith(`${CREATE_ORDER_HREF}/`);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Opening always starts at the first action, with focus on the close button.
      if (body.current) body.current.scrollTop = 0;
      closeButton.current?.focus();
    } else if (!open && dialog.open) {
      // A nested dialog (App Tony) closes first, so nothing modal stays behind the closed menu.
      dialog.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(nested => nested.close());
      dialog.close();
    }
  }, [open, dialogRef]);

  // Opening the menu shows some twenty links: they prefetch on touch or hover, not all at once on sight.
  const tile = (item: Tile) => <NavAnchor className="tc-tile tony-menu-tile" href={item.href} external={item.external} intent onClick={onDismiss} aria-current={!item.external && path === item.href ? 'page' : undefined}>
    {item.image && <img src={siteAsset(item.image)} alt="" width={640} height={400} loading="lazy" decoding="async" style={item.focus ? {objectPosition: item.focus} : undefined}/>}
    {item.flag && <span className="tc-flag">{item.flag}</span>}
    <span className="tc-go"><Icon name={item.external ? 'diagonal' : 'arrow'}/></span>
    <span className="tc-tile-label"><span><b>{item.label}</b>{item.note && <small>{item.note}</small>}</span></span>
  </NavAnchor>;

  // React passes a nested dialog's close event up to this one: closing the App Tony dialog must leave the menu open.
  return <dialog ref={dialogRef} id="tony-mobile-menu" className="tony-mobile" aria-label="Menú de Tony Sportswear" onClose={event => { if (event.target === event.currentTarget) onClosed(); }}
    onClick={event => { if (event.target === event.currentTarget) onDismiss(); }}>
    <div className="tony-mobile-inner">
      <div className="tony-mobile-top">
        <Brand/>
        <button ref={closeButton} type="button" className="tony-menu-close" aria-label="Cerrar menú" onClick={onDismiss}><span>Cerrar</span><Icon name="close" size={24}/></button>
      </div>
      <div ref={body} className="tony-mobile-body">
        <button type="button" className="tony-search-pill tony-menu-search" aria-haspopup="dialog" onClick={onSearch} onPointerEnter={warmSearchIndex} onFocus={warmSearchIndex} onTouchStart={warmSearchIndex}><Icon name="search" size={26}/><span>{SEARCH_LABEL}</span></button>
        {!onConfigurator && <Link className="tc-btn tc-btn--lime tc-btn--lg tc-btn--block tony-menu-create" href={CREATE_ORDER_HREF} onClick={onDismiss}>Crear mi pedido<Icon name="plus"/></Link>}
        <nav aria-label="Navegación principal" className="tony-mobile-nav">
          <section className="tony-menu-sec" aria-labelledby="tony-menu-disciplinas">
            <h2 id="tony-menu-disciplinas" className="tony-menu-sec-title">{DISCIPLINES_TITLE}</h2>
            <ul className="tony-chips">
              {DISCIPLINES.map(discipline => <li key={discipline.id}>
                <IntentLink className="tony-chip" href={disciplineHref(discipline.id)} onClick={onDismiss}>
                  <span className="tony-chip-img"><img src={siteAsset(disciplineThumb(discipline, 'chip'))} alt="" width={160} height={160} loading="lazy" decoding="async"/></span>
                  <span className="tony-chip-name">{discipline.name}</span>
                </IntentLink>
              </li>)}
              <li><IntentLink className="tony-chip tony-chip--all" href="/producto" onClick={onDismiss} aria-current={path === '/producto' ? 'page' : undefined}><span className="tony-chip-img"><Icon name="grid" size={28}/></span><span className="tony-chip-name">Ver todas</span></IntentLink></li>
            </ul>
          </section>
          <ul className="tony-menu-tiles">
            {tiles(storeCount).map(item => <li key={item.href} className={item.wide ? 'is-wide' : undefined}>{tile(item)}</li>)}
            <li>
              <AppDownload className="tc-tile tony-menu-tile">
                <img src={siteAsset(NAV.app.image)} alt="" width={640} height={400} loading="lazy" decoding="async"/>
                <span className="tc-go"><Icon name="download"/></span>
                <span className="tc-tile-label"><span><b>Descarga la App Tony</b><small>Android y iPhone</small></span></span>
              </AppDownload>
            </li>
            <li>
              <a className="tc-tile tony-menu-tile tony-menu-tile--wa" href={NAV.ayuda.href} target="_blank" rel="noopener noreferrer" onClick={onDismiss}>
                <Icon name="whatsapp-solid" className="tony-menu-tile-glyph" size={140}/>
                <span className="tc-go"><Icon name="diagonal"/></span>
                <span className="tc-tile-label"><span><b>Ayuda por WhatsApp</b><small>{TONY_WHATSAPP_NUMBER}</small></span></span>
                <span className="tc-sr"> (se abre en otra pestaña)</span>
              </a>
            </li>
            <li>{tile(NAV.news)}</li>
          </ul>
          <ul className="tony-menu-more">
            {MENU_MORE.map(item => <li key={item.href}><IntentLink href={item.href} onClick={onDismiss} aria-current={path === item.href ? 'page' : undefined}><Icon name={item.icon}/>{item.label}</IntentLink></li>)}
          </ul>
        </nav>
      </div>
      <div className="tony-mobile-support">
        <a className="tony-menu-wa" href={TONY_WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label={`Contáctanos por WhatsApp al ${TONY_WHATSAPP_NUMBER}`}>
          <Icon name="whatsapp-solid" size={30}/><span><small>Contáctanos</small><b>{TONY_WHATSAPP_NUMBER}</b></span><Icon name="arrow" className="tony-menu-wa-go"/>
        </a>
      </div>
    </div>
  </dialog>;
}
