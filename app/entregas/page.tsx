import type {Metadata} from 'next';
import Icon from '@/components/Icon';
import LeadImage from '@/components/media/LeadImage';
import {LOOKUP_PHOTO_SIZES} from '@/components/pages/photo-sizes';
import {responsive} from '@/lib/responsive-image';
import {ORDER_LOOKUP_URL, whatsappLink} from '@/lib/site-links';
import '@/components/pages/pages.css';

export const metadata: Metadata = {
  title: 'Servicio a domicilio',
  description: 'Coordiná la entrega de tus uniformes en El Salvador con el equipo de Tony.',
};

export default function EntregasPage() {
  return <main id="contenido" className="tp tc-page tp-lookup">
    <div className="tc-wrap">
      <section className="tp-lookup-card" aria-labelledby="delivery-title">
        <div className="tp-lookup-media">
          <LeadImage {...responsive('/assets/secciones/entregas/portada.webp', LOOKUP_PHOTO_SIZES)} width={600} height={600}/>
        </div>
        <div className="tp-lookup-copy">
          <p className="tp-kicker"><Icon name="pin"/>Todo El Salvador</p>
          <h1 id="delivery-title" className="tc-display">Servicio <em className="tc-title-accent">a domicilio</em></h1>
          <p className="tp-lookup-lead">Mandanos el diseño que te interesa y tu municipio. Un asesor te ayudará a coordinar el pedido y su entrega.</p>
          <a className="tc-btn tc-btn--lime tp-btn-xl" href={whatsappLink('Hola, Tony. Quisiera coordinar un pedido a domicilio. Mi municipio es:')} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp-solid"/>Coordinar entrega<span className="tc-sr"> por WhatsApp (se abre en otra pestaña)</span>
          </a>
          <p className="tp-lookup-note">¿Ya tenés un número de orden?</p>
          <a className="tp-lookup-wa" href={ORDER_LOOKUP_URL} target="_blank" rel="noopener noreferrer">Consultar mi pedido<Icon name="diagonal"/><span className="tc-sr"> (se abre en otra pestaña)</span></a>
        </div>
      </section>
    </div>
  </main>;
}
