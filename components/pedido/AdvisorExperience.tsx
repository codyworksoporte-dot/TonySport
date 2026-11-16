'use client';
import dynamic from 'next/dynamic';
import {useEffect, useRef, useState} from 'react';
import type {AdvisorCue} from '@/lib/pedido/advisor';
import {useAdvisorSpeech} from './useAdvisorSpeech';
const Stage = dynamic(() => import('./AdvisorStage'), {ssr: false, loading: () => <div className="advisor-stage-loading" role="status">Preparando el escenario…</div>});

export default function AdvisorExperience({cue, step, ready = true}: {cue: AdvisorCue; step: number; ready?: boolean}) {
  const speech = useAdvisorSpeech();
  const [voice, setVoice] = useState(true);
  const said = useRef(''), gestureRetried = useRef('');
  const retry = voice && (speech.playback === 'blocked' || speech.playback === 'error');
  const label = retry ? 'Reintentar sonido de la asesora' : voice ? 'Silenciar asesora' : 'Activar sonido de la asesora';

  useEffect(() => {speech.stop();}, [cue.key, step, ready, speech.stop]);
  useEffect(() => {
    if (!ready || !voice || !speech.canSpeak || said.current === cue.key) return;
    const timer = setTimeout(() => {said.current = cue.key; speech.speak(cue.text);}, 250);
    return () => clearTimeout(timer);
  }, [cue.key, cue.text, step, ready, voice, speech.canSpeak, speech.speak]);

  // Browsers may require a real gesture before allowing the first narration.
  // Retry once for this cue, inside that gesture, while respecting explicit mute.
  useEffect(() => {
    if (!ready || !retry || gestureRetried.current === cue.key) return;
    const interact = (event: Event) => {
      const target = event.target;
      if (!event.isTrusted || !(target instanceof Element) || !target.closest('.pedido-page') || target.closest('.advisor-sound-toggle, .advisor-quality')) return;
      if (event instanceof KeyboardEvent && ['Shift', 'Control', 'Alt', 'Meta', 'Escape', 'Tab'].includes(event.key)) return;
      gestureRetried.current = cue.key;
      document.removeEventListener('pointerdown', interact, true);
      document.removeEventListener('keydown', interact, true);
      said.current = cue.key;
      speech.speak(cue.text);
    };
    document.addEventListener('pointerdown', interact, true);
    document.addEventListener('keydown', interact, true);
    return () => {document.removeEventListener('pointerdown', interact, true); document.removeEventListener('keydown', interact, true);};
  }, [ready, retry, cue.key, cue.text, speech.speak]);

  function toggleSound() {
    if (!voice || retry || speech.availability === 'missing') {
      setVoice(true);
      if (speech.canSpeak) said.current = cue.key;
      speech.speak(cue.text);
    } else {
      setVoice(false);
      speech.stop();
    }
  }

  return <div className="advisor-studio" aria-label="Tu asesora Tony" role="region">
    <button type="button" className="advisor-sound-toggle" aria-label={label} title={label} aria-pressed={voice} disabled={speech.availability === 'unsupported'} onClick={toggleSound}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 4 5.5 8.5H2v7h3.5L11 20Z"/>
        {voice ? <><path d="M15 8a6 6 0 0 1 0 8"/><path d="M18 5a10 10 0 0 1 0 14"/></> : <><path d="m16 9 5 6"/><path d="m21 9-5 6"/></>}
      </svg>
    </button>
    <div className="advisor-stage-wrap">{ready && <Stage speaking={speech.speaking} paused={false}/>}<span className="advisor-stage-badge">TONY · TU ASESORA</span></div>
    <div className="advisor-studio-copy">
      <p className="advisor-studio-eyebrow">CONTIGO, PASO A PASO</p>
      <p className="advisor-studio-message" aria-live="polite">{cue.text}</p>
      {voice && (speech.availability === 'missing' || speech.availability === 'unsupported') && <p className="advisor-voice-note" role="status">La voz no está disponible ahora. Puedes seguir la guía escrita.</p>}
      {retry && <p className="advisor-voice-note" role="status">Toca el icono de sonido para escuchar la guía.</p>}
    </div>
  </div>;
}
