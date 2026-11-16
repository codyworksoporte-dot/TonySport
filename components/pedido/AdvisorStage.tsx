'use client';
import {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {siteAsset} from '@/lib/asset-path';
import {createAdvisorRig} from '@/lib/pedido/advisor-rig';

/** Mounted only in high mode. Owns and releases its complete WebGL lifecycle. */
export default function AdvisorStage({speaking, paused}: {speaking: boolean; paused: boolean}) {
  const host = useRef<HTMLDivElement>(null), state = useRef({speaking, paused}), wake = useRef<() => void>(() => {});
  state.current = {speaking, paused};
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {wake.current();}, [paused, speaking]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'low-power'});} catch {setStatus('error'); return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Asesora Tony en tres dimensiones, de cuerpo completo');
    renderer.domElement.setAttribute('role', 'img');
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, .01, 100);
    scene.add(new THREE.HemisphereLight(0xeaffdd, 0x2b2327, 2.2));
    const key = new THREE.DirectionalLight(0xfff5e9, 3); key.position.set(2, 3, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0xb5f66f, 2); rim.position.set(-2, 2, -2); scene.add(rim);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(.65, 48), new THREE.MeshBasicMaterial({color: 0xa7d26b, transparent: true, opacity: .13}));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -.015; scene.add(ground);
    let alive = true, visible = true, model: THREE.Object3D | undefined, rig: ReturnType<typeof createAdvisorRig> | undefined;
    let frame = 0, last = 0, time = 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    function disposeObject(root: THREE.Object3D) {
      const materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
      root.traverse(object => {if (object instanceof THREE.Mesh) {object.geometry.dispose(); for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);}});
      for (const material of materials) {for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value); material.dispose();}
      for (const texture of textures) {const bitmap = texture.source?.data; if (typeof ImageBitmap !== 'undefined' && bitmap instanceof ImageBitmap) bitmap.close(); texture.dispose();}
    }
    function size() {
      if (!alive) return;
      const w = mount!.clientWidth, h = mount!.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      const distance = Math.max(5.2, .65 / camera.aspect / Math.tan(Math.PI / 12));
      camera.position.set(0, 1.25, distance); camera.lookAt(0, 1.18, 0); camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }
    new GLTFLoader().load(siteAsset('/assets/advisor/tony-advisor.glb'), gltf => {
      if (!alive) {disposeObject(gltf.scene); return;}
      rig = createAdvisorRig(gltf.scene);
      model = rig.root;
      model.scale.setScalar(2.4 / 1.7);
      rig.update(0, false, true);
      scene.add(model);
      setStatus('ready'); size();
    }, undefined, () => {if (alive) setStatus('error');});
    const resize = new ResizeObserver(size); resize.observe(mount); size();
    const observer = new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; schedule();}); observer.observe(mount);
    function draw(now: number) {
      frame = 0;
      if (!alive || document.hidden || !visible) return;
      if (now - last >= 1000 / 30) {
        const dt = Math.min((now - last) / 1000, .05); last = now;
        if (!state.current.paused && !reduce.matches) {
          time += dt;
          rig?.update(time, state.current.speaking);
        }
        renderer.render(scene, camera);
      }
      if (!state.current.paused && !reduce.matches) schedule();
    }
    function schedule() {if (alive && !frame && visible && !document.hidden) frame = requestAnimationFrame(draw);}
    wake.current = schedule;
    function visibility() {if (document.hidden) {cancelAnimationFrame(frame); frame = 0;} else {last = performance.now(); schedule();}}
    function contextLost(event: Event) {event.preventDefault(); setStatus('error'); cancelAnimationFrame(frame); frame = 0; visible = false;}
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    document.addEventListener('visibilitychange', visibility); reduce.addEventListener('change', schedule); schedule();
    return () => {alive = false; wake.current = () => {}; cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); reduce.removeEventListener('change', schedule); document.removeEventListener('visibilitychange', visibility); renderer.domElement.removeEventListener('webglcontextlost', contextLost); rig?.dispose(); disposeObject(scene); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();};
  }, [attempt]);
  return <div className="advisor-stage" ref={host} data-state={status}>{status !== 'ready' && <div className="advisor-stage-status" role="status">{status === 'loading' ? 'Cargando a tu asesora 3D…' : <>No se pudo cargar el personaje. Puedes continuar con la guía.<button type="button" onClick={() => {setStatus('loading'); setAttempt(n => n + 1);}}>Reintentar 3D</button></>}</div>}</div>;
}
