import Link from 'next/link';
import Icon from '@/components/Icon';
import LeadImage from '@/components/media/LeadImage';
import {responsive} from '@/lib/responsive-image';
import {ORDER_LOOKUP_URL, whatsappLink} from '@/lib/site-links';
import {LOOKUP_PHOTO_SIZES, TILE_SIZES} from './photo-sizes';
import {rise} from './rise';
import './pages.css';

const NO_NUMBER = whatsappLink('Hola, Tony. Quiero consultar mi pedido, pero no tengo mi número de orden.');

/** "Consulta tu pedido": one big button to the official order lookup. Rendered by /consulta and /entregas. */
export default function OrderLookup() {
  return <main id="contenido" className="tp tc-page tp-lookup">
    <div className="tc-wrap">
      <section className="tp-lookup-card tc-rise" aria-labelledby="tp-lookup-title">
        <div className="tp-lookup-media">
          <LeadImage {...responsive('/assets/sections/entregas-tony.webp', LOOKUP_PHOTO_SIZES)} width={960} height={1200}/>
        </div>
        <div className="tp-lookup-copy">
          <p className="tp-kicker"><Icon name="package"/>Tu pedido</p>
          <h1 id="tp-lookup-title" className="tc-display">Consulta tu pedido</h1>
          <p className="tp-lookup-lead">Ten a mano tu número de orden.</p>
          <a className="tc-btn tc-btn--lime tp-btn-xl" href={ORDER_LOOKUP_URL} target="_blank" rel="noopener noreferrer">
            <Icon name="search"/>Consultar mi pedido<Icon name="diagonal"/><span className="tc-sr"> (se abre en otra pestaña)</span>
          </a>
          <p className="tp-lookup-note">Se abre la consulta oficial de Tony.</p>
          <a className="tp-lookup-wa" href={NO_NUMBER} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp-solid"/>¿No tienes tu número? Escríbenos<span className="tc-sr"> por WhatsApp (se abre en otra pestaña)</span>
          </a>
        </div>
      </section>

      <ol className="tp-steps" aria-label="Cómo consultar">
        <li className="tc-rise" style={rise(1)}>Toca «Consultar mi pedido»</li>
        <li className="tc-rise" style={rise(2)}>Escribe tu número de orden</li>
        <li className="tc-rise" style={rise(3)}>Mira el estado de tu pedido</li>
      </ol>

      <section className="tp-lookup-more" aria-label="Más ayuda con tu pedido">
        <div className="tp-tiles">
          <Link className="tc-tile tc-rise" style={rise(4)} href="/tiendas">
            <img className="tp-img-top" {...responsive('/assets/sections/tiendas-tony.webp', TILE_SIZES)} alt="" width={960} height={1200} loading="lazy" decoding="async"/>
            <span className="tc-tile-label"><span><b>Tiendas</b><small>Retiro o envío a domicilio</small></span><span className="tc-go"><Icon name="pin"/></span></span>
          </Link>
          <Link className="tc-tile tc-rise" style={rise(5)} href="/ayuda">
            <img className="tp-img-top" {...responsive('/assets/sections/recientes-tony.webp', TILE_SIZES)} alt="" width={960} height={1200} loading="lazy" decoding="async"/>
            <span className="tc-tile-label"><span><b>Preguntas frecuentes</b><small>Respuestas rápidas</small></span><span className="tc-go"><Icon name="arrow"/></span></span>
          </Link>
        </div>
      </section>
    </div>
  </main>;
}
