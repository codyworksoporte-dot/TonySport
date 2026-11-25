'use client';
import {useEffect} from 'react';

type Props = {
  /** Ids that start with one of these (e.g. `categoria-`) are handled. */
  prefixes?:string[];
  /** Exact ids that are handled. */
  ids?:string[];
  /** Old anchors mapped to the current id (e.g. `futbol` → `categoria-futbol`). */
  aliases?:Record<string,string>;
};

const HIGHLIGHT='is-hash-target';
const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.tonyEffects==='off';

/** Height of what sticks to the top of the viewport: the site header, plus any bar marked data-hash-offset. */
function stuckHeight(){
  let bottom=0;
  document.querySelectorAll<HTMLElement>('.site-header,[data-hash-offset]').forEach(element=>{
    const style=getComputedStyle(element);
    if(!/sticky|fixed/.test(style.position)||style.display==='none'||style.visibility==='hidden')return;
    bottom=Math.max(bottom,(parseFloat(style.top)||0)+element.getBoundingClientRect().height);
  });
  return bottom;
}
/** Scrolls so the target starts just under the sticky header, whatever the global scroll-padding is. */
function reveal(target:HTMLElement,smooth:boolean){
  const gap=innerWidth<900?16:24;
  const top=target.getBoundingClientRect().top+scrollY-stuckHeight()-gap;
  scrollTo({top:Math.max(0,Math.round(top)),behavior:smooth&&!calm()?'smooth':'instant'});
}

/**
 * Lands hash links on their section, just under the sticky header (and any bar marked data-hash-offset), and briefly
 * highlights it. Same-page links (plain or Next <Link>) are handled here, because a Next navigation
 * changes history without a `hashchange` event.
 */
export default function HashFocus({prefixes=[],ids=[],aliases={}}:Props){
  const key=JSON.stringify([prefixes,ids,aliases]);
  useEffect(()=>{
    const [pre,exact,alias]=JSON.parse(key) as [string[],string[],Record<string,string>];
    let timer=0;
    const resolve=(hash:string)=>{
      let id='';
      try{id=decodeURIComponent(hash.replace(/^#/,''));}catch{return null;}
      const aliased=alias[id];
      if(aliased)id=aliased;
      if(!id||!(exact.includes(id)||pre.some(prefix=>id.startsWith(prefix))))return null;
      const target=document.getElementById(id);
      return target?{id,target,aliased:Boolean(aliased)}:null;
    };
    const land=(target:HTMLElement,scroll:boolean,smooth:boolean)=>{
      if(scroll)reveal(target,smooth);
      document.querySelectorAll(`.${HIGHLIGHT}`).forEach(element=>element.classList.remove(HIGHLIGHT));
      void target.offsetWidth; // restart the highlight when the same target is chosen twice
      target.classList.add(HIGHLIGHT);
      window.clearTimeout(timer);
      timer=window.setTimeout(()=>target.classList.remove(HIGHLIGHT),2200);
    };
    const canonical=(id:string)=>{
      const url=`${location.pathname}${location.search}#${id}`;
      if(location.hash!==`#${id}`)history.replaceState(history.state,'',url);
    };

    // First load (or arriving from another page): the browser may already be there; make sure. Fonts and
    // pictures can still change the height of what is above, so for a few seconds the page keeps the
    // section in place, until the visitor scrolls on their own.
    const initial=resolve(location.hash);
    let settle:ResizeObserver|null=null,settleTimer=0;
    const stopSettling=()=>{
      settle?.disconnect();settle=null;window.clearTimeout(settleTimer);
      removeEventListener('wheel',stopSettling);removeEventListener('touchstart',stopSettling);removeEventListener('pointerdown',stopSettling);removeEventListener('keydown',stopSettling);
    };
    if(initial){
      if(initial.aliased)canonical(initial.id);
      const hold=()=>{if(settle)reveal(initial.target,false);}; // a frame already scheduled must not outlive stopSettling
      requestAnimationFrame(()=>land(initial.target,true,false));
      let frame=0;
      settle=new ResizeObserver(()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;hold();});});
      settle.observe(document.body);
      document.fonts?.ready.then(()=>{if(settle)requestAnimationFrame(hold);}).catch(()=>{});
      addEventListener('wheel',stopSettling,{passive:true});addEventListener('touchstart',stopSettling,{passive:true});addEventListener('pointerdown',stopSettling,{passive:true});addEventListener('keydown',stopSettling);
      settleTimer=window.setTimeout(stopSettling,4000);
    }

    const onHash=()=>{
      const found=resolve(location.hash);
      if(!found)return;
      // A new destination (Back/Forward, a typed hash) ends the hold on the first one, or a late resize pulls the page back.
      stopSettling();
      if(found.aliased)canonical(found.id);
      land(found.target,true,true);
    };
    const onClick=(event:MouseEvent)=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const anchor=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href]'):null;
      if(!anchor||(anchor.target&&anchor.target!=='_self')||anchor.hasAttribute('download'))return;
      const url=new URL(anchor.href,location.href);
      if(url.origin!==location.origin||url.pathname!==location.pathname||url.search!==location.search||!url.hash)return;
      const found=resolve(url.hash);
      if(!found)return;
      event.preventDefault();
      stopSettling();
      if(location.hash!==`#${found.id}`)history.pushState(history.state,'',`${url.pathname}${url.search}#${found.id}`);
      // Next frame: menus and the search dialog close first, then the page moves.
      requestAnimationFrame(()=>land(found.target,true,true));
    };
    window.addEventListener('hashchange',onHash);
    document.addEventListener('click',onClick,true);
    return()=>{
      stopSettling();
      window.clearTimeout(timer);
      window.removeEventListener('hashchange',onHash);
      document.removeEventListener('click',onClick,true);
    };
  },[key]);
  return null;
}
