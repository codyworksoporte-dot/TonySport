import Link from 'next/link';
import Icon, { type IconName } from '@/components/Icon';
import BlackFridayCover from '@/components/BlackFridayCover';
import { AdStrip, CampaignCarousel } from '@/components/home/HomeAdvertising';
import HomeDisciplines from '@/components/home/HomeDisciplines';
import InstallWebsite from '@/components/home/InstallWebsite';
import LeadImage from '@/components/media/LeadImage';
import { homeCampaigns, type Campaign } from '@/lib/home-campaigns';
import { APP_TONY } from '@/lib/site-links';
import { PROMOTIONS } from '@/lib/promotions';
import { siteAsset } from '@/lib/asset-path';
import { storefrontImage } from '@/lib/storefront-image';
import { responsive } from '@/lib/responsive-image';
import '@/components/home/home.css';
import '@/components/home/storefront.css';

const ways: {title: string; detail: string; action: string; href: string; label: string; icon: IconName}[] = [
  {title: 'Creá tu pedido', detail: 'Elegí el diseño, la tela y las tallas de tu equipo.', action: 'Personalizar', href: '/configurador', label: 'Personalizados', icon: 'shield'},
  {title: 'Comprá en tienda', detail: 'Explorá jerseys, camisas e implementos deportivos.', action: 'Ver productos', href: '/tienda', label: 'Catálogo', icon: 'bag'},
  {title: 'Promociones Tony', detail: 'Consultá las ofertas y su disponibilidad.', action: 'Consultar ofertas', href: '/promociones', label: 'Ofertas', icon: 'tag'},
];

function CampaignSlide({ad, feature = false, archive = false}: {ad: Campaign; feature?: boolean; archive?: boolean}) {
  return <article className={feature ? 'feature-slide' : 'strip-slide'}>
    {ad.image && <img className="campaign-art" alt="" src={ad.image} loading="lazy" decoding="async"/>}
    <div className="campaign-copy">
      <span className="home-caption">{archive ? 'Archivo de promociones' : 'Promociones Tony'}</span>
      <h2>{ad.title}</h2>
      <p>{ad.detail}</p>
    </div>
    <Link className="campaign-cta" href={ad.href}>{ad.action} <Icon name="arrow" size={17}/></Link>
  </article>;
}

export default function Home() {
  const ads = homeCampaigns();
  const promos = ads.filter(ad => ['black-friday', 'portero', 'premios'].includes(ad.id));
  const appImage = storefrontImage('app-tony');
  const past = PROMOTIONS.find(promo => promo.id === 'precios-patrios')!;
  const archive: Campaign = {
    id: past.id, title: past.title, detail: 'Campaña de ' + past.when.toLocaleLowerCase('es') + ' · Finalizada.',
    action: 'Ver campaña', href: past.official, image: siteAsset(past.image),
  };

  return <main id="contenido" className="home-page home-c tc-page">
    <div className="tc-wrap">
      <div className="home-utility">
        <AdStrip ads={ads}/>
        <InstallWebsite/>
        <div id="home-assistant-slot"/>
      </div>

      <section className="order-hero" aria-labelledby="order-title">
        <div className="order-hero-art">
          <LeadImage {...responsive('/assets/portadas/crear-pedido.webp', '(max-width:599px) 100vw, (max-width:1384px) 55vw, 730px')} width={800} height={800}/>
        </div>
        <div className="order-hero-copy">
          <h1 className="tc-display" id="order-title">Crear mi <em>pedido</em></h1>
          <p>Uniformes o camisas, con tu diseño.</p>
          <Link className="tc-btn tc-btn--dark" id="crear-mi-pedido" aria-label="Empezar mi pedido" href="/configurador"><span>Empezar<span className="order-cta-rest"> mi pedido</span></span><Icon name="arrow"/></Link>
        </div>
      </section>

      <CampaignCarousel label="Promociones destacadas" compact>
        {promos.map(ad => <CampaignSlide key={ad.id} ad={ad}/>)}
      </CampaignCarousel>

      <HomeDisciplines/>

      <section className="home-order-ways" aria-labelledby="ways-title">
        <p className="home-caption">Comprá a tu manera</p>
        <h2 className="tc-display" id="ways-title">Tres formas de hacer tu pedido</h2>
        <div className="ways-grid">{ways.map(way => {
          const image = storefrontImage('forma-' + way.href.slice(1));
          return <article key={way.href}>
          {image && <img className="way-picture" src={image} alt="" loading="lazy" decoding="async"/>}
          <div className="way-category"><Icon name={way.icon} size={19}/><span>{way.label}</span></div>
          <h3>{way.title}</h3><p>{way.detail}</p>
          <Link className="way-action" href={way.href}>{way.action}<Icon name="arrow" size={18}/></Link>
        </article>;
        })}</div>
      </section>

      <section className="home-app" id="app-tony" aria-labelledby="app-title">
        <div className="app-copy">
          <p className="home-caption"><Icon name="phone" size={16}/> App Tony</p>
          <h2 className="tc-display" id="app-title">Comprá. Acumulá. Ganá.</h2>
          <p>Sumá puntos con tus compras y canjealos por premios desde tu celular.</p>
          <div className="app-actions">
            <a className="tc-btn tc-btn--sm tc-btn--lime" href={APP_TONY.android}><Icon name="play" size={17}/>Android</a>
            <a className="tc-btn tc-btn--sm tc-btn--ghost" href={APP_TONY.ios}><Icon name="apple" size={17}/>iOS</a>
            <Link className="app-prizes" href="/colecciones?categoria=premios-app">Ver premios <Icon name="arrow" size={17}/></Link>
          </div>
        </div>
        {appImage ? <img className="app-picture" alt="" src={appImage} loading="lazy" decoding="async"/> :
          <span className="app-poster-type tc-display" aria-hidden="true">Más<br/>premios.</span>}
      </section>

      <div className="home-feature">
        <CampaignCarousel label="Cartelera de promociones">
          {[
            <BlackFridayCover key="black-friday"/>,
            ...promos.filter(ad => ad.id !== 'black-friday' && ad.image).map(ad => <CampaignSlide key={ad.id} ad={ad} feature/>),
            <CampaignSlide key={past.id} ad={archive} feature archive/>,
          ]}
        </CampaignCarousel>
      </div>
    </div>
  </main>;
}
