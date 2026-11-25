import type {Metadata} from 'next';
import Link from 'next/link';
import Icon from '@/components/Icon';
import {rise} from '@/components/pages/rise';
import stores from '@/data/tony-stores.json';
import {siteAsset} from '@/lib/asset-path';
import {ORDER_LOOKUP_URL, TONY_EMAIL, TONY_WHATSAPP, TONY_WHATSAPP_NUMBER} from '@/lib/site-links';
import '@/components/pages/pages.css';

export const metadata: Metadata = {
  title: 'Contáctanos',
  description: `Escríbele a Tony Sportswear por WhatsApp al ${TONY_WHATSAPP_NUMBER} o por correo. También puedes buscar tu tienda o consultar tu pedido.`,
};

const NEW_TAB = ' (se abre en otra pestaña)';

export default function ContactoPage() {
  return <main id="contenido" className="tp tc-page tp-contact">
    <div className="tc-wrap">
      <header className="tc-head tc-rise">
        <h1 className="tc-display">Contáctanos</h1>
        <p>Escríbenos. Te atendemos por WhatsApp.</p>
      </header>

      <div className="tp-contact-grid">
        <a className="tp-wa-giant tc-rise" style={rise(1)} href={TONY_WHATSAPP} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp-solid" className="tp-wa-mark"/>
          <span className="tp-wa-icon"><Icon name="whatsapp-solid"/></span>
          <span className="tp-wa-text"><small>WhatsApp · El Salvador (+503)</small><b>{TONY_WHATSAPP_NUMBER}</b></span>
          <span className="tc-go tp-go-white"><Icon name="diagonal"/></span>
          <span className="tc-sr">Escribir por WhatsApp{NEW_TAB}</span>
        </a>
        <a className="tp-mail tc-rise" style={rise(2)} href={`mailto:${TONY_EMAIL}`}>
          <span className="tp-mail-top"><span className="tp-mail-icon"><Icon name="send"/></span><span className="tc-go"><Icon name="arrow"/></span></span>
          <span><small>Correo</small><b>{TONY_EMAIL}</b></span>
        </a>
      </div>

      <div className="tp-tiles tp-tiles--3 tp-contact-tiles">
        <Link className="tc-tile tc-rise" style={rise(3)} href="/tiendas">
          <img className="tp-img-top" src={siteAsset('/assets/sections/tiendas-tony.webp')} alt="" width={960} height={1200} loading="lazy" decoding="async"/>
          <span className="tc-tile-label"><span><b>Tiendas</b><small>{stores.length} en El Salvador</small></span><span className="tc-go"><Icon name="pin"/></span></span>
        </Link>
        <a className="tc-tile tc-rise" style={rise(4)} href={ORDER_LOOKUP_URL} target="_blank" rel="noopener noreferrer">
          <img className="tp-img-top" src={siteAsset('/assets/sections/entregas-tony.webp')} alt="" width={960} height={1200} loading="lazy" decoding="async"/>
          <span className="tc-tile-label"><span><b>Consulta tu pedido</b><small>Con tu número de orden</small></span><span className="tc-go"><Icon name="diagonal"/></span></span>
          <span className="tc-sr">{NEW_TAB}</span>
        </a>
        <Link className="tc-tile tc-rise" style={rise(5)} href="/ayuda">
          <img className="tp-img-top" src={siteAsset('/assets/sections/recientes-tony.webp')} alt="" width={960} height={1200} loading="lazy" decoding="async"/>
          <span className="tc-tile-label"><span><b>Preguntas frecuentes</b><small>Respuestas rápidas</small></span><span className="tc-go"><Icon name="help"/></span></span>
        </Link>
      </div>

      <nav className="tp-legal" aria-label="Atención y condiciones">
        <Link href="/ayuda#reclamos">Cambios, garantías y reclamos</Link>
        <Link href="/terminos">Condiciones del pedido</Link>
        <Link href="/privacidad">Privacidad</Link>
      </nav>
    </div>
  </main>;
}
