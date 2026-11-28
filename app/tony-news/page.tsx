import type {Metadata} from 'next';
import SocialGlyph from '@/components/SocialGlyph';
import SocialPublication from '@/components/SocialPublication';
import {LOURDES_PUBLICATION, TONY_CHANNELS} from '@/lib/social-news';
import './tony-news.css';

export const metadata: Metadata = {
  title:'Tony News | Publicaciones y videos',
  description:'Publicaciones de Tony y sus canales oficiales en Instagram, TikTok y Facebook.',
};

export default function TonyNewsPage(){
  return <main id="contenido" className="tony-news-page">
    <header className="tn-hero tn-wrap"><h1>TONY <em>NEWS.</em></h1></header>
    <section className="tn-feature tn-wrap" aria-labelledby="tn-feature-title">
      <SocialPublication provider="instagram"/>
      <div className="tn-feature-copy">
        <div className="tn-post-meta"><span>Instagram</span><time dateTime={LOURDES_PUBLICATION.publishedAt}>{LOURDES_PUBLICATION.dateLabel}</time></div>
        <h2 id="tn-feature-title">La llegada<br/>de Tony <em>a Lourdes.</em></h2>
        <p>Así anunciamos la apertura de Tony Lourdes, prevista para el 18 de septiembre de 2026. Mirá el reel original en Instagram.</p>
      </div>
    </section>
    <section className="tn-social tn-wrap" aria-labelledby="tn-social-title">
      <div><h2 id="tn-social-title">Las redes <em>de Tony.</em></h2>
        <nav className="tn-social-links" aria-label="Canales oficiales de Tony">
          {(['instagram','tiktok','facebook'] as const).map(id => <a key={id} href={TONY_CHANNELS[id].url}
            aria-label={TONY_CHANNELS[id].name} title={TONY_CHANNELS[id].name} target="_blank" rel="noopener noreferrer" className={`tn-logo-${id}`}>
            <SocialGlyph channel={id} size={34}/>
          </a>)}
        </nav>
      </div>
      <SocialPublication provider="tiktok"/>
    </section>
  </main>;
}
