'use client';
import dynamic from 'next/dynamic';
import {useEffect, useState, type ReactNode} from 'react';
import type {AdvisorCue} from '@/lib/pedido/advisor';
import './advisor-experience.css';

const Experience = dynamic(() => import('./AdvisorExperience'), {ssr: false, loading: () => <p role="status">Preparando a tu asesora…</p>});
const KEY = 'tony:pedido:quality:v1';
type Quality = 'low' | 'high';
/** The portrait stage stands beside every step except the welcome, the design editor (which needs the width) and the confirmation. */
const guidedStep = (step: number) => step > 0 && step < 12 && step !== 6;

export default function PedidoAdvisor({cue, step, ready = true, children}: {cue: AdvisorCue; step: number; ready?: boolean; children?: ReactNode}) {
  const [quality, setQuality] = useState<Quality>('low');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'low' || saved === 'high') {setQuality(saved); return;}
      // The portrait is one textured quad, so any current phone or laptop can run it; only data saving or reduced motion keep the light version.
      const device = navigator as Navigator & {deviceMemory?: number; connection?: {saveData?: boolean}};
      const memory = device.deviceMemory ?? 4, cores = device.hardwareConcurrency || 4;
      if (!device.connection?.saveData && !matchMedia('(prefers-reduced-motion: reduce)').matches && memory >= 4 && cores >= 4) setQuality('high');
    } catch { /* The light version works without storage. */ }
  }, []);
  function select(value: Quality) {setQuality(value); try {localStorage.setItem(KEY, value);} catch { /* Visit-only preference. */ }}
  return <section className={`advisor-experience mode-${quality}${guidedStep(step) ? ' is-guided-choice' : ''}${step === 0 ? ' is-welcome' : ''}`} aria-label="Guía del pedido">
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
