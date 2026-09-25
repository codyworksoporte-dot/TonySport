'use client';
import {useId} from 'react';
import Jersey from './Jersey';
import type {SportLine} from '@/lib/lines';

/** Original category illustrations: these are not stock or catalogue photographs. */
export default function LineArtwork({line}:{line:SportLine}) {
  const uid=useId().replace(/:/g,'');
  if(line.kind==='football'||line.kind==='volleyball')return <Jersey color={line.color} accent={line.accent} variant={line.kind==='football'?'clean':'stripe'} name={line.kind==='football'?'TU EQUIPO':'TONY'} number="10" hideFrontPrint elements={{brand:false}}/>;
  const sleeveless=line.kind==='basketball'||line.kind==='running';
  const long=line.kind==='racing';
  const polo=line.kind==='polo'||line.kind==='casual';
  const shape=sleeveless?'M172 85 209 65Q240 108 271 65L308 85Q298 153 342 190L352 489Q240 525 128 489L138 190Q182 153 172 85Z':long?'M180 72 106 105 19 356 74 380 134 203 126 490Q240 515 354 490L346 203 406 380 461 356 374 105 300 72Q240 104 180 72Z':'M180 72 107 104 39 197 105 239 134 196 126 490Q240 515 354 490L346 196 375 239 441 197 373 104 300 72Q240 104 180 72Z';
  return <svg viewBox="0 0 480 560" role="img" aria-label={`Ilustración de la línea ${line.name}`} fill="none">
    <defs><linearGradient id={`${uid}-shade`} x1="130" y1="100" x2="360" y2="480" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" stopOpacity=".25"/><stop offset=".35" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#00170e" stopOpacity=".45"/></linearGradient><linearGradient id={`${uid}-fold`}><stop stopColor="#00170e" stopOpacity="0"/><stop offset=".4" stopColor="#00170e" stopOpacity=".19"/><stop offset=".6" stopColor="#fff" stopOpacity=".22"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient><clipPath id={`${uid}-clip`}><path d={shape}/></clipPath><pattern id={`${uid}-weave`} width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 .5h4M.5 0v4" stroke="#00150b" strokeOpacity=".12" strokeWidth=".5"/></pattern><filter id={`${uid}-shadow`} x="-40%" y="-30%" width="180%" height="180%"><feDropShadow dx="0" dy="17" stdDeviation="15" floodColor="#06150f" floodOpacity=".35"/></filter></defs>
    {line.kind==='equipment'?<g filter={`url(#${uid}-shadow)`}>
      <path d="M97 322Q118 302 160 302H347Q386 303 397 328L419 460Q260 494 76 463Z" fill={line.color}/><path d="M154 310v-55q0-29 32-29h92q31 0 31 29v50" stroke={line.accent} strokeWidth="15"/><path d="M116 325v123M369 325l13 123M125 326h231" stroke={line.accent} strokeWidth="7"/><rect x="192" y="352" width="112" height="70" rx="5" fill={line.accent}/><text x="248" y="396" textAnchor="middle" fill={line.color} fontFamily="Impact, sans-serif" fontSize="31">TONY</text>
      <circle cx="172" cy="210" r="92" fill="#D9E8B4"/><path d="m148 188 44 1 14 39-35 25-36-26Zm-53-10 36-36 26 7m88 33-33-39-28 7m-75 95 10 32 26 19m73-51-10 32-26 20M151 122l15 25" fill={line.accent}/><circle cx="172" cy="210" r="92" stroke={line.accent} strokeWidth="2"/><path d="M345 150h36v32l13 16v94q-30 14-62 0v-94l13-16Z" fill="#EF9B67"/><path d="M342 143h42v15h-42Z" fill={line.accent}/><path d="M343 217h42v46h-42Z" fill={line.accent}/>
    </g>:<g filter={`url(#${uid}-shadow)`}>
      <path d={shape} fill={line.color}/>
      <g clipPath={`url(#${uid}-clip)`}>
        <path d="M101 95 156 90 166 502 120 502Z M379 95 324 90 314 502 360 502Z" fill={line.accent} opacity=".9"/>
        {line.kind==='running'&&<path d="m130 342 213-120v28L130 370Z" fill={line.accent}/>}
        {line.kind==='racing'&&<><path d="m28 280 424-83v34L28 315Z" fill={line.accent}/><path d="m28 324 424-83v10L28 335Z" fill={line.accent}/></>}
        <path d={shape} fill={`url(#${uid}-shade)`}/><path d={shape} fill={`url(#${uid}-weave)`}/><path d="M180 109Q195 245 171 488h40q-27-182-11-379ZM287 109q-18 152 25 379h36q-52-207-25-379Z" fill={`url(#${uid}-fold)`}/>
      </g>
      {sleeveless?<><path d="M174 84Q184 164 138 191m168-107q-10 80 36 107M209 68q31 64 62 0" stroke={line.accent} strokeWidth="10"/><text x="240" y="250" textAnchor="middle" fill={line.accent} fontSize="39" fontFamily="Impact, sans-serif">TU EQUIPO</text>{line.kind==='basketball'&&<text x="240" y="402" textAnchor="middle" fill={line.accent} fontSize="151" fontFamily="Impact, sans-serif">23</text>}</>:polo?<><path d="m180 72 8-22q52 30 104 0l8 22-29 66-31-36-31 36Z" fill={line.accent}/><path d="m203 65 37 37 37-37q-37 16-74 0Z" fill="#132B21"/><path d="M234 108h14v66h-14Z" fill={line.accent}/><circle cx="241" cy="132" r="2" fill={line.color}/><circle cx="241" cy="157" r="2" fill={line.color}/><path d="M289 182h39v30h-39Z" stroke={line.accent} strokeWidth="2"/><text x="309" y="204" textAnchor="middle" fill={line.accent} fontSize="15" fontFamily="Arial,sans-serif">TU</text></>:<><path d="M180 72q60 40 120 0l-13 19q-47 32-94 0Z" fill={line.accent}/>{line.kind==='cycling'&&<><path d="M239 94v398" stroke={line.accent} strokeWidth="4"/><path d="M236 117h8v23h-8Z" fill={line.accent}/></>}<text x="240" y="289" textAnchor="middle" fill={line.accent} fontSize="37" fontFamily="Impact,sans-serif">TU EQUIPO</text></>}
      <path d={shape} stroke="#fff" strokeOpacity=".2"/>
    </g>}
  </svg>;
}
