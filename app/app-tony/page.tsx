import type {Metadata} from 'next';
import Link from 'next/link';
import Icon from '@/components/Icon';
import {AppDownloadPanel} from '@/components/AppDownload';
import LeadImage from '@/components/media/LeadImage';
import {APP_PHOTO_SIZES} from '@/components/pages/photo-sizes';
import {rise} from '@/components/pages/rise';
import {siteAsset} from '@/lib/asset-path';
import {responsive,srcSetOf} from '@/lib/responsive-image';
import '@/components/pages/pages.css';

export const metadata: Metadata = {
  title: 'App Tony',
  description: 'Descarga la App Tony para Android o iPhone: suma puntos, canjéalos por premios y crea tu pedido.',
};

export default function AppTonyPage() {
  return <main id="contenido" className="tp tc-page tp-app">
    <div className="tc-wrap">
      <header className="tc-head tc-rise">
        <p className="tp-kicker"><Icon name="phone"/>Puntos · Premios · Pedidos</p>
        <h1 className="tc-display">App Tony</h1>
      </header>

      <div className="tp-app-grid">
        <div className="tc-tile tp-app-photo tc-rise" style={rise(1)}>
          <picture>
            <source media="(max-width: 760px)" srcSet={srcSetOf('/assets/secciones/app-tony/horizontal.webp')} sizes="100vw"/>
            <LeadImage {...responsive('/assets/secciones/app-tony/portada.webp', APP_PHOTO_SIZES)} width={960} height={1200}/>
          </picture>
          <span className="tc-tile-label"><span><b>Tony en tu teléfono</b><small>Android y iPhone</small></span></span>
        </div>
        <div className="tp-app-panel tc-rise" style={rise(2)}>
          <AppDownloadPanel/>
        </div>
      </div>

      <Link className="tp-prize tc-rise" style={rise(3)} href="/colecciones?categoria=premios-app">
        <span className="tp-prize-media"><img src={siteAsset('/assets/colecciones/33527.webp')} alt="" width={440} height={440} loading="lazy" decoding="async"/></span>
        <span><span className="tp-kicker">Premios de la app</span><b>Mira lo que puedes canjear</b></span>
        <span className="tc-go"><Icon name="arrow"/></span>
      </Link>
    </div>
  </main>;
}
