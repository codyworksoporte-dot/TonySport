'use client';
import {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {siteAsset} from '@/lib/asset-path';
import {createPortraitRig, type Framing} from '@/lib/pedido/advisor-portrait';
import type {MouthSource} from '@/lib/pedido/lipsync';

export const ADVISOR_PORTRAIT = '/assets/advisor/tony-advisor-portrait.webp';

/**
 * Mounted only in high mode. Owns and releases its complete WebGL lifecycle.
 * The portrait follows the visitor's pointer anywhere on the page, breathes,
 * blinks, shifts her weight and moves her lips with the voice (`mouth`).
 */
export default function AdvisorStage({speaking, paused, mouth, framing = 'full'}: {speaking: boolean; paused: boolean; mouth?: MouthSource; framing?: Framing}) {
  const host = useRef<HTMLDivElement>(null), state = useRef({speaking, paused, framing, mouth}), wake = useRef<() => void>(() => {});
  state.current = {speaking, paused, framing, mouth};
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {wake.current();}, [paused, speaking, framing]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'low-power'});} catch {setStatus('error'); return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Asesora Tony en tres dimensiones, animada mientras te habla');
    renderer.domElement.setAttribute('role', 'img');
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    camera.position.z = 5;
    const rig = createPortraitRig();
    scene.add(rig.mesh);
    let alive = true, visible = true, ready = false, frame = 0, last = 0, framed: Framing | '' = '';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = {x: 0, y: 0, active: false};
    let pointerTimer = 0;
    function size() {
      if (!alive) return;
      const w = mount!.clientWidth, h = mount!.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      rig.frame(camera, w, h, state.current.framing);
      framed = state.current.framing;
      if (ready) renderer.render(scene, camera);
    }
    new THREE.TextureLoader().load(siteAsset(ADVISOR_PORTRAIT), texture => {
      if (!alive) {texture.dispose(); return;}
      rig.setTexture(texture);
      ready = true;
      rig.update({dt: .016, now: performance.now(), speaking: false, mouth: {open: 0, wide: 0}, reduced: true, pointer});
      setStatus('ready'); size(); schedule();
    }, undefined, () => {if (alive) setStatus('error');});
    const resize = new ResizeObserver(size); resize.observe(mount); size();
    const observer = new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; schedule();}); observer.observe(mount);
    // She looks toward the visitor's pointer wherever it is on the page, not only over her stage.
    function move(event: PointerEvent) {
      if (!event.isTrusted || event.pointerType === 'touch') return;
      const box = mount!.getBoundingClientRect();
      const cx = box.left + box.width / 2, cy = box.top + box.height * (state.current.framing === 'bust' ? .3 : .18);
      pointer.x = Math.max(-1, Math.min(1, (event.clientX - cx) / Math.max(240, innerWidth * .45)));
      pointer.y = Math.max(-1, Math.min(1, (event.clientY - cy) / Math.max(200, innerHeight * .5)));
      pointer.active = true;
      clearTimeout(pointerTimer);
      pointerTimer = window.setTimeout(() => {pointer.active = false;}, 4000);
      schedule();
    }
    document.addEventListener('pointermove', move, {passive: true});
    function draw(now: number) {
      frame = 0;
      if (!alive || document.hidden || !visible || !ready) return;
      const dt = Math.min((now - last) / 1000, .05); last = now;
      const {speaking, paused, mouth, framing} = state.current;
      if (framing !== framed) size();
      const reduced = reduce.matches || paused;
      rig.update({dt, now, speaking, mouth: mouth?.sample(now) ?? {open: 0, wide: 0}, reduced, pointer});
      renderer.render(scene, camera);
      // With reduced motion only the lips move, and only while she speaks.
      if (!reduced || (speaking && mouth?.active)) schedule();
    }
    function schedule() {if (alive && !frame && visible && !document.hidden) {last = performance.now(); frame = requestAnimationFrame(draw);}}
    wake.current = schedule;
    function visibility() {if (document.hidden) {cancelAnimationFrame(frame); frame = 0;} else schedule();}
    function contextLost(event: Event) {event.preventDefault(); setStatus('error'); cancelAnimationFrame(frame); frame = 0; visible = false;}
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    document.addEventListener('visibilitychange', visibility); reduce.addEventListener('change', schedule); schedule();
    return () => {
      alive = false; wake.current = () => {}; cancelAnimationFrame(frame); clearTimeout(pointerTimer);
      resize.disconnect(); observer.disconnect(); reduce.removeEventListener('change', schedule);
      document.removeEventListener('visibilitychange', visibility); document.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      rig.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [attempt]);
  return <div className="advisor-stage" ref={host} data-state={status} data-framing={framing}>{status !== 'ready' && <div className="advisor-stage-status" role="status">{status === 'loading' ? 'Cargando a tu asesora…' : <>No se pudo cargar a la asesora. Puedes continuar con la guía.<button type="button" onClick={() => {setStatus('loading'); setAttempt(n => n + 1);}}>Reintentar</button></>}</div>}</div>;
}
