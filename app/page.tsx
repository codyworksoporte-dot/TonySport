import type {CSSProperties, ReactNode} from 'react';
import Link from 'next/link';
import Icon, {type IconName} from '@/components/Icon';
import AppDownload from '@/components/AppDownload';
import HomeSearch from '@/components/home/HomeSearch';
import {siteAsset} from '@/lib/asset-path';
import {DISCIPLINES, DISCIPLINES_TITLE, disciplineHref} from '@/lib/disciplines';
import {IMPLEMENT_FAMILIES, IMPLEMENTS_PAGE} from '@/lib/implements';
import {CURRENT_PROMOTIONS, PROMOTIONS_PAGE} from '@/lib/promotions';
import {HELP_WHATSAPP, ORDER_LOOKUP_URL, TONY_WHATSAPP_NUMBER} from '@/lib/site-links';
import stores from '@/data/tony-stores.json';
import catalog from '@/data/pedido/catalog.json';
import '@/components/home/home.css';

// "Botones gigantes": the home is a greeting, one big search and picture buttons. No reading required.
type Asset = `/assets/${string}`;
const rise = (i: number) => ({'--i': i}) as CSSProperties;
const NEW_TAB = ' (se abre en otra pestaña)';

// Real TONY designs from the order catalog (data/pedido/catalog.json), each one opens the order flow with it:
// four football, then one volleyball, one basketball and one business polo. The eighth tile fills the grid's
// second row (fourth on phones) and leads to the whole catalogue, one design of each line as its picture.
const designOf = (code: string) => {
  const design = catalog.designs.find(item => item.code === code);
  if (!design) throw new Error(`El catálogo no tiene ${code}.`);
  return design;
};
const DESIGNS = ['TONY-063', 'TONY-052', 'TONY-040', 'TONY-031', 'TONY-077', 'TONY-088', 'TONY-095'].map(designOf);
const LINE_COVERS = ['TONY-012', 'TONY-071', 'TONY-084', 'TONY-100'].map(designOf);
const LINE_NAMES = [...new Set(catalog.designs.map(design => design.category))];
const LINE_COLOR: Record<string, string> = {Fútbol: '#b4ff35', Voleibol: '#62c9ff', Baloncesto: '#ff9442', Empresarial: '#f2cd5c'};
const lineLabel = (line?: string): CSSProperties => ({display: 'block', marginTop: 6, font: '700 11px/1.2 var(--font-body), sans-serif', letterSpacing: '.12em', color: (line && LINE_COLOR[line]) || 'var(--tc-mute)'});
const MOSAIC: CSSProperties = {display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2};
const catalogAsset = (path: string) => siteAsset(path as Asset);

// Fine framing for product flyers: the zoom keeps the garment or product in view and leaves out the flyer's
// printed titles and prices (pos is both object-position and the zoom origin).
const CHIP_FRAME: Record<string, {pos: string; zoom?: number}> = {
  replicas: {pos: '50% 30%', zoom: 1.5},
  hoddies: {pos: '50% 51%', zoom: 2.1},
  moldes: {pos: '0% 40.5%', zoom: 1.8},
  'logos-3d': {pos: '50% 35%', zoom: 1.6},
};
const FAMILY_FRAME: Record<string, {pos: string; zoom: number}> = {
  mallas: {pos: '46% 57.5%', zoom: 1.77},
};
const frame = (spec?: {pos: string; zoom?: number}) => spec ? {objectPosition: spec.pos, transformOrigin: spec.pos, scale: String(spec.zoom ?? 1)} as CSSProperties : undefined;
/** The real row (0) plus three decorative copies; home.css shifts each track by exactly one copy (25 %). */
const MARQUEE_COPIES = [0, 1, 2, 3];

type TileProps = {
  href: string; title: string; note?: ReactNode; image: Asset; size: [number, number]; position: string;
  icon?: IconName; flag?: string; external?: boolean; className?: string; i: number;
};

/** One giant picture button: photo, name, a short line and the lime "go" disc. */
function Tile({href, title, note, image, size, position, icon = 'arrow', flag, external, className = '', i}: TileProps) {
  const body = <>
    <img src={siteAsset(image)} alt="" width={size[0]} height={size[1]} loading="eager" decoding="async" style={{objectPosition: position}}/>
    <span className="tc-tile-label"><span><b>{title}</b>{note && <small>{note}</small>}</span></span>
    {flag && <span className="tc-flag">{flag}</span>}
    <span className="tc-go home-go"><Icon name={icon}/></span>
    {external && <span className="tc-sr">{NEW_TAB}</span>}
  </>;
  const cls = `tc-tile home-tile tc-rise ${className}`;
  return external
    ? <a className={cls} style={rise(i)} href={href} target="_blank" rel="noopener noreferrer">{body}</a>
    : <Link className={cls} style={rise(i)} href={href}>{body}</Link>;
}

function SectionHead({id, title, href, more, what}: {id: string; title: string; href: string; more: string; what: string}) {
  return <div className="tc-sec-h home-sec-h"><h2 id={id}>{title}</h2><Link href={href}><span>{more}<span className="tc-sr"> {what}</span></span><Icon name="arrow" size={18}/></Link></div>;
}

export default function Home() {
  // Only a campaign Tony has confirmed as running shows its flyer here. Past flyers carry old prices and dates
  // (Precios Patrios says uniforms from $7.99), so with none confirmed the banner keeps to the campaign art.
  const promo = CURRENT_PROMOTIONS[0];
  return (
    <main id="contenido" className="home-page home-c tc-page">
      <div className="tc-wrap">
        <div className="home-hello">
          <div>
            <h1 className="tc-display home-title tc-rise">¿Qué necesitas hoy?</h1>
            <p className="home-lead tc-rise" style={rise(1)}>Toca una opción. Así de simple.</p>
          </div>
          <HomeSearch style={rise(2)}/>
        </div>

        <nav className="home-bento" aria-label="Opciones principales">
          <Link className="tc-tile home-tile home-create tc-rise" style={rise(2)} href="/configurador">
            <img src={siteAsset('/assets/sections/comunidad-tony.webp')} alt="" width={960} height={1200} loading="eager" fetchPriority="high" decoding="async"/>
            <span className="home-create-copy">
              <span>
                <span className="tc-display home-create-title">Crear mi pedido</span>
                <span className="home-create-note">Uniformes o camisas, con tu diseño.</span>
              </span>
              <span className="tc-btn tc-btn--dark home-create-btn">Empezar <Icon name="arrow"/></span>
            </span>
          </Link>
          <Tile i={3} href={PROMOTIONS_PAGE} title="Promociones" flag="Ofertas" image="/assets/home/promo-campaign.webp" size={[960, 549]} position="62% 50%" icon="tag" className="home-tile--promo"/>
          <Tile i={4} href="/producto#categoria-futbol" title="Uniformes" note="Desde $12.99" image="/assets/sections/futbol-tony.webp" size={[960, 1200]} position="50% 6%"/>
          <Tile i={5} href="/producto#categoria-camisas-polos" title="Camisas" note="Desde $7.99" image="/assets/sections/casual-tony.webp" size={[960, 1200]} position="50% 20%"/>
          <Tile i={6} href={IMPLEMENTS_PAGE} title="Implementos" note="Balones, guantes y más" image="/assets/sections/implementos-tony.webp" size={[960, 1200]} position="50% 0%"/>
          <Tile i={7} href={ORDER_LOOKUP_URL} external title="Consulta tu pedido" image="/assets/sections/entregas-tony.webp" size={[960, 1200]} position="50% 22%" icon="package"/>
          <div className="home-cell tc-rise" style={rise(8)}>
            <AppDownload className="tc-tile home-tile home-tile--button">
              <img src={siteAsset('/assets/sections/app-tony-tony.webp')} alt="" width={960} height={1200} loading="eager" decoding="async" style={{objectPosition: '50% 30%'}}/>
              <span className="tc-tile-label"><span><b>Descarga la App Tony</b><small>Android y iPhone</small></span></span>
              <span className="tc-go home-go"><Icon name="download"/></span>
            </AppDownload>
          </div>
          <Tile i={9} href="/tiendas" title="Tiendas" note={`${stores.length} tiendas`} image="/assets/sections/tiendas-tony.webp" size={[960, 1200]} position="50% 30%" icon="pin" className="home-wide"/>
          <a className="tc-tile home-tile home-help home-wide tc-rise" style={rise(10)} href={HELP_WHATSAPP} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp-solid" className="home-help-mark" size={180}/>
            <span className="tc-tile-label"><span><b>Ayuda por WhatsApp</b><small>{TONY_WHATSAPP_NUMBER}</small></span></span>
            <span className="tc-go home-go home-go--white"><Icon name="whatsapp-solid"/></span>
            <span className="tc-sr"> (se abre en WhatsApp)</span>
          </a>
        </nav>

        <section className="tc-sec home-sec" aria-labelledby="home-disciplinas">
          <SectionHead id="home-disciplinas" title={DISCIPLINES_TITLE} href="/producto" more="Ver todas" what="las disciplinas"/>
          {/* Two rows in motion: the top one drifts right, the bottom one left. Each track repeats its row
              (copies are aria-hidden and out of the tab order) and shifts by exactly one copy, so the loop is seamless. */}
          <div className="home-chips-rows">
            {[DISCIPLINES.slice(0, 7), DISCIPLINES.slice(7)].map((row, rowIndex) => {
              const chips = [...row.map(line => ({key: line.id, line})), ...(rowIndex === 1 ? [{key: 'all', line: null}] : [])];
              return <div key={rowIndex} className="home-marquee" data-dir={rowIndex === 0 ? 'right' : 'left'}>
                <ul className="home-marquee-track" role="list">
                  {MARQUEE_COPIES.flatMap(copy => chips.map(({key, line}) => {
                    const copyProps = copy ? {tabIndex: -1} : {};
                    if (!line) return <li key={`${copy}-${key}`} aria-hidden={copy ? true : undefined} data-copy={copy || undefined}>
                      <Link className="home-chip home-chip--all" href="/producto" {...copyProps}>
                        <span className="home-chip-ring"><span className="home-chip-photo home-chip-all"><Icon name="grid" size={30}/></span></span>
                        <span className="home-chip-name">Ver todas<span className="tc-sr"> las disciplinas</span></span>
                      </Link>
                    </li>;
                    const portrait = line.image.includes('/sections/');
                    return <li key={`${copy}-${key}`} aria-hidden={copy ? true : undefined} data-copy={copy || undefined}>
                      <Link className="home-chip" href={disciplineHref(line.id)} {...copyProps}>
                        <span className="home-chip-ring"><span className="home-chip-photo"><img src={siteAsset(line.image)} alt="" width={portrait ? 960 : 440} height={portrait ? 1200 : 440} loading="lazy" decoding="async" style={portrait ? {objectPosition: '50% 18%'} : frame(CHIP_FRAME[line.id])}/></span></span>
                        <span className="home-chip-name">{line.name}</span>
                      </Link>
                    </li>;
                  }))}
                </ul>
              </div>;
            })}
          </div>
        </section>

        <section className="tc-sec home-sec" aria-labelledby="home-disenos">
          <SectionHead id="home-disenos" title="Diseños para tu equipo" href="/configurador" more="Ver todo" what="en diseños"/>
          <ul className="tc-cards home-grid" role="list">
            {DESIGNS.map(design => <li key={design.code}>
              <Link className="tc-card" href={`/configurador?diseno=${design.code}`}>
                <span className="tc-card-media"><img src={catalogAsset(design.image)} srcSet={`${catalogAsset(design.thumbnail)} 220w, ${catalogAsset(design.image)} ${design.width}w`} sizes="(max-width: 599px) 46vw, (max-width: 1399px) 24vw, 320px" alt="" width={design.width} height={design.height} loading="lazy" decoding="async"/></span>
                <span className="tc-card-name"><span><span className="tc-sr">Personalizar el diseño </span>{design.code} <small style={lineLabel(design.category)}>{design.category}</small></span><span className="home-plus"><Icon name="plus"/></span></span>
              </Link>
            </li>)}
            <li>
              <Link className="tc-card" href="/configurador">
                <span className="tc-card-media" style={MOSAIC}>{LINE_COVERS.map(design => <span key={design.code} style={{overflow: 'hidden'}}><img src={catalogAsset(design.thumbnail)} alt="" width={220} height={220} loading="lazy" decoding="async"/></span>)}</span>
                <span className="tc-card-name"><span>Ver los {catalog.designs.length} diseños <small style={lineLabel()}>{LINE_NAMES.length} líneas<span className="tc-sr">: {LINE_NAMES.join(', ')}</span></small></span><span className="home-plus"><Icon name="grid"/></span></span>
              </Link>
            </li>
          </ul>
        </section>

        <section className="tc-sec home-sec" aria-labelledby="home-implementos">
          <SectionHead id="home-implementos" title="Implementos deportivos" href={IMPLEMENTS_PAGE} more="Ver todos" what="los implementos"/>
          <ul className="tc-cards home-grid" role="list">
            {IMPLEMENT_FAMILIES.map(family => <li key={family.id}>
              <Link className="tc-card" href={`${IMPLEMENTS_PAGE}#${family.id}`}>
                <span className="tc-card-media"><img src={siteAsset(family.cover)} alt="" width={440} height={440} loading="lazy" decoding="async" style={frame(FAMILY_FRAME[family.id])}/></span>
                <span className="tc-card-name">{family.name}<Icon name="arrow"/></span>
              </Link>
            </li>)}
          </ul>
        </section>

        <section className="tc-sec home-sec" aria-labelledby="home-promos">
          <Link className="home-promo" href={PROMOTIONS_PAGE}>
            <span className="home-promo-copy">
              <span className="home-promo-icon" aria-hidden="true"><Icon name="tag" size={26}/></span>
              <h2 id="home-promos" className="tc-display home-promo-title">Promociones Tony</h2>
              <span className="home-promo-note">{promo ? promo.title : 'Pregunta por las promos vigentes.'}</span>
              <span className="tc-btn tc-btn--dark home-promo-btn">Ver promociones <Icon name="arrow"/></span>
            </span>
            <span className={`home-promo-art${promo ? '' : ' home-promo-art--solo'}`} aria-hidden="true">
              <img src={siteAsset('/assets/home/promo-campaign.webp')} alt="" width={960} height={549} loading="lazy" decoding="async" className="home-promo-bg"/>
              {promo && <img src={siteAsset(promo.image)} alt="" width={440} height={440} loading="lazy" decoding="async" className="home-promo-card"/>}
            </span>
          </Link>
        </section>
      </div>
    </main>
  );
}
