import type { SVGProps } from 'react';
import { TONY_CLAW, TONY_EYES, TONY_HEAD } from '@/lib/tony-art';
import { siteAsset } from '@/lib/asset-path';
import './tony-art.css';

/*
 * Tony as drawn in the brand logo: the head peeking over an edge (its flat base
 * is that edge) and the claw that grips it. The artwork is vectorised from the
 * reference and served as cached SVG files; only the eyelids are inline, so CSS
 * can close them for a blink (`.tf-lid`) or a wink (`.tf-lid--right`).
 */
const HEAD_SRC = siteAsset('/assets/tony-head.svg');
const CLAW_SRC = siteAsset('/assets/tony-claw.svg');
const LID = { fill: '#2f9346', stroke: '#080e0a', strokeWidth: 1.3, strokeLinejoin: 'round' } as const;

/** Each eye's box in head units, with room for the lid's outline. */
const EYE_BOXES = TONY_EYES.map(d => {
  const numbers = d.match(/-?\d*\.?\d+/g)!.map(Number);
  const xs = numbers.filter((_, index) => index % 2 === 0), ys = numbers.filter((_, index) => index % 2 === 1);
  const pad = LID.strokeWidth / 2;
  const x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
  return { x, y, width: Math.max(...xs) + pad - x, height: Math.max(...ys) + pad - y };
});
const percent = (value: number, of: number) => `${(value / of * 100).toFixed(3)}%`;

function Lids() {
  return <>{TONY_EYES.map((d, index) => <path key={index} className={`tf-lid tf-lid--${index ? 'right' : 'left'}`} d={d} {...LID}/>)}</>;
}

/**
 * The head as HTML: each lid is its own small element over the eye, so a blink
 * or a wink is a transform the compositor runs without repainting the head.
 */
export function TonyFace({ className = '' }: { className?: string }) {
  return <span className={`tony-face ${className}`} aria-hidden="true">
    <img src={HEAD_SRC} alt="" width={TONY_HEAD.width * 4} height={TONY_HEAD.height * 4} draggable={false} decoding="async"/>
    {TONY_EYES.map((d, index) => {
      const box = EYE_BOXES[index];
      return <span key={index} className={`tf-lid tf-lid--${index ? 'right' : 'left'}`} style={{ left: percent(box.x, TONY_HEAD.width), top: percent(box.y, TONY_HEAD.height), width: percent(box.width, TONY_HEAD.width), height: percent(box.height, TONY_HEAD.height) }}>
        <svg viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} preserveAspectRatio="none" focusable="false"><path d={d} {...LID}/></svg>
      </span>;
    })}
  </span>;
}

/** The same head placed inside another SVG drawing. */
export function TonyFaceInSvg({ className = '', ...box }: SVGProps<SVGSVGElement>) {
  return <svg {...box} className={`tony-face ${className}`} viewBox={`0 0 ${TONY_HEAD.width} ${TONY_HEAD.height}`} overflow="visible" aria-hidden="true" focusable="false">
    <image href={HEAD_SRC} width={TONY_HEAD.width} height={TONY_HEAD.height}/>
    <Lids/>
  </svg>;
}

/** A claw gripping an edge; the fingers point right, or left when `flip`. */
export function TonyClaw({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return <img className={`tony-claw${flip ? ' tony-claw--flip' : ''} ${className}`} src={CLAW_SRC} alt="" aria-hidden="true" width={TONY_CLAW.width * 4} height={TONY_CLAW.height * 4} draggable={false} decoding="async"/>;
}

export function TonyClawInSvg({ flip = false, ...box }: SVGProps<SVGSVGElement> & { flip?: boolean }) {
  return <svg {...box} viewBox={`0 0 ${TONY_CLAW.width} ${TONY_CLAW.height}`} overflow="visible" aria-hidden="true" focusable="false">
    <image href={CLAW_SRC} width={TONY_CLAW.width} height={TONY_CLAW.height} transform={flip ? `translate(${TONY_CLAW.width} 0) scale(-1 1)` : undefined}/>
  </svg>;
}
