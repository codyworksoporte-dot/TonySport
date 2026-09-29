'use client';
import {accountStorageKey} from '@/lib/auth';

import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import Jersey from '@/components/Jersey';
import Icon from '@/components/Icon';
import TeamRoster from '@/components/TeamRoster';
import TeamDesignStudio from '@/components/TeamDesignStudio';
import OrderArtworkReview from '@/components/OrderArtworkReview';
import AddToCart from '@/components/AddToCart';
import {techniqueLabel} from '@/lib/studio';
import {activePlayers,collarLabel,createOrder,LEGACY_STORAGE_KEY,migrateOrder,MIN_QUANTITY,ORDER_STORAGE_KEY,orderText,playerComplete,quantityOf,readOrder,rosterCSV,validateOrder,variantLabel,withQuantity,type DesignAssets,type OrderDraft,type OrderErrors,type Player} from '@/lib/order';
import {loadAssets,saveAssets} from '@/lib/order-assets';
import '@/app/configurador/configurator.css';
import '@/app/configurador/team-order.css';

const steps=['Cantidad','Jugadores','Diseño','Revisión'];
const headings=['PRIMERO, TU EQUIPO.','CADA JUGADOR CUENTA.','TU IDEA. TU UNIFORME.','TODO TU EQUIPO, LISTO.'];
const descriptions=['Define cuántas prendas necesitas. Después personalizamos cada una.','Un nombre, una talla y un dorsal por persona. Sin perder ningún detalle.','Elige un punto de partida o trae tu propio diseño. La identidad la decides tú.','Revisa la lista completa y comparte tu solicitud con Tony.'];
function missingArtwork(order:OrderDraft,assets:DesignAssets){
  return order.design.mode==='reference' ? !assets.front : order.design.layers.some(layer=>layer.kind==='image'&&layer.visible&&layer.opacity>0&&(!layer.assetKey||!assets[layer.assetKey]));
}

function download(content:string,name:string,type:string){
  const url=URL.createObjectURL(new Blob([content],{type}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export default function ConfiguratorPage(){
  const [order,setOrder]=useState<OrderDraft>(createOrder);
  const [assets,setAssets]=useState<DesignAssets>({});
  const [ready,setReady]=useState(false),[assetsReady,setAssetsReady]=useState(false);
  const [step,setStep]=useState(1),[furthest,setFurthest]=useState(1);
  const [errors,setErrors]=useState<OrderErrors>({});
  const [storage,setStorage]=useState<'saved'|'restored'|'unavailable'>('saved');
  const [artworkStorage,setArtworkStorage]=useState(true);
  const [studioBusy,setStudioBusy]=useState(false);
  const [resetOpen,setResetOpen]=useState(false);
  const title=useRef<HTMLHeadingElement>(null),resetDialog=useRef<HTMLDialogElement>(null);
  const initialized=useRef(false),navigated=useRef(false),errorFocus=useRef('');
  const current=useRef(order),currentAssets=useRef(assets);
  const fileSaveQueue=useRef(Promise.resolve());
  const assetEpoch=useRef(0);
  const renderedAssetEpoch=assetEpoch.current;

  useEffect(()=>{
    if(initialized.current)return;
    initialized.current=true;
    let next=createOrder();
    try{
      const saved=localStorage.getItem(accountStorageKey(ORDER_STORAGE_KEY));
      const legacy=!saved?localStorage.getItem(accountStorageKey(LEGACY_STORAGE_KEY)):null;
      const recovered=saved?readOrder(JSON.parse(saved)):legacy?migrateOrder(JSON.parse(legacy)):null;
      if(recovered){next=recovered;setStorage('restored');}
    }catch{setStorage('unavailable');}
    const params=new URLSearchParams(window.location.search);
    const color=params.get('color');
    if(color && /^#[\da-f]{6}$/i.test(color))next.design.color=color.toUpperCase();
    const team=params.get('name');if(team)next.team=team.trim().slice(0,24);
    const style=params.get('style');if(style==='clean'||style==='stripe'||style==='scales')next.design.variant=style;
    // A home preview dorsal is an example, not a player's roster entry.
    for(const key of ['color','name','number','style'])params.delete(key);
    setOrder(next);current.current=next;setReady(true);
    const requested=Number(window.location.hash.replace('#paso-',''));
    const restoredStep=Object.keys(validateOrder(next,1)).length?1:Object.keys(validateOrder(next,2)).length?Math.min(requested||1,2):Math.min(requested||1,3);
    const safe=[1,2,3].includes(restoredStep)?restoredStep:1;
    setStep(safe);setFurthest(safe);
    const query=params.toString();
    window.history.replaceState(window.history.state,'',`${window.location.pathname}${query?`?${query}`:''}#paso-${safe}`);
    const loadEpoch=assetEpoch.current;
    loadAssets().then(value=>{if(assetEpoch.current===loadEpoch)setAssets(value);}).catch(()=>setArtworkStorage(false)).finally(()=>setAssetsReady(true));
  },[]);

  useEffect(()=>{
    current.current=order;
    if(!ready)return;
    try{localStorage.setItem(accountStorageKey(ORDER_STORAGE_KEY),JSON.stringify(order));setStorage(s=>s==='restored'?'restored':'saved');}
    catch{setStorage('unavailable');}
  },[order,ready]);
  useEffect(()=>{
    currentAssets.current=assets;
    if(!assetsReady)return;
    fileSaveQueue.current=fileSaveQueue.current.then(()=>saveAssets(assets)).then(()=>setArtworkStorage(true)).catch(()=>setArtworkStorage(false));
  },[assets,assetsReady]);
  useEffect(()=>{
    const onBack=()=>{
      const requested=Number(window.location.hash.replace('#paso-',''));
      let safe=[1,2,3,4].includes(requested)?requested:1;
      if(safe>1 && Object.keys(validateOrder(current.current,1)).length)safe=1;
      else if(safe>2 && Object.keys(validateOrder(current.current,2)).length)safe=2;
      else if(safe===4 && missingArtwork(current.current,currentAssets.current))safe=3;
      if(safe!==requested)window.history.replaceState(window.history.state,'',`${window.location.pathname}${window.location.search}#paso-${safe}`);
      navigated.current=true;setErrors({});setStep(safe);setFurthest(value=>Math.max(value,safe));
    };
    window.addEventListener('popstate',onBack);return()=>window.removeEventListener('popstate',onBack);
  },[]);
  useEffect(()=>{
    if(navigated.current && !errorFocus.current)title.current?.focus({preventScroll:true});
  },[step]);
  useEffect(()=>{
    if(errorFocus.current){document.getElementById(errorFocus.current)?.focus();errorFocus.current='';}
  },[step,errors]);
  useEffect(()=>{if(resetOpen)resetDialog.current?.showModal();else resetDialog.current?.close();},[resetOpen]);

  function edit<K extends keyof OrderDraft>(key:K,value:OrderDraft[K]){
    setOrder(previous=>({...previous,[key]:value}));setStorage(s=>s==='unavailable'?s:'saved');
    if(key==='team')setErrors(previous=>{const next={...previous};delete next['cfg-team'];return next;});
  }
  function editPlayers(players:Player[]){
    setOrder(previous=>({...previous,players:[...players,...previous.players.slice(players.length)]}));
    setErrors(previous=>{
      const updated=validateOrder({...order,players:[...players,...order.players.slice(players.length)]},2);
      return Object.fromEntries(Object.entries(previous).filter(([key])=>Boolean(updated[key])));
    });
  }
  function goTo(next:number){
    if(next>step){
      const found=validateOrder(order,Math.min(next-1,2));
      if(next===4 && studioBusy)found['order-design-error']='Espera a que termine de abrirse tu imagen para revisar el pedido.';
      if(next===4 && missingArtwork(order,assets))found['order-design-error']=order.design.mode==='reference'?'Añade una referencia frontal o elige una base del editor para continuar.':'Falta el archivo de una imagen del diseño. Vuelve a subirlo o elimina esa capa antes de continuar.';
      const first=Object.keys(found)[0];
      if(first){
        errorFocus.current=first;setErrors(found);
        const failedStep=first==='cfg-quantity'?1:first==='order-design-error'?3:2;
        setStep(failedStep);setFurthest(value=>Math.max(value,failedStep));
        window.history.replaceState(window.history.state,'',`${window.location.pathname}${window.location.search}#paso-${failedStep}`);
        return;
      }
    }
    if(next===step)return;
    navigated.current=true;setStep(next);setFurthest(value=>Math.max(value,next));setErrors({});
    window.history.pushState(window.history.state,'',`${window.location.pathname}${window.location.search}#paso-${next}`);
    document.getElementById('order-workspace')?.scrollIntoView({behavior:'instant',block:'start'});
  }
  function resetOrder(){
    assetEpoch.current+=1;
    setOrder(createOrder());setAssets({});setStep(1);setFurthest(1);setErrors({});setResetOpen(false);setStorage('saved');
    try{localStorage.removeItem(accountStorageKey(LEGACY_STORAGE_KEY));}catch{}
    window.history.replaceState(window.history.state,'',`${window.location.pathname}#paso-1`);
  }
  const players=activePlayers(order),complete=players.filter(playerComplete).length;
  const fullText=orderText(order);
  const fullMessage=`¡Hola, Tony! Quiero cotizar este pedido.\n\n${fullText}`;
  const longMessage=encodeURIComponent(fullMessage).length>6500;
  const message=longMessage?`¡Hola, Tony! Quiero cotizar ${order.quantity} ${order.line==='kit'?'uniformes completos':'camisas'} para ${order.team.trim()}. Preparé una lista de ${players.length} jugadores. Voy a adjuntar el resumen descargado con los nombres, tallas y dorsales, y las referencias por separado. ¿Me ayudas a confirmar el diseño, precio y entrega?`:fullMessage;
  const sizes=players.reduce<Record<string,number>>((result,p)=>{if(p.size)result[p.size]=(result[p.size]||0)+1;return result;},{});

  return <main className="cfg-page order-page" id="contenido">
    <div className="order-topbar"><Link href="/">← Volver a Tony</Link><span>TONY / TEAM STUDIO</span><a href="https://wa.me/50370155571" target="_blank" rel="noopener noreferrer">Necesito ayuda <Icon name="diagonal"/></a></div>
    <header className="order-heading"><div><p className="eyebrow">TU EQUIPO NO ES IGUAL A NINGUNO.</p><h1>VÍSTELO <em>A TU MANERA.</em></h1></div><p>De la primera idea al último dorsal.<br/>{" "}Arma la solicitud de todo tu equipo, aquí.</p></header>

    <section className="order-shell" id="order-workspace" aria-label="Crea el pedido de tu equipo">
      <nav className="order-steps" aria-label="Pasos del pedido">{steps.map((label,index)=><button type="button" key={label} aria-current={step===index+1?'step':undefined} disabled={index+1>furthest} onClick={()=>goTo(index+1)}><span>{index+1<step?'✓':`0${index+1}`}</span><strong>{label}</strong><small>{['Prendas y cantidad','Nombre · talla · dorsal','Tu propio estilo','Todo en orden'][index]}</small></button>)}</nav>
      <div className="order-step-heading"><div><p className="eyebrow">PASO 0{step} / 04</p><h2 ref={title} tabIndex={-1}>{headings[step-1]}</h2><p>{descriptions[step-1]}</p></div><div className="order-save"><span className="status-dot"/><span className="cfg-draft-status" role="status">{!ready?'Cargando borrador…':storage==='unavailable'?'Sin guardado en este dispositivo':storage==='restored'?'Borrador recuperado':'Borrador guardado en este dispositivo'}</span></div></div>

      {step===1 && <div className="order-quantity-layout">
        <div className="order-first-fields">
          <div className="order-quantity-field"><label htmlFor="cfg-quantity">01 / ¿Cuántos uniformes serán?</label><div className="order-quantity-control"><button type="button" aria-label="Quitar un uniforme" disabled={quantityOf(order)<=MIN_QUANTITY} onClick={()=>setOrder(previous=>withQuantity(previous,String(Math.max(MIN_QUANTITY,quantityOf(previous)-1))))}>−</button><input id="cfg-quantity" inputMode="numeric" maxLength={3} value={order.quantity} aria-invalid={Boolean(errors['cfg-quantity'])} aria-describedby="order-quantity-hint order-quantity-error" onChange={event=>{setOrder(previous=>withQuantity(previous,event.target.value.replace(/\D/g,'')));setErrors({});}}/><button type="button" aria-label="Agregar un uniforme" disabled={quantityOf(order)>=999} onClick={()=>setOrder(previous=>withQuantity(previous,String(Math.min(999,quantityOf(previous)+1))))}>+</button><span>uniformes</span></div><p id="order-quantity-error" className="cfg-error" role={errors['cfg-quantity']?'alert':undefined}>{errors['cfg-quantity']}</p><p id="order-quantity-hint">Desde {MIN_QUANTITY} unidades. Incluye a los porteros dentro de esta cantidad.</p><div className="order-presets" aria-label="Cantidades frecuentes">{[6,12,18,24].map(value=><button type="button" key={value} aria-pressed={quantityOf(order)===value} onClick={()=>{setOrder(previous=>withQuantity(previous,String(value)));setErrors({});}}>{value}</button>)}</div></div>
          <fieldset className="order-line-field"><legend>02 / ¿Qué necesita tu equipo?</legend><div className="order-line-options">{([{id:'kit',title:'Uniforme completo',description:'Camisa + calzoneta',icon:'kit'},{id:'shirt',title:'Solo camisa',description:'Elige el acabado en el editor',icon:'shirt'}] as const).map(line=><label key={line.id} className={order.line===line.id?'is-selected':''}><input type="radio" name="order-line" value={line.id} checked={order.line===line.id} onChange={()=>edit('line',line.id)}/><svg viewBox="0 0 80 75" aria-hidden="true"><path d="m24 8 11 4 10-4 10 6 12 13-12 8-6-7v28H20V28l-6 7-12-8 12-13Z" fill="none" stroke="currentColor" strokeWidth="2"/>{line.icon==='kit'&&<path d="M23 58h25l3 13H39l-3-8-3 8H21Z" fill="currentColor"/>}</svg><span><strong>{line.title}</strong><small>{line.description}</small></span><b aria-hidden="true">{order.line===line.id?'✓':'+'}</b></label>)}</div></fieldset>
          <p className="order-retained-note">Si cambias la cantidad, conservamos los datos que ya escribiste. Solo se incluirán las primeras {quantityOf(order)||'—'} personas.</p>
        </div>
        <aside className="order-team-board"><div className="order-board-top"><span>TU PRÓXIMO EQUIPO</span><Icon name="diagonal"/></div><div className="order-shirt-line" aria-hidden="true"><Jersey color="#F3F5EF" accent="#2264E8" variant="clean" name="EQUIPO"/><Jersey color="#2264E8" accent="#F3F5EF" variant="stripe" name="EQUIPO"/><Jersey color="#ED2647" accent="#F3F5EF" variant="clean" name="EQUIPO"/></div><div className="order-board-count"><strong>{quantityOf(order)||'—'}</strong><div><span>PERSONAS.</span><span>UNA MISMA PASIÓN.</span></div></div><p>Diseños distintos. Colores propios.<br/>Las escamas son una opción más.</p><div className="order-board-foot"><span>UN NOMBRE</span><span>UNA TALLA</span><span>UN DORSAL</span></div></aside>
      </div>}

      {step===2 && <div className="order-roster-step"><div className="order-team-input"><label htmlFor="cfg-team">Nombre del equipo<input id="cfg-team" value={order.team} maxLength={24} placeholder="Ej. Deportivo San Miguel" autoComplete="organization" aria-invalid={Boolean(errors['cfg-team'])} aria-describedby={errors['cfg-team']?'order-team-error':undefined} onChange={event=>edit('team',event.target.value)}/></label>{errors['cfg-team']&&<p className="cfg-error" id="order-team-error" role="alert">{errors['cfg-team']}</p>}<p>Escribe el nombre que quieres ver en el frente. Cada jugador lleva su propio nombre en la espalda.</p></div><TeamRoster players={players} errors={errors} onChange={editPlayers} onEditQuantity={()=>goTo(1)}/></div>}

      {step===3 && <div className="order-design-step">{errors['order-design-error']&&<p id="order-design-error" tabIndex={-1} className="order-notice error" role="alert">{errors['order-design-error']}</p>}{!assetsReady?<p className="order-notice" role="status">Recuperando tus archivos…</p>:<TeamDesignStudio onBusyChange={setStudioBusy} design={order.design} garment={order.garment} team={order.team} players={players} assets={assets} line={order.line} onDesignChange={value=>{edit('design',value);setErrors({});}} onAssetsChange={value=>{if(assetEpoch.current!==renderedAssetEpoch)return;setAssets(value);setErrors({});}} onGarmentChange={value=>edit('garment',value)}/>}<p className="order-artwork-storage" role="status">{!artworkStorage?'Las imágenes funcionan en esta sesión, pero no pudieron guardarse en este navegador. Conserva los originales.':'Tus imágenes se guardan solo en este navegador. Al cotizar tendrás que adjuntarlas a la conversación.'}</p><div className="order-notes"><label htmlFor="cfg-notes">Indicaciones para el equipo de diseño <span>Opcional</span></label><textarea id="cfg-notes" value={order.notes} maxLength={800} rows={3} placeholder="Por ejemplo: el portero irá en naranja, el escudo del lado izquierdo…" onChange={event=>edit('notes',event.target.value)}/></div></div>}

      {step===4 && <div className="order-review"><div className="order-review-top"><div className="cfg-summary-heading"><p>TU SOLICITUD DE EQUIPO</p><h3>{order.team}</h3><span>{players.length} {order.line==='kit'?'uniformes completos':'camisas'} · {complete} fichas completas</span></div><button type="button" className="order-edit" onClick={()=>goTo(2)}>Editar jugadores <Icon/></button></div><div className="order-review-grid"><dl className="order-specs"><div><dt>Línea</dt><dd>{order.line==='kit'?'Camisa + calzoneta':'Solo camisa'}</dd></div><div><dt>Diseño</dt><dd>{order.design.mode==='reference'?'Referencia propia':variantLabel(order.design.elements.pattern?order.design.variant:'clean')}</dd></div><div><dt>Colores</dt><dd><i style={{background:order.design.color}}/><i style={{background:order.design.accent}}/>{order.design.color} / {order.design.accent}</dd></div><div><dt>Molde / confección</dt><dd>{order.garment.mold} · {order.garment.construction}</dd></div><div><dt>Técnica solicitada</dt><dd>{techniqueLabel(order.garment.technique)}</dd></div><div><dt>Tela</dt><dd>{order.garment.fabric}</dd></div><div><dt>Cuello / manga</dt><dd>{collarLabel(order.garment.collar)} · {order.garment.sleeve==='short'?'Corta':'Larga'}</dd></div>{order.line==='kit'&&<div><dt>Número en calzoneta</dt><dd>{order.garment.shortsNumber?'Sí':'No'}</dd></div>}{order.design.sponsor&&<div><dt>Patrocinador</dt><dd>{order.design.sponsor}</dd></div>}</dl><aside className="order-size-summary"><p>DISTRIBUCIÓN DE TALLAS</p><div>{Object.entries(sizes).map(([size,count])=><span key={size}><strong>{size}</strong>{count} {count===1?'prenda':'prendas'}</span>)}</div><button type="button" className="order-edit" onClick={()=>goTo(3)}>Editar diseño y preferencias <Icon/></button></aside></div><OrderArtworkReview order={order} assets={assets}/><div className="order-review-roster"><table><caption>Nómina completa del equipo</caption><thead><tr><th scope="col">#</th><th scope="col">Nombre</th><th scope="col">Talla</th><th scope="col">Dorsal</th><th scope="col">Rol</th></tr></thead><tbody>{players.map((player,index)=><tr key={player.id}><td>{index+1}</td><th scope="row">{player.name}</th><td>{player.size}</td><td>{player.number}</td><td>{player.role==='goalkeeper'?'Portero':'Jugador'}</td></tr>)}</tbody></table></div>{order.notes&&<div className="order-review-notes"><strong>Indicaciones de diseño</strong><p>{order.notes}</p></div>}<AddToCart order={order} assets={assets}/><div className="order-delivery"><div><h3>LA LISTA ESTÁ. VAMOS A HABLAR.</h3><p>Tony confirma el diseño final, las tallas, el precio y la entrega antes de producir. Esta solicitud todavía no confirma un pedido.</p><p>Adjunta las vistas PNG descargadas en el editor para compartir tu diseño, los escudos y los textos.</p>{(assets.front||assets.back||assets.crest)&&<p>Recuerda adjuntar tus archivos originales: {[assets.front?'referencia frontal':'',assets.back?'referencia dorsal':'',assets.crest?'escudo':''].filter(Boolean).join(', ')}. No se envían automáticamente.</p>}{longMessage&&<p className="order-notice">La lista es extensa. Descarga el resumen completo y adjúntalo en WhatsApp; el mensaje de apertura incluirá el equipo y la cantidad.</p>}</div><div className="order-downloads"><button type="button" onClick={()=>download(fullText,'tony-resumen-equipo.txt','text/plain;charset=utf-8')}>Descargar resumen completo <Icon name="diagonal"/></button><button type="button" onClick={()=>download(rosterCSV(order),'tony-lista-jugadores.csv','text/csv;charset=utf-8')}>Descargar lista para Excel <Icon name="diagonal"/></button></div></div></div>}

      <div className="order-actions"><div className="order-action-info"><strong>{quantityOf(order)||'—'} {order.line==='kit'?'uniformes':'camisas'}</strong><span>{step===1?'Comencemos con la cantidad':`${complete} de ${players.length} jugadores completos`}</span></div><div className="order-action-buttons">{step>1&&<button type="button" className="order-back" aria-label="Volver al paso anterior" onClick={()=>goTo(step-1)}>← <span>Atrás</span></button>}{step<4?<button type="button" className="cfg-primary" disabled={!ready||(step===3&&(!assetsReady||studioBusy))} onClick={()=>goTo(step+1)}>{['Crear lista de jugadores','Ir al editor de diseño','Revisar mi pedido'][step-1]}<Icon/></button>:<a className="cfg-primary" href={`https://wa.me/50370155571?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">Abrir WhatsApp para cotizar <Icon/></a>}</div></div>
      {step===4&&<p className="order-send-note">Se abrirá un mensaje listo para revisar. Tú decides cuándo enviarlo.</p>}
    </section>
    <div className="order-bottom"><p>Tu borrador se queda en este navegador.</p><button type="button" onClick={()=>setResetOpen(true)}>Borrar borrador y empezar de nuevo</button></div>
    <dialog ref={resetDialog} className="order-reset-dialog" onCancel={()=>setResetOpen(false)} onClose={()=>setResetOpen(false)} aria-labelledby="reset-title"><h2 id="reset-title">¿EMPEZAMOS DE NUEVO?</h2><p>Se borrarán los jugadores, el diseño y las imágenes guardadas de esta solicitud en este navegador.</p><div><button type="button" autoFocus onClick={()=>setResetOpen(false)}>Conservar mi borrador</button><button type="button" onClick={resetOrder}>Sí, borrar borrador</button></div></dialog>
  </main>;
}
