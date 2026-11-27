import type {CSSProperties} from 'react';
import type {Metadata} from 'next';
import Link from 'next/link';
import Icon from '@/components/Icon';
import DisciplineGrid from '@/components/product/DisciplineGrid';
import PictureCard from '@/components/product/PictureCard';
import SearchButton from '@/components/product/SearchButton';
import {DISCIPLINES_TITLE} from '@/lib/disciplines';
import {PRODUCT_MENU} from '@/lib/product-menu';
import {siteAsset} from '@/lib/asset-path';
import {fitted,responsive} from '@/lib/responsive-image';
import {TONY_WHATSAPP_NUMBER,whatsappLink} from '@/lib/site-links';
import ProductDirectorySync from './ProductDirectorySync';
import '@/components/product/product.css';
import './producto.css';

export const metadata:Metadata={
  title:DISCIPLINES_TITLE,
  description:'Fútbol, baloncesto, voleibol, ciclismo, running, racing, empresarial, réplicas, hoddies e implementos: escoge tu disciplina y mira los productos de Tony Sportswear.',
};

// How many card columns a section takes on a 5-, 4- and 3-column page (producto.css): short lines share a
// row with the next ones, so the page has no half-empty rows, and every card has the same size.
const spans=(cards:number)=>({'--s5':Math.min(cards,5),'--s4':Math.min(cards,4),'--s3':Math.min(cards,3)}) as CSSProperties;

export default function Producto(){
  return <main id="contenido" className="tc-page pd-page">
    <ProductDirectorySync/>
    <div className="tc-wrap">
      <header className="tc-head pd-head">
        <Link className="tc-back" href="/"><Icon name="left"/>Inicio</Link>
        <h1>{DISCIPLINES_TITLE}</h1>
        <p>Toca una disciplina y mira sus productos.</p>
      </header>

      <div id="directorio-producto" className="pd-directory">
        <DisciplineGrid/>
      </div>

      <div className="pd-sections">
      {PRODUCT_MENU.map(section=><section key={section.id} id={`categoria-${section.id}`} className="tc-sec pd-sec" style={spans(section.cards.length)} aria-labelledby={`titulo-${section.id}`}>
        <header className="tc-sec-h pd-sec-h">
          <div className="pd-sec-title">
            <img className="pd-sec-avatar" src={siteAsset(fitted(section.image,240))} alt="" width={64} height={64} loading="lazy" decoding="async"/>
            <h2 id={`titulo-${section.id}`}>{section.name}</h2>
          </div>
          {section.more&&<Link href={section.more.href}>{section.more.label}<Icon name="arrow"/></Link>}
        </header>
        <ul className={`tc-cards pd-cards${section.featured?' has-feature':''}`} role="list">
          {section.cards.map(card=><li key={card.id}>
            <PictureCard id={card.id} name={card.name} image={card.image} href={card.href} kind={card.whatsapp?'whatsapp':'page'}/>
          </li>)}
          {section.more&&<li className="pd-more">
            <Link href={section.more.href} className="tc-tile pd-more-tile">
              <img {...responsive(section.image,'(max-width: 899px) 33vw, 520px')} alt="" width={800} height={800} loading="lazy" decoding="async"/>
              <span className="tc-tile-label"><b>{section.more.cta}</b><span className="tc-go"><Icon name="arrow"/></span></span>
            </Link>
          </li>}
        </ul>
      </section>)}
      </div>

      <aside className="pd-help" aria-labelledby="pd-help-title">
        <h2 id="pd-help-title" className="tc-display">¿Buscas algo en específico?</h2>
        <div className="pd-help-actions">
          <SearchButton className="tc-pill pd-help-search"><Icon name="search"/><span>Buscar en Tony</span></SearchButton>
          <a className="tc-btn tc-btn--wa tc-btn--lg pd-help-wa" href={whatsappLink('Hola, Tony. Busco un producto y quisiera ayuda.')} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp-solid"/>{TONY_WHATSAPP_NUMBER}<span className="tc-sr"> · escribir por WhatsApp (se abre en otra pestaña)</span></a>
        </div>
      </aside>
    </div>
  </main>;
}
