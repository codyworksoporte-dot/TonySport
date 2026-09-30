import type {Metadata} from 'next';
import Link from 'next/link';
import './privacidad.css';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Cómo se usan los datos de tu cuenta, diseño, pedido, reseña o propuesta, qué permanece en tu navegador y cómo contactar a Tony sobre tu información.',
};

const SECTIONS: {title: string; body: React.ReactNode}[] = [
  {title: 'Contacto sobre tus datos', body: <p>Este sitio presenta la marca Tony Sportswear, El Salvador. Para consultar sobre tu información, escribe a <a href="mailto:info@tonysportselsalvador.com">info@tonysportselsalvador.com</a> o por WhatsApp al <a href="https://wa.me/50370155571" target="_blank" rel="noopener noreferrer">7015-5571</a>. Indica qué solicitud necesitas atender y, si corresponde, la referencia de tu pedido; evita adjuntar tu DUI o un comprobante completo al hacer la primera consulta.</p>},
  {title: 'Qué información utilizas aquí', body: <ul>
    <li><strong>Cuenta:</strong> correo y contraseña, cuando el acceso esté habilitado. La contraseña se almacena como un hash, una representación que permite comprobarla sin guardar el texto original. Se usan enlaces por correo para verificar el registro o recuperar el acceso.</li>
    <li><strong>Diseño y equipo:</strong> nombre del equipo, nombres de jugadores y porteros, tallas, dorsales, indicaciones, imágenes, escudos, logos y textos que agregas.</li>
    <li><strong>Pedido:</strong> nombre del responsable, DUI, WhatsApp, correo opcional, sucursal o dirección de entrega, firma, aceptación de condiciones y comprobante de transferencia. Las coordenadas de entrega son opcionales; puedes escribir una dirección sin compartir tu ubicación.</li>
    <li><strong>Reseña:</strong> nombre o alias, valoración y comentario. El borrador se guarda en este navegador y se comparte con Tony solo cuando decides abrir el canal y enviar el mensaje.</li>
    <li><strong>Patrocinio y consultas:</strong> información de tu organización, propuesta y contacto, o la zona y sucursal de una consulta de entrega. Estos formularios preparan el mensaje en la página; tú eliges compartirlo por WhatsApp o correo.</li>
  </ul>},
  {title: 'Para qué se usa la información', body: <><p>Para gestionar el acceso a tu cuenta, preparar tu diseño y, cuando el servicio de pedidos esté disponible, gestionar, fabricar, cobrar, entregar y dar seguimiento al pedido. También sirve para responder consultas, valorar propuestas de colaboración y acordar la publicación de una reseña.</p><p>La información solicitada en estos formularios no se destina a campañas de publicidad ni a la venta de datos. Preparar una consulta, una reseña o una propuesta no equivale a enviarla: revisa el mensaje y confirma el envío en el canal que elijas.</p></>},
  {title: 'Lo que permanece en tu navegador', body: <><p>Los borradores y diseños del carrito se guardan localmente e incluyen los datos del equipo que hayas escrito: nombres, tallas, dorsales e indicaciones, además de las imágenes. También pueden quedar un borrador de reseña, las preferencias de efectos y asesora, y la referencia y estado de pedidos enviados.</p><p>El checkout mantiene los datos del responsable, la dirección de entrega, el DUI, la firma y el comprobante en la página mientras completas el pedido; la aplicación no los añade al guardado persistente del borrador. Recargar la página puede hacer que tengas que completarlos de nuevo. Si envías el pedido, esa información pasa al servicio de pedidos y al sistema de gestión de Tony. Al solicitar el cálculo del precio o preparar un enlace de pago, el diseño, los datos del equipo y la entrega también se envían al servicio de pedidos antes de la confirmación final.</p><p>Cuando las cuentas estén habilitadas, los borradores se separan por cuenta en este navegador. No se sincronizan automáticamente entre dispositivos, y cerrar sesión no elimina los diseños guardados. En un equipo compartido, borra los datos del sitio si necesitas retirarlos. La página de <Link href="/cookies">cookies y almacenamiento</Link> explica cómo hacerlo.</p></>},
  {title: 'Servicios externos y opciones voluntarias', body: <><ul>
    <li><strong>WhatsApp y correo:</strong> al abrir una consulta, reseña o propuesta, el texto pasa al canal elegido para que lo revises y envíes. Ese servicio aplica sus propias condiciones de privacidad.</li>
    <li><strong>Wompi:</strong> cuando el pago con tarjeta esté habilitado y lo elijas, procesa el anticipo en su enlace de pago. Los datos de la tarjeta se introducen allí; este checkout no solicita número de tarjeta ni código de seguridad.</li>
    <li><strong>Google Gemini:</strong> cuando la edición con IA esté habilitada y solicites usarla, recibe las imágenes, elementos e indicaciones necesarios para esa operación. No incluyas documentos personales ni información ajena a tu diseño en esos archivos.</li>
    <li><strong>OpenStreetMap:</strong> si abres el mapa de entrega, el navegador solicita las imágenes de la zona mostrada. El proveedor recibe los datos técnicos de esa conexión, como la dirección IP. La ubicación del dispositivo se pide solo al elegir la opción correspondiente y con el permiso del navegador.</li>
    <li><strong>Instagram y TikTok:</strong> sus vistas en Tony News se cargan cuando pulsas el botón para verlas. Pueden recibir datos técnicos de tu visita y utilizar sus propias cookies o almacenamiento. También puedes abrir las publicaciones directamente en su plataforma.</li>
  </ul><p>El sitio y los servicios de cuenta o pedidos también necesitan procesar datos técnicos de conexión para responder solicitudes y limitar usos abusivos. La disponibilidad de pagos, IA y cuentas depende de la activación de cada servicio.</p></>},
  {title: 'Datos de tu equipo y menores', body: <p>Comparte solo la información necesaria para personalizar las prendas y utiliza datos de otras personas únicamente cuando tengas autorización para hacerlo. Si el equipo incluye menores, la persona responsable debe contar con la autorización de sus madres, padres o representantes cuando corresponda. Evita publicar sus datos en reseñas y no incluyas documentos de identidad, domicilios o teléfonos de jugadores en propuestas, textos del diseño o archivos del editor.</p>},
  {title: 'Reseñas y publicación', body: <p>Las reseñas no se publican automáticamente. Puedes usar un alias y revisar tu comentario antes de compartirlo; el equipo debe acordar contigo su publicación. Evita teléfonos, direcciones y datos de terceros en el comentario. Para corregir o solicitar retirar una reseña publicada, contacta a Tony e indica el alias o la publicación correspondiente.</p>},
  {title: 'Conservación y eliminación', body: <><p>Los borradores y preferencias locales no tienen un vencimiento automático: permanecen hasta que los elimines o el navegador retire los datos del sitio. Las claves de sesión pueden permanecer en la pestaña; el acceso a cuenta o pedidos tiene una vigencia máxima de ocho horas. Cambiar o recuperar la contraseña invalida las sesiones anteriores.</p><p>La conservación de cuentas, pedidos y comunicaciones debe considerar su finalidad y las obligaciones aplicables. No se establece aquí un plazo único para todos esos datos. Puedes consultar sobre la conservación de tu caso o solicitar su eliminación por los contactos indicados arriba. El sitio no ofrece actualmente un botón para eliminar la cuenta ni un borrado automático de pedidos; borrar los datos del navegador no elimina lo que ya enviaste.</p></>},
  {title: 'Solicitudes sobre tu información', body: <p>Puedes solicitar acceso a tu información, su corrección o eliminación, y consultar sobre su uso o retirar una autorización que hayas dado. Describe la solicitud y usa, si puedes, el correo o contacto relacionado con tu cuenta o pedido. Puede ser necesario comprobar tu identidad antes de facilitar datos o cambiarlos. La eliminación puede estar limitada cuando la información sea necesaria para un pedido en curso, la atención de una reclamación o una obligación legal; pide que te expliquen qué información debe conservarse y por qué.</p>},
  {title: 'Cambios en esta información', body: <p>La fecha de esta página permite identificar la versión consultada. Si se añaden servicios o cambian las formas de utilizar los datos, esta información debe actualizarse. Consulta también las <Link href="/terminos">condiciones de pedidos y atención</Link> y la página de <Link href="/cookies">cookies y almacenamiento</Link>.</p>},
];

export default function Privacidad() {
  return <main id="contenido" className="internal-page privacy-page">
    <section className="section-wrap internal-hero">
      <div className="internal-breadcrumb"><Link href="/">Inicio</Link><span>/</span><span>Privacidad</span></div>
      <p className="eyebrow orange">TUS DATOS, CLAROS</p>
      <h1>POLÍTICA DE<br/><span>PRIVACIDAD.</span></h1>
      <p className="lead">Qué información utilizas aquí, qué se guarda en tu navegador y cómo contactar a Tony sobre tus datos.</p>
      <p className="privacy-updated">Actualizada el <time dateTime="2026-09-30">30 de septiembre de 2026</time>.</p>
      <nav className="privacy-related" aria-label="Información relacionada"><Link href="/terminos">Condiciones de pedidos ↗</Link><Link href="/cookies">Cookies y almacenamiento ↗</Link></nav>
    </section>
    <section className="section-wrap privacy-body" aria-label="Uso de tu información">
      {SECTIONS.map((section, index) => <article key={section.title}><span className="privacy-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><h2>{section.title}</h2>{section.body}</div></article>)}
    </section>
  </main>;
}
