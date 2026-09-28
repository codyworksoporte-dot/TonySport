'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { AMBIENT } from '@/lib/ambient-config';
import { startAmbient } from '@/lib/ambient-runtime';
import TonyPeek from './TonyPeek';
import './ambient-experience.css';

const { glow, peek, scratch } = AMBIENT;
const variables = {
  '--glow-radius': `${glow.radius}px`,
  '--pulse-radius': `${glow.ambient.radius}px`,
  '--scratch-size': `${scratch.size}px`,
  '--peek-width': `clamp(${peek.width.min}px, ${peek.width.vw}vw, ${peek.width.max}px)`,
} as CSSProperties;

export default function AmbientExperience() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const scratchRef = useRef<HTMLDivElement>(null);
  const runtime = useRef<ReturnType<typeof startAmbient> | null>(null);
  const path = useRef(pathname);
  path.current = pathname;

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 900px), (pointer: coarse)');
    const update = () => {setReduced(preference.matches); setCompact(mobile.matches);};
    update();
    try { setEnabled(localStorage.getItem(AMBIENT.preferenceKey) !== 'off'); } catch { /* The choice then lasts for this visit only. */ }
    setReady(true);
    preference.addEventListener('change', update);
    mobile.addEventListener('change', update);
    return () => {preference.removeEventListener('change', update); mobile.removeEventListener('change', update);};
  }, []);

  const active = ready && enabled && !reduced;

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.tonyEffects = active ? 'on' : 'off';
    window.dispatchEvent(new CustomEvent('tony:effects-change', { detail: { enabled: active } }));
  }, [active, ready]);

  useEffect(() => {
    const glowLayer = glowRef.current, pulseLayer = pulseRef.current, peekLayer = peekRef.current;
    if (!active || compact || !glowLayer || !pulseLayer || !peekLayer) return;
    const scratches = [...(scratchRef.current?.querySelectorAll<SVGSVGElement>('svg') ?? [])];
    const controller = startAmbient({ glow: glowLayer, pulse: pulseLayer, peek: peekLayer, scratches }, path.current);
    runtime.current = controller;
    return () => { controller.destroy(); runtime.current = null; };
  }, [active, compact]);

  useEffect(() => { runtime.current?.setRoute(pathname); }, [pathname]);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    try { localStorage.setItem(AMBIENT.preferenceKey, next ? 'on' : 'off'); } catch { /* Storage is optional. */ }
  }

  const label = reduced ? 'Efectos en pausa' : enabled ? 'Pausar efectos' : 'Activar efectos';
  return <>
    <div className="tony-ambient tony-scale-glow-layer" style={variables} aria-hidden="true">
      <div className="tony-scale-glow" ref={glowRef}><span className="tony-scale-joints"/></div>
      <div className="tony-scale-glow tony-scale-glow--ambient" ref={pulseRef}><span className="tony-scale-joints"/></div>
    </div>
    <div className="tony-ambient tony-peek" ref={peekRef} style={variables} data-state="off" aria-hidden="true"><TonyPeek/></div>
    <div ref={scratchRef} className="tony-ambient tony-scratch-stage" style={variables} aria-hidden="true">
      {Array.from({ length: scratch.maxActive }, (_, index) => <svg key={index} viewBox="0 0 40 40" focusable="false">
        <path d="M29.5 4.5C25 13.6 18.8 23.6 9.5 33.5c11.4-8.6 17.8-18.6 20-29Z"/>
        <path d="M34 11c-3.6 7-8.3 14-14.6 20.4 8.1-5.6 13.1-12.4 14.6-20.4Z"/>
        <path d="M35.5 19.5c-2 3.9-4.6 7.2-8 10 4-1.9 6.9-5.3 8-10Z" opacity=".75"/>
      </svg>)}
    </div>
    <button type="button" className="tony-effects-toggle" onClick={toggle} disabled={!ready || reduced} aria-pressed={active} title={reduced ? 'Se respeta la preferencia de movimiento reducido de tu dispositivo' : undefined}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">{active
        ? <path d="M9 6v12m6-12v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        : <path d="m9 6.5 9 5.5-9 5.5Z" fill="currentColor"/>}</svg>
      <span>{label}</span>
    </button>
  </>;
}
