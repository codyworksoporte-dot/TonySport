import {SOCIAL_COUNTS,SOCIAL_VERIFIED_DATE} from '@/lib/customer-content';
import {TONY_CHANNELS} from '@/lib/social-news';
import Icon from './Icon';
import './customer-content.css';

export default function SocialCommunity({index}:{index?:string}){
  return <section className="social-community section-wrap" aria-labelledby="social-community-title">
    <header><div><p className="eyebrow">{index&&<span className="section-index">{index}</span>} UNA MARCA. MUCHAS FORMAS DE CONECTAR.</p><h2 id="social-community-title">LA GARRA<br/><em>TAMBIÉN SE COMPARTE.</em></h2></div><p>Así crece la comunidad en nuestras cuentas oficiales. Encuentra las historias, los equipos y el día a día de Tony.</p></header>
    <div className="social-community-counts">{SOCIAL_COUNTS.map(item=><a href={TONY_CHANNELS[item.network].url} key={item.network} target="_blank" rel="noopener noreferrer" className={`social-count social-count-${item.network}`}><div><span>{TONY_CHANNELS[item.network].name}</span><Icon name="diagonal"/></div><strong>{item.approximate&&<><small aria-hidden="true">≈</small><span className="sr-only">aproximadamente </span></>}{item.display}</strong><span className="social-count-label">{item.label}</span><p>{TONY_CHANNELS[item.network].handle}</p></a>)}</div>
    <p className="social-count-source">Cifras públicas consultadas el <time dateTime={SOCIAL_VERIFIED_DATE}>23 de septiembre de 2026</time>. TikTok muestra una cifra redondeada. Actualización manual.</p>
  </section>;
}

