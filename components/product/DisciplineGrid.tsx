import type {CSSProperties} from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import {DISCIPLINES,disciplineHref} from '@/lib/disciplines';
import {siteAsset} from '@/lib/asset-path';
import {imageFocus} from '@/lib/product-menu';
import './product.css';

/**
 * "Escoge tu disciplina deportiva": the 13 lines as giant picture buttons. Each one jumps to its
 * section on /producto (#categoria-<id>); on /producto itself the jump stays on the page.
 */
export default function DisciplineGrid({label='Disciplinas'}:{label?:string}){
  return <ul className="pd-grid" role="list" aria-label={label}>
    {DISCIPLINES.map((discipline,index)=><li key={discipline.id} className={index===0?'is-lead is-wide':index===1?'is-wide':undefined}>
      <Link href={disciplineHref(discipline.id)} className={`tc-tile pd-tile tc-rise${discipline.image.includes('/sections/')?'':' is-product'}`} style={{'--i':index} as CSSProperties}>
        <img src={siteAsset(discipline.image)} alt="" width={440} height={550} loading={index<6?'eager':'lazy'} decoding="async" style={imageFocus(discipline.image)}/>
        <span className="tc-tile-label"><b>{discipline.name}</b><span className="tc-go"><Icon name="arrow"/></span></span>
      </Link>
    </li>)}
  </ul>;
}
