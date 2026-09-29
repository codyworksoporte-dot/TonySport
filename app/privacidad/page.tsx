import type {Metadata} from 'next';
import Link from 'next/link';
import './privacidad.css';

export const metadata: Metadata = {title: 'Política de privacidad', description: 'Qué datos pide Tony Sportswear al crear tu pedido, para qué los usa, con quién los comparte y cómo puedes pedir que se corrijan o eliminen.'};

const SECTIONS: {title: string; body: React.ReactNode}[] = [
  {title: 'Tu cuenta Tony', body: <p>Cuando se active el acceso con cuenta, utilizaremos tu correo para confirmar el registro, iniciar sesión y recuperar tu contraseña. La contraseña se almacena como un hash; nunca se envía por correo. La sesión se conserva en esta pestaña durante un máximo de ocho horas. Cambiar o recuperar la contraseña invalida las sesiones anteriores. Los borradores se separan por cuenta en este navegador; no se sincronizan automáticamente con otros dispositivos.</p>},
  {title: 'Quién cuida tus datos', body: <p>Tony Sportswear, El Salvador. Para cualquier consulta sobre tus datos escríbenos a <a href="mailto:info@tonysportselsalvador.com">info@tonysportselsalvador.com</a> o por WhatsApp al <a href="https://wa.me/50370155571" target="_blank" rel="noopener noreferrer">7015-5571</a>.</p>},
  {title: 'Qué datos pedimos', body: <><p>Solo cuando creas un pedido:</p><ul>
    <li>Datos de la persona responsable: nombre completo, DUI, WhatsApp y, si quieres, correo electrónico.</li>
    <li>Datos del equipo: nombre del equipo y de cada jugador, tallas y números.</li>
    <li>Entrega: la sucursal donde retiras, o tu dirección, y tu ubicación solo si decides compartirla o marcarla en el mapa.</li>
    <li>Pago: el comprobante de transferencia que subas. Los datos de tarjeta los ingresas en Wompi y Tony no los recibe.</li>
    <li>Tu firma y la aceptación de los términos del pedido.</li>
    <li>Las imágenes, escudos, logos y textos que agregas a tu diseño.</li>
  </ul></>},
  {title: 'Para qué los usamos', body: <p>Para gestionar, fabricar, cobrar, entregar y dar seguimiento a tu pedido, y para contactarte sobre él. No los usamos para publicidad ni los vendemos.</p>},
  {title: 'Con quién se comparten', body: <ul>
    <li><strong>Wompi</strong>, cuando pagas con tarjeta: procesa el pago del anticipo en su propio enlace seguro.</li>
    <li><strong>Servicio de inteligencia artificial de Google (Gemini)</strong>, solo cuando usas las herramientas con IA del editor: recibe las imágenes de tu diseño para preparar el mockup o borrar un área.</li>
    <li><strong>OpenStreetMap</strong>, solo si abres el mapa de entrega: tu navegador descarga de ahí las imágenes del mapa.</li>
    <li><strong>Instagram y TikTok</strong>, solo si eliges ver una publicación en Tony News.</li>
  </ul>},
  {title: 'Qué se guarda en tu navegador', body: <p>El borrador de tu diseño, los diseños que guardas en el carrito, tus preferencias (efectos y asesora) y el número y estado de los pedidos que envías. Tu DUI, tu firma y tu comprobante no se guardan en el navegador: viajan por conexión segura al enviar el pedido. Este sitio no usa cookies de publicidad ni de analítica. Puedes borrar lo guardado desde la configuración de tu navegador.</p>},
  {title: 'Tus derechos', body: <p>Puedes pedirnos ver, corregir o eliminar tus datos escribiendo a los contactos de arriba. Si el pedido ya está en producción o pagado, conservaremos lo necesario para cumplir con él y con nuestras obligaciones.</p>},
];

export default function Privacidad() {
  return <main id="contenido" className="internal-page privacy-page">
    <section className="section-wrap internal-hero">
      <div className="internal-breadcrumb"><Link href="/">Inicio</Link><span>/</span><span>Privacidad</span></div>
      <p className="eyebrow orange">TUS DATOS, CLAROS</p>
      <h1>POLÍTICA DE<br/><span>PRIVACIDAD.</span></h1>
      <p className="lead">Qué datos pide Tony al crear tu pedido, para qué los usa y cómo puedes pedir que se corrijan o eliminen.</p>
    </section>
    <section className="section-wrap privacy-body">
      {SECTIONS.map((section, index) => <article key={section.title}><span className="privacy-index">{String(index + 1).padStart(2, '0')}</span><div><h2>{section.title}</h2>{section.body}</div></article>)}
    </section>
  </main>;
}
