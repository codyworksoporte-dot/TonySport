import { AMBIENT, SENSITIVE_TARGETS } from './ambient-config';

/**
 * One imperative controller for all decorative motion: the joint glow, the
 * ambient light, the lizard peeking from the bottom edge and the click scratch.
 * It owns a single set of listeners and a single requestAnimationFrame loop that
 * sleeps whenever nothing is moving, so React never re-renders for pointer or
 * scroll input.
 */
export type AmbientElements = {
  glow: HTMLElement;
  pulse: HTMLElement;
  peek: HTMLElement;
  scratches: SVGSVGElement[];
};

type PeekMode = 'off' | 'enter' | 'look' | 'flee';

const CONTENT = 'a, button, input, select, textarea, label, summary, img, picture, video, canvas, iframe, svg, p, h1, h2, h3, h4, h5, h6, li, dt, dd, blockquote, figcaption, table, form, dialog, [role], [popover]';
const EDITABLE = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable]:not([contenteditable="false"])';

const approach = (dt: number, ms: number) => 1 - Math.exp(-dt / ms);

function hasOwnText(element: Element) {
  for (const node of element.childNodes) if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true;
  return false;
}

/** A filled or bordered box narrower than the page: a card, panel or control group. */
function isSurface(element: Element) {
  if (element.getBoundingClientRect().width >= innerWidth * .86) return false;
  const style = getComputedStyle(element);
  if (style.backgroundImage !== 'none') return true;
  const channels = style.backgroundColor.match(/\(([^)]+)\)/)?.[1].split(/[\s,/]+/) ?? [];
  if (channels.length >= 3 && Number(channels[3] ?? 1) >= .12) return true;
  return parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== 'none' && parseFloat(style.borderLeftWidth) > 0;
}

/** True when something the visitor reads or uses sits at this point of the viewport. */
function occupied(x: number, y: number) {
  for (const element of document.elementsFromPoint(x, y)) {
    if (element === document.documentElement || element === document.body || element.tagName === 'MAIN') return false;
    if (element.closest('.tony-ambient')) continue;
    if (element.matches(CONTENT) || hasOwnText(element) || isSurface(element)) return true;
  }
  return false;
}

export function startAmbient(elements: AmbientElements, initialPath: string) {
  const { glow, pulse, peek, scratches } = elements;
  const { glow: glowConfig, peek: peekConfig, scratch: scratchConfig } = AMBIENT;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const snap = (value: number) => { const ratio = Math.min(2, devicePixelRatio || 1); return Math.round(value * ratio) / ratio; };
  const timers = new Set<number>();
  const later = (callback: () => void, ms: number) => { const id = window.setTimeout(() => { timers.delete(id); callback(); }, ms); timers.add(id); return id; };
  const cancel = (id: number) => { clearTimeout(id); timers.delete(id); };

  let quiet = AMBIENT.quietRoutes.test(initialPath);
  let busy = false;
  let frame = 0, lastFrame = 0;

  const request = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); };

  /* ---------- open dialogs, menus and fields keep the decoration out of the way ---------- */
  const computeBusy = () => document.hidden
    || !!document.querySelector('dialog[open], :popover-open, [aria-expanded="true"][aria-controls]')
    || !!document.activeElement?.matches(EDITABLE);

  /* ---------- the lizard that rises over the bottom edge, stares and drops away ---------- */
  let peekMode: PeekMode = 'off', peekTimer = 0, lastInteraction = performance.now();
  const setPeekMode = (mode: PeekMode) => { peekMode = mode; peek.dataset.state = mode; };
  const armPeek = (delay = peekConfig.idleMs - (performance.now() - lastInteraction)) => {
    cancel(peekTimer);
    peekTimer = later(tryPeek, Math.max(60, delay));
  };
  const tryPeek = () => {
    peekTimer = 0;
    if (peekMode !== 'off') return;
    if (performance.now() - lastInteraction < peekConfig.idleMs - 20) { armPeek(); return; }
    if (document.hidden || busy || quiet || document.documentElement.dataset.routeCover) { armPeek(900); return; }
    const box = peek.getBoundingClientRect(), width = box.width || 260, height = box.height || width * .34;
    // Rise where he covers the least: buttons and links weigh more than text, open floor weighs nothing.
    let target = 0, best = Infinity;
    for (const fraction of peekConfig.stopCandidates) {
      const left = Math.max(4, Math.min(innerWidth - width - 4, innerWidth * fraction - width / 2));
      let score = Math.random() * .5;
      for (const fx of [.2, .5, .8]) for (const fy of [.3, .75]) {
        const x = left + width * fx, y = innerHeight - height + height * fy;
        const top = document.elementsFromPoint(x, y).find(element => !element.closest('.tony-ambient'));
        if (top?.closest('a, button, input, select, textarea, label, summary, [role="button"]')) score += 3;
        else if (occupied(x, y)) score += 1;
      }
      if (score < best) { best = score; target = left; }
    }
    peek.style.transform = `translate3d(${Math.round(target)}px, 0, 0)`;
    setPeekMode('enter');
    later(() => { if (peekMode === 'enter') setPeekMode('look'); }, peekConfig.enterMs);
  };
  const fleePeek = () => {
    if (peekMode !== 'enter' && peekMode !== 'look') return;
    setPeekMode('flee');
    later(() => {
      if (peekMode !== 'flee') return;
      setPeekMode('off');
      armPeek(Math.max(peekConfig.cooldownMs, peekConfig.idleMs - (performance.now() - lastInteraction)));
    }, peekConfig.fleeMs);
  };
  const interaction = () => {
    lastInteraction = performance.now();
    fleePeek();
    if (peekMode === 'off') armPeek();
  };
  const hidePeek = () => { if (peekMode !== 'off') setPeekMode('off'); };

  /* ---------- joint glow around the cursor ---------- */
  let pointerInside = false, clientX = 0, clientY = 0, lastMove = 0, restTimer = 0;
  const light = { x: 0, y: 0, targetX: 0, targetY: 0, opacity: 0, placed: false };

  const tile = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale-tile')) || 640;
  const wrap = (value: number) => ((value % tile) + tile) % tile;
  /*
   * The masked window moves to the cursor and the joint layer inside it moves
   * back by the same amount (modulo one tile), so the seams stay anchored to the
   * document origin like the base texture. Both are transforms: nothing repaints.
   */
  const place = (element: HTMLElement, x: number, y: number, radius: number) => {
    const left = snap(x - radius), top = snap(y - radius);
    element.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    (element.firstElementChild as HTMLElement).style.transform = `translate3d(${-wrap(left)}px, ${-wrap(top)}px, 0)`;
  };

  const stepGlow = (dt: number) => {
    const now = performance.now();
    const active = pointerInside && finePointer.matches && !busy;
    const resting = now - lastMove > glowConfig.restAfterMs;
    const target = active ? (resting ? glowConfig.restIntensity : glowConfig.intensity) : 0;
    if (!light.placed) { light.x = light.targetX; light.y = light.targetY; light.placed = true; }
    const follow = approach(dt, glowConfig.followMs);
    light.x += (light.targetX - light.x) * follow;
    light.y += (light.targetY - light.y) * follow;
    light.opacity += (target - light.opacity) * approach(dt, target > light.opacity ? glowConfig.fadeInMs : glowConfig.fadeOutMs);
    if (Math.abs(target - light.opacity) < .004) light.opacity = target;
    if (light.opacity > 0 || target > 0) place(glow, light.x, light.y, glowConfig.radius);
    glow.style.opacity = light.opacity.toFixed(3);
    const settled = Math.abs(light.targetX - light.x) + Math.abs(light.targetY - light.y) < .3 && light.opacity === target;
    // Dim to the resting level once the cursor has been still for a moment.
    if (settled && active && !resting && !restTimer) restTimer = later(() => { restTimer = 0; request(); }, lastMove + glowConfig.restAfterMs - now + 30);
    return !settled;
  };

  /* ---------- slow light travelling along some joints ---------- */
  let pulseTimer = 0;
  let travel: { x: number; y: number; dx: number; dy: number; start: number } | null = null;
  const schedulePulse = () => {
    cancel(pulseTimer);
    const { minDelayMs, maxDelayMs } = glowConfig.ambient;
    pulseTimer = later(startPulse, minDelayMs + Math.random() * (maxDelayMs - minDelayMs));
  };
  const startPulse = () => {
    if (document.hidden || quiet || busy || (pointerInside && performance.now() - lastMove < glowConfig.ambient.quietAfterPointerMs)) { schedulePulse(); return; }
    // Only start where the scales are actually visible between sections.
    for (let attempt = 0; attempt < 8; attempt++) {
      const x = innerWidth * (.06 + Math.random() * .88), y = innerHeight * (.14 + Math.random() * .76);
      if (occupied(x, y)) continue;
      const angle = Math.random() * Math.PI * 2;
      travel = { x: x + scrollX, y: y + scrollY, dx: Math.cos(angle), dy: Math.sin(angle) * .6, start: performance.now() };
      request();
      return;
    }
    schedulePulse();
  };
  const stepPulse = () => {
    if (!travel) return false;
    const { durationMs, travel: distance, radius, intensity } = glowConfig.ambient;
    const t = (performance.now() - travel.start) / durationMs;
    if (t >= 1 || (pointerInside && performance.now() - lastMove < 400)) {
      travel = null; pulse.style.opacity = '0'; schedulePulse();
      return false;
    }
    const eased = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    place(pulse, travel.x + travel.dx * distance * eased, travel.y + travel.dy * distance * eased, radius);
    pulse.style.opacity = (Math.sin(Math.PI * t) ** 1.4 * intensity).toFixed(3);
    return true;
  };

  /* ---------- click scratch ---------- */
  let press: { id: number; x: number; y: number; time: number; scrolled: boolean } | null = null;
  let scratchIndex = 0;
  const scratchAnimations: (Animation | undefined)[] = [];
  const scratch = (x: number, y: number) => {
    const slot = scratchIndex++ % Math.min(scratchConfig.maxActive, scratches.length);
    const node = scratches[slot];
    scratchAnimations[slot]?.cancel();
    node.style.left = `${x - scratchConfig.size / 2}px`;
    node.style.top = `${y - scratchConfig.size / 2}px`;
    const pose = `rotate(${(-16 + Math.random() * 24).toFixed(1)}deg) scale(${(.9 + Math.random() * .18).toFixed(2)})`;
    const animation = node.animate([
      { opacity: 0, clipPath: 'inset(0 0 100% 0)', transform: pose },
      { opacity: 1, clipPath: 'inset(0 0 0 0)', transform: pose, offset: .28 },
      { opacity: .85, clipPath: 'inset(0 0 0 0)', transform: pose, offset: .5 },
      { opacity: 0, clipPath: 'inset(0 0 0 0)', transform: pose },
    ], { duration: scratchConfig.durationMs, easing: 'cubic-bezier(.2, .8, .2, 1)' });
    animation.onfinish = () => { if (scratchAnimations[slot] === animation) scratchAnimations[slot] = undefined; };
    scratchAnimations[slot] = animation;
  };

  /* ---------- the single frame loop ---------- */
  function tick(now: number) {
    frame = 0;
    const dt = Math.min(48, lastFrame ? now - lastFrame : 16);
    lastFrame = now;
    const glowing = stepGlow(dt), travelling = stepPulse();
    if (glowing || travelling) request(); else lastFrame = 0;
  }

  const refresh = () => {
    busy = computeBusy();
    if (busy) fleePeek();
    request();
  };

  /* ---------- listeners ---------- */
  let uiTimer = 0;
  const onUiChange = () => { cancel(uiTimer); uiTimer = later(refresh, 60); };
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    pointerInside = true; clientX = event.clientX; clientY = event.clientY; lastMove = performance.now();
    light.targetX = clientX + scrollX; light.targetY = clientY + scrollY;
    request();
  };
  const onPointerDown = (event: PointerEvent) => {
    interaction();
    press = event.isPrimary && event.button === 0 ? { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), scrolled: false } : null;
  };
  const onPointerUp = (event: PointerEvent) => {
    const start = press;
    press = null;
    if (!start || start.id !== event.pointerId || start.scrolled) return;
    if (performance.now() - start.time > scratchConfig.tapMaxMs || Math.hypot(start.x - event.clientX, start.y - event.clientY) > scratchConfig.tapSlop) return;
    if (getSelection()?.isCollapsed === false) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest(SENSITIVE_TARGETS) && !document.querySelector('dialog[open]')) scratch(event.clientX, event.clientY);
  };
  const onPointerCancel = () => { press = null; };
  const onScroll = () => {
    interaction();
    if (press) press.scrolled = true;
    if (pointerInside) { light.targetX = clientX + scrollX; light.targetY = clientY + scrollY; request(); }
  };
  const onLeave = () => { pointerInside = false; request(); };
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame); frame = 0; lastFrame = 0;
      cancel(pulseTimer); travel = null; pulse.style.opacity = '0';
      pointerInside = false; light.opacity = 0; glow.style.opacity = '0';
      busy = true; hidePeek();
      return;
    }
    lastInteraction = performance.now(); armPeek(); schedulePulse(); refresh();
  };
  const onIntroStart = () => { cancel(pulseTimer); cancel(peekTimer); busy = true; hidePeek(); };
  const onIntroEnd = () => { schedulePulse(); lastInteraction = performance.now(); armPeek(); onUiChange(); };

  // Dialogs, <details> and menu buttons announce themselves through these attributes.
  const observer = new MutationObserver(onUiChange);
  observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open', 'aria-expanded'] });

  const passive = { passive: true } as const, capture = { passive: true, capture: true } as const;
  const listeners: [EventTarget, string, EventListener, AddEventListenerOptions | boolean][] = [
    [window, 'pointermove', onPointerMove as EventListener, passive],
    [window, 'pointerdown', onPointerDown as EventListener, capture],
    [window, 'pointerup', onPointerUp as EventListener, capture],
    [window, 'pointercancel', onPointerCancel, passive],
    [window, 'scroll', onScroll, passive],
    [window, 'wheel', interaction, passive],
    [window, 'touchstart', interaction, passive],
    [window, 'keydown', interaction, passive],
    [window, 'resize', onUiChange, passive],
    [window, 'blur', onLeave, false],
    [window, 'tony:intro-start', onIntroStart, false],
    [window, 'tony:intro-complete', onIntroEnd, false],
    [document.documentElement, 'pointerleave', onLeave, false],
    [document, 'visibilitychange', onVisibility, false],
    [document, 'focusin', onUiChange, false],
    [document, 'focusout', onUiChange, false],
    [document, 'toggle', onUiChange, true],
  ];
  for (const [target, type, listener, options] of listeners) target.addEventListener(type, listener, options);

  peek.dataset.state = 'off';
  armPeek();
  schedulePulse();
  onUiChange();

  return {
    setRoute(path: string) {
      quiet = AMBIENT.quietRoutes.test(path);
      hidePeek();
      lastInteraction = performance.now();
      armPeek();
      onUiChange();
    },
    destroy() {
      cancelAnimationFrame(frame);
      timers.forEach(id => clearTimeout(id)); timers.clear();
      observer.disconnect();
      for (const [target, type, listener, options] of listeners) target.removeEventListener(type, listener, options);
      scratchAnimations.forEach(animation => animation?.cancel());
      peek.dataset.state = 'off';
      peek.style.transform = '';
      glow.style.opacity = '0';
      pulse.style.opacity = '0';
    },
  };
}
