import type { CSSProperties } from 'react';
import { TONY_ART, ratioOf } from '@/lib/tony-art';
import { TonyFace } from './TonyArt';
import './tony-mascot.css';

/*
 * Tony lunging over an edge, as in the brand logo: the art turned a quarter so
 * the shield's edge it rises from lies along the parent's right edge, both claws
 * gripping it (they are part of the art; the hand layers stay as empty anchors
 * for parents that animate them). The cart shows him chomping a removed design:
 * the parent sets --tm-width and animates .tm-head (in and out), .tm-lunge
 * (growing from the edge, so the base never leaves it) and .tm-face (chomps
 * around the jaw hinge).
 */
const turned = { aspectRatio: `1 / ${(1 / ratioOf(TONY_ART.peek)).toFixed(5)}`, '--tony-aspect': (1 / ratioOf(TONY_ART.peek)).toFixed(5) } as CSSProperties;

export default function TonyMascot() {
  return <>
    <div className="tm-layer tm-head" style={turned}><div className="tm-turn"><div className="tm-lunge"><TonyFace className="tm-face"/></div></div></div>
    <div className="tm-hand tm-hand--top"/>
    <div className="tm-hand tm-hand--bottom"/>
  </>;
}
