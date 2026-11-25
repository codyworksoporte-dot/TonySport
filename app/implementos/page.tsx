import type {Metadata} from 'next';
import Link from 'next/link';
import Icon from '@/components/Icon';
import HashFocus from '@/components/product/HashFocus';
import ImplementChips from '@/components/product/ImplementChips';
import PictureCard from '@/components/product/PictureCard';
import {IMPLEMENT_FAMILIES,implementsOf} from '@/lib/implements';
import {siteAsset} from '@/lib/asset-path';
import {TONY_WHATSAPP_NUMBER,whatsappLink} from '@/lib/site-links';
import '@/components/product/product.css';
import './implementos.css';

export const metadata:Metadata={
  title:'Implementos deportivos',
  description:'Balones de fútbol, fútbol sala y baloncesto, guantes de portero, espinilleras, béisbol, mallas y accesorios que vende Tony Sportswear.',
};

const FAMILY_IDS=IMPLEMENT_FAMILIES.map(family=>family.id);

export default function Implementos(){
  return <main id="contenido" className="tc-page im-page">
    <HashFocus ids={FAMILY_IDS}/>
    <div className="tc-wrap">
      <header className="tc-head pd-head">
        <Link className="tc-back" href="/producto#categoria-implementos"><Icon name="left"/>Disciplinas</Link>
        <h1>Implementos deportivos</h1>
        <p>Toca un producto para verlo en la tienda oficial de Tony.</p>
      </header>
    </div>

    <ImplementChips families={IMPLEMENT_FAMILIES}/>

    <div className="tc-wrap">
      {IMPLEMENT_FAMILIES.map(family=><section key={family.id} id={family.id} className="tc-sec pd-sec im-sec" aria-labelledby={`titulo-${family.id}`}>
        <header className="tc-sec-h pd-sec-h">
          <div className="pd-sec-title">
            <img className="pd-sec-avatar im-avatar" src={siteAsset(family.cover)} alt="" width={64} height={64} loading="lazy" decoding="async"/>
            <h2 id={`titulo-${family.id}`}>{family.name}</h2>
          </div>
        </header>
        <ul className="tc-cards pd-cards" role="list">
          {implementsOf(family.id).map(item=><li key={item.id}>
            <PictureCard name={item.name} image={item.image} href={item.href} kind="external" label={`${item.name} en la tienda oficial de Tony`}/>
          </li>)}
        </ul>
      </section>)}

      <aside className="im-more" aria-labelledby="im-more-title">
        <h2 id="im-more-title" className="tc-display">¿Buscas otro implemento?</h2>
        <a className="tc-btn tc-btn--wa tc-btn--lg" href={whatsappLink('Hola, Tony. Busco un implemento deportivo.')} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp-solid"/>Escríbenos al {TONY_WHATSAPP_NUMBER}<span className="tc-sr"> (WhatsApp, se abre en otra pestaña)</span></a>
      </aside>
    </div>
  </main>;
}
