'use client';
import {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {siteAsset} from '@/lib/asset-path';
import {createPortraitRig, type Framing} from '@/lib/pedido/advisor-portrait';
import type {MouthSource} from '@/lib/pedido/lipsync';

export const ADVISOR_PORTRAIT = '/assets/advisor/tony-advisor-portrait.webp';
const EXPRESSION_POSES = '/assets/advisor/tony-advisor-expressions.webp';

/**
 * Mounted only in high mode. Owns and releases its complete WebGL lifecycle.
 * The portrait follows the visitor's pointer anywhere on the page, breathes,
 * shifts her weight and moves her lips with the voice (`mouth`).
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
    // The only mesh is a textured portrait with its own alpha silhouette.
    try {renderer = new THREE.WebGLRenderer({alpha: true, depth: false, powerPreference: 'low-power'});} catch {setStatus('error'); return;}
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
    let alive = true, visible = false, ready = false, lost = false;
    let frame = 0, lastDraw = 0, nextDraw = 0, scrolling = false, scrollTimer = 0;
    let width = 0, height = 0, framed: Framing | '' = '';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const touch = matchMedia('(pointer: coarse)');
    const pointer = {x: 0, y: 0, active: false};
    let pendingPointer: PointerEvent | null = null, pointerUntil = 0;
    const loader = new THREE.TextureLoader();
    loader.load(siteAsset(ADVISOR_PORTRAIT), texture => {
      if (!alive || lost) {texture.dispose(); return;}
      rig.setTexture(texture);
      ready = true;
      setStatus('ready'); wakeUp();
      // The portrait can already animate while its expression detail loads.
      loader.load(siteAsset(EXPRESSION_POSES), pose => {
        if (!alive || lost) {pose.dispose(); return;}
        rig.setExpressions(pose);
        wakeUp();
      });
    }, undefined, () => {if (alive) setStatus('error');});
    const resize = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width), h = Math.round(entry.contentRect.height);
      if (w === width && h === height) return;
      width = w; height = h; framed = '';
      wakeUp();
    });
    resize.observe(mount);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wakeUp(); else sleep();
    });
    observer.observe(mount);
    function move(event: PointerEvent) {
      if (visible && event.isTrusted && event.pointerType !== 'touch' && !reduce.matches && !state.current.paused) {
        pendingPointer = event;
        pointerUntil = performance.now() + 4000;
      }
    }
    function scroll() {
      if (!touch.matches || !visible || !ready || reduce.matches || state.current.paused) return;
      scrolling = true;
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {scrolling = false; wakeUp();}, 140);
    }
    document.addEventListener('pointermove', move, {passive: true});
    document.addEventListener('scroll', scroll, {passive: true, capture: true});
    function draw(now: number) {
      frame = 0;
      if (!width || !height) return;
      if (now + 0.5 < nextDraw) {schedule(); return;}
      const {speaking, paused, mouth, framing} = state.current;
      if (framing !== framed) {
        if (!framed) renderer.setSize(width, height, false);
        rig.frame(camera, width, height, framing);
        framed = framing;
      }
      if (pendingPointer) {
        const box = mount!.getBoundingClientRect();
        const cx = box.left + box.width / 2, cy = box.top + box.height * (framing === 'bust' ? .3 : .18);
        pointer.x = Math.max(-1, Math.min(1, (pendingPointer.clientX - cx) / Math.max(240, innerWidth * .45)));
        pointer.y = Math.max(-1, Math.min(1, (pendingPointer.clientY - cy) / Math.max(200, innerHeight * .5)));
        pendingPointer = null;
      }
      pointer.active = now < pointerUntil;
      const dt = lastDraw ? Math.min((now - lastDraw) / 1000, .05) : 1 / 60;
      lastDraw = now;
      const reduced = reduce.matches || paused;
      rig.update({dt, now, speaking, mouth: mouth?.sample(now) ?? {open: 0, wide: 0}, reduced, pointer});
      renderer.render(scene, camera);
      // Reserve the touch scroll budget for the page; keep lip sync sampling
      // the current speech time even during a swipe.
      if (!speaking && (reduced || scrolling)) return;
      const fps = speaking ? (touch.matches ? 30 : 60) : 24;
      const interval = 1000 / fps;
      nextDraw = now - nextDraw >= interval ? now + interval : nextDraw + interval;
      schedule();
    }
    function schedule() {
      if (alive && ready && !frame && visible && !document.hidden) frame = requestAnimationFrame(draw);
    }
    function wakeUp() {nextDraw = 0; schedule();}
    function sleep() {cancelAnimationFrame(frame); frame = 0; lastDraw = 0; nextDraw = 0;}
    wake.current = wakeUp;
    function visibility() {if (document.hidden) sleep(); else wakeUp();}
    function contextLost(event: Event) {event.preventDefault(); lost = true; ready = false; sleep(); setStatus('error');}
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    document.addEventListener('visibilitychange', visibility); reduce.addEventListener('change', wakeUp);
    return () => {
      alive = false; wake.current = () => {}; sleep(); clearTimeout(scrollTimer);
      resize.disconnect(); observer.disconnect(); reduce.removeEventListener('change', wakeUp);
      document.removeEventListener('scroll', scroll, true);
      document.removeEventListener('visibilitychange', visibility); document.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      rig.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [attempt]);
  return <div className="advisor-stage" ref={host} data-state={status} data-framing={framing}>{status !== 'ready' && <div className="advisor-stage-status" role="status">{status === 'loading' ? 'Cargando a tu asesora…' : <>No se pudo cargar a la asesora. Puedes continuar con la guía.<button type="button" onClick={() => {setStatus('loading'); setAttempt(n => n + 1);}}>Reintentar</button></>}</div>}</div>;
}
