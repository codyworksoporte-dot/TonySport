import { TonyFace } from './TonyArt';
import './tony-peek.css';

/**
 * Tony rising over the bottom edge of the screen, exactly like the brand logo
 * over its shield: head and claws come up together, his eye catches fire, he
 * stares and roars now and then, and drops out of sight as soon as you touch,
 * click, type or scroll. The box takes its height from the art.
 */
export default function TonyPeek() {
  return <div className="tp-face-wrap"><TonyFace className="tp-face"/></div>;
}
