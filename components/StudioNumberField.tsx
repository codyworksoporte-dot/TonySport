'use client';

import {useEffect, useRef, useState} from 'react';

/** Keep incomplete input (empty or a minus sign) editable while updating the preview. */
export default function StudioNumberField({id,label,value,min,max,unit,onChange,onStart,onEnd}: {
  id:string; label:string; value:number; min:number; max:number; unit:string;
  onChange:(value:number)=>void; onStart:()=>void; onEnd:()=>void;
}) {
  const [draft,setDraft]=useState(String(Math.round(value*10)/10));
  const focused=useRef(false);
  const clamp=(number:number)=>Math.max(min,Math.min(max,number));
  useEffect(()=>{if(!focused.current)setDraft(String(Math.round(value*10)/10));},[value]);
  function change(next:string){
    if(!/^-?\d*(?:[.,]\d*)?$/.test(next))return;
    setDraft(next);
    if(next!==''&&next!=='-'&&next!=='.'&&next!==','){
      const number=Number(next.replace(',','.'));
      if(Number.isFinite(number))onChange(clamp(number));
    }
  }
  function finish(){
    focused.current=false;
    const number=draft.trim()===''?NaN:Number(draft.replace(',','.'));
    const next=Number.isFinite(number)?clamp(number):value;
    setDraft(String(Math.round(next*10)/10));onChange(next);onEnd();
  }
  return <label className="tds-field">{label}<span className="tds-input-unit"><input id={id} type="text" inputMode="decimal" role="spinbutton" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={Math.round(value*10)/10} value={draft} onFocus={()=>{focused.current=true;onStart();}} onBlur={finish} onChange={event=>change(event.target.value)} onKeyDown={event=>{
    if(event.key==='ArrowUp'||event.key==='ArrowDown'){
      event.preventDefault();const next=clamp(value+(event.key==='ArrowUp'?1:-1)*(event.shiftKey?10:1));setDraft(String(Math.round(next*10)/10));onChange(next);
    }
    if(event.key==='Enter')event.currentTarget.blur();
  }}/><span>{unit}</span></span></label>;
}
