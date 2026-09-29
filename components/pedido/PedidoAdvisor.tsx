'use client';
import {useEffect, useRef, useState} from 'react';
import {siteAsset} from '@/lib/asset-path';
import {type AdvisorCue} from '@/lib/pedido/advisor';
import {useAdvisorSpeech} from './useAdvisorSpeech';
import './advisor.css';

/** Remembered per browser: whether the advisor is shown and speaks. Voice starts on. */
const PREFERENCE = 'tony:pedido:asesora:v2';
type Preference = {visible: boolean; voice: boolean};
const AVATAR = '/assets/pedido/guides/advisor-thumb.webp' as const;

/** Browsers only let a page speak after the visitor has clicked, tapped or typed once. */
const activated = () => (navigator as Navigator & {userActivation?: {hasBeenActive: boolean}}).userActivation?.hasBeenActive ?? true;

/**
 * Tony's advisor. It follows the customer through every step and every choice
 * inside it: it reads the next instruction aloud as soon as it changes (no play
 * button needed), outlines the part of the form it is talking about and brings it
 * into view. When its card scrolls away, a small bubble keeps it at hand.
 */
export default function PedidoAdvisor({cue, step}: {cue: AdvisorCue; step: number}) {
  const [preference, setPreference] = useState<Preference>({visible: true, voice: true});
  const [docked, setDocked] = useState(false);
  const {availability, playback, deviceVoice, speak, stop, canSpeak, speaking} = useAdvisorSpeech();
  const voiceFailure = playback === 'blocked' || playback === 'error';
  const card = useRef<HTMLElement>(null), latest = useRef(cue), said = useRef(''), lastStep = useRef(step), lastTarget = useRef({step: -1, target: undefined as string | undefined});
  latest.current = cue;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFERENCE) || 'null');
      if (saved && typeof saved.visible === 'boolean') setPreference({visible: saved.visible, voice: saved.voice !== false});
    } catch { /* The advisor then starts visible and speaking for this visit. */ }
  }, []);

  function remember(next: Preference) {
    setPreference(next);
    try {localStorage.setItem(PREFERENCE, JSON.stringify(next));} catch { /* Only this visit keeps the choice. */ }
  }

  // Speak each new instruction once: quickly on a new step, after a short pause
  // while choosing or typing inside a step so it doesn't talk over every keystroke.
  useEffect(() => {
    if (!preference.visible || !preference.voice || !canSpeak || voiceFailure || said.current === cue.key) return;
    const newStep = lastStep.current !== step;
    let first: (() => void) | undefined;
    let activationTimer = 0;
    const timer = window.setTimeout(() => {
      const current = latest.current;
      if (document.hidden || said.current === current.key) return;
      if (activated()) {said.current = current.key; speak(current.text); return;}
      // Before any click the browser keeps the page silent: speak on the first touch or key,
      // once that touch has done its work (it may have opened the next step).
      first = () => {
        window.removeEventListener('pointerdown', first!, true); window.removeEventListener('keydown', first!, true);
        activationTimer = window.setTimeout(() => {if (said.current !== latest.current.key) {said.current = latest.current.key; speak(latest.current.text);}}, 200);
      };
      window.addEventListener('pointerdown', first, true); window.addEventListener('keydown', first, true);
    }, cue.warning ? 120 : newStep ? 350 : 900);
    return () => {clearTimeout(timer); clearTimeout(activationTimer); if (first) {window.removeEventListener('pointerdown', first, true); window.removeEventListener('keydown', first, true);}};
  }, [cue.key, step, preference.visible, preference.voice, canSpeak, voiceFailure, speak]);
  useEffect(() => {lastStep.current = step;}, [step]);

  // Outline the part of the form the advice is about; within a step, bring the next part into view.
  useEffect(() => {
    const previous = lastTarget.current;
    lastTarget.current = {step, target: cue.target};
    if (!preference.visible || !cue.target) return;
    const element = document.querySelector<HTMLElement>(`[data-advisor="${cue.target}"]`);
    element?.classList.add('is-advised');
    // Only a choice made inside the same step moves the page; a new step starts at its title.
    const moved = previous.step === step && (cue.warning || (previous.target !== undefined && previous.target !== cue.target));
    let timer = 0;
    if (element && moved && !matchMedia('(max-width: 900px)').matches) timer = window.setTimeout(() => {
      const box = element.getBoundingClientRect();
      if (box.top < 90 || box.top > innerHeight * .7) element.scrollIntoView({block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    }, 450);
    return () => {clearTimeout(timer); element?.classList.remove('is-advised');};
  }, [cue.target, cue.key, step, preference.visible]);

  // The bubble appears only while the full card is out of view.
  useEffect(() => {
    const mobile = matchMedia('(max-width: 900px)');
    let observer: IntersectionObserver | undefined;
    const observe = () => {
      observer?.disconnect();
      setDocked(false);
      if (mobile.matches || !card.current || !preference.visible) return;
      observer = new IntersectionObserver(([entry]) => setDocked(!entry.isIntersecting), {rootMargin: '-80px 0px 0px 0px'});
      observer.observe(card.current);
    };
    observe();
    mobile.addEventListener('change', observe);
    return () => {observer?.disconnect(); mobile.removeEventListener('change', observe);};
  }, [preference.visible]);

  const icon = (d: string) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
  const ICONS = {
    on: 'M4 9v6h4l5 4V5L8 9H4Zm12.5-.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
    off: 'M4 9v6h4l5 4V5L8 9H4Zm12 .5 5 5m0-5-5 5',
    again: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5',
    stop: 'M7 7h10v10H7Z',
    hide: 'M6 6l12 12M18 6 6 18',
  };
  const voiceActive = preference.voice && canSpeak && !voiceFailure;
  const voiceLabel = availability === 'unsupported' ? 'Voz no disponible' : voiceFailure ? 'Escuchar guía' : availability === 'missing' ? 'Reintentar voz' : voiceActive ? 'Voz activada' : 'Escuchar guía';
  const voiceButton = <button type="button" className="pedido-advisor-voice" disabled={availability === 'unsupported'} aria-pressed={voiceActive} onClick={() => {
    const voice = !voiceActive;
    remember({...preference, voice});
    if (voice) {said.current = cue.key; speak(cue.text);} else stop();
  }}>{icon(voiceActive ? ICONS.on : ICONS.off)}<span>{voiceLabel}</span></button>;
  const note = playback === 'blocked' ? 'Toca Escuchar guía para activar el audio. También puedes seguir por escrito.'
    : playback === 'error' ? 'No se pudo reproducir la voz. Toca Escuchar guía para reintentar.'
    : availability === 'unsupported' ? 'Este navegador no permite leer la guía en voz alta. Puedes seguir por escrito.'
    : availability === 'missing' ? 'La voz aún no está disponible en este navegador. Puedes reintentar o seguir por escrito.'
    : availability === 'loading' ? 'Preparando la voz. Puedes continuar mientras tanto.'
    : deviceVoice ? 'Uso la voz en español disponible en tu dispositivo.' : '';
  const state = `${speaking ? ' is-speaking' : ''}${cue.warning ? ' is-warning' : ''}`;

  if (!preference.visible) return <button type="button" className="pedido-advisor-recall" onClick={() => {remember({...preference, visible: true}); said.current = '';}}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={siteAsset(AVATAR)} alt="" width="200" height="300"/>
    Mostrar a tu asesora Tony
  </button>;

  return <>
    <section ref={card} className={`pedido-advisor-card${state}`} aria-label="Tu asesora Tony">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={siteAsset(AVATAR)} alt="" width="200" height="300"/>
      <div>
        <p className="pedido-advisor-name">TU ASESORA TONY <span className="pedido-advisor-wave" aria-hidden="true"><i/><i/><i/></span></p>
        <p className="pedido-advisor-message" aria-live="polite">{cue.text}</p>
        <div className="pedido-advisor-actions">
          {voiceButton}
          {canSpeak && !voiceFailure && <button type="button" onClick={() => {said.current = cue.key; if (speaking) stop(); else speak(cue.text);}}>{icon(speaking ? ICONS.stop : ICONS.again)}<span>{speaking ? 'Detener' : 'Repetir'}</span></button>}
          <button type="button" className="pedido-advisor-hide" onClick={() => {stop(); remember({...preference, visible: false});}}>{icon(ICONS.hide)}<span>No quiero asesora</span></button>
        </div>
        {note && <p className="pedido-advisor-note" role="status">{note}</p>}
      </div>
    </section>
    <div className={`pedido-advisor-dock${docked ? ' is-shown' : ''}${state}`} aria-hidden={!docked} inert={!docked}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={siteAsset(AVATAR)} alt="" width="200" height="300"/>
      <p>{cue.text}</p>
      {voiceButton}
    </div>
  </>;
}
