import type {Metadata} from 'next';
import Link from 'next/link';
import {SponsorshipProposal} from '@/components/EditorialTools';
import {EditorialShell} from '@/components/TonyEditorial';
import {siteAsset} from '@/lib/asset-path';
import './patrocinio.css';

export const metadata: Metadata = {
  title:'Patrocinio deportivo de Tony',
  description:'Conoce los clubes de fútbol que Tony presenta en su archivo de patrocinios y prepara la propuesta de tu equipo.',
};

const clubs = [
  {slug:'dragon', name:'C.D. Dragón', photo:'Presentación de la indumentaria de C.D. Dragón', credit:'Stefany Andrade / Diario El Mundo, 2022', source:'https://diario.elmundo.sv/deportes/dragon-presento-su-nueva-piel-para-el-apertura-2022'},
  {slug:'platense', name:'C.D. Platense', photo:'Jugadores de C.D. Platense con la camiseta amarilla del club'},
  {slug:'cacahuatique', name:'C.D. Cacahuatique', photo:'Jugadores de C.D. Cacahuatique reunidos junto al trofeo'},
  {slug:'marte-soyapango', name:'C.F. Marte Soyapango', photo:'Formación del C.F. Marte Soyapango con su uniforme azul', credit:'Diario El Mundo, 2022', source:'https://diario.elmundo.sv/deportes/jugadores-de-equipo-de-segunda-division-denuncian-deuda-salarial-de-dos-meses'},
];
const source = 'https://www.tonysportselsalvador.com/patrocinadores/';

export default function SponsorshipPage() {
  return <EditorialShell className="te-sponsorship">
    <div className="club-wrap">
      <nav aria-label="Ruta de navegación" className="club-path"><Link href="/">Inicio</Link> / Patrocinio</nav>
      <header className="club-intro">
        <div><p className="club-kicker">Fútbol salvadoreño</p><h1>Patrocinio <em>Tony.</em></h1></div>
        <div><p>Conocé los clubes que forman parte de nuestro archivo de patrocinios.</p><a href="#propuesta">Presentar mi equipo <span aria-hidden="true">↓</span></a></div>
      </header>
      <section className="club-grid" aria-label="Clubes patrocinados por Tony">
        {clubs.map(({slug,name,photo,credit,source:creditUrl},index) => <article key={slug} className={`club-card club-${slug}`}>
          <img className="club-photo" src={siteAsset(`/assets/patrocinio/foto-${slug}.webp`)} alt={photo} width="520" height="360" loading={index === 0 ? 'eager' : 'lazy'}/>
          <div className="club-identity"><img className="club-crest" src={siteAsset(`/assets/patrocinio/escudo-${slug}.webp`)} alt={`Escudo de ${name}`} width="64" height="64" loading="lazy"/><h2>{name}</h2></div>
          {credit && <small className="club-credit">Foto de archivo · <a href={creditUrl} target="_blank" rel="noopener noreferrer">{credit}</a></small>}
        </article>)}
      </section>
      <p className="club-source"><a href={source} target="_blank" rel="noopener noreferrer">Ver el archivo de patrocinio de Tony ↗</a></p>
    </div>
    <section className="te-wrap te-rule" id="propuesta"><div className="te-proposal-layout">
      <aside className="te-proposal-aside"><p className="club-kicker">Clubes y academias</p><h2>Presentá <em>tu equipo.</em></h2><p>Contanos dónde juegan, qué necesitan y quién es la persona de contacto. Podés revisar tu propuesta antes de compartirla con Tony.</p></aside>
      <SponsorshipProposal/>
    </div></section>
  </EditorialShell>;
}
