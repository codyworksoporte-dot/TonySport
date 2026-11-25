'use client';
import {useEffect,useRef,useState} from 'react';
import {siteAsset} from '@/lib/asset-path';
import type {ImplementFamily} from '@/lib/implements';

const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.tonyEffects==='off';

/**
 * The family chips of /implementos: a row that sticks under the site header, marks the family on screen
 * and jumps to it (the jump itself is HashFocus's job, so it also works before this hydrates).
 */
export default function ImplementChips({families}:{families:ImplementFamily[]}){
  const [active,setActive]=useState(families[0]?.id??'');
  const nav=useRef<HTMLElement>(null),row=useRef<HTMLDivElement>(null);

  // Stick right under the site header, whatever its height, and tell the sections how much to clear.
  useEffect(()=>{
    const element=nav.current,page=element?.closest<HTMLElement>('main');
    if(!element||!page)return;
    let frame=0;
    const measure=()=>{
      frame=0;
      const header=document.querySelector<HTMLElement>('.site-header')??document.querySelector<HTMLElement>('body header');
      const style=header?getComputedStyle(header):null;
      const top=header&&style&&/sticky|fixed/.test(style.position)?Math.max(0,Math.round((parseFloat(style.top)||0)+header.getBoundingClientRect().height)):0;
      page.style.setProperty('--im-top',`${top}px`);
      page.style.setProperty('--im-chips',`${Math.round(element.getBoundingClientRect().height)}px`);
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure);};
    measure();
    const observer=new ResizeObserver(schedule);
    observer.observe(element);
    const header=document.querySelector('.site-header');
    if(header)observer.observe(header);
    addEventListener('resize',schedule);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();removeEventListener('resize',schedule);};
  },[]);

  // Which family is on screen.
  useEffect(()=>{
    const sections=families.map(family=>document.getElementById(family.id)).filter((section):section is HTMLElement=>Boolean(section));
    const visible=new Map<string,boolean>();
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries)visible.set(entry.target.id,entry.isIntersecting);
      const first=sections.find(section=>visible.get(section.id));
      if(first)setActive(first.id);
    },{rootMargin:'-35% 0px -55% 0px'});
    sections.forEach(section=>observer.observe(section));
    return()=>observer.disconnect();
  },[families]);

  // Fade the edge where more chips are hidden.
  useEffect(()=>{
    const scroller=row.current;
    if(!scroller)return;
    let frame=0;
    const paint=()=>{
      frame=0;
      const max=scroller.scrollWidth-scroller.clientWidth,start=scroller.scrollLeft>4,end=scroller.scrollLeft<max-4;
      const fade=max<=4?'':start&&end?'both':start?'start':end?'end':'';
      if(fade)scroller.dataset.fade=fade;else delete scroller.dataset.fade;
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint);};
    paint();
    scroller.addEventListener('scroll',schedule,{passive:true});
    const observer=new ResizeObserver(schedule);
    observer.observe(scroller);
    return()=>{cancelAnimationFrame(frame);scroller.removeEventListener('scroll',schedule);observer.disconnect();};
  },[]);

  // Keep the marked chip in view inside the row (never scrolls the page). Only when the marked family changes:
  // the first chip is already in view, and scrolling on hydration would undo a swipe (or move a tap) the visitor
  // made before it.
  const followed=useRef(active);
  useEffect(()=>{
    if(followed.current===active)return;
    followed.current=active;
    const scroller=row.current,chip=scroller?.querySelector<HTMLElement>(`[data-family="${active}"]`);
    if(!scroller||!chip||scroller.scrollWidth<=scroller.clientWidth)return;
    const left=chip.offsetLeft-(scroller.clientWidth-chip.offsetWidth)/2;
    scroller.scrollTo({left:Math.max(0,left),behavior:calm()?'instant':'smooth'});
  },[active]);

  return <nav ref={nav} className="im-chips" aria-label="Familias de implementos" data-hash-offset="">
    <div ref={row} className="im-chips-row">
      {families.map(family=><a key={family.id} href={`#${family.id}`} data-family={family.id} className="im-chip" aria-current={active===family.id?'location':undefined}>
        <img src={siteAsset(family.cover)} alt="" width={40} height={40} decoding="async"/>
        <span>{family.name}</span>
      </a>)}
    </div>
  </nav>;
}
