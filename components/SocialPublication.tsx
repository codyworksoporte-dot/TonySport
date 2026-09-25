'use client';

import {useEffect,useRef,useState} from 'react';
import Icon from './Icon';
import {LOURDES_PUBLICATION,TONY_CHANNELS} from '@/lib/social-news';

type Provider='instagram'|'tiktok';
type Phase='idle'|'loading'|'opened'|'unavailable';

/** Instagram's load event cannot verify playback or login. TikTok must emit
 * its actual resize handshake before the external view becomes visible.
 * Neither signal claims that any video is playing. */
export default function SocialPublication({provider}:{provider:Provider}){
  const [phase,setPhase]=useState<Phase>('idle'),[attempt,setAttempt]=useState(0);
  const host=useRef<HTMLDivElement>(null);
  const isInstagram=provider==='instagram',name=TONY_CHANNELS[provider].name;
  const originalUrl=isInstagram?LOURDES_PUBLICATION.url:TONY_CHANNELS.tiktok.url;
  function start(){setPhase('loading');setAttempt(current=>current+1);}

  useEffect(()=>{
    if(!attempt||!host.current)return;
    const mount=host.current;
    let active=true,awaiting=true,observer:MutationObserver|undefined,script:HTMLScriptElement|undefined;
    const frameListeners:Array<{frame:HTMLIFrameElement;loaded:()=>void}>=[];
    const timeout=window.setTimeout(failed,12000);
    function failed(){if(!active||!awaiting)return;awaiting=false;clearTimeout(timeout);observer?.disconnect();script?.remove();setPhase('unavailable');mount.replaceChildren();}
    function opened(){if(active&&awaiting){awaiting=false;clearTimeout(timeout);setPhase('opened');}}
    function tiktokMessage(event:MessageEvent){
      if(!active||!awaiting||event.origin!=='https://www.tiktok.com'||typeof event.data!=='string')return;
      let data:{signalSource?:unknown;height?:unknown};
      try{data=JSON.parse(event.data);}catch{return;}
      if(!data||typeof data.signalSource!=='string'||typeof data.height!=='number'||!Number.isFinite(data.height)||data.height<=0)return;
      const frame=Array.from(mount.querySelectorAll('iframe')).find(item=>item.contentWindow===event.source);
      if(!frame||!frame.parentElement?.id||frame.name!==data.signalSource||frame.name!==`__tt_embed__${frame.parentElement.id}`)return;
      // The official SDK's receiveMessage() uses this same signalSource/height
      // contract. Source and exact frame name also bind it to this attempt.
      // Verified 2026-09-22 in embed_lib_v1.0.13.js, loaded by tiktok.com/embed.js.
      opened();
    }
    function watch(frame:HTMLIFrameElement){
      if(frameListeners.some(item=>item.frame===frame))return;
      frame.title=isInstagram?'Publicación de Tony Lourdes en Instagram':'Publicaciones de Tony Sportswear en TikTok';
      const loaded=()=>{if(isInstagram)opened();};
      frame.addEventListener('load',loaded);
      frameListeners.push({frame,loaded});
    }
    mount.replaceChildren();
    if(isInstagram){
      const frame=document.createElement('iframe');
      watch(frame);
      frame.src=LOURDES_PUBLICATION.embedUrl;
      frame.allow='encrypted-media; fullscreen; picture-in-picture';
      frame.referrerPolicy='strict-origin-when-cross-origin';
      frame.addEventListener('error',failed,{once:true});
      mount.append(frame);
    }else{
      // Official creator-profile markup. TikTok renders its own video links;
      // no video IDs, thumbnails, counts or successful playback are fabricated.
      window.addEventListener('message',tiktokMessage);
      const quote=document.createElement('blockquote');
      quote.className='tiktok-embed';
      quote.setAttribute('cite',TONY_CHANNELS.tiktok.url);
      quote.dataset.uniqueId='tonysportswear';
      quote.dataset.embedType='creator';
      quote.dataset.embedFrom='oembed';
      const section=document.createElement('section');
      const link=document.createElement('a');
      link.href=TONY_CHANNELS.tiktok.url;link.target='_blank';link.rel='noopener noreferrer';
      link.textContent=TONY_CHANNELS.tiktok.handle;
      section.append(link);quote.append(section);mount.append(quote);
      observer=new MutationObserver(()=>mount.querySelectorAll<HTMLIFrameElement>('iframe').forEach(watch));
      observer.observe(mount,{childList:true,subtree:true});
      script=document.createElement('script');script.src='https://www.tiktok.com/embed.js';script.async=true;
      script.addEventListener('error',failed,{once:true});document.body.append(script);
    }
    return()=>{active=false;clearTimeout(timeout);window.removeEventListener('message',tiktokMessage);observer?.disconnect();script?.remove();for(const {frame,loaded} of frameListeners)frame.removeEventListener('load',loaded);mount.replaceChildren();};
  },[attempt,isInstagram]);

  return <div className={`tn-embed tn-embed-${provider}`} data-state={phase}>
    <div className="tn-embed-stage">
      {phase==='idle'&&<div className="tn-embed-cover">
        <span className="tn-cover-top">{isInstagram?'DEL ARCHIVO DE TONY':'EL CANAL OFICIAL'}</span>
        <div className="tn-cover-wordmark" aria-hidden="true">{isInstagram?<>LOURDES.<br/><em>TAMBIÉN<br/>ES TONY.</em></>:<>TONY<br/><em>EN<br/>MOVIMIENTO.</em></>}</div>
        <div className="tn-cover-action"><span>{isInstagram?'Instagram · 11 SEP 2026':TONY_CHANNELS.tiktok.handle}</span><button type="button" onClick={start}>{isInstagram?'Ver publicación':'Ver publicaciones de TikTok'}<Icon name="diagonal"/></button><small>{isInstagram?'Carga la publicación original de Instagram.':'Carga el perfil y las publicaciones que muestre TikTok.'}</small></div>
      </div>}
      <div ref={host} className="tn-embed-host" aria-busy={phase==='loading'} aria-hidden={phase==='loading'} inert={phase==='loading'} hidden={phase==='idle'||phase==='unavailable'}/>
      {phase==='loading'&&<div className="tn-embed-loading" role="status"><span className="tn-loading-mark" aria-hidden="true"/><strong>Conectando con {name}…</strong><span>Puedes abrir el original mientras carga.</span></div>}
      {phase==='unavailable'&&<div className="tn-embed-fallback" role="status"><span className="tn-fallback-mark" aria-hidden="true">!</span><h3>Esta vez no se pudo cargar.</h3><p>{name} no respondió a tiempo o la vista está bloqueada. El enlace original sigue disponible.</p><button type="button" onClick={start}>Reintentar <Icon/></button></div>}
    </div>
    <div className="tn-embed-footer"><a href={originalUrl} target="_blank" rel="noopener noreferrer">{isInstagram?'Abrir publicación en Instagram':'Ir al canal de TikTok'}<Icon name="diagonal"/></a><p>{phase==='opened'?`Vista externa de ${name}. Si no aparece el contenido o pide iniciar sesión, usa el enlace original.`:`El contenido se carga desde ${name} cuando lo solicitas.`}</p>{phase==='opened'&&<button className="tn-embed-retry" type="button" onClick={start}>¿No se muestra? Reintentar</button>}</div>
  </div>;
}
