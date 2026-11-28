import Link from 'next/link';
import {Fragment, type CSSProperties, type ReactNode} from 'react';
import Icon from '@/components/Icon';
import type {MenuCard} from '@/lib/product-menu';
import PictureCard from './PictureCard';
import './product.css';

type Props = {
  title:string;
  cards:MenuCard[];
  children?:ReactNode;
  navLabel?:string;
  more?:{href:string;label:string};
};

export default function LineOptions({title, cards, children, navLabel, more}: Props) {
  const groups = new Map<string, MenuCard[]>();
  for (const card of cards) {
    const name = card.group ?? '';
    const items = groups.get(name);
    if (items) items.push(card);
    else groups.set(name, [card]);
  }
  return <main id="contenido" className="tc-page"><div className="tc-wrap">
    {children}
    <header className="tc-head"><Link className="tc-back" href="/producto"><Icon name="left"/>Todas las disciplinas</Link><h1>{title}</h1></header>
    <nav aria-label={navLabel ?? 'Opciones de '+title}>
      {Array.from(groups, ([name,items],groupIndex) => <Fragment key={name}>
        {name && <h2 className="pd-option-heading">{name}</h2>}
        <ul className="tc-cards pd-cards pd-line-options" role="list" aria-label={name || undefined}
          style={{'--pd-options-width':(items.length*360 + (items.length-1)*16)+'px'} as CSSProperties}>
          {items.map((card,index)=><li key={card.id}>
            <PictureCard id={card.id} name={card.name} image={card.image} href={card.href} kind={card.whatsapp?'whatsapp':'page'}
              priority={groupIndex===0 && index<2 ? (index===0?'high':'auto') : false}/>
          </li>)}
        </ul>
      </Fragment>)}
      {more && <Link className="tc-btn pd-options-more" href={more.href}>{more.label}<Icon name="arrow"/></Link>}
    </nav>
  </div></main>;
}
