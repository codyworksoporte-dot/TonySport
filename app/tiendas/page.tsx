import type {Metadata} from 'next';
import Icon from '@/components/Icon';
import Link from 'next/link';
import stores from '@/data/tony-stores.json';
import {StoreDirectory} from '@/components/EditorialTools';
import {EditorialShell, SourceNote, whatsappLink} from '@/components/TonyEditorial';
import LeadImage from '@/components/media/LeadImage';
import {STORES_PHOTO_SIZES, TILE_SIZES} from '@/components/pages/photo-sizes';
import {rise} from '@/components/pages/rise';
import {responsive} from '@/lib/responsive-image';
import {TONY_WHATSAPP_NUMBER} from '@/lib/site-links';
import '@/components/pages/pages.css';

export const metadata: Metadata = {title: 'Tiendas y ubicaciones', description: 'Encuentra las tiendas de Tony Sportswear en El Salvador: dirección, teléfono, ubicación y consulta por WhatsApp.'};

export default function StoresPage() {
  return <EditorialShell className="te-stores-page tp tp-stores">
    <header className="tc-wrap tp-stores-head">
      <div className="tp-stores-title tc-rise" style={rise(1)}>
        <p className="tp-kicker"><Icon name="pin"/>Ubicaciones</p>
        <h1 className="tp-stores-h1">Tiendas</h1>
        <p className="tp-stores-count"><b>{stores.length}</b>tiendas en El Salvador</p>
      </div>
      <div className="tc-tile tp-stores-photo tc-rise" aria-hidden="true">
        <LeadImage {...responsive('/assets/secciones/tiendas/portada.webp', STORES_PHOTO_SIZES)} width={600} height={600}/>
      </div>
    </header>

    <section className="tc-wrap tp-stores-dir" aria-labelledby="tp-stores-dir">
      <h2 id="tp-stores-dir" className="tc-sr">Directorio de tiendas</h2>
      <StoreDirectory stores={stores}/>
      <p className="te-address-note">Confirma el horario y la disponibilidad antes de ir. Cada tienda tiene su contacto directo.</p>
      <SourceNote href="https://www.tonysportselsalvador.com/nuestras-tiendas/">Direcciones y contactos del directorio publicado por Tony.</SourceNote>
    </section>

    <section className="tc-wrap tp-stores-end" aria-label="Tu pedido y ayuda">
      <div className="tp-tiles">
        <Link className="tc-tile tc-rise" href="/consulta">
          <img className="tp-img-top" {...responsive('/assets/secciones/consulta/portada.webp', TILE_SIZES)} alt="" width={600} height={600} loading="lazy" decoding="async"/>
          <span className="tc-tile-label"><span><b>Consulta tu pedido</b><small>Con tu número de orden</small></span><span className="tc-go"><Icon name="package"/></span></span>
        </Link>
        <a className="tc-tile tp-tile-wa tc-rise" href={whatsappLink('Hola, Tony. Quiero que me orienten sobre una tienda. Mi ciudad es:')} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp-solid" className="tp-wa-mark"/>
          <span className="tc-tile-label"><span><b>Hablar con un asesor</b><small>WhatsApp {TONY_WHATSAPP_NUMBER}</small></span><span className="tc-go tp-go-white"><Icon name="arrow"/></span></span>
          <span className="tc-sr"> (se abre en otra pestaña)</span>
        </a>
      </div>
    </section>
  </EditorialShell>;
}
