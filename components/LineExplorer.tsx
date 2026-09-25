'use client';
import {useEffect,useId,useState,type CSSProperties,type KeyboardEvent} from 'react';
import Link from 'next/link';
import {SPORT_LINES,lineQuote} from '@/lib/lines';
import LineArtwork from './LineArtwork';
import Icon from './Icon';
import './line-explorer.css';

export default function LineExplorer({full=false}:{full?:boolean}) {
  const [selected,setSelected]=useState('futbol'),[instant,setInstant]=useState(true);
  const uid=useId().replace(/:/g,'');
  const tabId=(id:string)=>full?id:`${uid}-${id}`;
  const line=SPORT_LINES.find(item=>item.id===selected)??SPORT_LINES[0];
  const index=SPORT_LINES.indexOf(line);
  useEffect(()=>{
    if(!full)return;
    const fromURL=()=>{const id=window.location.hash.slice(1);setInstant(true);setSelected(SPORT_LINES.some(item=>item.id===id)?id:'futbol');};
    fromURL();window.addEventListener('hashchange',fromURL);window.addEventListener('popstate',fromURL);
    return()=>{window.removeEventListener('hashchange',fromURL);window.removeEventListener('popstate',fromURL);};
  },[full]);
  function choose(id:string,keyboard=false){
    setInstant(keyboard);setSelected(id);
    if(full)window.history.replaceState(window.history.state,'',`${window.location.pathname}${window.location.search}#${id}`);
  }
  function navigate(event:KeyboardEvent<HTMLButtonElement>,current:number){
    let next=current;
    if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(current+1)%SPORT_LINES.length;
    else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(current+SPORT_LINES.length-1)%SPORT_LINES.length;
    else if(event.key==='Home')next=0;else if(event.key==='End')next=SPORT_LINES.length-1;else return;
    event.preventDefault();choose(SPORT_LINES[next].id,true);document.getElementById(tabId(SPORT_LINES[next].id))?.focus();
  }
  return <section className={`line-explorer ${full?'lx-full':''}`} id="lineas-tony" aria-labelledby={`${uid}-heading`} data-instant={instant}>
    {!full&&<header className="lx-heading"><div><p className="eyebrow"><span className="section-index">01</span> DISTINTAS FORMAS DE COMPETIR.</p><h2 id={`${uid}-heading`}>ENCUENTRA<br/><em>TU TERRENO.</em></h2></div><p>De la cancha a tu empresa.<br/>Una identidad propia para cada equipo.</p><Link href="/lineas" className="lx-all">Explorar todas las líneas <Icon name="diagonal"/></Link></header>}
    {full&&<h2 className="sr-only" id={`${uid}-heading`}>Explora las líneas Tony</h2>}
    <div className="lx-console">
      <div className="lx-directory"><div className="lx-directory-top"><span>ELIGE TU LÍNEA</span><strong>01—09</strong></div><div className="lx-tabs" role="tablist" aria-label="Líneas Tony" aria-orientation="vertical">{SPORT_LINES.map((item,i)=><button type="button" role="tab" key={item.id} id={tabId(item.id)} aria-controls={`${uid}-panel`} aria-selected={selected===item.id} tabIndex={selected===item.id?0:-1} onClick={event=>choose(item.id,event.detail===0)} onKeyDown={event=>navigate(event,i)}><span className="lx-tab-index">{String(i+1).padStart(2,'0')}</span><strong>{item.name}</strong><span className="lx-tab-corner" aria-hidden="true">✓</span></button>)}</div><Link href="/calidad" className="lx-directory-foot">Conoce los acabados <Icon name="diagonal"/></Link></div>
      <div className="lx-visual" style={{'--line-color':line.color} as CSSProperties}>
        <div className="lx-visual-top"><span>ESTUDIO DE IDENTIDAD</span><span>TONY / {String(index+1).padStart(2,'0')}</span></div>
        <span className="lx-giant-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span>
        <div className="lx-terrain" aria-hidden="true"><svg viewBox="0 0 640 500"><path d="M30 60h580v380H30zM320 60v380"/><circle cx="320" cy="250" r="75"/><path d="M30 145h110v210H30m580-210H500v210h110M80 60v380m480-380v380"/></svg></div>
        <div className="lx-art-stack">{SPORT_LINES.map(item=><div className={`lx-art${item.id===selected?' is-active':''}`} aria-hidden={item.id!==selected} key={item.id}><LineArtwork line={item}/></div>)}</div>
        <div className="lx-swatch-label"><i style={{background:line.color}}/><i style={{background:line.accent}}/><span>TUS COLORES CAMBIAN EL JUEGO.</span></div>
        <span className="lx-concept">Ilustración de línea · el diseño se define contigo</span>
      </div>
      <div className="lx-detail" role="tabpanel" id={`${uid}-panel`} aria-labelledby={tabId(line.id)} tabIndex={0}>
        <p className="lx-kicker">LÍNEA {line.name.toUpperCase()}</p><h3>{line.headline.split('\n').map((text,i)=><span key={text}>{i===1?<em>{text}</em>:text}</span>)}</h3><p className="lx-description">{line.description}</p>
        <ul className="lx-inclusions">{line.items.map(item=><li key={item}><span aria-hidden="true">+</span>{item}</li>)}</ul>
        <p className="lx-detail-note">{line.note}</p>
        {line.id==='futbol'&&!full?<Link href="/configurador" className="button primary">Crear mi uniforme <span className="button-icon"><Icon name="diagonal"/></span></Link>:<a href={lineQuote(line)} target="_blank" rel="noopener noreferrer" className="button primary">Consultar esta línea <span className="button-icon"><Icon name="diagonal"/></span></a>}
        <span className="lx-request-note">Diseño y opciones sujetos a confirmación con Tony.</span>
      </div>
    </div>
  </section>;
}
