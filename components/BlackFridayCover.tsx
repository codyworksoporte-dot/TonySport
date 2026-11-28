import Link from 'next/link';
import Icon from '@/components/Icon';
import TonyWordmark from './TonyWordmark';
import {BLACK_FRIDAY, PROMOTIONS_PAGE} from '@/lib/promotions';
import {responsive} from '@/lib/responsive-image';
import './black-friday-cover.css';

export default function BlackFridayCover({promotionPage = false}: {promotionPage?: boolean}) {
  return <section id={BLACK_FRIDAY.id} className={promotionPage ? 'bf-cover tc-rise' : 'bf-cover'} aria-labelledby="bf-title">
    {promotionPage && <h1 className="tc-sr">Promociones</h1>}
    <img className="bf-cover-photo" {...responsive(BLACK_FRIDAY.image, '(max-width: 640px) 100vw, 1160px')} alt="" width={1200} height={800} decoding="async" loading={promotionPage ? 'eager' : 'lazy'}/>
    <div className="bf-cover-copy">
      <p className="bf-cover-brand"><TonyWordmark alt="Tony Sportwear"/></p>
      <h2 id="bf-title" className="tc-display bf-cover-title">Black <em>Friday</em></h2>
      <p className="bf-cover-offer">30% <span>OFF</span></p>
      <p className="bf-cover-dates">{BLACK_FRIDAY.dates}</p>
      {promotionPage
        ? <a className="tc-btn tc-btn--wa" href={BLACK_FRIDAY.contact} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp-solid"/>Consultar la promoción</a>
        : <Link href={`${PROMOTIONS_PAGE}#${BLACK_FRIDAY.id}`} className="tc-btn tc-btn--lime">Ver promoción <Icon name="arrow"/></Link>}
    </div>
  </section>;
}
