'use client';

import { useEffect, useRef, type MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon from './Icon';
import RevealText from './RevealText';
import { siteAsset } from '@/lib/asset-path';

export function Hero() {
  const art = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  // Entrance: the campaign settles in and the supporting lines follow the heading, once any intro or section change has uncovered the page.
  useEffect(() => {
    const root = section.current;
    if (!root) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const animations: Animation[] = [];
    let played = false;
    const play = () => {
      if (played || reduced.matches || document.documentElement.dataset.tonyEffects === 'off') return;
      const boot = (window as Window & { __tonyIntroBoot?: { pending: boolean } }).__tonyIntroBoot;
      if (boot?.pending || document.querySelector('.lagarto-intro[open]') || document.documentElement.dataset.routeCover) return;
      played = true;
      const compact = matchMedia('(max-width: 900px), (pointer: coarse)').matches;
      const image = root.querySelector('.hero-campaign-art img');
      if (image && !compact) animations.push(image.animate([{ transform: 'scale(1.09)', filter: 'brightness(.55) saturate(.8)' }, { transform: 'scale(1)', filter: 'none' }], { duration: 1700, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' }));
      root.querySelectorAll<HTMLElement>('[data-rise]').forEach(element => {
        animations.push(element.animate([{ opacity: 0, transform: compact ? 'none' : 'translate3d(0, 18px, 0)' }, { opacity: 1, transform: 'none' }], { duration: compact ? 180 : 720, delay: compact ? 0 : 260 + Number(element.dataset.rise) * 110, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' }));
      });
    };
    play();
    window.addEventListener('tony:intro-complete', play);
    window.addEventListener('tony:route-reveal', play);
    window.addEventListener('tony:effects-change', play);
    return () => {
      window.removeEventListener('tony:intro-complete', play);
      window.removeEventListener('tony:route-reveal', play);
      window.removeEventListener('tony:effects-change', play);
      animations.forEach(animation => animation.cancel());
    };
  }, []);
  function moveArt(event: MouseEvent<HTMLElement>) {
    if (!art.current || !window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    art.current.style.transform = `translate3d(${(event.clientX - rect.left - rect.width / 2) * .012}px,${(event.clientY - rect.top - rect.height / 2) * .012}px,0) scale(1.025)`;
  }
  return (
    <section ref={section} className="hero" aria-labelledby="hero-title" onMouseMove={moveArt} onMouseLeave={() => { if (art.current) art.current.style.transform = ''; }}>
      <div className="hero-campaign-art" ref={art}>
        <Image src={siteAsset('/assets/hero-campaign-v3.png')} alt="Concepto de camisetas Tony con textura de escamas, iluminadas en verde y ámbar" fill sizes="100vw" priority quality={90}/>
      </div>
      <div className="hero-vignette" aria-hidden="true"/>
      <div className="hero-topline" data-rise="0"><span>EL SALVADOR. EN NUESTRA PIEL.</span><span>DISEÑO / IDENTIDAD / INSTINTO</span></div>
      <div className="hero-text">
        <p className="hero-eyebrow" data-rise="0"><span className="status-dot"/> EL JUEGO EMPIEZA CONTIGO</p>
        <RevealText as="h1" id="hero-title">NACIDOS<br/>PARA DEJAR<br/><em>HUELLA.</em></RevealText>
        <p className="hero-description" data-rise="5">La garra se lleva dentro.<br/>La identidad, en la piel.</p>
        <div className="hero-buttons" data-rise="6">
          <Link href="/configurador" className="button primary">Crea tu uniforme <span className="button-icon"><Icon name="diagonal"/></span></Link>
          <Link href="/producto" className="hero-secondary">Explora Producto <span>↗</span></Link>
        </div>
      </div>
      <div className="hero-art-label" data-rise="7"><span className="micro-cross">+</span><div><span>TU EQUIPO. TU PROPIA PIEL.</span><strong>PERSONALIZACIÓN TONY</strong></div></div>
      <div className="hero-bottom" data-rise="8"><span><Icon name="shield"/> DEPORTE · EQUIPOS · EMPRESAS</span><span className="concept-label">BOCETO DE CAMPAÑA · DISEÑO CONCEPTUAL</span><a href="#como-funciona" aria-label="Conoce el proceso" className="scroll-cue">↓</a></div>
    </section>
  );
}
