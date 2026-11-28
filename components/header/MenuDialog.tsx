'use client';
import {useEffect, useRef, type RefObject} from 'react';
import {MAIN_MENU, MENU_SERVICE_LINKS, type MenuDestination} from '@/lib/main-menu';
import {SEARCH_LABEL} from '@/lib/nav';
import Icon from '../Icon';
import NavAnchor from './NavAnchor';
import {warmSearchIndex} from './SearchDialog';

type Props = {
  open: boolean;
  path: string;
  dialogRef: RefObject<HTMLDialogElement | null>;
  onDismiss: () => void;
  onClosed: () => void;
  onSearch: () => void;
};

function MenuItem({item, path, onDismiss, depth = 0}: {
  item: MenuDestination;
  path: string;
  onDismiss: () => void;
  depth?: number;
}) {
  const link = (label: string) => <NavAnchor href={item.href} external={item.external} intent onClick={onDismiss}
    aria-current={path === item.href ? 'page' : undefined}>
    <span>{label}</span>{item.external && <Icon name="diagonal" size={15}/>}
  </NavAnchor>;

  if (!item.children?.length || (depth === 1 && item.children.length === 1)) return <li>{link(item.label)}</li>;
  if (depth === 1) return <li className="tony-category">
    {link(item.label)}
    <details name="tony-product-options">
      <summary role="button" aria-label={'Opciones de '+item.label}><Icon name="down" size={17}/></summary>
      <ul className="tony-menu-sublist">{item.children.map(child =>
        <MenuItem key={child.href} item={child} path={path} depth={depth+1} onDismiss={onDismiss}/>
      )}</ul>
    </details>
  </li>;
  return <li>
    <details name={`tony-menu-level-${depth}`}>
      <summary>{item.label}<Icon name="down" size={17}/></summary>
      <ul className="tony-menu-sublist">
        <li>{link(item.overview ?? item.label)}</li>
        {item.children.map(child => <MenuItem key={child.href} item={child} path={path} depth={depth + 1} onDismiss={onDismiss}/>)}
      </ul>
    </details>
  </li>;
}

export default function MenuDialog({open, path, dialogRef, onDismiss, onClosed, onSearch}: Props) {
  const body = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
      if (body.current) body.current.scrollTop = 0;
      close.current?.focus({preventScroll: true});
    } else if (!open && dialog?.open) {
      dialog.close();
    }
  }, [open, dialogRef]);

  return <dialog ref={dialogRef} id="tony-mobile-menu" className="tony-mobile" aria-label="Menú de Tony Sportswear"
    onClose={onClosed} onClick={event => {if (event.target === event.currentTarget) onDismiss();}}>
    <div className="tony-mobile-inner">
      <div className="tony-mobile-top">
        <h2>Menú</h2>
        <button ref={close} type="button" className="tony-menu-close" aria-label="Cerrar menú" onClick={onDismiss}><span>Cerrar</span><Icon name="close" size={22}/></button>
      </div>
      <div ref={body} className="tony-mobile-body">
        <button type="button" className="tony-search-pill tony-menu-search" aria-haspopup="dialog" onClick={onSearch}
          onPointerEnter={warmSearchIndex} onFocus={warmSearchIndex} onTouchStart={warmSearchIndex}><Icon name="search" size={20}/><span>{SEARCH_LABEL}</span></button>
        <nav aria-label="Navegación principal">
          {open && <ul className="tony-menu-list">{MAIN_MENU.map(item => <MenuItem key={item.href} item={item} path={path} onDismiss={onDismiss}/>)}</ul>}
        </nav>
        <nav aria-label="Pedidos y ayuda" className="tony-menu-services">
          <h3>Pedidos y ayuda</h3>
          {open && <ul>{MENU_SERVICE_LINKS.map(item => <MenuItem key={item.href} item={item} path={path} onDismiss={onDismiss}/>)}</ul>}
        </nav>
      </div>
    </div>
  </dialog>;
}
