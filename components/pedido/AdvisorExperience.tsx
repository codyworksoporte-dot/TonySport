'use client';
import dynamic from 'next/dynamic';
import {useEffect, useRef, useState} from 'react';
import type {AdvisorCue} from '@/lib/pedido/advisor';
import {useAdvisorSpeech} from './useAdvisorSpeech';
const Stage = dynamic(() => import('./AdvisorStage'), {ssr: false, loading: () => <div className="advisor-stage-loading" role="status">Preparando el escenario…</div>});

export default function AdvisorExperience({cue, step, onLight}: {cue: AdvisorCue; step: number; onLight: () => void}) {
  const speech = useAdvisorSpeech();
  const [voice, setVoice] = useState(false), [paused, setPaused] = useState(false);
  const said = useRef('');
  useEffect(() => {
    if (!voice || !speech.canSpeak || said.current === cue.key) return;
    const timer = setTimeout(() => {said.current = cue.key; speech.speak(cue.text);}, 400);
    return () => clearTimeout(timer);
  }, [cue.key, cue.text, voice, speech.canSpeak, speech.speak]);
  useEffect(() => {speech.stop();}, [step, cue.key, speech.stop]);
  return <div className="advisor-studio" aria-label="Tu asesora Tony" role="region">
    <div className="advisor-stage-wrap"><Stage speaking={speech.playback === 'speaking'} paused={paused}/><span className="advisor-stage-badge">TONY · TU ASESORA</span></div>
    <div className="advisor-studio-copy">
      <p className="advisor-studio-eyebrow">CONTIGO, PASO A PASO</p>
      <p className="advisor-studio-message" aria-live="polite">{cue.text}</p>
      <div className="advisor-studio-actions">
        <button type="button" aria-pressed={voice} disabled={speech.availability === 'unsupported'} onClick={() => {setVoice(!voice); if (!voice) {said.current = cue.key; speech.speak(cue.text);} else speech.stop();}}>{voice ? 'Silenciar voz' : 'Activar voz'}</button>
        {voice && <button type="button" onClick={() => {said.current = cue.key; speech.speak(cue.text);}}>Repetir guía</button>}
        <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'Activar movimiento' : 'Pausar movimiento'}</button>
      </div>
      {(speech.availability === 'missing' || speech.availability === 'unsupported' || speech.playback === 'error' || speech.playback === 'blocked') && <p className="advisor-voice-note" role="status">La voz no está disponible ahora. Puedes seguir la guía escrita.</p>}
      <button type="button" className="advisor-light-link" onClick={onLight}>Usar versión ligera</button>
    </div>
  </div>;
}
