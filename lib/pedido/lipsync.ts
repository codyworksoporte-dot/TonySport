/**
 * Lip-sync for the advisor's voice. Web Speech gives no audio samples, so the
 * mouth follows the text instead: each letter becomes a viseme (how open and
 * how wide the mouth is) with a typical Spanish duration, and the engine's
 * word-boundary events re-anchor the timeline so it never drifts far from the
 * voice. When a voice fires no boundary events, the estimate alone still gives
 * a plausible, continuous mouth.
 */
export type Viseme = {open: number; wide: number};
export type Keyframe = Viseme & {at: number};
export const CLOSED: Viseme = {open: 0, wide: 0};

type Shape = [open: number, wide: number, ms: number];
const VOWELS: Record<string, Shape> = {a: [.95, .3, 96], e: [.6, .85, 88], i: [.4, 1, 80], o: [.82, -.65, 96], u: [.5, -1, 86]};
const SHAPES: Record<string, Shape> = {
  m: [0, .1, 72], b: [0, .1, 66], p: [0, .1, 66],
  f: [.18, .6, 66], v: [.18, .6, 62],
  l: [.32, .5, 54], n: [.28, .45, 54], 'ñ': [.3, .55, 58], d: [.3, .45, 52], t: [.3, .5, 52], s: [.22, .7, 58], z: [.22, .7, 58], c: [.3, .5, 54], r: [.3, .45, 48], y: [.35, .75, 56],
  g: [.38, .25, 54], j: [.38, .25, 58], k: [.38, .3, 54], q: [.38, .3, 54], x: [.3, .55, 58], h: [0, 0, 0], w: [.45, -.8, 70],
};
const ACCENTS: Record<string, string> = {'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u'};
const PAUSE: Record<string, number> = {'.': 240, '!': 240, '?': 240, ',': 130, ';': 160, ':': 160, '…': 260, '·': 120};

/** Milliseconds a viseme keeps its shape before blending to the next one. */
export function timelineFor(text: string, offsetMs = 0): Keyframe[] {
  const frames: Keyframe[] = [{at: offsetMs, ...CLOSED}];
  let at = offsetMs;
  for (const raw of text.toLowerCase()) {
    const ch = ACCENTS[raw] ?? raw;
    let shape: Shape | undefined;
    if (VOWELS[ch]) shape = VOWELS[ch];
    else if (SHAPES[ch]) shape = SHAPES[ch];
    else if (/\d/.test(ch)) shape = [.6, .5, 160];
    else if (PAUSE[ch] !== undefined) shape = [0, 0, PAUSE[ch]];
    else if (/\s/.test(ch)) shape = [0, 0, 58];
    else continue;
    const [open, wide, ms] = shape;
    if (!ms) continue;
    // The shape peaks in the middle of its sound, so neighbours blend into each other.
    frames.push({at: at + ms * .5, open, wide});
    at += ms;
  }
  frames.push({at: at + 70, ...CLOSED});
  return frames;
}

/** Linear blend between the two keyframes around `at`. */
export function sampleTimeline(frames: Keyframe[], at: number): Viseme {
  if (!frames.length || at <= frames[0].at) return CLOSED;
  const last = frames[frames.length - 1];
  if (at >= last.at) return CLOSED;
  let low = 0, high = frames.length - 1;
  while (high - low > 1) {const mid = (low + high) >> 1; if (frames[mid].at <= at) low = mid; else high = mid;}
  const a = frames[low], b = frames[high], span = b.at - a.at || 1, t = Math.min(1, Math.max(0, (at - a.at) / span));
  const ease = t * t * (3 - 2 * t);
  return {open: a.open + (b.open - a.open) * ease, wide: a.wide + (b.wide - a.wide) * ease};
}

export type MouthSource = {sample(now: number): Viseme; readonly active: boolean};

export class LipSync implements MouthSource {
  private text = '';
  private frames: Keyframe[] = [];
  private anchor = 0;
  private live = false;
  get active() {return this.live;}
  /** An utterance started: estimate the whole sentence from now. */
  start(text: string, now: number) {
    this.text = text;
    this.anchor = now;
    this.frames = timelineFor(text);
    this.live = true;
  }
  /** The engine reached a word: restart the estimate from that word, in sync with the voice. */
  boundary(charIndex: number, now: number) {
    if (!this.live || charIndex < 0 || charIndex >= this.text.length) return;
    this.anchor = now;
    this.frames = timelineFor(this.text.slice(charIndex));
  }
  stop() {this.live = false; this.frames = []; this.text = '';}
  sample(now: number): Viseme {
    if (!this.live) return CLOSED;
    return sampleTimeline(this.frames, now - this.anchor);
  }
}
