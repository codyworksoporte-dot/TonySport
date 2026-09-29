'use client';
import {useCallback, useEffect, useRef, useState} from 'react';
import {advisorVoice, femaleVoice, spoken} from '@/lib/pedido/advisor';

type Availability = 'loading' | 'ready' | 'missing' | 'unsupported';
type Playback = 'idle' | 'starting' | 'speaking' | 'blocked' | 'error';
const supported = () => typeof window.speechSynthesis?.getVoices === 'function' && typeof window.SpeechSynthesisUtterance === 'function';

/** Device voices can arrive late; a name that we don't recognise isn't a missing voice. */
export function useAdvisorSpeech() {
  const [availability, setAvailability] = useState<Availability>('loading');
  const [playback, setPlayback] = useState<Playback>('idle');
  const [deviceVoice, setDeviceVoice] = useState(false);
  const run = useRef(0), watchdog = useRef(0);
  // Keep utterances alive until completion, including in engines that don't retain the JS wrapper.
  const utterances = useRef<SpeechSynthesisUtterance[]>([]);
  const cancel = useCallback(() => {
    run.current++;
    clearTimeout(watchdog.current);
    window.speechSynthesis?.cancel();
    utterances.current = [];
  }, []);
  const stop = useCallback(() => {cancel(); setPlayback('idle');}, [cancel]);
  const check = useCallback((settled = false) => {
    if (!supported()) {setAvailability('unsupported'); return;}
    const voices = window.speechSynthesis.getVoices();
    const voice = advisorVoice(voices);
    setAvailability(voice ? 'ready' : settled ? 'missing' : 'loading');
    setDeviceVoice(!!voice && !femaleVoice([voice]));
    return voice;
  }, []);

  useEffect(() => {
    check();
    const settle = window.setTimeout(() => check(true), 1500);
    const changed = () => check(true);
    const visibility = () => {if (document.hidden) stop(); else check(true);};
    window.speechSynthesis?.addEventListener?.('voiceschanged', changed);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clearTimeout(settle);
      window.speechSynthesis?.removeEventListener?.('voiceschanged', changed);
      document.removeEventListener('visibilitychange', visibility);
      cancel();
    };
  }, [cancel, check, stop]);

  const speak = useCallback((text: string) => {
    stop();
    if (document.hidden) return;
    const voice = check(true);
    if (!voice) return;
    const token = run.current;
    const fail = (blocked = false) => {
      if (token !== run.current) return;
      cancel();
      setPlayback(blocked ? 'blocked' : 'error');
    };
    const sentences = spoken(text).split(/(?<=[.!?])\s+/).filter(Boolean);
    if (!sentences.length) return;
    setPlayback('starting');
    watchdog.current = window.setTimeout(() => fail(true), 4500);
    utterances.current = sentences.map((sentence, index) => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.voice = voice;
      utterance.lang = voice.lang.replaceAll('_', '-');
      utterance.rate = 1.02;
      utterance.pitch = 1.05;
      utterance.onstart = () => {
        if (token !== run.current) return;
        clearTimeout(watchdog.current);
        setPlayback('speaking');
      };
      utterance.onend = () => {
        if (token !== run.current || index !== sentences.length - 1) return;
        clearTimeout(watchdog.current);
        utterances.current = [];
        setPlayback('idle');
      };
      utterance.onerror = event => fail(event.error === 'not-allowed');
      return utterance;
    });
    // Called directly by the Listen button, inside the tap's user activation.
    try {
      window.speechSynthesis.resume();
      for (const utterance of utterances.current) {
        if (token !== run.current) break;
        window.speechSynthesis.speak(utterance);
      }
    } catch {fail();}
  }, [cancel, check, stop]);

  return {availability, playback, deviceVoice, speak, stop, canSpeak: availability === 'ready', speaking: playback === 'starting' || playback === 'speaking'};
}
