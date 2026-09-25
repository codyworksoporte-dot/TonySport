import { TonyClaw, TonyFace } from './TonyArt';
import './tony-mascot.css';

/*
 * Tony gripping an edge, as in the brand logo: the head turned so its flat base
 * lies along the edge and both claws holding on above and below. The cart shows
 * him taking a bite out of a removed design; the parent sets --tm-width and
 * animates the head and claws.
 */
export default function TonyMascot() {
  return <>
    <div className="tm-layer tm-head"><TonyFace className="tm-face"/></div>
    <div className="tm-hand tm-hand--top"><TonyClaw flip/></div>
    <div className="tm-hand tm-hand--bottom"><TonyClaw flip/></div>
  </>;
}
