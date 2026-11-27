import type {CSSProperties, ReactNode} from 'react';
import Link from 'next/link';
import Icon, {type IconName} from '@/components/Icon';
import AppDownload from '@/components/AppDownload';
import BlackFridayCover from '@/components/BlackFridayCover';
import HomeSearch from '@/components/home/HomeSearch';
import LeadImage from '@/components/media/LeadImage';
import WarmImages from '@/components/media/WarmImages';
import {leadTilePhotos} from '@/components/product/discipline-photos';
import {siteAsset} from '@/lib/asset-path';
import {fitted, responsive, srcSetOf} from '@/lib/responsive-image';
import {DISCIPLINES, DISCIPLINES_TITLE, disciplineHref} from '@/lib/disciplines';
import {IMPLEMENT_FAMILIES, IMPLEMENTS_PAGE} from '@/lib/implements';
import {BLACK_FRIDAY, PROMOTIONS_PAGE} from '@/lib/promotions';
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

/** The real row (0) plus three decorative copies; home.css shifts each track by exactly one copy (25 %). */
const MARQUEE_COPIES = [0, 1, 2, 3];

// `sizes` = how wide each photo is drawn (object-fit: cover, home.css) on phones (2 columns), tablets (3) and
// desktop (4); the browser then takes the lightest copy that still covers the screen's pixels.
const TILE_SIZES = '(max-width: 599px) calc(50vw - 21px), (max-width: 1099px) calc(34vw - 20px), (max-width: 1383px) calc(25vw - 28px), 318px';
const WIDE_TILE_SIZES = '(max-width: 599px) calc(100vw - 32px), (max-width: 1099px) calc(34vw - 20px), (max-width: 1383px) calc(25vw - 28px), 318px';
// The landscape promo photo fills the tile's height, so it is drawn wider than the tile.
const PROMO_TILE_SIZES = '(max-width: 599px) 308px, (max-width: 1099px) 368px, 402px';
const CREATE_SIZES = '(max-width: 599px) calc(56vw - 17px), (max-width: 1099px) 400px, 381px';
const DESIGN_SIZES = '(max-width: 699px) calc(50vw - 21px), (max-width: 899px) calc(25vw - 20px), (max-width: 1383px) calc(25vw - 28px), 318px';
/** Round chips are 64–104 px and share the same small copy across the marquee. */
const CHIP_WIDTH = 240;
/** The photos /producto shows on arrival ("Ver todas" of the disciplines section leads there). */
const PRODUCT_LEAD_PHOTOS = leadTilePhotos();
const designSrcSet = (design: (typeof DESIGNS)[number]) =>
  `${catalogAsset(design.thumbnail)} 220w, ${srcSetOf(design.image as Asset) ?? `${catalogAsset(design.image)} ${design.width}w`}`;

type TileProps = {
  href: string; title: string; note?: ReactNode; image: Asset; size: [number, number]; position: string; sizes?: string;
  /** On screen when a phone opens the page: loads at once (still no RSC prefetch hint); the rest load lazily. */
  eager?: boolean;
  icon?: IconName; flag?: string; external?: boolean; className?: string; i: number;
};

/** One giant picture button: photo, name, a short line and the lime "go" disc. */
function Tile({href, title, note, image, size, position, sizes = TILE_SIZES, eager = false, icon = 'arrow', flag, external, className = '', i}: TileProps) {
  const photo = {...responsive(image, sizes), alt: '', width: size[0], height: size[1], decoding: 'async' as const, style: {objectPosition: position}};
  const body = <>
    {eager ? <LeadImage {...photo} fetchPriority="auto"/> : <img {...photo} loading="lazy"/>}
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
            <LeadImage {...responsive('/assets/portadas/crear-pedido.webp', CREATE_SIZES)} width={800} height={800}/>
            <span className="home-create-copy">
              <span>
                <span className="tc-display home-create-title">Crear mi pedido</span>
                <span className="home-create-note">Uniformes o camisas, con tu diseño.</span>
              </span>
              <span className="tc-btn tc-btn--dark home-create-btn">Empezar <Icon name="arrow"/></span>
            </span>
          </Link>
          <Tile i={3} eager href={`${PROMOTIONS_PAGE}#${BLACK_FRIDAY.id}`} title="Black Friday" flag="30% OFF" note="23–30 de noviembre" image={BLACK_FRIDAY.image} size={[1200, 800]} position="94% 35%" sizes={PROMO_TILE_SIZES} icon="tag" className="home-tile--promo"/>
          <Tile i={4} eager href="/producto#categoria-futbol" title="Uniformes" note="Desde $12.99" image="/assets/portadas/uniformes.webp" size={[560, 560]} position="50% 34%" className="home-product-tile"/>
          <Tile i={5} eager href="/producto#categoria-camisas-polos" title="Camisas" note="Desde $7.99" image="/assets/portadas/camisas-polos.webp" size={[680, 680]} position="50% 32%" className="home-product-tile"/>
          <Tile i={6} eager href={IMPLEMENTS_PAGE} title="Implementos" note="Balones, guantes y más" image="/assets/portadas/implementos.webp" size={[800, 800]} position="50% 43%" className="home-product-tile"/>
          <Tile i={7} href={ORDER_LOOKUP_URL} external title="Consulta tu pedido" image="/assets/portadas/consulta.webp" size={[800, 800]} position="69% 40%" icon="package" className="home-product-tile"/>
          <div className="home-cell tc-rise" style={rise(8)}>
            <AppDownload className="tc-tile home-tile home-tile--button home-product-tile">
              <img {...responsive('/assets/portadas/app-tony.webp', TILE_SIZES)} alt="" width={800} height={800} loading="lazy" decoding="async" style={{objectPosition: '63% 35%'}}/>
              <span className="tc-tile-label"><span><b>Descarga la App Tony</b><small>Android y iPhone</small></span></span>
              <span className="tc-go home-go"><Icon name="download"/></span>
            </AppDownload>
          </div>
          <Tile i={9} href="/tiendas" title="Tiendas" note={`${stores.length} tiendas`} image="/assets/portadas/tiendas.webp" size={[800, 800]} position="57% 37%" sizes={WIDE_TILE_SIZES} icon="pin" className="home-wide home-product-tile"/>
          <a className="tc-tile home-tile home-help home-wide tc-rise" style={rise(10)} href={HELP_WHATSAPP} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp-solid" className="home-help-mark" size={180}/>
            <span className="tc-tile-label"><span><b>Ayuda por WhatsApp</b><small>{TONY_WHATSAPP_NUMBER}</small></span></span>
            <span className="tc-go home-go home-go--white"><Icon name="whatsapp-solid"/></span>
            <span className="tc-sr"> (se abre en WhatsApp)</span>
          </a>
        </nav>

        <section className="tc-sec home-sec" aria-labelledby="home-disciplinas">
          <SectionHead id="home-disciplinas" title={DISCIPLINES_TITLE} href="/producto" more="Ver todas" what="las disciplinas"/>
          {/* A visitor looking at this section is likely to open /producto: its first photos load (low priority,
              once the page has settled) so it arrives complete, without every visit paying for them. Renders nothing. */}
          <WarmImages watch="home-disciplinas" images={PRODUCT_LEAD_PHOTOS}/>
          {/* Two rows in motion: the top one drifts right, the bottom one left. Each track repeats its row
              (copies are aria-hidden and out of the tab order) and shifts by exactly one copy, so the loop is seamless. */}
          {/* data-ahead: the marquees clip their chips, so PicturesAhead readies them all as the section comes near. */}
          <div className="home-chips-rows" data-ahead="">
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
                    return <li key={`${copy}-${key}`} aria-hidden={copy ? true : undefined} data-copy={copy || undefined}>
                      <Link className="home-chip" href={disciplineHref(line.id)} {...copyProps}>
                        <span className="home-chip-ring"><span className="home-chip-photo"><img src={siteAsset(fitted(line.image, CHIP_WIDTH))} alt="" width={CHIP_WIDTH} height={CHIP_WIDTH} loading="lazy" decoding="async"/></span></span>
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
                <span className="tc-card-media"><img src={catalogAsset(design.image)} srcSet={designSrcSet(design)} sizes={DESIGN_SIZES} alt="" width={design.width} height={design.height} loading="lazy" decoding="async"/></span>
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
              <Link className="tc-card home-equipment-card" href={`${IMPLEMENTS_PAGE}#${family.id}`}>
                <span className="tc-card-media"><img {...responsive(family.cover, DESIGN_SIZES)} alt="" width={560} height={560} loading="lazy" decoding="async"/></span>
                <span className="tc-card-name">{family.name}<Icon name="arrow"/></span>
              </Link>
            </li>)}
          </ul>
        </section>

        <div className="tc-sec home-sec"><BlackFridayCover/></div>
      </div>
    </main>
  );
}
