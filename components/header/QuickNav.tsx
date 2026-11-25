'use client';
import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import AppDownload from '../AppDownload';
import Icon from '../Icon';
import NavAnchor from './NavAnchor';
import {disciplineThumb} from './thumbs';
import {siteAsset} from '@/lib/asset-path';
import {DISCIPLINES, DISCIPLINES_TITLE, disciplineHref} from '@/lib/disciplines';
import {NAV, type NavLink} from '@/lib/nav';

const LINKS: (NavLink & {className?: string})[] = [
  {...NAV.promociones, className: 'tony-qnav-promo'}, NAV.implementos, NAV.tiendas, NAV.consulta,
];

/** Desktop-only row under the header: the disciplines panel and the main destinations, each with its icon. */
export default function QuickNav({path}: {path: string}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    window.addEventListener('tony:intro-replay', close);
    return () => window.removeEventListener('tony:intro-replay', close);
  }, []);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  const current = (href: string) => path === href ? 'page' as const : undefined;
  return <nav ref={root} className="tony-qnav" aria-label="Accesos rápidos"
    onKeyDown={event => { if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false); trigger.current?.focus(); } }}
    onBlur={event => { if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <ul className="tony-qnav-list">
      <li>
        <button ref={trigger} type="button" className={`tony-qnav-link tony-qnav-disc${path === '/producto' ? ' is-current' : ''}`} aria-expanded={open} aria-controls="tony-disciplinas" onClick={() => setOpen(value => !value)}>
          <Icon name="grid"/>Escoge tu disciplina<Icon name="down" className="tony-qnav-chevron"/>
        </button>
      </li>
      {LINKS.map(link => <li key={link.href}>
        <NavAnchor className={`tony-qnav-link ${link.className ?? ''}`} href={link.href} external={link.external} aria-current={link.external ? undefined : current(link.href)}>
          <Icon name={link.icon}/>{link.label}{link.external && <Icon name="diagonal" className="tony-qnav-ext"/>}
        </NavAnchor>
      </li>)}
      <li onClick={close}><AppDownload className="tony-qnav-link" label="Descarga la App Tony"><Icon name="phone"/>App Tony</AppDownload></li>
      <li><NavAnchor className="tony-qnav-link" href={NAV.ayuda.href} external aria-label="Ayuda por WhatsApp"><Icon name="whatsapp"/>Ayuda<Icon name="diagonal" className="tony-qnav-ext"/></NavAnchor></li>
      <li><Link className="tony-qnav-link" href={NAV.news.href} aria-current={current(NAV.news.href)}><Icon name="news"/>{NAV.news.label}</Link></li>
    </ul>
    <div id="tony-disciplinas" className="tony-disc-panel" hidden={!open}>
      <div className="tony-disc-inner">
        <h2 className="tony-disc-title">{DISCIPLINES_TITLE}</h2>
        <ul className="tony-disc-grid">
          {DISCIPLINES.map(discipline => <li key={discipline.id}>
            <Link className="tony-disc-card" href={disciplineHref(discipline.id)} onClick={close}>
              <img src={siteAsset(disciplineThumb(discipline, 'card'))} alt="" width={400} height={480} loading="lazy" decoding="async"/>
              <span>{discipline.name}</span>
            </Link>
          </li>)}
          <li><Link className="tony-disc-card tony-disc-all" href="/producto" onClick={close}><Icon name="grid" size={30}/><span>Ver todas</span></Link></li>
        </ul>
      </div>
    </div>
  </nav>;
}
