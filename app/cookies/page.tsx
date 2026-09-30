import type {Metadata} from 'next';
import Link from 'next/link';
import '../privacidad/privacidad.css';

export const metadata: Metadata = {
  title: 'Cookies y almacenamiento',
  description: 'Qué guarda Tony en tu navegador, cómo controlarlo y qué ocurre cuando eliges cargar mapas, publicaciones sociales o servicios externos.',
};

const SECTIONS: {title: string; body: React.ReactNode}[] = [
  {title: 'Qué guarda este sitio', body: <><p>El sitio utiliza almacenamiento del navegador para conservar diseños, recordar opciones y mantener una sesión cuando el servicio correspondiente esté habilitado. Son datos locales del sitio; no todo ese almacenamiento son cookies.</p><p>Esta versión no incorpora herramientas propias de publicidad ni de analítica. Cuando eliges cargar contenido de otras plataformas, esas plataformas pueden utilizar sus propias cookies y otras tecnologías.</p></>},
  {title: 'Borradores y carrito', body: <><p>Los diseños se guardan en una base de datos del navegador, llamada IndexedDB. Incluyen imágenes, opciones de la prenda y la información del equipo que hayas escrito: nombres, tallas, dorsales e indicaciones. El editor anterior también puede conservar un borrador en el almacenamiento local.</p><p>Estos datos permiten continuar el diseño y recuperar el carrito. No se sincronizan automáticamente entre dispositivos. No tienen una fecha de vencimiento automática: puedes retirar un diseño desde el carrito o borrar todos los datos del sitio desde el navegador.</p></>},
  {title: 'Preferencias, reseñas y referencias', body: <p>El almacenamiento local, conocido como localStorage, puede recordar tus opciones de efectos y asesora, un borrador de reseña y las referencias y estados de pedidos enviados. No tiene un vencimiento automático. Puedes cambiar las opciones desde sus controles y borrar los datos del sitio en el navegador. Eliminar una referencia local no cancela ni elimina el pedido enviado.</p>},
  {title: 'Sesión de la pestaña', body: <p>El almacenamiento de sesión, conocido como sessionStorage, conserva las claves de acceso cuando las cuentas o pedidos están habilitados, referencias necesarias para volver de un pago y si ya viste la presentación inicial. Las claves permiten identificar la sesión sin guardar la contraseña. Su uso se limita a la sesión de la pestaña y el servicio de acceso tiene una vigencia máxima de ocho horas. Cerrar sesión no elimina los borradores locales; si compartes el dispositivo, revisa también los datos guardados del sitio.</p>},
  {title: 'Datos del checkout', body: <><p>La aplicación no añade el DUI, la firma, el comprobante ni la dirección de entrega al guardado persistente del diseño. Se mantienen en la página mientras completas el checkout y, cuando confirmas un pedido con el servicio habilitado, se envían al servicio de pedidos. Recargar puede hacer que tengas que completarlos de nuevo. Los nombres y tallas del equipo sí forman parte del borrador guardado.</p><p>La solicitud del cálculo de precio o de un enlace de pago también envía el diseño, los datos del equipo y la entrega al servicio de pedidos antes de la confirmación final.</p></>},
  {title: 'Contenido externo que tú eliges', body: <ul>
    <li><strong>Instagram y TikTok:</strong> las vistas de Tony News se cargan al pulsar su botón. Desde ese momento la plataforma puede recibir datos de conexión y utilizar su propio almacenamiento; sus políticas rigen ese contenido.</li>
    <li><strong>Mapa de entrega:</strong> se conecta a OpenStreetMap al abrirlo y solicita las imágenes de la zona mostrada. Puedes escribir la dirección sin abrirlo. La opción de usar tu ubicación requiere el permiso del navegador.</li>
    <li><strong>IA del editor:</strong> si está habilitada, solicita las imágenes y elementos necesarios para la operación que elijas a Google Gemini. Revisa qué archivos incluyes antes de utilizarla.</li>
    <li><strong>WhatsApp, correo y pago:</strong> se abren cuando eliges el enlace o la acción correspondiente. El mensaje preparado o los datos necesarios para el pago pasan al servicio elegido, que aplica sus propias condiciones.</li>
  </ul>},
  {title: 'Cómo controlarlo', body: <><p>En la configuración de privacidad de tu navegador, busca los datos guardados por este sitio y elimina sus cookies y datos de almacenamiento. Para retirar también las imágenes y diseños, elige borrar los datos del sitio; borrar solo cookies puede dejar intactos los borradores.</p><p>Guarda una copia de los diseños y documentos que necesites antes de hacerlo: perderás los borradores y preferencias locales y puede cerrarse tu sesión. Si bloqueas el almacenamiento, algunas funciones de guardado o recuperación de pagos pueden no funcionar. Puedes evitar las conexiones opcionales sin abrir las vistas sociales, el mapa o las herramientas con IA.</p><p>Borrar datos locales no retira mensajes enviados por WhatsApp o correo, ni elimina cuentas o pedidos del servicio. Para una solicitud sobre esa información, consulta los contactos de la <Link href="/privacidad">política de privacidad</Link>.</p></>},
];

export default function Cookies() {
  return <main id="contenido" className="internal-page privacy-page">
    <section className="section-wrap internal-hero">
      <div className="internal-breadcrumb"><Link href="/">Inicio</Link><span>/</span><span>Cookies y almacenamiento</span></div>
      <p className="eyebrow orange">TÚ CONTROLAS LO QUE GUARDAS</p>
      <h1>COOKIES Y<br/><span>ALMACENAMIENTO.</span></h1>
      <p className="lead">Cómo se conservan tus borradores y preferencias, y qué ocurre al cargar servicios externos.</p>
      <p className="privacy-updated">Actualizada el <time dateTime="2026-09-30">30 de septiembre de 2026</time>.</p>
      <nav className="privacy-related" aria-label="Información relacionada"><Link href="/privacidad">Política de privacidad ↗</Link><Link href="/terminos">Condiciones de pedidos ↗</Link></nav>
    </section>
    <section className="section-wrap privacy-body" aria-label="Almacenamiento y controles">
      {SECTIONS.map((section, index) => <article key={section.title}><span className="privacy-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><h2>{section.title}</h2>{section.body}</div></article>)}
    </section>
  </main>;
}
