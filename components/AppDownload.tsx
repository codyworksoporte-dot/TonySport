'use client';
import Link from 'next/link';
import {useId, useRef, type ReactNode} from 'react';
import Icon from './Icon';
import {APP_TONY} from '@/lib/site-links';
import './app-download.css';

const PERKS: {icon: 'gift'|'star'|'plus'; title: string; text: string}[] = [
  {icon: 'star', title: 'Puntos en cada compra', text: 'Recibes puntos de bienvenida al descargarla y sumas más con cada compra.'},
  {icon: 'gift', title: 'Canjéalos por premios', text: 'Cambia tus puntos por premios para ti y tu equipo.'},
  {icon: 'plus', title: 'Crea tu pedido', text: 'Arma el pedido de tu equipo en la opción Crea tu pedido.'},
];

/** The store buttons and the short story of the app. Used inside the dialog and on its own page. */
export function AppDownloadPanel({headingId, compact = false}: {headingId?: string; compact?: boolean}) {
  return <div className={`app-dl${compact ? ' app-dl--compact' : ''}`}>
    <p className="app-dl-kicker">App Tony</p>
    <h2 id={headingId} className="app-dl-title">Descarga la App Tony</h2>
    <div className="app-dl-stores">
      <a className="app-dl-store" href={APP_TONY.android} target="_blank" rel="noopener noreferrer" aria-label="Descargar la App Tony en Google Play para Android">
        <Icon name="play" size={26}/><span><small>Disponible en</small><b>Google Play</b><em>Android</em></span>
      </a>
      <a className="app-dl-store" href={APP_TONY.ios} target="_blank" rel="noopener noreferrer" aria-label="Descargar la App Tony en App Store para iPhone">
        <Icon name="apple" size={26}/><span><small>Descárgala en</small><b>App Store</b><em>iPhone</em></span>
      </a>
    </div>
    <ul className="app-dl-perks">
      {PERKS.map(perk => <li key={perk.title}><span className="app-dl-perk-icon"><Icon name={perk.icon}/></span><div><b>{perk.title}</b><p>{perk.text}</p></div></li>)}
    </ul>
    <Link className="app-dl-prizes" href="/colecciones?categoria=premios-app">Ver los premios de la app <Icon name="arrow"/></Link>
  </div>;
}

/** A trigger (any content) that opens the download options in a dialog. */
export default function AppDownload({children, className, label = 'Descarga la App Tony'}: {children: ReactNode; className?: string; label?: string}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  return <>
    <button ref={trigger} type="button" className={className} aria-haspopup="dialog" aria-label={label} onClick={() => dialog.current?.showModal()}>{children}</button>
    <dialog ref={dialog} className="app-dl-dialog" aria-labelledby={headingId} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onClose={() => trigger.current?.focus({preventScroll: true})}>
      <button type="button" className="app-dl-close" aria-label="Cerrar descarga de la app" onClick={() => dialog.current?.close()}><Icon name="close"/></button>
      <AppDownloadPanel headingId={headingId}/>
    </dialog>
  </>;
}
