import type {Metadata} from 'next';
import Link from 'next/link';
import PrivacyControls from '@/components/PrivacyControls';
import './privacidad.css';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Cómo se usan los datos de tu cuenta, diseño, pedido, reseña o propuesta, qué permanece en tu navegador y cómo contactar a Tony sobre tu información.',
};

const deletionMail = 'mailto:info@tonysportselsalvador.com?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20datos';
const usesTestHosting = process.env.TONY_GITHUB_PAGES === 'true';
const servicesEnabled = !!process.env.NEXT_PUBLIC_TONY_API_BASE;
const accountsEnabled = process.env.NEXT_PUBLIC_TONY_AUTH_ENABLED === 'true' && servicesEnabled;

const SECTIONS: {id?: string; title: string; body: React.ReactNode}[] = [
  {title: 'Contacto sobre tus datos', body: <p>Este sitio presenta la marca Tony Sportswear, El Salvador. Para consultar sobre tu información, escribe a <a href="mailto:info@tonysportselsalvador.com">info@tonysportselsalvador.com</a> o por WhatsApp al <a href="https://wa.me/50370155571" target="_blank" rel="noopener noreferrer">7015-5571</a>. Indica qué solicitud necesitas atender y, si corresponde, la referencia de tu pedido; evita adjuntar tu DUI o un comprobante completo al hacer la primera consulta.</p>},
  {id: 'datos', title: 'Qué información utilizas aquí', body: <ul>
    <li><strong>Visitas:</strong> el servicio de alojamiento recibe tu dirección IP al entregar las páginas, incluso si solo consultas el catálogo. Esta versión del sitio no incorpora píxeles publicitarios ni herramientas de analítica de visitantes.</li>
    <li><strong>Cuenta:</strong> correo y contraseña, cuando el acceso esté habilitado. La contraseña se almacena como un hash, una representación que permite comprobarla sin guardar el texto original. Se usan enlaces por correo para verificar el registro o recuperar el acceso.</li>
    <li><strong>Diseño y equipo:</strong> nombre del equipo, nombres de jugadores y porteros, tallas, dorsales, indicaciones, imágenes, escudos, logos y textos que agregas.</li>
    <li><strong>Pedido:</strong> nombre del responsable, DUI, WhatsApp, correo opcional, sucursal o dirección de entrega, firma, aceptación de condiciones y comprobante de transferencia. Las coordenadas de entrega son opcionales; puedes escribir una dirección sin compartir tu ubicación.</li>
    <li><strong>Reseña:</strong> nombre o alias, valoración y comentario. El borrador se guarda en este navegador y se comparte con Tony solo cuando decides abrir el canal y enviar el mensaje.</li>
    <li><strong>Patrocinio y consultas:</strong> información de tu organización, propuesta y contacto, o la zona y sucursal de una consulta de entrega. Estos formularios preparan el mensaje en la página; tú eliges compartirlo por WhatsApp o correo.</li>
  </ul>},
  {title: 'Para qué se usa la información', body: <>
    <p>Tony trata los datos necesarios para preparar y cumplir el pedido que contrates, incluyendo fabricación, cobro, entrega y atención de reclamaciones. Para las funciones opcionales, como compartir una reseña, utilizar la ubicación o enviar imágenes a la IA, la página indica qué se compartirá antes de que elijas hacerlo. El uso publicitario de los datos de los formularios no forma parte de estas finalidades.</p>
    <p>La Ley para la Protección de Datos Personales de El Salvador regula el consentimiento informado y el tratamiento necesario para cumplir una relación contractual. Puedes retirar la autorización para un uso opcional por los medios que aparecen más abajo. <a href="https://ace.gob.sv/documentos/decretos/decreto_144_proteccion_datos.pdf">Consultar la ley, artículos 24 y 26 a 29</a>.</p>
  </>},
  {title: 'Lo que permanece en tu navegador', body: <><p>Los borradores y diseños del carrito se guardan localmente e incluyen los datos del equipo que hayas escrito: nombres, tallas, dorsales e indicaciones, además de las imágenes. También pueden quedar un borrador de reseña, las preferencias de efectos y asesora, y la referencia y estado de pedidos enviados.</p><p>El checkout mantiene los datos del responsable, la dirección de entrega, el DUI, la firma y el comprobante en la página mientras completas el pedido; la aplicación no los añade al guardado persistente del borrador. Recargar la página puede hacer que tengas que completarlos de nuevo. Si envías el pedido, esa información pasa al servicio de pedidos y al sistema de gestión de Tony. Al solicitar el cálculo del precio o preparar un enlace de pago, el diseño, los datos del equipo y la entrega también se envían al servicio de pedidos antes de la confirmación final.</p><p>Cuando las cuentas estén habilitadas, los borradores se separan por cuenta en este navegador. No se sincronizan automáticamente entre dispositivos, y cerrar sesión no elimina los diseños guardados. En un equipo compartido, puedes <a href="#borrar-datos-locales">borrar los diseños de tu perfil</a>. La página de <Link href="/cookies">cookies y almacenamiento</Link> explica cómo retirar todos los datos del sitio.</p></>},
  {id: 'servicios', title: 'Servicios externos y opciones voluntarias', body: <><ul>
    <li><strong>Alojamiento web:</strong> el proveedor recibe las solicitudes de páginas, imágenes y archivos para mostrarlos en tu navegador.{usesTestHosting && <> Durante las pruebas, el proveedor registra la dirección IP por motivos de seguridad. <a href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection">Consultar la información de privacidad del proveedor de pruebas</a>.</>}</li>
    <li><strong>WhatsApp (Meta) y correo:</strong> al abrir un enlace de contacto, el canal elegido recibe el texto que ya lleve preparado. En el editor anterior, una cotización puede incluir el equipo, nombres, tallas y dorsales. Revisa el mensaje antes de enviarlo. Si usas una cuenta Tony, el servicio de correo del alojamiento procesa tu dirección y el enlace de verificación o recuperación.</li>
    <li><strong>Wompi El Salvador:</strong> si habilitamos el anticipo con tarjeta y lo eliges, el servicio de Tony comunica a Wompi el importe y la referencia del cobro. Introduces los datos de tarjeta directamente en Wompi. Tony recibe el estado y los identificadores de la transacción para verificar el pago.</li>
    <li><strong>Panel Tony:</strong> cuando está conectado, el servicio de pedidos remite al panel de gestión de Tony el pedido confirmado, incluidos diseño y equipo, contacto, entrega, firma y datos del pago o comprobante, para gestionar la producción y entrega.</li>
    <li><strong>Google Gemini a través de Vercel AI Gateway:</strong> si decides utilizar una herramienta de inteligencia artificial del editor y el servicio está habilitado, el servidor de Tony, alojado en Vercel, envía los archivos e instrucciones descritos en la sección de IA de esta página a Vercel AI Gateway, que los transmite a Google Gemini para generar la imagen.</li>
    <li><strong>OpenStreetMap:</strong> si abres el mapa de entrega, el navegador solicita las imágenes de la zona mostrada. El proveedor recibe los datos técnicos de esa conexión, como la dirección IP. La ubicación del dispositivo se pide solo al elegir la opción correspondiente y con el permiso del navegador.</li>
    <li><strong>Instagram y TikTok:</strong> sus vistas en Tony News se cargan cuando pulsas el botón para verlas. Pueden recibir datos técnicos de tu visita y utilizar sus propias cookies o almacenamiento. También puedes abrir las publicaciones directamente en su plataforma.</li>
    <li><strong>Enlaces de salida:</strong> al abrir una ubicación en Google Maps o seguir un enlace a Facebook, Google Play o App Store, tu navegador se conecta a Google, Meta o Apple, según el enlace elegido.</li>
  </ul><p>Los servicios de cuenta y pedidos, cuando están habilitados, también procesan datos técnicos de conexión para validar sesiones y limitar solicitudes abusivas. Si necesitas identificar al prestador técnico que intervino en un pedido concreto, indica su referencia al contactar a Tony.</p></>},
  {id: 'inteligencia-artificial', title: 'Cuándo se utiliza inteligencia artificial', body: <>
    <p>El editor utiliza Google Gemini a través de Vercel AI Gateway para generar un mockup, borrar una zona o preparar el acabado final cuando solicitas esa operación. El generador usa la imagen base y las instrucciones de la prenda. La herramienta para borrar una zona envía la imagen completa de la cara elegida y la posición de la zona que marcas. Para el acabado final se envían las vistas de ambos lados y los elementos del diseño, que pueden mostrar nombres, dorsales, escudos o patrocinadores. Revisa los archivos antes de usar estas funciones.</p>
    <p>La asesora del configurador es un personaje animado que lee instrucciones del pedido. Utiliza la síntesis de voz del navegador o del dispositivo. Algunas voces se procesan en línea y su proveedor puede recibir el texto de la guía. Puedes silenciarla o elegir «Gama baja». La guía funciona sin acceder al micrófono ni a la cámara.</p>
  </>},
  {title: 'Datos de tu equipo y menores', body: <p>Comparte solo la información necesaria para personalizar las prendas y utiliza datos de otras personas únicamente cuando tengas autorización para hacerlo. Si el equipo incluye menores, la persona responsable debe contar con la autorización de sus madres, padres o representantes cuando corresponda. Evita publicar sus datos en reseñas y no incluyas documentos de identidad, domicilios o teléfonos de jugadores en propuestas, textos del diseño o archivos del editor.</p>},
  {title: 'Reseñas y publicación', body: <p>Las reseñas no se publican automáticamente. Puedes usar un alias y revisar tu comentario antes de compartirlo; el equipo debe acordar contigo su publicación. Evita teléfonos, direcciones y datos de terceros en el comentario. Para corregir o solicitar retirar una reseña publicada, contacta a Tony e indica el alias o la publicación correspondiente.</p>},
  {title: 'Conservación y eliminación', body: <>
    <p>Los borradores, diseños, referencias y preferencias del navegador pueden permanecer entre visitas. Puedes eliminar tus borradores y otros datos locales con el control de esta página. Los archivos que hayas descargado, como un PDF del pedido, se eliminan desde tu dispositivo.</p>
    <PrivacyControls/>
    <p>Cuando el servicio de cuentas está habilitado, puedes eliminar tu cuenta desde Mi cuenta confirmando tu contraseña. Esto retira el registro de acceso e invalida sus sesiones. Para un pedido, pago, conversación o reseña que ya hayas enviado, utiliza la solicitud de eliminación que aparece a continuación.</p>
    {accountsEnabled && <p><Link href="/cuenta?accion=eliminar">Ir a eliminar mi cuenta</Link></p>}
    <p>La conservación de pedidos y pagos depende de su estado y de las obligaciones aplicables. Si procede conservar parte de un registro para completar una entrega, atender una reclamación o cumplir una obligación legal, puedes pedir el motivo, los datos afectados y el plazo o criterio de conservación.</p>
  </>},
  {id: 'solicitudes', title: 'Solicitudes sobre tu información', body: <>
    <p>Puedes pedir a Tony acceso, rectificación, cancelación o supresión, oposición, portabilidad, olvido o limitación del uso de tus datos. También puedes retirar tu consentimiento. Puedes iniciar la solicitud aunque no tengas una cuenta.</p>
    <p>Indica qué quieres eliminar o cambiar, cómo quieres recibir la respuesta y, si aplica, el número de pedido o el alias de la reseña. Utiliza el contacto asociado a esos datos si lo tienes. Para acreditar tu identidad o representación, pide instrucciones antes de adjuntar documentos.</p>
    <p><a href={deletionMail}>Solicitar la eliminación de mis datos por correo</a> · <a href="https://wa.me/50370155571?text=Quiero%20hacer%20una%20solicitud%20sobre%20mis%20datos." target="_blank" rel="noopener noreferrer">Contactar por WhatsApp</a></p>
    <p>Si quieres consultar los formularios de la autoridad de protección de datos, están disponibles en la <a href="https://ace.gob.sv/formularios.php">Agencia de Ciberseguridad del Estado (ACE)</a>.</p>
  </>},
  {title: 'Cambios en esta información', body: <p>La fecha de esta página permite identificar la versión consultada. Si se añaden servicios o cambian las formas de utilizar los datos, esta información debe actualizarse. Consulta también las <Link href="/terminos">condiciones de pedidos y atención</Link> y la página de <Link href="/cookies">cookies y almacenamiento</Link>.</p>},
];

export default function Privacidad() {
  return <main id="contenido" className="internal-page privacy-page">
    <section className="section-wrap internal-hero">
      <div className="internal-breadcrumb"><Link href="/">Inicio</Link><span>/</span><span>Privacidad</span></div>
      <p className="eyebrow orange">TUS DATOS, CLAROS</p>
      <h1>POLÍTICA DE<br/><span>PRIVACIDAD.</span></h1>
      <p className="lead">TonySport sí trata datos personales. Al visitar la web, el servidor recibe tu dirección IP. Al crear un pedido, el navegador guarda el diseño y los datos del equipo que escribes. Aquí puedes ver qué se comparte y cómo borrarlo.</p>
      {!servicesEnabled && <p className="privacy-updated">En esta versión puedes crear y guardar diseños en tu dispositivo. Las cuentas, el pago en línea y la edición de imágenes con Google Gemini a través de Vercel AI Gateway están deshabilitados.</p>}
      {servicesEnabled && !accountsEnabled && <p className="privacy-updated">En esta versión puedes crear y guardar diseños en tu dispositivo y, si lo eliges, usar la IA del editor con Google Gemini a través de Vercel AI Gateway. Las cuentas están deshabilitadas.</p>}
      <p className="privacy-updated">Actualizada el <time dateTime="2026-11-26">26 de noviembre de 2026</time>.</p>
      <nav className="privacy-related" aria-label="Información relacionada"><a href="#servicios">Quién recibe datos</a><a href="#inteligencia-artificial">Uso de IA</a><a href="#borrar-datos-locales">Borrar datos del navegador</a><a href="#solicitudes">Solicitar eliminación</a><Link href="/cookies">Cookies y almacenamiento</Link></nav>
    </section>
    <section className="section-wrap privacy-body" aria-label="Uso de tu información">
      {SECTIONS.map((section, index) => <article id={section.id} key={section.title}><span className="privacy-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><h2>{section.title}</h2>{section.body}</div></article>)}
    </section>
  </main>;
}
