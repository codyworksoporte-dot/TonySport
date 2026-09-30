import type {Metadata} from 'next';
import Link from 'next/link';
import checkout from '@/data/pedido/checkout.json';
import '../privacidad/privacidad.css';

export const metadata: Metadata = {
  title: 'Términos de uso y pedido',
  description: 'Cómo preparar y confirmar tu pedido Tony Sportswear: diseño, cotización, pagos, entrega y consultas sobre cambios o garantías.',
};

const SECTIONS: {title: string; body: React.ReactNode}[] = [
  {title: 'Explorar, diseñar y guardar', body: <p>Puedes consultar los diseños y preparar una solicitud de uniformes. Guardar en el carrito o descargar un boceto conserva tu trabajo; esas acciones no envían un pedido, reservan materiales ni realizan un cobro. Si abres WhatsApp, revisa el mensaje y adjunta los archivos que quieras compartir antes de enviarlo.</p>},
  {title: 'Revisión del diseño y los archivos', body: <p>El editor y los mockups son referencias visuales. Antes de aprobar, revisa ambas caras, nombres, números, tallas, cantidades, telas y opciones. Tony confirmará la viabilidad del diseño y los ajustes técnicos necesarios para fabricar la prenda. Usa imágenes, escudos y marcas que tengas derecho o autorización para utilizar. Puedes consultar con Tony antes de aprobar si tienes dudas sobre un archivo o una opción.</p>},
  {title: 'Cotización y disponibilidad', body: <p>El total mostrado corresponde a las opciones elegidas y a las reglas del configurador. Antes de comprometer un pago, confirma con Tony la cotización definitiva, disponibilidad, costo y modalidad de entrega, y cualquier condición que necesite aclaración. Explorar un diseño del catálogo no garantiza disponibilidad inmediata de prendas, telas o materiales.</p>},
  {title: 'Envío, pago y confirmación', body: <><p>El envío de pedidos y el pago en línea requieren que el servicio correspondiente esté disponible. El anticipo y el saldo aparecen en el resumen antes de pagar. Con tarjeta, ingresas los datos de pago en el enlace seguro de Wompi; una transferencia queda sujeta a revisión del comprobante.</p><p>Conserva la referencia y comprueba que Tony haya recibido el pedido y confirmado sus condiciones. Si ves un pago sin verificar o un aviso de recepción pendiente, consulta su estado antes de repetir un pago o solicitar el inicio de producción. La preparación de un boceto por sí sola no confirma una compra.</p></>},
  {title: 'Entrega y seguimiento', body: <p>Revisa la sucursal o la dirección elegida y acuerda con Tony la fecha estimada antes de confirmar. Consulta el estado con tu referencia de pedido. Si necesitas corregir datos o cambiar una opción, contacta a Tony cuanto antes para conocer si el cambio es viable y cómo afecta el pedido.</p>},
  {title: 'Cambios, cancelaciones, garantías y reclamos', body: <><p>Para solicitar un cambio, una cancelación, una devolución, una revisión por defecto o una garantía, comunica tu referencia y describe lo ocurrido. Tony deberá revisar el caso, informar las condiciones aplicables y acordar contigo la solución. Si el pedido ya empezó a fabricarse, consulta el estado y los trabajos realizados antes de decidir un cambio o cancelación.</p><p>Los términos del pedido no limitan los derechos irrenunciables que te correspondan como consumidor. Puedes presentar tus consultas por WhatsApp al <a href="https://wa.me/50370155571" target="_blank" rel="noopener noreferrer">7015-5571</a> o escribir a <a href="mailto:info@tonysportselsalvador.com">info@tonysportselsalvador.com</a>.</p></>},
  {title: 'Tus datos y borradores', body: <p>Consulta qué información se usa, qué queda guardado en tu navegador y cómo pedir su corrección o eliminación en la <Link href="/privacidad">política de privacidad</Link>. Los borradores locales no se sincronizan automáticamente entre dispositivos; conserva una copia de los archivos y documentos que necesites.</p>},
];

export default function TerminosPage() {
  return <main id="contenido" className="internal-page privacy-page">
    <section className="section-wrap internal-hero">
      <div className="internal-breadcrumb"><Link href="/">Inicio</Link><span>/</span><span>Términos</span></div>
      <p className="eyebrow orange">TU PEDIDO, CLARO</p>
      <h1>TÉRMINOS DE<br/><span>USO Y PEDIDO.</span></h1>
      <p className="lead">Revisa cómo preparar tu diseño, consultar las condiciones y confirmar un pedido con Tony Sportswear, El Salvador.</p>
      <p>Actualizado el 30 de septiembre de 2026.</p>
      <a className="text-link" href="#condiciones-pedido">Leer los 13 puntos del pedido ↓</a>
    </section>
    <section className="section-wrap privacy-body" aria-label="Guía de uso y pedido">
      {SECTIONS.map((section, index) => <article key={section.title}><span className="privacy-index">{String(index + 1).padStart(2, '0')}</span><div><h2>{section.title}</h2>{section.body}</div></article>)}
      <article id="condiciones-pedido">
        <span className="privacy-index">08</span>
        <div>
          <h2>Condiciones que aceptas al enviar el pedido</h2>
          <p>Estos son los mismos 13 puntos que aparecen para tu revisión, aceptación y firma en el configurador. Versión: {checkout.termsVersion}.</p>
          <ol>{checkout.terms.map((term, index) => <li key={index}>{term.replace(/^\d+[.)]\s*/, '')}</li>)}</ol>
          <p>Si una condición no te queda clara, <Link href="/contacto">consulta con Tony</Link> antes de aceptarla.</p>
        </div>
      </article>
    </section>
  </main>;
}
