import type {Metadata} from 'next';
import Link from 'next/link';
import {EditorialShell, EditorialHero, EditorialLink, SectionLabel, whatsappLink} from '@/components/TonyEditorial';

export const metadata: Metadata = {
  title: 'Ayuda y preguntas frecuentes',
  description: 'Resuelve dudas sobre cotizaciones, tallas, diseños, archivos, entregas y atención de cambios, garantías y reclamos con Tony Sportswear.',
};

export default function AyudaPage() {
  return <EditorialShell>
    <EditorialHero
      label="Ayuda"
      eyebrow="TE ACOMPAÑAMOS EN CADA PASO"
      title={<>Tu pedido,<br/><em>con menos dudas.</em></>}
      description="Encuentra respuestas para preparar tu uniforme, conservar tu diseño y conversar con Tony sobre tu pedido."
    />

    <section className="te-wrap te-rule" style={{paddingTop: 0, borderTop: 0}} aria-labelledby="ayuda-pedido">
      <div className="te-guides">
        <div>
          <SectionLabel number="01">Antes de pedir</SectionLabel>
          <h2 id="ayuda-pedido">Una idea clara.<br/><em>Un equipo listo.</em></h2>
          <p className="te-body-copy">Prepara los detalles y conserva los archivos originales. El equipo de Tony te ayuda a confirmar las opciones para tu confección.</p>
          <div className="te-actions"><EditorialLink href="/configurador">Crear mi uniforme</EditorialLink><EditorialLink href="/contacto" outline>Hablar con Tony</EditorialLink></div>
        </div>
        <div className="te-accordion">
          <details open>
            <summary>¿Qué necesito para pedir una cotización?</summary>
            <div className="te-guide-content"><p>Comparte la cantidad de prendas, el tipo de uniforme o camisa, tu idea de diseño y el lugar de entrega. Si tienes una fecha en mente, indícala para consultar si puede atenderse.</p><p>Antes de confirmar, revisa con Tony el precio final, materiales, personalización, condiciones de pago y entrega. Guardar un diseño en el carrito no confirma la producción.</p></div>
          </details>
          <details>
            <summary>¿Cómo elijo la talla y el molde?</summary>
            <div className="te-guide-content"><p>Confirma la talla de cada integrante y el molde de la prenda antes de aprobar la nómina. Si dudas entre tallas, consulta con Tony las medidas que corresponden al modelo elegido; evita decidir solo por la talla de otra marca.</p><p><Link className="privacy-inline-link" href="/calidad">Conoce las telas, técnicas y recomendaciones de confección.</Link></p></div>
          </details>
          <details>
            <summary>¿Qué imágenes puedo subir y qué debo revisar?</summary>
            <div className="te-guide-content"><p>El editor admite JPG, PNG y WebP de hasta 4 MB por imagen. Usa archivos nítidos y conserva los originales de escudos, marcas y patrocinadores que tengas autorización para utilizar.</p><p>Revisa frente y espalda, nombres, dorsales, colores y ubicación de los elementos. La vista del editor es orientativa; confirma el arte y los detalles de producción con Tony antes de aprobar.</p></div>
          </details>
          <details>
            <summary>¿Dónde quedan mis diseños guardados?</summary>
            <div className="te-guide-content"><p>El borrador y el carrito se guardan en este navegador. No se sincronizan automáticamente entre dispositivos; borrar los datos del sitio o usar otro navegador puede dejarte sin acceso a esas copias locales.</p><p>Descarga tus diseños y los documentos disponibles del pedido para conservarlos. Puedes revisar lo guardado en <Link className="privacy-inline-link" href="/carrito">Mi carrito</Link> y consultar las referencias en <Link className="privacy-inline-link" href="/recientes">Recientes</Link>.</p></div>
          </details>
          <details>
            <summary>¿Necesito una cuenta?</summary>
            <div className="te-guide-content"><p>Puedes explorar el sitio y consultar con Tony sin registrarte. En <Link className="privacy-inline-link" href="/cuenta">Mi cuenta</Link> verás si el acceso con correo está disponible. Cuando las cuentas estén habilitadas, el configurador puede solicitar que inicies sesión.</p><p>Los diseños guardados se separan por cuenta en este navegador; no se trasladan automáticamente a otro dispositivo.</p></div>
          </details>
          <details>
            <summary>¿Cuánto tarda y cómo recibo el pedido?</summary>
            <div className="te-guide-content"><p>La fecha, el destino y el costo de entrega se acuerdan para cada pedido. Confirma esos detalles con tu asesor junto con la aprobación del diseño y las condiciones de pago.</p><p>Consulta las <Link className="privacy-inline-link" href="/entregas">opciones de entrega</Link> o busca una <Link className="privacy-inline-link" href="/tiendas">tienda cercana</Link>. Antes de visitarla, confirma la ubicación y el horario con la sucursal.</p></div>
          </details>
        </div>
      </div>
    </section>

    <section id="reclamos" className="te-wrap te-rule" style={{scrollMarginTop: 130}} aria-labelledby="ayuda-reclamos">
      <div className="te-guides">
        <div>
          <SectionLabel number="02">Después de pedir</SectionLabel>
          <h2 id="ayuda-reclamos">Cambios, garantías<br/><em>y reclamos.</em></h2>
          <p className="te-body-copy">Si necesitas un ajuste o tienes un problema con tu pedido, cuéntanos lo ocurrido para revisar el caso y coordinar la atención.</p>
          <div className="te-actions"><EditorialLink href={whatsappLink('Hola, Tony. Necesito atención sobre un cambio, garantía o reclamo de mi pedido.')} external>Consultar por WhatsApp</EditorialLink><a className="te-text-link" href="mailto:info@tonysportselsalvador.com?subject=Consulta%20sobre%20mi%20pedido">Escribir por correo <span aria-hidden="true">↗</span></a></div>
        </div>
        <div className="te-accordion">
          <details>
            <summary>¿Puedo cambiar o cancelar un pedido personalizado?</summary>
            <div className="te-guide-content"><p>Comunícate con Tony en cuanto necesites un cambio y antes de aprobar el arte si todavía estás en revisión. Indica qué quieres modificar y la referencia del pedido, si la tienes.</p><p>Los ajustes después de la aprobación o del inicio de producción pueden afectar el costo y la fecha. Pide que te confirmen las condiciones para tu caso antes de autorizar el cambio. Consulta las <Link className="privacy-inline-link" href="/terminos">condiciones del pedido</Link>.</p></div>
          </details>
          <details>
            <summary>¿Cómo solicito atención por un defecto o un pedido incorrecto?</summary>
            <div className="te-guide-content"><p>Escríbenos por WhatsApp o correo con una descripción del problema, la referencia del pedido si está disponible y fotografías de la prenda y del detalle que reportas. Indica cómo prefieres que te contactemos.</p><p>Para la primera consulta no necesitas enviar tu DUI, firma ni datos de tarjeta. Tony revisará la información contigo y te comunicará la atención que corresponde al caso. Conserva los documentos y la prenda para facilitar la revisión.</p></div>
          </details>
          <details>
            <summary>¿Cómo consulto una garantía o un reembolso?</summary>
            <div className="te-guide-content"><p>Usa los mismos contactos e indica el motivo de tu solicitud. Tony debe revisar el pedido, su estado y las condiciones acordadas para explicarte las opciones aplicables.</p><p>Antes de pagar, solicita que te aclaren las condiciones de garantía, cancelación y devolución del pedido específico. La atención de un reclamo no limita tus derechos como consumidor.</p></div>
          </details>
        </div>
      </div>
    </section>

    <section className="te-wrap te-cta" aria-labelledby="ayuda-datos">
      <div><SectionLabel number="03">Tus datos</SectionLabel><h2 id="ayuda-datos">También puedes<br/><em>preguntar por tu privacidad.</em></h2><p>Consulta qué información se utiliza y qué queda guardado en tu navegador. Para pedir acceso, corrección o eliminación de tus datos, usa los contactos publicados en nuestra política.</p><div className="te-actions"><EditorialLink href="/privacidad" outline>Política de privacidad</EditorialLink><EditorialLink href="/cookies" outline>Cookies y almacenamiento</EditorialLink></div></div>
    </section>
  </EditorialShell>;
}
