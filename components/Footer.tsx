import Link from 'next/link';
import Brand from './Brand';
import Icon from './Icon';
import NavAnchor from './header/NavAnchor';
import {FOOTER_COLUMNS} from '@/lib/nav';
import {TONY_EMAIL, TONY_WHATSAPP, TONY_WHATSAPP_DISPLAY} from '@/lib/site-links';
import {TONY_CHANNELS} from '@/lib/social-news';
import './site-footer.css';

type Channel = keyof typeof TONY_CHANNELS;
const SOCIAL_ORDER: Channel[] = ['facebook', 'instagram', 'tiktok'];
// Brand glyphs for the three official accounts (filled, 24px grid).
const SOCIAL_GLYPHS: Record<Channel, string> = {
  facebook: 'M13.5 21.5v-8h2.7l.4-3.2h-3.1V8.3c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3v3.2h2.8v8h3.4Z',
  instagram: 'M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Zm5-8.1a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 4.6c2.4 0 2.7 0 3.6.1 2.4.1 3.6 1.3 3.7 3.7.1.9.1 1.2.1 3.6s0 2.7-.1 3.6c-.1 2.4-1.3 3.6-3.7 3.7-.9.1-1.2.1-3.6.1s-2.7 0-3.6-.1c-2.4-.1-3.6-1.3-3.7-3.7-.1-.9-.1-1.2-.1-3.6s0-2.7.1-3.6c.1-2.4 1.3-3.6 3.7-3.7.9-.1 1.2-.1 3.6-.1ZM12 3c-2.4 0-2.8 0-3.7.1-3.3.2-5 2-5.2 5.2C3 9.2 3 9.6 3 12s0 2.8.1 3.7c.2 3.3 2 5 5.2 5.2.9.1 1.3.1 3.7.1s2.8 0 3.7-.1c3.3-.2 5-2 5.2-5.2.1-.9.1-1.3.1-3.7s0-2.8-.1-3.7c-.2-3.3-2-5-5.2-5.2C14.8 3 14.4 3 12 3Z',
  tiktok: 'M16.6 3c.3 2.4 1.7 3.9 4.1 4v2.8a7 7 0 0 1-4-1.3v5.9a5.6 5.6 0 1 1-5.6-5.6l.6.1v3a2.6 2.6 0 1 0 1.9 2.5V3h3Z',
};

/** Compact footer: contact first, three short link columns and the legal line. */
export default function Footer() {
  return <footer className="site-footer tony-footer">
    <div className="tc-wrap tony-footer-main">
      <div className="tony-footer-contact" id="contactos" tabIndex={-1}>
        <Brand/>
        <a className="tony-footer-phone" href={TONY_WHATSAPP} target="_blank" rel="noopener noreferrer">
          <span className="tony-footer-phone-icon"><Icon name="whatsapp-solid" size={30}/></span>
          <span className="tony-footer-phone-text"><small>Escríbenos por WhatsApp</small><b>{TONY_WHATSAPP_DISPLAY}</b></span>
          <span className="tc-sr"> (se abre en otra pestaña)</span>
        </a>
        <a className="tony-footer-email" href={`mailto:${TONY_EMAIL}`}><Icon name="send"/><span>{TONY_EMAIL}</span></a>
        <ul className="tony-footer-social" aria-label="Redes de Tony">
          {SOCIAL_ORDER.map(key => {
            const channel = TONY_CHANNELS[key];
            return <li key={key}><a href={channel.url} target="_blank" rel="noopener noreferrer" aria-label={`${channel.name}: ${channel.handle}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={SOCIAL_GLYPHS[key]}/></svg>
            </a></li>;
          })}
        </ul>
      </div>
      {FOOTER_COLUMNS.map(column => <nav className="tony-footer-column" aria-label={column.title} key={column.title}>
        <h3>{column.title}</h3>
        <ul>{column.links.map(link => <li key={link.href}>
          <NavAnchor href={link.href} external={link.external}>{link.label}{link.external && <Icon name="diagonal" className="tony-footer-ext"/>}</NavAnchor>
        </li>)}</ul>
      </nav>)}
    </div>
    <div className="tc-wrap tony-footer-bottom">
      <span className="tony-footer-copy">© {new Date().getFullYear()} Tony Sportswear</span>
      <nav className="tony-footer-legal" aria-label="Información y condiciones">
        <Link href="/privacidad">Privacidad</Link><Link href="/terminos">Términos</Link><Link href="/cookies">Cookies</Link>
      </nav>
      <span className="tony-footer-origin">
        <svg className="tony-salvador-flag" viewBox="0 0 60 36" role="img" aria-label="Bandera de El Salvador"><path fill="#0757ad" d="M0 0h60v36H0z"/><path fill="#fff" d="M0 12h60v12H0z"/><g transform="translate(30 18)"><path d="M-4.7 3.5A6 6 0 0 1-5-3M4.7 3.5A6 6 0 0 0 5-3" fill="none" stroke="#43843c" strokeWidth="1"/><path d="m0-4.4 4.4 7.1h-8.8Z" fill="#e7cf70" stroke="#b69137" strokeWidth=".4"/><path d="M-3 2.2-1.9-.3l1 1.3L.1-1 1.2.8 2-.3l1 2.5" fill="#467d41"/><path d="M-3 2.1h6v.5h-6" fill="#367ec4"/><path d="M-.9-2.5h1.8" stroke="#cf4340" strokeWidth=".55"/><circle cy="-3.3" r=".55" fill="#e5b541"/><path d="M-3.7 4.4q3.7 1.5 7.4 0" fill="none" stroke="#b69137" strokeWidth=".55"/></g></svg>
        Desde El Salvador
      </span>
      <a className="tony-footer-top" href="#contenido">Volver arriba <span aria-hidden="true"><Icon name="arrow" size={18}/></span></a>
    </div>
  </footer>;
}
