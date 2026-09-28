import SectionImage from '@/components/SectionImage';
import type { Metadata } from 'next';
import stores from '@/data/tony-stores.json';
import { StoreDirectory } from '@/components/EditorialTools';
import { EditorialShell, EditorialHero, EditorialLink, SectionLabel, SourceNote, whatsappLink } from '@/components/TonyEditorial';
export const metadata: Metadata = {title:'Tiendas y ubicaciones',description:'Encuentra las tiendas publicadas por Tony Sportswear en El Salvador: dirección, teléfono, ubicación y consulta de atención.'};
export default function StoresPage() {
  return <EditorialShell className="te-stores-page"><EditorialHero label="Tiendas" eyebrow="CERCA DE TU EQUIPO" title={<>Encuentra<br /><em>tu punto.</em></>} description="Busca una tienda, revisa cómo llegar y conversa con el equipo de Tony antes de visitarla." aside={<div className="te-large-word"><SectionImage photo="tiendas" shade="bottom" /><div>EL<br />SALVADOR.<small>UNA IDENTIDAD. MUCHAS CANCHAS.</small></div></div>} />
    <section className="te-wrap te-rule"><SectionLabel number="01">Directorio de tiendas</SectionLabel><StoreDirectory stores={stores} /><p className="te-address-note">Confirma el horario de atención y la disponibilidad antes de trasladarte. Cada tienda tiene su contacto directo.</p><SourceNote href="https://www.tonysportselsalvador.com/nuestras-tiendas/">Direcciones y contactos tomados del directorio publicado por Tony.</SourceNote></section>
    <section className="te-wrap"><div className="te-info-strip"><div><h3>Si vas por tu uniforme.</h3><p>Lleva el nombre del equipo, la cantidad de prendas y una referencia de tu idea. Si ya tienes una solicitud, comparte también sus datos para coordinar la atención.</p></div><div><h3>Si necesitas recibirlo.</h3><p>Consulta cobertura, costo y coordinación del servicio a domicilio para tu pedido. La fecha y las condiciones se acuerdan con Tony.</p><div className="te-actions"><EditorialLink href="/entregas" outline>Ver cómo coordinar la entrega</EditorialLink></div></div></div></section>
    <section className="te-cta te-wrap"><div><p className="te-eyebrow">TE AYUDAMOS A ENCONTRARNOS</p><h2>Hablemos de<br /><em>tu próxima visita.</em></h2><p>El canal central puede orientarte sobre la tienda y la atención que necesitas.</p></div><EditorialLink href={whatsappLink('Hola, Tony. Quiero que me orienten sobre una tienda para consultar mi uniforme. Mi ciudad es:')} external>Hablar con un asesor</EditorialLink></section>
  </EditorialShell>;
}
