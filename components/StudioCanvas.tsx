'use client';

import { useId, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import type { Design, DesignAssets, Garment, Player } from '@/lib/order';
import type { StudioLayer } from '@/lib/studio';
import Jersey from './Jersey';
import './studio-canvas.css';

type Props = {
  design:Design; garment:Garment; team:string; player?:Player; assets:DesignAssets;
  side:'front'|'back'; line:'kit'|'shirt'; selectedId:string|null;
  onSelect:(id:string|null)=>void; onLayerChange:(id:string,patch:Partial<StudioLayer>)=>void;
  onGestureStart:()=>void; onGestureEnd:()=>void; readOnly?:boolean;
};
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const layerDimensions=(layer:StudioLayer)=>({x:layer.x*4.8,y:layer.y*5.6,width:layer.width*4.8,height:layer.height*5.6});

/** The same clipped SVG shown on screen is rasterized; editor handles never enter the PNG. */
export async function exportStudioPNG(container:HTMLElement):Promise<Blob> {
  const stage=container.matches('[data-studio-stage]')?container:container.querySelector<HTMLElement>('[data-studio-stage]')??container;
  const bounds=stage.getBoundingClientRect();
  if(!bounds.width||!bounds.height) throw new Error('No hay una vista visible para exportar.');
  const drawings=Array.from(stage.querySelectorAll<SVGSVGElement>('svg[data-studio-artwork], svg.sc-shorts, svg.tds-shorts'));
  if(!drawings.length || stage.querySelector('[data-studio-empty]')) throw new Error('Añade una imagen para exportar esta vista.');
  if(stage.querySelector('[data-studio-missing]')) throw new Error('Una imagen de esta vista no está disponible. Vuelve a cargarla antes de exportar.');
  const frames=drawings.map(svg=>{
    const box=svg.getBoundingClientRect();
    const copy=svg.cloneNode(true) as SVGSVGElement;
    copy.setAttribute('xmlns','http://www.w3.org/2000/svg');
    copy.setAttribute('width',String(box.width));copy.setAttribute('height',String(box.height));
    copy.removeAttribute('class');copy.removeAttribute('style');
    copy.style.color=getComputedStyle(svg).color;
    const originalTexts=svg.querySelectorAll('text');
    copy.querySelectorAll('text').forEach((text,index)=>{
      const computed=getComputedStyle(originalTexts[index]);
      text.style.fontFamily=computed.fontFamily;text.style.fontWeight=computed.fontWeight;text.style.textTransform=computed.textTransform;
    });
    copy.querySelectorAll('[data-studio-ui]').forEach(element=>element.remove());
    copy.querySelectorAll('[tabindex]').forEach(element=>element.removeAttribute('tabindex'));
    return {source:`data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`,x:box.left-bounds.left,y:box.top-bounds.top,width:box.width,height:box.height};
  });
  let background='#e7ece2';
  for(let node:HTMLElement|null=stage;node;node=node.parentElement){
    const color=getComputedStyle(node).backgroundColor;
    if(color!=='transparent' && color!=='rgba(0, 0, 0, 0)'){background=color;break;}
  }
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(bounds.width*2);canvas.height=Math.ceil(bounds.height*2);
  const context=canvas.getContext('2d');if(!context) throw new Error('El navegador no puede crear esta imagen.');
  context.scale(2,2);context.fillStyle=background;context.fillRect(0,0,bounds.width,bounds.height);
  for(const frame of frames){
    const image=new Image();image.src=frame.source;await image.decode();
    context.drawImage(image,frame.x,frame.y,frame.width,frame.height);
  }
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo crear el PNG.')),'image/png'));
}

function Shorts({color,accent,number,trim}:{color:string;accent:string;number?:string;trim:boolean}){
  const uid=useId().replace(/:/g,'');
  return <svg className="sc-shorts" viewBox="0 0 250 235" role="img" aria-label={`Calzoneta orientativa${number?`, dorsal ${number}`:''}`}>
    <defs><linearGradient id={`sc-shorts-${uid}`}><stop stopColor="white" stopOpacity=".16"/><stop offset=".45" stopColor="white" stopOpacity="0"/><stop offset="1" stopColor="black" stopOpacity=".25"/></linearGradient></defs>
    <path d="M42 22Q125 11 208 22L229 201Q185 220 139 208L125 125 112 208Q66 220 21 201Z" fill={color}/>
    <path d="M42 22Q125 11 208 22L211 43Q125 34 39 43Z" fill={trim?accent:color}/>
    {trim && <path d="M40 44L24 192 44 199 56 42ZM210 44L226 192 206 199 194 42Z" fill={accent}/>}
    <path d="M42 22Q125 11 208 22L229 201Q185 220 139 208L125 125 112 208Q66 220 21 201Z" fill={`url(#sc-shorts-${uid})`}/>
    <path d="M120 38L115 72M130 38L134 68" stroke={accent} strokeWidth="2"/>
    {number && <text x="171" y="166" textAnchor="middle" fontFamily="Impact, Arial Narrow, sans-serif" fontSize="44" fill={accent}>{number}</text>}
  </svg>;
}

export default function StudioCanvas({design,garment,team,player,assets,side,line,selectedId,onSelect,onLayerChange,onGestureStart,onGestureEnd,readOnly=false}:Props){
  const hintId=useId();
  const pointer=useRef<{id:string;pointerId:number;x:number;y:number;originX:number;originY:number}|null>(null);
  const keyboard=useRef(false);
  const layers=(design.layers??[]).filter(layer=>layer.side===side&&layer.visible);
  const selected=layers.find(layer=>layer.id===selectedId);
  const reference=assets[side];
  const isReference=design.mode==='reference';

  function point(event:PointerEvent<SVGGElement>){
    const svg=event.currentTarget.ownerSVGElement;
    const matrix=svg?.getScreenCTM();
    return matrix?new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse()):null;
  }
  function start(event:PointerEvent<SVGGElement>,layer:StudioLayer){
    if(readOnly||event.button!==0) return;
    event.stopPropagation();onSelect(layer.id);event.currentTarget.focus({preventScroll:true});
    if(layer.locked) return;
    const position=point(event);if(!position)return;
    event.preventDefault();onGestureStart();
    pointer.current={id:layer.id,pointerId:event.pointerId,x:position.x,y:position.y,originX:layer.x,originY:layer.y};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event:PointerEvent<SVGGElement>){
    const active=pointer.current;
    if(!active||active.pointerId!==event.pointerId)return;
    const position=point(event);if(!position)return;
    event.preventDefault();
    onLayerChange(active.id,{x:clamp(active.originX+(position.x-active.x)/4.8,0,100),y:clamp(active.originY+(position.y-active.y)/5.6,0,100)});
  }
  function finish(){if(pointer.current){pointer.current=null;onGestureEnd();}}
  function keyDown(event:KeyboardEvent<SVGGElement>,layer:StudioLayer){
    if(readOnly)return;
    if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(layer.id);return;}
    if(event.key==='Escape'){event.preventDefault();onSelect(null);return;}
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)||layer.locked)return;
    event.preventDefault();onSelect(layer.id);
    if(!keyboard.current){keyboard.current=true;onGestureStart();}
    const delta=event.shiftKey?5:1;
    onLayerChange(layer.id,{x:clamp(layer.x+(event.key==='ArrowRight'?delta:event.key==='ArrowLeft'?-delta:0),0,100),y:clamp(layer.y+(event.key==='ArrowDown'?delta:event.key==='ArrowUp'?-delta:0),0,100)});
  }
  function finishKeyboard(){if(keyboard.current){keyboard.current=false;onGestureEnd();}}
  const artwork=<>{layers.map(layer=>{
    const {x,y,width,height}=layerDimensions(layer);
    const image=layer.kind==='image'?assets[layer.assetKey??'']:undefined;
    const missing=layer.kind==='image'&&!image&&layer.opacity>0;
    return <g key={layer.id} data-layer-id={layer.id} data-layer-kind={layer.kind} data-layer-locked={String(layer.locked)} data-studio-missing={missing?'':undefined} className={`sc-layer${layer.locked?' is-locked':''}${selectedId===layer.id?' is-selected':''}`} transform={`translate(${x} ${y}) rotate(${layer.rotation})`} opacity={layer.opacity} role={readOnly?undefined:'button'} tabIndex={readOnly?undefined:0} aria-label={readOnly?undefined:`Capa ${layer.name}${layer.locked?', bloqueada':''}${missing?', imagen no disponible':''}`} aria-pressed={readOnly?undefined:selectedId===layer.id} aria-describedby={readOnly?undefined:hintId} onPointerDown={readOnly?undefined:event=>start(event,layer)} onPointerMove={readOnly?undefined:move} onPointerUp={readOnly?undefined:finish} onPointerCancel={readOnly?undefined:finish} onLostPointerCapture={readOnly?undefined:finish} onFocus={readOnly?undefined:()=>onSelect(layer.id)} onKeyDown={readOnly?undefined:event=>keyDown(event,layer)} onKeyUp={readOnly?undefined:finishKeyboard} onBlur={readOnly?undefined:finishKeyboard}>
      <rect x={-width/2} y={-height/2} width={width} height={height} fill="transparent" pointerEvents={readOnly?'none':'all'}/>
      {layer.kind==='image' ? image&&<image href={image} x={-width/2} y={-height/2} width={width} height={height} preserveAspectRatio="none" pointerEvents="none"/> : <text x="0" y="0" dominantBaseline="central" textAnchor="middle" fill={layer.color} fontFamily={layer.bold?'Impact, Arial Narrow, sans-serif':'Arial, sans-serif'} fontWeight={layer.bold?'700':'400'} fontSize={height} textLength={width} lengthAdjust="spacingAndGlyphs" pointerEvents="none">{layer.text}</text>}
      {missing&&<g data-studio-ui="missing-image" pointerEvents="none"><rect x={-width/2} y={-height/2} width={width} height={height} fill="#f7eee0" fillOpacity=".8" stroke="#9e5630" strokeWidth="1" strokeDasharray="4 3"/><text x="0" y="0" textAnchor="middle" dominantBaseline="central" fill="#713f28" fontFamily="Arial, sans-serif" fontSize={Math.min(14,height*.22)} textLength={width*.82} lengthAdjust="spacingAndGlyphs">Imagen pendiente</text></g>}
    </g>;
  })}</>;
  const selection=selected&&!readOnly?(()=>{
    const {x,y,width,height}=layerDimensions(selected);
    return <g data-studio-ui="selection" className="sc-selection" transform={`translate(${x} ${y}) rotate(${selected.rotation})`} pointerEvents="none" aria-hidden="true">
      <rect x={-width/2-3} y={-height/2-3} width={width+6} height={height+6} rx="1" fill="none" stroke="#24522e" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
      <rect x={-width/2-3} y={-height/2-3} width={width+6} height={height+6} rx="1" fill="none" stroke="#c7ff56" strokeWidth="1.3" strokeDasharray={selected.locked?'4 3':undefined} vectorEffect="non-scaling-stroke"/>
      <circle cx="0" cy={-height/2-3} r="3.5" fill="#c7ff56" stroke="#24522e" strokeWidth="1"/>
    </g>;
  })():null;

  return <div className={`studio-canvas${line==='kit'&&!isReference?' sc-has-shorts':''}${readOnly?' sc-readonly':''}${isReference?' sc-reference':''}`} data-studio-stage="" onPointerDown={readOnly?undefined:()=>onSelect(null)}>
    <div className="sc-garment">
      {isReference?<svg data-studio-artwork="" data-studio-side={side} viewBox="0 0 480 560" role="img" aria-label={`Referencia ${side==='front'?'frontal':'posterior'} del cliente`} xmlns="http://www.w3.org/2000/svg">
        {reference?<image href={reference} x="20" y="20" width="440" height="520" preserveAspectRatio="xMidYMid meet"/>:<g data-studio-ui="empty" data-studio-empty=""><rect x="32" y="75" width="416" height="410" rx="8" fill="#dce4d4" stroke="#899f78" strokeDasharray="5 6"/><path d="M240 213v52m-16-36 16-16 16 16" stroke="#4c6840" strokeWidth="3" fill="none"/><text x="240" y="309" textAnchor="middle" fill="#2d472a" fontSize="21" fontFamily="Arial, sans-serif">Tu referencia, aquí.</text><text x="240" y="336" textAnchor="middle" fill="#4c6545" fontSize="13" fontFamily="Arial, sans-serif">Sube una imagen para esta vista</text></g>}
      </svg>:<Jersey color={design.color} accent={design.accent} variant={design.variant} collar={garment.collar} sleeve={garment.sleeve} back={side==='back'} name={side==='back'?(player?.name??''):team} number={player?.number??''} hideFrontPrint elements={design.elements} artwork={artwork} interaction={selection} interactive={!readOnly}/>}
    </div>
    {line==='kit'&&!isReference&&<Shorts color={design.color} accent={design.accent} trim={design.elements?.trim!==false} number={garment.shortsNumber&&design.elements?.playerNumber!==false?player?.number:undefined}/>}
    {!readOnly&&<span className="sc-sr-only" id={hintId}>Selecciona una capa con Enter o espacio. Arrastra para moverla, o usa las flechas; con Mayúsculas se mueve cinco veces más. Escape quita la selección. Las capas bloqueadas se desbloquean desde el panel.</span>}
  </div>;
}
