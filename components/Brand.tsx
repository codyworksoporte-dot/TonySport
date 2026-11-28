import TonyWordmark from './TonyWordmark';
import IntentLink from './IntentLink';
import './brand.css';

export default function Brand() {
  return (
    <IntentLink href="/" className="brand" aria-label="Tony Sportswear — Inicio">
      <TonyWordmark alt="TONY Sportswear" className="official-logo"/>
    </IntentLink>
  );
}
