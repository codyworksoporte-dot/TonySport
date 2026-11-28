'use client';

import {useEffect, useRef, type ReactNode} from 'react';

type Drag = {id: number; startX: number; startY: number; lastX: number; time: number; moved: boolean};

/** The visible window uses native scroll coordinates. Repeating a row lets a drag hand
 * back to its automatic pace at the same chip, including when the user crosses a seam. */
export default function DisciplineRail({direction, count, children}: {
  direction: 'left' | 'right'; count: number; children: ReactNode;
}) {
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rail.current!;
    const list = el.firstElementChild as HTMLElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const restingSpeed = direction === 'right' ? -24 : 24; // Scroll pixels per second.
    let period = 0;
    let position = el.scrollLeft;
    let speed = restingSpeed;
    let lastFrame = 0;
    let frame = 0;
    let visible = false;
    let keyboard = false;
    let drag: Drag | null = null;
    let blockClick = false;

    function place(next: number) {
      if (!period) return;
      position = reduced.matches
        ? Math.max(0, Math.min(next, el.scrollWidth - el.clientWidth))
        : period + ((next % period) + period) % period;
      el.scrollLeft = position;
    }
    function tick(now: number) {
      const elapsed = lastFrame ? Math.min(now - lastFrame, 45) / 1000 : 0;
      lastFrame = now;
      speed += (restingSpeed - speed) * (1 - Math.exp(-elapsed * 6));
      place(position + speed * elapsed);
      frame = requestAnimationFrame(tick);
    }
    function resume() {
      cancelAnimationFrame(frame);
      lastFrame = 0;
      if (visible && !document.hidden && !reduced.matches && !keyboard && !drag && period) {
        frame = requestAnimationFrame(tick);
      }
    }
    function measure() {
      const previous = period;
      period = list.children[0]?.getBoundingClientRect().width * count;
      place(previous ? position / previous * period : el.scrollLeft);
      resume();
    }
    function down(event: PointerEvent) {
      if (!event.isPrimary || event.button !== 0) return;
      blockClick = false;
      keyboard = false;
      drag = {id: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, time: event.timeStamp, moved: false};
      position = el.scrollLeft;
      speed = 0;
      resume();
    }
    function move(event: PointerEvent) {
      if (!drag || drag.id !== event.pointerId) return;
      if (!drag.moved) {
        const dx = Math.abs(drag.startX - event.clientX);
        const dy = Math.abs(drag.startY - event.clientY);
        if (dx < 6 || dy > dx) return;
        drag.moved = true;
        el.setPointerCapture(event.pointerId);
        el.dataset.dragging = '';
      }
      const dx = drag.lastX - event.clientX;
      const dt = Math.max(8, event.timeStamp - drag.time);
      speed = Math.max(-1500, Math.min(1500, dx * 1000 / dt));
      place(position + dx);
      drag.lastX = event.clientX;
      drag.time = event.timeStamp;
    }
    function end(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return;
      blockClick = drag.moved;
      if (!drag.moved || event.timeStamp - drag.time > 100 || event.type === 'pointercancel') speed = restingSpeed;
      drag = null;
      delete el.dataset.dragging;
      resume();
    }
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY))) return;
      const delta = event.deltaX || event.deltaY;
      if (!delta) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientWidth : 1;
      place(el.scrollLeft + delta * unit);
    }
    function focus(event: FocusEvent) {
      if (!(event.target instanceof HTMLElement)) return;
      keyboard = event.target.matches(':focus-visible');
      resume();
    }
    function blur(event: FocusEvent) {
      if (event.relatedTarget instanceof Node && el.contains(event.relatedTarget)) return;
      keyboard = false;
      position = el.scrollLeft;
      resume();
    }
    function key(event: KeyboardEvent) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      const links = Array.from(list.querySelectorAll<HTMLAnchorElement>('li:not([data-copy]) a'));
      const index = links.indexOf(document.activeElement as HTMLAnchorElement);
      if (index < 0) return;
      event.preventDefault();
      links[(index + (event.key === 'ArrowRight' ? 1 : -1) + links.length) % links.length].focus();
    }
    function click(event: MouseEvent) {
      if (!blockClick || !event.detail) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      blockClick = false;
    }
    const listeners = new AbortController();
    const options = {signal: listeners.signal};
    el.dataset.interactive = '';
    const observer = new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; resume();});
    const size = new ResizeObserver(measure);
    observer.observe(el);
    size.observe(list);
    el.addEventListener('pointerdown', down, options);
    window.addEventListener('pointermove', move, options);
    window.addEventListener('pointerup', end, options);
    window.addEventListener('pointercancel', end, options);
    el.addEventListener('click', click, {...options, capture:true});
    el.addEventListener('dragstart', event => event.preventDefault(), options);
    el.addEventListener('wheel', wheel, {...options, passive:false});
    el.addEventListener('focusin', focus, options);
    el.addEventListener('focusout', blur, options);
    el.addEventListener('keydown', key, options);
    document.addEventListener('visibilitychange', resume, options);
    reduced.addEventListener('change', measure, options);
    measure();
    return () => {
      listeners.abort();
      observer.disconnect();
      size.disconnect();
      cancelAnimationFrame(frame);
      delete el.dataset.interactive;
      delete el.dataset.dragging;
    };
  }, [count, direction]);

  return <div ref={rail} className="home-marquee">{children}</div>;
}
