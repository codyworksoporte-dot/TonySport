'use client';

import { useEffect, useRef } from 'react';

export default function ScaleBackdrop() {
  const spotRef = useRef<HTMLDivElement>(null);
  const seamsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const spot = spotRef.current;
    const seams = seamsRef.current;
    if (!spot || !seams) return;
    const preference = matchMedia('(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference)');
    const tile = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale-tile'));
    let radius = 0;
    let clientX = 0, clientY = 0, frame = 0, inside = false;
    let listeners: AbortController | undefined;
    const wrap = (value: number) => ((value % tile) + tile) % tile;

    const draw = () => {
      frame = 0;
      // The light follows the viewport pointer. Both textures stay anchored to the document.
      const left = Math.round(clientX + window.scrollX - radius);
      const top = Math.round(clientY + window.scrollY - radius);
      spot.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      seams.style.transform = `translate3d(${-wrap(left)}px, ${-wrap(top)}px, 0)`;
      spot.dataset.lit = 'true';
    };

    function schedule() {
      if (inside && !frame) frame = requestAnimationFrame(draw);
    }

    const hide = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      inside = false;
      delete spot.dataset.lit;
    };

    function move(event: PointerEvent) {
      if (event.pointerType === 'touch') { hide(); return; }
      clientX = event.clientX;
      clientY = event.clientY;
      inside = true;
      schedule();
    }

    function leave(event: PointerEvent) {
      if (!event.relatedTarget) hide();
    }

    const sync = () => {
      listeners?.abort();
      hide();
      spot.hidden = !preference.matches;
      if (spot.hidden) return;
      radius = spot.offsetWidth / 2;
      listeners = new AbortController();
      const options = {passive: true, signal: listeners.signal};
      window.addEventListener('pointermove', move, options);
      window.addEventListener('pointerout', leave, options);
      window.addEventListener('scroll', schedule, options);
      window.addEventListener('blur', hide, options);
      document.addEventListener('visibilitychange', hide, options);
    };

    sync();
    preference.addEventListener('change', sync);
    return () => {
      preference.removeEventListener('change', sync);
      listeners?.abort();
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="scale-backdrop" aria-hidden="true">
    <div className="scale-spot" ref={spotRef} hidden><div className="scale-seams" ref={seamsRef}/></div>
  </div>;
}
