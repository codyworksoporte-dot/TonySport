import type {CSSProperties} from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import LeadImage from '@/components/media/LeadImage';
import {DISCIPLINES,disciplineHref} from '@/lib/disciplines';
import {imageFocus} from '@/lib/product-menu';
import {ON_SCREEN,disciplinePhoto} from './discipline-photos';
import './product.css';

/**
 * "Escoge tu disciplina deportiva": the 13 lines as giant picture buttons. Each one jumps to its
 * section on /producto (#categoria-<id>); on /producto itself the jump stays on the page.
 */
export default function DisciplineGrid({label='Disciplinas'}:{label?:string}){
  return <ul className="pd-grid" role="list" aria-label={label}>
    {DISCIPLINES.map((discipline,index)=>{
      const photo={...disciplinePhoto(discipline.image,index),alt:'',width:440,height:550,decoding:'async' as const,style:imageFocus(discipline.image)};
      return <li key={discipline.id} className={index===0?'is-lead is-wide':index===1?'is-wide':undefined}>
        <Link href={disciplineHref(discipline.id)} className={`tc-tile pd-tile tc-rise${discipline.image.includes('/sections/')?'':' is-product'}`} style={{'--i':index} as CSSProperties}>
          {/* The tiles on screen when a phone opens the page load at once; the rest load as they come near the
              screen. Default priority: the h1 or a smaller tile is the LCP, and a high-priority photo would take
              bandwidth from the render-blocking CSS on slow phones (FCP +300 ms measured). */}
          {index<ON_SCREEN?<LeadImage {...photo} fetchPriority="auto"/>:<img {...photo} loading="lazy"/>}
          <span className="tc-tile-label"><b>{discipline.name}</b><span className="tc-go"><Icon name="arrow"/></span></span>
        </Link>
      </li>;
    })}
  </ul>;
}
