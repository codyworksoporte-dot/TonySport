import type {Metadata} from 'next';
import Link from 'next/link';
import Icon from '@/components/Icon';
import {rise} from '@/components/pages/rise';
import {siteAsset} from '@/lib/asset-path';
import {CURRENT_PROMOTIONS, PROMOTIONS, PROMO_QUESTION, type Promotion} from '@/lib/promotions';
import {whatsappLink} from '@/lib/site-links';
import '@/components/pages/pages.css';
import './promociones.css';

export const metadata: Metadata = {
  title: 'Promociones',
  description: 'Promociones de Tony Sportswear: pregunta por la vigente en tu tienda o por WhatsApp y mira nuestras campañas recientes.',
};

const ASK = whatsappLink(PROMO_QUESTION);
const NEW_TAB = ' (se abre en otra pestaña)';

/** A campaign card: its album in the gallery when there is one, otherwise the campaign on the official site. */
function PromoCard({promo, index, now = false}: {promo: Promotion; index: number; now?: boolean}) {
  const body = <>
    <span className="tp-promo-media">
      <img src={siteAsset(promo.image)} alt="" width={440} height={440} loading={index < 3 ? 'eager' : 'lazy'} decoding="async"/>
      {now && <span className="tc-flag">Vigente</span>}
    </span>
    <span className="tp-promo-name">
      <span><b>{promo.title}</b><small>{now && promo.until ? `Hasta ${promo.until}` : promo.when}</small></span>
      <span className="tc-go"><Icon name={promo.album ? 'arrow' : 'diagonal'}/></span>
    </span>
  </>;
  const className = `tp-promo-card tc-rise${now ? ' tp-promo-card--now' : ''}`;
  return promo.album
    ? <Link className={className} style={rise(index + 2)} href={`/colecciones?categoria=${promo.album}`}>{body}</Link>
    : <a className={className} style={rise(index + 2)} href={promo.official} target="_blank" rel="noopener noreferrer">{body}<span className="tc-sr">{NEW_TAB}</span></a>;
}

export default function PromocionesPage() {
  const recent = PROMOTIONS.filter(promo => !promo.current);
  return <main id="contenido" className="tp tc-page tp-promos">
    <div className="tc-wrap">
      <section className="tp-promo-hero tc-rise" aria-labelledby="tp-promo-title">
        <span className="tp-promo-word" aria-hidden="true">Tony</span>
        <div>
          <p className="tp-kicker tp-promo-kicker"><Icon name="tag"/>Tony Sportswear</p>
          <h1 id="tp-promo-title" className="tc-display">Promociones</h1>
          <p className="tp-promo-lead">Pregunta por la promoción vigente en tu tienda o por WhatsApp.</p>
          <div className="tp-promo-actions">
            <a className="tc-btn tc-btn--wa tc-btn--lg" href={ASK} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp-solid"/>Preguntar por WhatsApp<span className="tc-sr">{NEW_TAB}</span>
            </a>
            <Link className="tc-btn tc-btn--dark tc-btn--lg" href="/tiendas"><Icon name="pin"/>Ver tiendas</Link>
          </div>
        </div>
        <div className="tp-promo-stack" aria-hidden="true">
          {PROMOTIONS.slice(0, 3).map(promo => <img key={promo.id} src={siteAsset(promo.image)} alt="" width={440} height={440} loading="eager" decoding="async"/>)}
        </div>
      </section>

      {CURRENT_PROMOTIONS.length > 0 && <section className="tc-sec" aria-labelledby="tp-promo-now">
        <div className="tc-sec-h"><h2 id="tp-promo-now">Vigentes</h2></div>
        <ul className="tp-promo-grid">
          {CURRENT_PROMOTIONS.map((promo, index) => <li key={promo.id}><PromoCard promo={promo} index={index} now/></li>)}
        </ul>
      </section>}

      <section className="tc-sec" aria-labelledby="tp-promo-recent">
        <div className="tc-sec-h"><div><h2 id="tp-promo-recent">Campañas recientes</h2><p className="tp-sec-note">Así fueron nuestras últimas promociones.</p></div></div>
        <ul className="tp-promo-grid">
          {recent.map((promo, index) => <li key={promo.id}><PromoCard promo={promo} index={index}/></li>)}
          <li>
            <a className="tp-promo-ask tc-rise" style={rise(recent.length + 2)} href={ASK} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp-solid" className="tp-wa-mark"/>
              <b>¿Y este mes?</b><small>Pregunta por la promoción vigente</small>
              <span className="tc-go tp-go-white"><Icon name="arrow"/></span>
              <span className="tc-sr">Escribir por WhatsApp{NEW_TAB}</span>
            </a>
          </li>
        </ul>
      </section>

      <section className="tc-sec" aria-label="También te puede servir">
        <div className="tp-tiles">
          <Link className="tc-tile tc-rise" href="/tiendas">
            <img className="tp-img-top" src={siteAsset('/assets/sections/tiendas-tony.webp')} alt="" width={960} height={1200} loading="lazy" decoding="async"/>
            <span className="tc-tile-label"><span><b>Tiendas</b><small>Pregunta en la más cercana</small></span><span className="tc-go"><Icon name="pin"/></span></span>
          </Link>
          <Link className="tc-tile tc-rise" href="/app-tony">
            <img className="tp-img-top" src={siteAsset('/assets/sections/app-tony-tony.webp')} alt="" width={960} height={1200} loading="lazy" decoding="async"/>
            <span className="tc-tile-label"><span><b>App Tony</b><small>Suma puntos y canjea premios</small></span><span className="tc-go"><Icon name="download"/></span></span>
          </Link>
        </div>
      </section>
    </div>
  </main>;
}
