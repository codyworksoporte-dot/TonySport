import { TonyClaw, TonyFace } from './TonyArt';
import './tony-peek.css';

/**
 * Tony rising over the bottom edge of the screen, exactly like the brand logo
 * over its shield: the claws grab the edge, the head comes up to look at you,
 * and both drop out of sight as soon as you touch, click, type or scroll.
 */
export default function TonyPeek() {
  return <>
    <div className="tp-face-wrap"><TonyFace className="tp-face"/></div>
    <div className="tp-claw tp-claw--left"><TonyClaw/></div>
    <div className="tp-claw tp-claw--right"><TonyClaw flip/></div>
  </>;
}
