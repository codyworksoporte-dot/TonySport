'use client';
import dynamic from 'next/dynamic';
import {useEffect, useState, type ReactNode} from 'react';
import type {AdvisorCue} from '@/lib/pedido/advisor';
import './advisor-experience.css';

const Experience = dynamic(() => import('./AdvisorExperience'), {ssr: false, loading: () => <p role="status">Preparando a tu asesora…</p>});
const KEY = 'tony:pedido:quality:v1';
type Quality = 'low' | 'high';

export default function PedidoAdvisor({cue, step, ready = true, children}: {cue: AdvisorCue; step: number; ready?: boolean; children?: ReactNode}) {
  const [quality, setQuality] = useState<Quality>('low');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'low' || saved === 'high') {setQuality(saved); return;}
      const device = navigator as Navigator & {deviceMemory?: number; connection?: {saveData?: boolean}};
      if (!device.connection?.saveData && !matchMedia('(prefers-reduced-motion: reduce)').matches && (device.deviceMemory || 0) >= 8 && device.hardwareConcurrency >= 8) setQuality('high');
    } catch { /* The light version works without storage. */ }
  }, []);
  function select(value: Quality) {setQuality(value); try {localStorage.setItem(KEY, value);} catch { /* Visit-only preference. */ }}
  return <section className={`advisor-experience mode-${quality}${step > 0 && step <= 5 ? ' is-guided-choice' : ''}`} aria-label="Guía del pedido">
    <div className="advisor-quality" role="group" aria-label="Rendimiento del pedido">
      <span>Tu experiencia</span>
      <button type="button" aria-pressed={quality === 'low'} onClick={() => select('low')}>Gama baja <small>Ligera · sin asesora</small></button>
      <button type="button" aria-pressed={quality === 'high'} onClick={() => select('high')}>Gama alta <small>Asesora 3D y voz</small></button>
    </div>
    <div className="pedido-guided-body">
      {ready && (quality === 'high' ? <Experience cue={cue} step={step}/> : <p className={`advisor-text-guide${cue.warning ? ' is-warning' : ''}`} aria-live="polite"><strong>VAMOS PASO A PASO</strong>{cue.text}</p>)}
      <div className="pedido-guided-options">{children}</div>
    </div>
  </section>;
}
