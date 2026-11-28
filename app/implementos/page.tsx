import type {Metadata} from 'next';
import Link from 'next/link';
import Icon from '@/components/Icon';
import CategoryAliases from '@/components/product/CategoryAliases';
import ImplementChips from '@/components/product/ImplementChips';
import PictureCard from '@/components/product/PictureCard';
import {IMPLEMENT_FAMILIES,implementsOf} from '@/lib/implements';
import {siteAsset} from '@/lib/asset-path';
import {fitted} from '@/lib/responsive-image';
import {TONY_WHATSAPP_NUMBER,whatsappLink} from '@/lib/site-links';
import '@/components/product/product.css';
import './implementos.css';

export const metadata:Metadata={
  title:'Implementos deportivos',
  description:'Balones de fútbol, fútbol sala y baloncesto, guantes de portero, espinilleras, béisbol, mallas y accesorios que vende Tony Sportswear.',
};

const familyPaths=Object.fromEntries(IMPLEMENT_FAMILIES.map(family=>[family.id,'/implementos/'+family.id]));
/** Chips (40 px) and section avatars (64 px) show the family cover small: its 240 px copy is plenty, even on 3x screens. */
const SMALL_COVER=240;
const CHIP_FAMILIES=IMPLEMENT_FAMILIES.map(family=>({...family,cover:fitted(family.cover,SMALL_COVER)}));
/** Cards in the first row of the first family: the page's first pictures (the first one is its LCP). */
const LEAD_CARDS=2;

export default function Implementos(){
  return <main id="contenido" className="tc-page im-page">
    <CategoryAliases paths={familyPaths}/>
    <div className="tc-wrap">
      <header className="tc-head pd-head">
        <Link className="tc-back" href="/producto"><Icon name="left"/>Disciplinas</Link>
        <h1>Implementos deportivos</h1>
        <p>Toca un producto para verlo en la tienda oficial de Tony.</p>
      </header>
    </div>

    <ImplementChips families={CHIP_FAMILIES}/>

    <div className="tc-wrap">
      {IMPLEMENT_FAMILIES.map((family,familyIndex)=><section key={family.id} id={family.id} className="tc-sec pd-sec im-sec" aria-labelledby={`titulo-${family.id}`}>
        <header className="tc-sec-h pd-sec-h">
          <div className="pd-sec-title">
            <img className="pd-sec-avatar im-avatar" src={siteAsset(fitted(family.cover,SMALL_COVER))} alt="" width={64} height={64} loading="lazy" decoding="async"/>
            <h2 id={`titulo-${family.id}`}>{family.name}</h2>
          </div>
        </header>
        <ul className="tc-cards pd-cards" role="list">
          {implementsOf(family.id).map((item,index)=><li key={item.id}>
            <PictureCard name={item.name} image={item.image} href={item.href} kind="external" label={`${item.name} en la tienda oficial de Tony`} priority={familyIndex===0&&index<LEAD_CARDS&&(index===0?'high':'auto')}/>
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
