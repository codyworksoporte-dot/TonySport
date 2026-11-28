import SocialGlyph from './SocialGlyph';
import Brand from './Brand';
import Icon from './Icon';
import IntentLink from './IntentLink';
import NavAnchor from './header/NavAnchor';
import {FOOTER_COLUMNS} from '@/lib/nav';
import {TONY_EMAIL, TONY_WHATSAPP, TONY_WHATSAPP_DISPLAY} from '@/lib/site-links';
import {TONY_CHANNELS} from '@/lib/social-news';
import './site-footer.css';

type Channel = keyof typeof TONY_CHANNELS;
const SOCIAL_ORDER: Channel[] = ['facebook', 'instagram', 'tiktok'];


/**
 * Compact footer: contact first, three short link columns and the legal line.
 * Its links prefetch on intent only (IntentLink): scrolling to the footer must not download every section behind it.
 */
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
              <SocialGlyph channel={key} size={22}/>
            </a></li>;
          })}
        </ul>
      </div>
      {FOOTER_COLUMNS.map(column => <nav className="tony-footer-column" aria-label={column.title} key={column.title}>
        <h3>{column.title}</h3>
        <ul>{column.links.map(link => <li key={link.href}>
          <NavAnchor href={link.href} external={link.external} intent>{link.label}{link.external && <Icon name="diagonal" className="tony-footer-ext"/>}</NavAnchor>
        </li>)}</ul>
      </nav>)}
    </div>
    <div className="tc-wrap tony-footer-bottom">
      <span className="tony-footer-copy">© {new Date().getFullYear()} Tony Sportswear</span>
      <nav className="tony-footer-legal" aria-label="Información y condiciones">
        <IntentLink href="/privacidad">Privacidad</IntentLink><IntentLink href="/terminos">Términos</IntentLink><IntentLink href="/cookies">Cookies</IntentLink>
      </nav>
      <span className="tony-footer-origin">
        <svg className="tony-salvador-flag" viewBox="0 0 60 36" role="img" aria-label="Bandera de El Salvador"><path fill="#0757ad" d="M0 0h60v36H0z"/><path fill="#fff" d="M0 12h60v12H0z"/><g transform="translate(30 18)"><path d="M-4.7 3.5A6 6 0 0 1-5-3M4.7 3.5A6 6 0 0 0 5-3" fill="none" stroke="#43843c" strokeWidth="1"/><path d="m0-4.4 4.4 7.1h-8.8Z" fill="#e7cf70" stroke="#b69137" strokeWidth=".4"/><path d="M-3 2.2-1.9-.3l1 1.3L.1-1 1.2.8 2-.3l1 2.5" fill="#467d41"/><path d="M-3 2.1h6v.5h-6" fill="#367ec4"/><path d="M-.9-2.5h1.8" stroke="#cf4340" strokeWidth=".55"/><circle cy="-3.3" r=".55" fill="#e5b541"/><path d="M-3.7 4.4q3.7 1.5 7.4 0" fill="none" stroke="#b69137" strokeWidth=".55"/></g></svg>
        Desde El Salvador
      </span>
      <a className="tony-footer-top" href="#contenido">Volver arriba <span aria-hidden="true"><Icon name="arrow" size={18}/></span></a>
    </div>
  </footer>;
}
