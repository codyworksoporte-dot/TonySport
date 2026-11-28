'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import Brand from './Brand';
import CartLink from './CartLink';
import Icon from './Icon';
import SocialGlyph from './SocialGlyph';
import MenuDialog from './header/MenuDialog';
import SearchDialog, {warmSearchIndex} from './header/SearchDialog';
import {CREATE_ORDER_HREF, SEARCH_LABEL} from '@/lib/nav';
import {TONY_EMAIL, TONY_WHATSAPP, TONY_WHATSAPP_NUMBER} from '@/lib/site-links';
import {TONY_CHANNELS} from '@/lib/social-news';
import './site-navigation.css';

/** Any component can open the site search: window.dispatchEvent(new Event('tony:open-search')). */
export const OPEN_SEARCH_EVENT = 'tony:open-search';

export default function Header() {
  const path = usePathname().replace(/\/$/, '') || '/';
  const previousPath = useRef(path);
  const onConfigurator = path === CREATE_ORDER_HREF || path.startsWith(`${CREATE_ORDER_HREF}/`);
  const header = useRef<HTMLElement>(null);
  const menuDialog = useRef<HTMLDialogElement>(null), searchDialog = useRef<HTMLDialogElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null), searchReturn = useRef<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false), [searchOpen, setSearchOpen] = useState(false), [mac, setMac] = useState(false);

  function closeAll() {
    setMenuOpen(false); setSearchOpen(false);
  }
  function openMenu() { setSearchOpen(false); setMenuOpen(true); }
  function openSearch() {
    if (searchDialog.current?.open) { searchDialog.current.querySelector<HTMLInputElement>('#site-search')?.focus(); return; }
    const active = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    // Opened from the menu, focus later returns to the menu button (the menu closes on the way).
    searchReturn.current = active && menuDialog.current?.contains(active) ? menuTrigger.current : active;
    setMenuOpen(false); setSearchOpen(true);
  }
  const openSearchRef = useRef(openSearch);
  openSearchRef.current = openSearch;

  useEffect(() => {
    if (previousPath.current !== path) closeAll();
    previousPath.current = path;
  }, [path]);
  useEffect(() => {
    const open = () => openSearchRef.current();
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearchRef.current(); }
    };
    window.addEventListener(OPEN_SEARCH_EVENT, open);
    window.addEventListener('keydown', shortcut);
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
    return () => { window.removeEventListener(OPEN_SEARCH_EVENT, open); window.removeEventListener('keydown', shortcut); };
  }, []);
  // Scroll state lives on a DOM attribute (no React state, no re-render): the glass deepens, the logo eases down and the lime reading thread shows.
  useEffect(() => {
    let frame = 0;
    const paint = () => { frame = 0; header.current?.toggleAttribute('data-scrolled', scrollY > 24); };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    paint(); addEventListener('scroll', schedule, {passive: true});
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', schedule); };
  }, []);

  const searchButton = (wide = false) => <button type="button" className={`tony-search-pill${wide ? ' tony-search-pill--wide' : ''}`} aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" onClick={openSearch}
    onPointerEnter={warmSearchIndex} onFocus={warmSearchIndex} onTouchStart={warmSearchIndex}><Icon name="search" size={26}/><span>{SEARCH_LABEL}</span></button>;

  return <>
    <header ref={header} className="site-header tony-header">
      <div className="tony-header-inner">
        <Brand/>
        <div className="tony-search-trigger">{searchButton()}<kbd aria-hidden="true">{mac ? '⌘ K' : 'Ctrl K'}</kbd></div>
        <div className="tony-header-actions">
          <a className="tony-wa-pill" href={TONY_WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label={`Contáctanos por WhatsApp al ${TONY_WHATSAPP_NUMBER}`}>
            <Icon name="whatsapp-solid" size={28}/><span className="tony-wa-text"><small>Contáctanos</small><b>{TONY_WHATSAPP_NUMBER}</b></span>
          </a>
          <CartLink className="tony-header-cart"/>
          {!onConfigurator && <Link className="tc-btn tc-btn--lime tony-header-create" href={CREATE_ORDER_HREF}>Crear pedido<Icon name="plus"/></Link>}
          <button ref={menuTrigger} type="button" className="tony-menu-button" aria-label="Abrir menú" aria-haspopup="dialog" aria-controls="tony-mobile-menu" aria-expanded={menuOpen} onClick={openMenu}><Icon name="menu" size={24}/><span>Menú</span></button>
        </div>
      </div>
    </header>
    <div className="tony-subbar">
      <div className="tony-subbar-search">{searchButton(true)}</div>
      <div className="tony-contact-line">
        <span>Si no te lo tenemos <strong>te lo hacemos</strong></span>
        <div className="tony-contact-links">
          <a href={`mailto:${TONY_EMAIL}`}><Icon name="mail" size={18}/>{TONY_EMAIL}</a>
          <div className="tony-strip-social">
            {(['facebook','instagram'] as const).map(channel => <a key={channel} href={TONY_CHANNELS[channel].url}
              aria-label={`${TONY_CHANNELS[channel].name} de Tony (se abre en otra pestaña)`} target="_blank" rel="noopener noreferrer">
              <SocialGlyph channel={channel} size={20}/>
            </a>)}
          </div>
        </div>
      </div>
    </div>
    <MenuDialog open={menuOpen} dialogRef={menuDialog} path={path} onDismiss={() => setMenuOpen(false)} onSearch={openSearch}
      onClosed={() => { setMenuOpen(false); if (!searchDialog.current?.open) menuTrigger.current?.focus({preventScroll: true}); }}/>
    <SearchDialog open={searchOpen} dialogRef={searchDialog} onDismiss={() => setSearchOpen(false)}
      onClosed={() => { setSearchOpen(false); const target = searchReturn.current; searchReturn.current = null; if (target?.isConnected && !menuDialog.current?.open) target.focus({preventScroll: true}); }}/>
  </>;
}
