import Link from 'next/link';
import Icon from '@/components/Icon';
import BlackFridayCover from '@/components/BlackFridayCover';
import { CampaignDialog, CampaignCarousel } from '@/components/home/HomeAdvertising';
import HomeDisciplines from '@/components/home/HomeDisciplines';
import BusinessLines from '@/components/business/BusinessLines';
import { homeCampaigns } from '@/lib/home-campaigns';
import { siteAsset } from '@/lib/asset-path';
import '@/components/home/home.css';
import '@/components/home/storefront.css';

const ways = [
  {id: 'personalizados', title: 'Creá tu pedido', detail: 'Elegí diseño, tela y tallas para tu equipo.', action: 'Personalizar', href: '/configurador'},
  {id: 'tienda', title: 'Comprá en tienda', detail: 'Encontrá jerseys, camisas e implementos.', action: 'Ver productos', href: '/tienda'},
  {id: 'ofertas', title: 'Promociones Tony', detail: 'Descubrí las campañas y sus beneficios.', action: 'Ver promociones', href: '/promociones'},
];

export default function Home() {
  return <main id="contenido" className="home-page home-c tc-page">
    <CampaignDialog ads={homeCampaigns}/>
    <div className="tc-wrap">
      <section className="order-hero" aria-labelledby="order-title">
        <picture className="order-hero-art">
          <source media="(max-width: 700px)" srcSet={siteAsset('/assets/inicio/crear-pedido/portada-800.webp')}/>
          <img src={siteAsset('/assets/inicio/crear-pedido/portada.webp')} width="1600" height="800" alt="" fetchPriority="high"/>
        </picture>
        <div className="order-hero-copy">
          <h1 className="tc-display" id="order-title">Crear mi <em>pedido</em></h1>
          <p>Personalizá tus uniformes o camisas, creá tu pedido y pagá en línea. ¡Así de fácil!</p>
          <Link className="tc-btn tc-btn--lime" id="crear-mi-pedido" aria-label="Empezar mi pedido" href="/configurador">Empezar mi pedido <Icon name="arrow"/></Link>
        </div>
      </section>

      <CampaignCarousel label="Promociones destacadas" compact>
        {homeCampaigns.filter(ad => ad.strip).map(ad =>
          <Link key={ad.id} href={ad.href} className={'strip-poster strip-' + ad.id}>
            <picture>
              <source media="(min-width:701px)" srcSet={siteAsset(`/assets/inicio/franjas/${ad.id}-panoramica.webp`)}/>
              <img src={ad.strip} alt={ad.title} width="1536" height="342" decoding="async"/>
            </picture>
          </Link>)}
      </CampaignCarousel>

      <HomeDisciplines/>
      <BusinessLines/>

      <section className="home-order-ways" aria-labelledby="ways-title">
        <h2 className="tc-display" id="ways-title">Tres formas de <em>hacer tu pedido</em></h2>
        <div className="ways-grid">{ways.map(way => <Link href={way.href} key={way.id} className={'way-card way-' + way.id}>
          <img src={siteAsset(`/assets/inicio/formas-de-pedido/${way.id}.webp`)} width="512" height="1024" alt="" loading="lazy" decoding="async"/>
          <div className="way-copy"><h3>{way.title}</h3><p>{way.detail}</p>
            <span className="way-action">{way.action} <Icon name="arrow" size={19}/></span>
          </div>
        </Link>)}</div>
      </section>

      <section className="home-app" id="app-tony" aria-labelledby="app-title">
        <img className="app-scene" src={siteAsset('/assets/inicio/app-tony/premios.webp')} alt="" width="1400" height="560" loading="lazy" decoding="async"/>
        <div className="app-copy">
          <p className="home-caption">App Tony</p>
          <h2 className="tc-display" id="app-title">Comprá. Acumulá. <em>Ganá.</em></h2>
          <p>Sumá puntos con tus compras y canjealos por premios.</p>
          <Link className="tc-btn tc-btn--lime" href="/app-tony">Descargá la app <Icon name="download" size={17}/></Link>
        </div>
      </section>

      <div className="home-feature">
        <CampaignCarousel label="Cartelera de promociones">
          {[
            <BlackFridayCover key="black-friday"/>,
            <Link key="precios-patrios" className="archive-poster" href="/promociones#precios-patrios">
              <picture><source media="(max-width:639px)" srcSet={siteAsset('/assets/promociones/precios-patrios/cartel-movil.webp')}/>
                <img src={siteAsset('/assets/promociones/precios-patrios/cartel.webp')} width="1760" height="587" alt="Precios Patrios" loading="lazy" decoding="async"/>
              </picture>
              <span className="archive-date">Septiembre 2026 · Campaña finalizada</span>
            </Link>,
          ]}
        </CampaignCarousel>
      </div>
    </div>
  </main>;
}
