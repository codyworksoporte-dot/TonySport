/**
 * Every tunable of the decorative layer lives here: the scale glow, the lizard
 * peeking from the bottom edge, the section wink and the click scratch.
 * Components read these values; CSS receives the ones it needs as custom
 * properties from AmbientExperience and RouteTransition.
 */
export const AMBIENT = {
  preferenceKey: 'tony:ambient-effects:v1',
  /** Order and purchase flows: no mascot and no ambient light over them. */
  quietRoutes: /^\/(configurador|carrito|recientes)(?:\/|$)/,

  glow: {
    /** Radius of the lit area around the cursor, in CSS px (brief: 140–200). */
    radius: 170,
    /** Opacity of the joint layer at the cursor while it moves. */
    intensity: .92,
    /** Resting opacity once the cursor has been still for `restAfterMs`. */
    restIntensity: .6,
    restAfterMs: 2600,
    /** Time constants (ms) for following the cursor and fading in/out. */
    followMs: 70,
    fadeInMs: 140,
    fadeOutMs: 650,
    /** Occasional slow light travelling along some joints when the cursor is away. */
    ambient: { minDelayMs: 5500, maxDelayMs: 10000, durationMs: 3800, travel: 260, radius: 120, intensity: .4, quietAfterPointerMs: 3000 },
  },

  peek: {
    /** Tony rises over the bottom edge after this long without clicks, taps, scroll or keys (pointer movement doesn't count). */
    idleMs: 5500,
    /** Box width: clamp(min, vw, max). */
    width: { min: 170, vw: 22, max: 330 },
    /** Candidate spots (fractions of the viewport width); he takes the one covering the least content. */
    stopCandidates: [.12, .25, .38, .5, .62, .75, .88],
    /** Time to climb into view before he stares, and to drop out of sight. */
    enterMs: 800,
    fleeMs: 320,
    /** Quiet time after he leaves before he may come back. */
    cooldownMs: 5500,
  },

  transition: {
    /** Minimum time the cover stays before the wink, so Tony can arrive (route-transition.css: rt-arrive). */
    arriveMs: 480,
    /** From the start of the wink to the page opening; the wink finishes while it opens. */
    winkMs: 300,
    /** Time for the scales to fade from the new section. */
    revealMs: 380,
    /** Reveal anyway if a navigation never lands. */
    timeoutMs: 3200,
  },

  scratch: {
    /** Overall size of the mark in CSS px (brief: 24–40). */
    size: 34,
    durationMs: 340,
    /** Simultaneous scratches on screen; older ones are recycled. */
    maxActive: 4,
    /** A tap only counts if the pointer moved less than this and was released in time. */
    tapSlop: 8,
    tapMaxMs: 650,
  },
} as const;

/** Where decorative marks must never be drawn. */
export const SENSITIVE_TARGETS = 'input, textarea, select, option, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="slider"], [role="spinbutton"], dialog, [popover], [data-no-scratch], .tds-stage, .studio-canvas';
