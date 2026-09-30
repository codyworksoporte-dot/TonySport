import SectionImage from '@/components/SectionImage';
import type {Metadata} from 'next';
import Link from 'next/link';
import Icon from '@/components/Icon';
export const metadata:Metadata={title:'Hablemos de tu equipo',description:'Contacta a Tony Sportswear por WhatsApp o correo para cotizar uniformes, consultar un pedido o solicitar atención.'};

export default function Contacto(){return <main id="contenido" className="internal-page">
  <section className="section-wrap internal-hero">
    <nav className="internal-breadcrumb" aria-label="Ruta de navegación"><Link href="/">Inicio</Link><span aria-hidden="true">/</span><span>Contacto</span></nav>
    <p className="eyebrow orange">EL PRIMER PASO ES UNA CONVERSACIÓN</p>
    <h1>TÚ PONES LA IDEA.<br/><span>NOSOTROS, LA GARRA.</span></h1>
    <p className="lead">Cuéntanos qué necesita tu equipo. Te ayudamos a definir el diseño y los detalles de tu pedido.</p>
  </section>
  <section className="section-wrap contact-grid" aria-label="Medios de contacto">
    <article className="contact-card"><SectionImage photo="app-tony" shade="strong" /><Icon name="whatsapp"/><p className="eyebrow">HABLEMOS DIRECTO</p><h2>WHATSAPP TONY</h2><p>7015-5571 · El Salvador (+503)<br/>Diseños, cantidades y consultas sobre tu pedido.</p><a className="button primary" href="https://wa.me/50370155571" target="_blank" rel="noopener noreferrer">Abrir WhatsApp <Icon name="diagonal"/></a></article>
    <article className="contact-card"><SectionImage photo="recientes" shade="strong" /><Icon name="arrow"/><p className="eyebrow">DALE ESPACIO A TU IDEA</p><h2>ESCRÍBENOS</h2><p>info@tonysportselsalvador.com<br/>Comparte los detalles de tu equipo o empresa.</p><a className="text-link" href="mailto:info@tonysportselsalvador.com">Enviar un correo <Icon name="diagonal"/></a></article>
    <div className="contact-note"><Icon name="pin"/><p><strong>¿Quieres visitarnos?</strong> Busca una <Link className="privacy-inline-link" href="/tiendas">tienda cercana</Link> y consulta por WhatsApp la ubicación y los horarios de atención antes de llegar.</p></div>
    <div className="contact-note"><Icon name="arrow"/><p><strong>¿Tienes una duda o necesitas atención de tu pedido?</strong> Visita nuestro <Link className="privacy-inline-link" href="/ayuda">centro de ayuda</Link> o consulta cómo solicitar atención por <Link className="privacy-inline-link" href="/ayuda#reclamos">cambios, garantías y reclamos</Link>.</p></div>
    <div className="contact-note"><Icon name="arrow"/><p>Antes de confirmar, revisa las <Link className="privacy-inline-link" href="/terminos">condiciones del pedido</Link>. La <Link className="privacy-inline-link" href="/privacidad">política de privacidad</Link> explica cómo usamos tus datos y cómo puedes solicitar su corrección o eliminación.</p></div>
  </section>
</main>}
